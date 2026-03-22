# app/services/analysis_service.py

from pathlib import Path
from typing import List, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import functools

from app.services.project_scanner import ProjectScanner
from app.services.quality_service import QualityService
from app.services.security_service import SecurityService
from app.services.complexity_service import ComplexityService
from app.services.structure_service import StructureService
from app.services.project_summarizer import ProjectSummarizer
from app.models.schemas import AnalysisResult, Metrics, ComplexityMetrics, Issue


class AnalysisService:
    def __init__(self):
        self.quality_service = QualityService()
        self.security_service = SecurityService()
        self.complexity_service = ComplexityService()
        self.structure_service = StructureService()
        self.project_summarizer = ProjectSummarizer()
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def analyze_project(self, project_id: str, path: str) -> AnalysisResult:
        """
        Main analysis orchestration - runs all analyses concurrently
        """
        try:
            # Run scanner in thread pool (I/O bound)
            loop = asyncio.get_event_loop()
            valid_files, lang, type_ = await loop.run_in_executor(
                self.executor,
                self._run_scanner,
                path
            )

            # Run all analyses concurrently
            # For each analysis, we create tasks correctly
            tasks = []
            
            # Quality analysis (sync - run in thread)
            quality_task = loop.run_in_executor(
                self.executor,
                functools.partial(
                    self.quality_service.analyze,
                    Path(path),
                    valid_files
                )
            )
            tasks.append(quality_task)
            
            # Security analysis (async - call directly)
            security_task = self.security_service.analyze(Path(path), valid_files)
            tasks.append(security_task)
            
            # Complexity analysis (sync - run in thread)
            complexity_task = loop.run_in_executor(
                self.executor,
                self.complexity_service.analyze,
                valid_files
            )
            tasks.append(complexity_task)
            
            # Structure analysis (sync - run in thread)
            structure_task = loop.run_in_executor(
                self.executor,
                self.structure_service.analyze,
                valid_files
            )
            tasks.append(structure_task)
            
            # Summarizer (sync - run in thread)
            summarizer_task = loop.run_in_executor(
                self.executor,
                self.project_summarizer.summarize,
                valid_files
            )
            tasks.append(summarizer_task)

            # Wait for all tasks with timeout
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results with error handling
            quality_result = self._get_result(results[0], (0.0, []))
            security_result = self._get_result(results[1], (0.0, []))
            complexity_metrics = self._get_result(results[2], ComplexityMetrics(
                averageComplexity=0.0,
                mostComplexFiles=[],
                functionCount=0,
                classCount=0,
                linesOfCode=0
            ))
            structure_result = self._get_result(results[3], (0.0, []))
            summaries = self._get_result(results[4], [])

            # Unpack results
            quality_score, quality_issues = quality_result
            security_score, security_issues = security_result
            structure_score, structure_issues = structure_result

            # Aggregate all issues
            all_issues = []
            all_issues.extend(quality_issues)
            all_issues.extend(security_issues)
            all_issues.extend(structure_issues)

            metrics = Metrics(
                qualityScore=quality_score,
                structureScore=structure_score,
                securityScore=security_score,
                complexity=complexity_metrics
            )

            return AnalysisResult(
                projectId=project_id,
                language=lang,
                projectType=type_,
                metrics=metrics,
                issues=all_issues,
                importantFiles=summaries,
                status="completed"
            )

        except asyncio.CancelledError:
            print(f"Analysis cancelled for project {project_id}")
            return self._create_error_result(
                project_id, 
                "cancelled", 
                "Analysis was cancelled"
            )
        except Exception as e:
            print(f"Error analyzing project {project_id}: {e}")
            import traceback
            traceback.print_exc()
            return self._create_error_result(
                project_id,
                "failed",
                f"Analysis failed: {str(e)}"
            )

    def _run_scanner(self, path: str) -> Tuple[List[Path], str, str]:
        """Run scanner in thread pool"""
        scanner = ProjectScanner(path)
        valid_files = scanner.scan()
        lang, type_ = scanner.detect_project_type(scanned_files=valid_files)
        return valid_files, lang, type_

    def _get_result(self, result, default):
        """Helper to extract result from task output"""
        if isinstance(result, Exception):
            print(f"Task failed: {result}")
            return default
        return result if result is not None else default

    def _create_error_result(self, project_id: str, status: str, error_message: str) -> AnalysisResult:
        """Create error result when analysis fails"""
        return AnalysisResult(
            projectId=project_id,
            language="unknown",
            projectType="unknown",
            metrics=Metrics(
                qualityScore=0.0,
                structureScore=0.0,
                securityScore=0.0,
                complexity=ComplexityMetrics(
                    averageComplexity=0.0,
                    mostComplexFiles=[],
                    functionCount=0,
                    classCount=0,
                    linesOfCode=0
                )
            ),
            issues=[Issue(
                severity="Critical",
                category="System",
                message=error_message,
                file="System"
            )],
            importantFiles=[],
            status=status
        )

    def __del__(self):
        """Clean up thread pool executor."""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)