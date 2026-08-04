import json
import logging
import re
import asyncio
from typing import Any, List, Dict
from collections import Counter

from models import EvaluationInput, EvaluationOutput
from llm_provider import get_llm_provider
from prompts import format_evaluation_prompt, format_chunk_evaluation_prompt
from config import Config
from ai_detection_service import get_ai_detection_service

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class AIAnalysisService:
    def __init__(self):
        self.provider = get_llm_provider()
        self.max_retries = 3
        self.ai_detection_service = None  # Lazy initialization

    async def analyze_ai_generation(self, input_data: EvaluationInput) -> Dict[str, Any]:
        """
        Analyze code for AI generation using dedicated AI detection service.
        """
        logger.info(f"Starting AI generation analysis for project {input_data.projectId}")
        
        try:
            # Initialize AI detection service if not already done
            if self.ai_detection_service is None:
                self.ai_detection_service = get_ai_detection_service()
            
            # Convert important files to dict format if needed
            files = []
            if input_data.importantFiles:
                for file in input_data.importantFiles:
                    if hasattr(file, 'dict'):
                        files.append(file.dict())
                    elif isinstance(file, dict):
                        files.append(file)
                    else:
                        files.append({
                            "path": getattr(file, 'path', 'unknown'),
                            "content": getattr(file, 'content', '')
                        })
            
            # Perform AI detection analysis
            ai_detection_result = await self.ai_detection_service.analyze_code_for_ai_signals(
                files, input_data.projectId
            )
            
            logger.info(f"AI generation analysis completed for project {input_data.projectId}")
            return ai_detection_result
            
        except Exception as e:
            logger.error(f"AI generation analysis failed: {str(e)}")
            return {
                "projectId": input_data.projectId,
                "error": str(e),
                "aiDetection": {
                    "level": "low",
                    "score": 0,
                    "confidence": 0,
                    "reasoning": f"Analysis failed: {str(e)}",
                    "signals": {}
                }
            }

    async def evaluate_project(self, input_data: EvaluationInput) -> EvaluationOutput:
        """
        Evaluates a software project using configured LLM provider.
        Dynamically switches between normal and chunk-based processing based on input size.
        """

        # Validate input
        if not input_data.projectId:
            raise ValueError("Project ID is required.")

        # Estimate token count
        estimated_tokens = self._estimate_tokens(input_data)
        logger.info(f"Estimated tokens: {estimated_tokens} for project {input_data.projectId}")

        try:
            if estimated_tokens <= 3000:
                # Normal processing for small projects
                logger.info(f"Using normal processing mode (≤3000 tokens)")
                response_data = await self._process_single_chunk(input_data)
            else:
                # Chunk-based processing for large projects
                logger.info(f"Using chunk-based processing mode (>3000 tokens)")
                response_data = await self._process_chunks(input_data)

            # Ensure response is dict
            response_data = self._safe_parse_response(response_data)

            # Fix hallucinated projectId
            response_data["projectId"] = input_data.projectId

            # Ensure summary exists
            if not response_data.get("summary") or len(response_data.get("summary", "")) < 20:
                response_data["summary"] = self._generate_summary(response_data)

            # Ensure innovation exists with proper fields
            if "innovation" not in response_data or not response_data["innovation"]:
                response_data["innovation"] = self._get_default_innovation(input_data)

            # Use dedicated AI detection service for enhanced analysis
            if "importantFiles" in input_data.dict() and input_data.importantFiles:
                try:
                    ai_detection_result = await self.analyze_ai_generation(input_data)
                    
                    if ai_detection_result and "aiDetection" in ai_detection_result:
                        ai_data = ai_detection_result["aiDetection"]
                        signals = ai_data.get("signals", {})
                        converted_signals = {}
                        for key, value in signals.items():
                            if isinstance(value, list):
                                converted_signals[key] = ", ".join(value) if value else ""
                            else:
                                converted_signals[key] = value
                        
                        ai_data["signals"] = converted_signals
                        response_data["aiDetection"] = ai_data
                        logger.info(f"Enhanced AI detection completed: {ai_data.get('level', 'unknown')}")
                except Exception as e:
                    logger.warning(f"AI detection service failed, using fallback: {str(e)}")
                    response_data["aiDetection"] = self._enhance_ai_detection(
                        response_data.get("aiDetection", ""),
                        input_data.importantFiles,
                        input_data
                    )

            # Validate with Pydantic
            output = EvaluationOutput(**response_data)
            
            logger.info(f"Successfully evaluated project {input_data.projectId}")
            return output

        except Exception as e:
            logger.error(f"Evaluation failed: {str(e)}")
            return self._get_fallback_response(input_data.projectId, str(e))

    def _get_default_innovation(self, input_data: EvaluationInput) -> Dict:
        """Generate default innovation data when AI doesn't provide it."""
        language = input_data.language
        project_type = input_data.metrics.get('projectType', 'Unknown')
        
        # Generate a description based on language
        descriptions = {
            'javascript': 'A JavaScript web application designed for interactive user experiences and real-time functionality.',
            'python': 'A Python application built for data processing, automation, or backend services.',
            'html': 'A web-based user interface for accessible and responsive user interactions.',
            'css': 'A stylesheet implementation focused on modern, responsive web design.',
            'java': 'An enterprise-grade Java application with robust architecture and scalability.',
            'react': 'A React application with component-based architecture for interactive user experiences.',
            'node': 'A Node.js backend API with scalable service architecture.',
            'mixed': 'A multi-language project combining various technologies for comprehensive functionality.'
        }
        
        description = descriptions.get(language.lower(), f"A {language} application designed to solve specific business and user requirements.")
        
        return {
            "level": "medium",
            "score": 5,
            "projectDescription": description,
            "assessment": f"This project demonstrates solid software engineering practices with some innovative elements in its approach. Built with {language}, it addresses relevant problems in its domain with potential for practical applications.",
            "novelFeatures": ["Core architecture and design patterns", "Implementation approach and code organization"],
            "marketImpact": "The project addresses relevant problems in its domain with potential for practical applications. Further market validation would help determine the exact impact.",
            "uniqueness": f"The project combines established patterns in a way that offers a unique solution to its target problems in the {language} ecosystem."
        }

    def _generate_summary(self, data: dict) -> str:
        """Generate a summary from overview and other fields."""
        overview = data.get("overview", "")
        if overview and len(overview) > 20:
            return overview[:300] + "..." if len(overview) > 300 else overview
        
        # Generate from other fields
        parts = []
        if data.get("architecture"):
            parts.append(f"Architecture: {data['architecture'][:100]}")
        if data.get("complexity"):
            parts.append(f"Complexity: {data['complexity'][:100]}")
        if data.get("security"):
            parts.append(f"Security: {data['security'][:100]}")
        
        if parts:
            combined = ". ".join(parts)
            return combined[:300] + "..." if len(combined) > 300 else combined
        
        return "Project analysis completed. See detailed breakdown below."

    def _generate_project_description(self, data: dict) -> str:
        """Generate a human-readable project description from available data."""
        language = data.get('language', '')
        overview = data.get('overview', '')
        project_type = data.get('projectType', '')
        
        # Try to extract from overview
        if overview and len(overview) > 20:
            sentences = overview.split('.')
            if sentences and len(sentences[0]) > 10:
                return sentences[0].strip() + "."
        
        # Language-based descriptions
        descriptions = {
            'javascript': 'JavaScript-based web application with dynamic user interfaces and interactive features.',
            'python': 'Python application designed for data processing, automation, or backend API services.',
            'html': 'Web-based user interface with responsive design and accessible features.',
            'css': 'Stylesheet implementation focused on responsive, modern web design.',
            'java': 'Enterprise-grade Java application with robust architecture and scalability.',
            'react': 'React application with component-based architecture for interactive user experiences.',
            'node': 'Node.js backend API with scalable service architecture.',
            'mixed': 'Multi-language project combining technologies for comprehensive functionality.'
        }
        
        for lang, desc in descriptions.items():
            if lang in str(language).lower():
                return desc
        
        return f"Application built with {language} solving specific business and user requirements through efficient software engineering."

    # ===============================
    # RETRY LOGIC
    # ===============================
    async def _call_with_retry(self, prompt: str) -> Any:
        last_error = None

        for attempt in range(self.max_retries):
            try:
                return await self.provider.evaluate_project(prompt)

            except Exception as e:
                last_error = e
                logger.warning(f"⚠️ Attempt {attempt + 1} failed: {str(e)}")
                
                if "429" in str(e) or "Too Many Requests" in str(e) or "rate" in str(e).lower():
                    if attempt < self.max_retries - 1:
                        delay = 15 * (attempt + 1)
                        logger.info(f"Rate limiting detected, waiting {delay} seconds before retry...")
                        await asyncio.sleep(delay)
                        continue
                
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)

        raise Exception(f"All retries failed: {str(last_error)}")

    # ===============================
    # SAFE PARSING
    # ===============================
    def _safe_parse_response(self, response_data: Any) -> dict:
        """Ensures LLM response is valid JSON dict."""
        if isinstance(response_data, dict):
            return self._fix_response_structure(response_data)

        if isinstance(response_data, str):
            try:
                parsed = json.loads(response_data)
                if isinstance(parsed, dict):
                    return self._fix_response_structure(parsed)
            except json.JSONDecodeError:
                pass

        raise ValueError("Invalid response format from LLM (not JSON/dict)")

    def _fix_response_structure(self, data: dict) -> dict:
        """Fix response structure to match frontend expectations."""
        
        # Ensure summary exists
        if 'summary' not in data or not data['summary'] or len(str(data['summary'])) < 20:
            if 'overview' in data and data['overview']:
                data['summary'] = str(data['overview'])[:300] + "..." if len(str(data['overview'])) > 300 else str(data['overview'])
            else:
                data['summary'] = self._generate_summary(data)

        # Fix innovation - ensure it's a dict with proper fields
        if 'innovation' in data and isinstance(data['innovation'], dict):
            # Ensure projectDescription is human-readable
            if 'projectDescription' in data['innovation']:
                project_desc = str(data['innovation']['projectDescription'])
                if (len(project_desc) == 36 and project_desc.count('-') == 4) or len(project_desc) < 20:
                    data['innovation']['projectDescription'] = self._generate_project_description(data)
            else:
                data['innovation']['projectDescription'] = self._generate_project_description(data)
            
            # Ensure all innovation fields exist
            if 'level' not in data['innovation'] or not data['innovation']['level']:
                data['innovation']['level'] = 'medium'
            if 'score' not in data['innovation'] or not isinstance(data['innovation']['score'], (int, float)):
                data['innovation']['score'] = 5
            if 'assessment' not in data['innovation'] or not data['innovation']['assessment'] or len(str(data['innovation']['assessment'])) < 20:
                data['innovation']['assessment'] = f"This project shows moderate innovation potential. It builds upon existing concepts while introducing some novel approaches."
            if 'novelFeatures' not in data['innovation'] or not data['innovation']['novelFeatures']:
                data['innovation']['novelFeatures'] = ["Project architecture and design patterns", "Code organization and modularity"]
            if 'marketImpact' not in data['innovation'] or not data['innovation']['marketImpact'] or len(str(data['innovation']['marketImpact'])) < 20:
                data['innovation']['marketImpact'] = "The project has potential applications in its target domain. Further market validation would help determine the exact impact."
            if 'uniqueness' not in data['innovation'] or not data['innovation']['uniqueness'] or len(str(data['innovation']['uniqueness'])) < 20:
                data['innovation']['uniqueness'] = "The project demonstrates a solid approach to solving its core problems, with some unique implementation choices."
        
        elif 'innovation' in data and isinstance(data['innovation'], str):
            # Convert string to dict
            data['innovation'] = {
                'level': 'medium',
                'score': 5,
                'projectDescription': self._generate_project_description(data),
                'assessment': data['innovation'] if len(data['innovation']) > 20 else "Project shows moderate innovation potential.",
                'novelFeatures': ["Project architecture", "Code organization"],
                'marketImpact': "Potential market impact needs further analysis.",
                'uniqueness': "Project shows some unique approaches."
            }
        else:
            # Create default innovation
            data['innovation'] = {
                'level': 'medium',
                'score': 5,
                'projectDescription': self._generate_project_description(data),
                'assessment': "This project demonstrates solid software engineering practices with some innovative elements in its approach and implementation.",
                'novelFeatures': ["Core architecture and design", "Implementation approach"],
                'marketImpact': "The project addresses relevant problems in its domain with potential for practical applications.",
                'uniqueness': "The project combines established patterns in a way that offers a unique solution to its target problems."
            }

        # Fix strengths - limit to 3 per category
        if 'strengths' in data and isinstance(data['strengths'], dict):
            for category in ['technical', 'architectural', 'performance']:
                if category in data['strengths'] and isinstance(data['strengths'][category], list):
                    data['strengths'][category] = [str(s) for s in data['strengths'][category] if s and len(str(s)) > 3][:3]
        else:
            data['strengths'] = {
                'technical': [],
                'architectural': [],
                'performance': []
            }

        # Fix weaknesses - limit to 3 per category
        if 'weaknesses' in data and isinstance(data['weaknesses'], dict):
            for category in ['technical', 'architectural', 'performance']:
                if category in data['weaknesses'] and isinstance(data['weaknesses'][category], list):
                    data['weaknesses'][category] = [str(w) for w in data['weaknesses'][category] if w and len(str(w)) > 3][:3]
        else:
            data['weaknesses'] = {
                'technical': [],
                'architectural': [],
                'performance': []
            }

        # Fix suggestions - limit to 3 per category
        if 'suggestions' in data and isinstance(data['suggestions'], dict):
            for category in ['technical', 'architectural', 'performance']:
                if category in data['suggestions'] and isinstance(data['suggestions'][category], list):
                    data['suggestions'][category] = [str(s) for s in data['suggestions'][category] if s and len(str(s)) > 3][:3]
        else:
            data['suggestions'] = {
                'technical': [],
                'architectural': [],
                'performance': []
            }

        return data

    # ===============================
    # FALLBACK RESPONSE
    # ===============================
    def _get_fallback_response(self, project_id: str, error_message: str) -> EvaluationOutput:
        """Return a valid response when analysis fails."""
        return EvaluationOutput(
            projectId=project_id,
            summary="Analysis could not be completed. Please try again.",
            overview="Unable to analyze project due to a temporary issue. Please try again.",
            architecture="Analysis unavailable",
            complexity="Analysis unavailable",
            security="Analysis unavailable",
            aiDetection={
                "level": "low",
                "score": 0,
                "confidence": 0,
                "reasoning": "Analysis unavailable due to system error",
                "signals": {
                    "repetition": "low",
                    "naming": "moderate",
                    "comments": "balanced",
                    "structure": "moderate",
                    "consistency": "medium"
                }
            },
            innovation={
                "level": "low",
                "score": 1,
                "projectDescription": "Project analysis unavailable",
                "assessment": "Analysis unavailable",
                "novelFeatures": [],
                "marketImpact": "Analysis unavailable",
                "uniqueness": "Analysis unavailable"
            },
            realWorldReadiness="Analysis unavailable",
            strengths={
                "technical": ["Analysis could not be completed"],
                "architectural": [],
                "performance": []
            },
            weaknesses={
                "technical": [f"System error: {error_message}"],
                "architectural": [],
                "performance": []
            },
            suggestions={
                "technical": [
                    "Retry after some time",
                    "Check API configuration",
                    "Verify model availability"
                ],
                "architectural": [],
                "performance": []
            }
        )
    
    # ===============================
    # TOKEN ESTIMATION & CHUNKING
    # ===============================
    def _estimate_tokens(self, input_data: EvaluationInput) -> int:
        """Estimate total token count for the input data."""
        total_chars = 0
        
        if input_data.importantFiles:
            for file in input_data.importantFiles:
                if hasattr(file, 'content') and file.content:
                    total_chars += len(file.content)
                if hasattr(file, 'summary') and file.summary:
                    total_chars += len(file.summary)
                if isinstance(file, dict):
                    if file.get("content"):
                        total_chars += len(file["content"])
                    if file.get("summary"):
                        total_chars += len(file["summary"])
        
        if input_data.readme:
            total_chars += len(input_data.readme)
        
        if input_data.metrics:
            if hasattr(input_data.metrics, 'dict'):
                metrics_str = str(input_data.metrics.dict())
            else:
                metrics_str = str(input_data.metrics)
            total_chars += len(metrics_str)
        
        if input_data.language:
            total_chars += len(input_data.language)
        
        total_chars += 1000
        estimated_tokens = total_chars // 4
        
        logger.info(f"Token estimation: {total_chars} chars → ~{estimated_tokens} tokens")
        return estimated_tokens
    
    async def _process_single_chunk(self, input_data: EvaluationInput) -> Any:
        """Process the entire input in a single API call."""
        if "chunk" in input_data.projectId:
            prompt = format_chunk_evaluation_prompt(input_data)
        else:
            prompt = format_evaluation_prompt(input_data)
        return await self._call_with_retry(prompt)
    
    async def _process_chunks(self, input_data: EvaluationInput) -> Dict:
        """Process the input in chunks and aggregate results."""
        logger.info(f"Starting chunk-based processing for {input_data.projectId}")
        
        chunks = self._create_chunks(input_data.importantFiles)
        logger.info(f"Created {len(chunks)} chunks for processing")
        
        chunk_results = []
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)} with {len(chunk)} files")
                
                if i > 0:
                    delay = 3
                    logger.info(f"Waiting {delay} seconds to avoid rate limiting...")
                    await asyncio.sleep(delay)
                
                chunk_input = EvaluationInput(
                    projectId=f"{input_data.projectId}_chunk_{i+1}",
                    language=input_data.language,
                    metrics=input_data.metrics,
                    importantFiles=chunk,
                    readme=input_data.readme[:1000] if input_data.readme else ""
                )
                
                chunk_result = await self._process_single_chunk(chunk_input)
                
                if isinstance(chunk_result, str):
                    chunk_result = json.loads(chunk_result)
                
                chunk_results.append(chunk_result)
                logger.info(f"Chunk {i+1} processed successfully")
                
            except Exception as e:
                logger.warning(f"Chunk {i+1} failed: {str(e)}")
                continue
        
        if not chunk_results:
            raise Exception("All chunks failed to process")
        
        logger.info(f"Aggregating results from {len(chunk_results)} chunks")
        return self._aggregate_chunk_results(chunk_results, input_data.projectId)
    
    def _create_chunks(self, important_files: List[Dict]) -> List[List[Dict]]:
        """Split important files into chunks that stay within token limits."""
        if not important_files:
            return []
        
        chunks = []
        current_chunk = []
        current_tokens = 0
        MAX_TOKENS_PER_CHUNK = 2000
        MAX_FILES_PER_CHUNK = 2
        
        for file in important_files:
            file_tokens = 0
            if hasattr(file, 'content') and file.content:
                file_tokens += len(file.content) // 4
            if hasattr(file, 'summary') and file.summary:
                file_tokens += len(file.summary) // 4
            if isinstance(file, dict):
                if file.get("content"):
                    file_tokens += len(file["content"]) // 4
                if file.get("summary"):
                    file_tokens += len(file["summary"]) // 4
            
            file_tokens += 500
            
            if file_tokens > MAX_TOKENS_PER_CHUNK:
                if hasattr(file, 'content') and file.content:
                    content_chunks = self._split_large_file_content(file, MAX_TOKENS_PER_CHUNK - 500)
                    for content_chunk in content_chunks:
                        chunks.append([content_chunk])
                elif isinstance(file, dict) and file.get("content"):
                    content_chunks = self._split_large_file_content(file, MAX_TOKENS_PER_CHUNK - 500)
                    for content_chunk in content_chunks:
                        chunks.append([content_chunk])
                continue
            
            if (current_tokens + file_tokens > MAX_TOKENS_PER_CHUNK or 
                len(current_chunk) >= MAX_FILES_PER_CHUNK) and current_chunk:
                chunks.append(current_chunk)
                current_chunk = [file]
                current_tokens = file_tokens
            else:
                current_chunk.append(file)
                current_tokens += file_tokens
                
                if len(current_chunk) >= MAX_FILES_PER_CHUNK:
                    chunks.append(current_chunk)
                    current_chunk = []
                    current_tokens = 0
        
        if current_chunk:
            chunks.append(current_chunk)
        
        logger.info(f"Created {len(chunks)} chunks: {[len(chunk) for chunk in chunks]} files per chunk")
        return chunks
    
    def _split_large_file_content(self, file: Dict, max_tokens: int) -> List[Dict]:
        """Split a large file's content into smaller chunks."""
        if hasattr(file, 'content'):
            content = file.content
            path = file.path
        elif isinstance(file, dict):
            content = file.get("content", "")
            path = file.get("path", "unknown")
        else:
            return [file]
        
        content_tokens = len(content) // 4
        
        if content_tokens <= max_tokens:
            return [file]
        
        chunks = []
        chunk_size = max_tokens * 4
        
        for i in range(0, len(content), chunk_size):
            chunk_content = content[i:i + chunk_size]
            chunk_path = f"{path}_part_{i//chunk_size + 1}"
            
            if hasattr(file, 'content'):
                chunk_file = type(file)(path=chunk_path, content=chunk_content)
            else:
                chunk_file = {
                    "path": chunk_path,
                    "content": chunk_content
                }
            
            chunks.append(chunk_file)
        
        return chunks
    
    def _aggregate_chunk_results(self, chunk_results: List[Dict], project_id: str) -> Dict:
        """Aggregate results from multiple chunks into a final result."""
        logger.info(f"Aggregating {len(chunk_results)} chunk results")
        
        aggregated = {
            "projectId": project_id,
            "summary": "",
            "overview": "",
            "architecture": "",
            "complexity": "",
            "security": "",
            "aiDetection": {
                "level": "low",
                "score": 1.0,
                "confidence": 0.5,
                "reasoning": "Analysis completed",
                "signals": {
                    "ai_phrases": [],
                    "naming_issues": [],
                    "structure_patterns": [],
                    "comment_analysis": "No unusual patterns detected",
                    "complexity_analysis": "Normal complexity"
                }
            },
            "innovation": {
                "level": "medium",
                "score": 5,
                "projectDescription": "",
                "assessment": "",
                "novelFeatures": [],
                "marketImpact": "",
                "uniqueness": ""
            },
            "realWorldReadiness": "",
            "strengths": {
                "technical": [],
                "architectural": [],
                "performance": []
            },
            "weaknesses": {
                "technical": [],
                "architectural": [],
                "performance": []
            },
            "suggestions": {
                "technical": [],
                "architectural": [],
                "performance": []
            }
        }
        
        # Collect all data
        summaries = []
        overviews = []
        architectures = []
        complexities = []
        securities = []
        readinesses = []
        
        innovation_scores = []
        innovation_assessments = []
        project_descriptions = []
        novel_features = []
        market_impacts = []
        uniquenesses = []
        innovation_levels = []
        
        ai_levels = []
        ai_scores = []
        
        all_strengths = {"technical": [], "architectural": [], "performance": []}
        all_weaknesses = {"technical": [], "architectural": [], "performance": []}
        all_suggestions = {"technical": [], "architectural": [], "performance": []}
        
        for result in chunk_results:
            # Collect text fields
            if result.get("summary") and len(str(result["summary"])) > 10:
                summaries.append(str(result["summary"]))
            if result.get("overview") and len(str(result["overview"])) > 10:
                overviews.append(str(result["overview"]))
            if result.get("architecture") and len(str(result["architecture"])) > 10:
                architectures.append(str(result["architecture"]))
            if result.get("complexity") and len(str(result["complexity"])) > 10:
                complexities.append(str(result["complexity"]))
            if result.get("security") and len(str(result["security"])) > 10:
                securities.append(str(result["security"]))
            if result.get("realWorldReadiness") and len(str(result["realWorldReadiness"])) > 10:
                readinesses.append(str(result["realWorldReadiness"]))
            
            # Collect innovation data
            innovation = result.get("innovation", {})
            if innovation and isinstance(innovation, dict):
                if "score" in innovation and isinstance(innovation["score"], (int, float)):
                    innovation_scores.append(innovation["score"])
                if "assessment" in innovation and innovation["assessment"] and len(str(innovation["assessment"])) > 10:
                    innovation_assessments.append(str(innovation["assessment"]))
                if "projectDescription" in innovation and innovation["projectDescription"] and len(str(innovation["projectDescription"])) > 10:
                    project_descriptions.append(str(innovation["projectDescription"]))
                if "novelFeatures" in innovation and isinstance(innovation["novelFeatures"], list):
                    novel_features.extend([str(f) for f in innovation["novelFeatures"] if f])
                if "marketImpact" in innovation and innovation["marketImpact"] and len(str(innovation["marketImpact"])) > 10:
                    market_impacts.append(str(innovation["marketImpact"]))
                if "uniqueness" in innovation and innovation["uniqueness"] and len(str(innovation["uniqueness"])) > 10:
                    uniquenesses.append(str(innovation["uniqueness"]))
                if "level" in innovation and innovation["level"]:
                    innovation_levels.append(innovation["level"])
            
            # Collect strengths
            strengths = result.get("strengths", {})
            for category in ["technical", "architectural", "performance"]:
                if category in strengths and isinstance(strengths[category], list):
                    for item in strengths[category]:
                        if item and len(str(item)) > 5 and str(item) not in all_strengths[category]:
                            all_strengths[category].append(str(item))
            
            # Collect weaknesses
            weaknesses = result.get("weaknesses", {})
            for category in ["technical", "architectural", "performance"]:
                if category in weaknesses and isinstance(weaknesses[category], list):
                    for item in weaknesses[category]:
                        if item and len(str(item)) > 5 and str(item) not in all_weaknesses[category]:
                            all_weaknesses[category].append(str(item))
            
            # Collect suggestions
            suggestions = result.get("suggestions", {})
            for category in ["technical", "architectural", "performance"]:
                if category in suggestions and isinstance(suggestions[category], list):
                    for item in suggestions[category]:
                        if item and len(str(item)) > 5 and str(item) not in all_suggestions[category]:
                            all_suggestions[category].append(str(item))
            
            # Collect AI detection
            ai_detection = result.get("aiDetection", {})
            if isinstance(ai_detection, dict):
                if ai_detection.get("level"):
                    ai_levels.append(ai_detection["level"])
                if ai_detection.get("score"):
                    ai_scores.append(ai_detection["score"])
        
        # Aggregate summary
        if summaries:
            aggregated["summary"] = summaries[0][:500]
        elif overviews:
            aggregated["summary"] = overviews[0][:300] + "..."
        else:
            aggregated["summary"] = self._generate_project_description(aggregated)
        
        # Aggregate overview
        if overviews:
            aggregated["overview"] = overviews[0][:500]
        else:
            aggregated["overview"] = self._generate_project_description(aggregated)
        
        # Aggregate other text fields
        if architectures:
            aggregated["architecture"] = architectures[0][:500]
        if complexities:
            aggregated["complexity"] = complexities[0][:500]
        if securities:
            aggregated["security"] = securities[0][:500]
        if readinesses:
            aggregated["realWorldReadiness"] = readinesses[0][:500]
        
        # Aggregate innovation
        if innovation_scores:
            aggregated["innovation"]["score"] = round(sum(innovation_scores) / len(innovation_scores))
        
        if innovation_assessments:
            combined = " ".join(innovation_assessments[:2])
            aggregated["innovation"]["assessment"] = combined[:500] if combined else "Innovation assessment in progress"
        else:
            aggregated["innovation"]["assessment"] = "This project demonstrates solid software engineering with some innovative elements in its approach."
        
        if project_descriptions:
            aggregated["innovation"]["projectDescription"] = project_descriptions[0]
        else:
            aggregated["innovation"]["projectDescription"] = self._generate_project_description(aggregated)
        
        if novel_features:
            unique_features = list(set(novel_features))[:3]
            aggregated["innovation"]["novelFeatures"] = unique_features
        else:
            aggregated["innovation"]["novelFeatures"] = ["Core architecture", "Implementation approach"]
        
        if market_impacts:
            aggregated["innovation"]["marketImpact"] = market_impacts[0][:300]
        else:
            aggregated["innovation"]["marketImpact"] = "The project has potential applications in its target domain with practical use cases."
        
        if uniquenesses:
            aggregated["innovation"]["uniqueness"] = uniquenesses[0][:300]
        else:
            aggregated["innovation"]["uniqueness"] = "The project combines established patterns in a unique way for its domain."
        
        # Determine innovation level based on score
        if aggregated["innovation"]["score"] >= 7:
            aggregated["innovation"]["level"] = "high"
        elif aggregated["innovation"]["score"] >= 4:
            aggregated["innovation"]["level"] = "medium"
        else:
            aggregated["innovation"]["level"] = "low"
        
        # If we have innovation levels from chunks, use the most common
        if innovation_levels:
            level_counter = Counter(innovation_levels)
            aggregated["innovation"]["level"] = level_counter.most_common(1)[0][0]
        
        # Limit strengths, weaknesses, suggestions to top 3 per category
        for category in ["technical", "architectural", "performance"]:
            aggregated["strengths"][category] = all_strengths[category][:3]
            aggregated["weaknesses"][category] = all_weaknesses[category][:3]
            aggregated["suggestions"][category] = all_suggestions[category][:3]
        
        # Aggregate AI detection
        if ai_levels:
            level_counter = Counter(ai_levels)
            aggregated["aiDetection"]["level"] = level_counter.most_common(1)[0][0]
        if ai_scores:
            aggregated["aiDetection"]["score"] = round(sum(ai_scores) / len(ai_scores), 2)
        
        logger.info(f"Aggregated results: {len(aggregated['strengths']['technical'])} strengths, {len(aggregated['weaknesses']['technical'])} weaknesses")
        return aggregated

    # ===============================
    # AI DETECTION ENHANCEMENT
    # ===============================
    def _enhance_ai_detection(self, existing_detection: Any, important_files: List[Dict], input_data: EvaluationInput) -> Dict:
        """Enhance AI detection with local code analysis."""
        
        signals = {
            "repetition": "low",
            "naming": "good",
            "comments": "balanced",
            "structure": "moderate",
            "consistency": "high"
        }
        
        all_code = ""
        naming_patterns = []
        comment_patterns = []
        structure_patterns = []
        repetition_score = 0
        ai_phrase_score = 0
        
        for file in important_files:
            if "content" in file and file["content"]:
                content = file["content"]
                all_code += content + "\n"
                
                naming_patterns.extend(re.findall(r'(?:function|const|let|var|def|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)', content))
                comments = re.findall(r'(?:#|//|/\*|<!--).*?(?:\*/|-->|$)', content, re.DOTALL)
                comment_patterns.extend(comments)
                indent_levels = re.findall(r'^\s+', content, re.MULTILINE)
                structure_patterns.extend([len(level) for level in indent_levels if level])
                
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                line_counter = Counter(lines)
                repetitions = sum(count - 1 for count in line_counter.values() if count > 1)
                repetition_score += repetitions
                
                ai_phrases = [
                    "generated by", "created by ai", "chatgpt", "claude",
                    "as an ai", "as an ai assistant", "i am an ai",
                    "i don't have access to", "i cannot provide"
                ]
                for phrase in ai_phrases:
                    if phrase.lower() in content.lower():
                        ai_phrase_score += 1
        
        if naming_patterns:
            avg_name_length = sum(len(name) for name in naming_patterns) / len(naming_patterns) if naming_patterns else 0
            if avg_name_length < 4:
                signals["naming"] = "poor"
            elif avg_name_length < 8:
                signals["naming"] = "moderate"
        
        if comment_patterns:
            comment_ratio = len(comment_patterns) / len(all_code.split('\n')) if all_code else 0
            if comment_ratio > 0.3:
                signals["comments"] = "over-documented"
            elif comment_ratio < 0.05:
                signals["comments"] = "missing"
        
        if structure_patterns:
            avg_indent = sum(structure_patterns) / len(structure_patterns) if structure_patterns else 0
            if avg_indent < 2:
                signals["structure"] = "simple"
            elif avg_indent > 8:
                signals["structure"] = "complex"
        
        if repetition_score > len(important_files) * 5:
            signals["repetition"] = "high"
        elif repetition_score > len(important_files) * 2:
            signals["repetition"] = "medium"
        
        score = 0
        
        if signals["naming"] == "poor":
            score += 2
        elif signals["naming"] == "moderate":
            score += 1
        
        if signals["comments"] == "over-documented":
            score += 2
        elif signals["comments"] == "missing":
            score += 1
        
        if signals["structure"] == "simple":
            score += 1.5
        
        if signals["repetition"] == "high":
            score += 1.5
        elif signals["repetition"] == "medium":
            score += 1
        
        if signals["consistency"] == "low":
            score += 1.5
        
        score += ai_phrase_score
        
        score = min(10, max(0, score))
        
        if score >= 7:
            level = "high"
        elif score >= 4:
            level = "medium"
        else:
            level = "low"
        
        confidence = 0.7
        if len(important_files) > 10:
            confidence += 0.2
        if ai_phrase_score > 0:
            confidence += 0.1
        confidence = min(0.95, confidence)
        
        reasoning = self._generate_ai_reasoning(score, signals, ai_phrase_score)
        
        return {
            "level": level,
            "score": round(score, 1),
            "confidence": round(confidence, 2),
            "reasoning": reasoning,
            "signals": signals
        }

    def _generate_ai_reasoning(self, score: float, signals: Dict, ai_phrase_score: int) -> str:
        """Generate reasoning text based on analysis."""
        
        reasons = []
        
        if signals["repetition"] == "high":
            reasons.append("high code repetition patterns")
        elif signals["repetition"] == "medium":
            reasons.append("some repetitive code")
        
        if signals["naming"] == "poor":
            reasons.append("inconsistent naming conventions")
        elif signals["naming"] == "moderate":
            reasons.append("acceptable but not excellent naming")
        
        if signals["comments"] == "over-documented":
            reasons.append("excessive commenting")
        elif signals["comments"] == "missing":
            reasons.append("lack of comments")
        
        if signals["structure"] == "simple":
            reasons.append("basic code structure")
        
        if signals["consistency"] == "low":
            reasons.append("inconsistent patterns across files")
        
        if ai_phrase_score > 0:
            reasons.append("contains AI-generated phrases")
        
        if not reasons:
            if score < 3:
                return "Code shows natural human patterns with good naming and structure"
            else:
                return "Mixed signals but overall appears human-written"
        
        reason_text = ", ".join(reasons[:-1]) + (" and " + reasons[-1] if len(reasons) > 1 else reasons[0])
        
        if score >= 7:
            return f"Strong indicators of AI generation: {reason_text}"
        elif score >= 4:
            return f"Some AI-like patterns detected: {reason_text}"
        else:
            return f"Minimal AI indicators: {reason_text}"