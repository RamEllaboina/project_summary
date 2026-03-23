import re
from radon.complexity import cc_visit
from radon.metrics import mi_visit
from typing import List, Set
from pathlib import Path
from app.models.schemas import ComplexityMetrics


class ComplexityService:
    def analyze(self, files: List[Path]) -> ComplexityMetrics:
        total_cc = 0
        total_mi = 0
        file_count = 0
        max_cc = 0
        complex_functions_count = 0
        
        # New universal metrics accumulators
        total_loc = 0
        file_extensions: Set[str] = set()
        keyword_score = 0
        
        # Track complexity by file extension
        complexity_by_extension = {}
        file_details_by_extension = {}

        for file_path in files:
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                
                # Count lines of code (non-empty lines)
                lines = [line.strip() for line in content.splitlines() if line.strip()]
                file_loc = len(lines)
                total_loc += file_loc
                
                # Track file extensions
                if file_path.suffix:
                    file_extensions.add(file_path.suffix.lower())
                
                # Count keyword complexity
                keyword_score += self._compute_keyword_complexity(content)

                # Initialize extension tracking
                ext = file_path.suffix.lower() or 'no_extension'
                if ext not in complexity_by_extension:
                    complexity_by_extension[ext] = {
                        'total_cc': 0,
                        'total_mi': 0,
                        'file_count': 0,
                        'max_cc': 0,
                        'total_loc': 0,
                        'files': []
                    }

                # ── Python: use radon ────────────────────────────────────────
                if file_path.suffix == ".py":
                    blocks = cc_visit(content)
                    file_cc = 0
                    for block in blocks:
                        cc = block.complexity
                        file_cc += cc
                        total_cc += cc
                        max_cc = max(max_cc, cc)
                        if cc > 10:
                            complex_functions_count += 1

                    mi = mi_visit(content, multi=True)
                    total_mi += mi
                    file_count += 1
                    
                    # Track by extension
                    complexity_by_extension[ext]['total_cc'] += file_cc
                    complexity_by_extension[ext]['total_mi'] += mi
                    complexity_by_extension[ext]['file_count'] += 1
                    complexity_by_extension[ext]['max_cc'] = max(complexity_by_extension[ext]['max_cc'], file_cc)
                    complexity_by_extension[ext]['total_loc'] += file_loc
                    complexity_by_extension[ext]['files'].append({
                        'name': file_path.name,
                        'cc': file_cc,
                        'mi': mi,
                        'loc': file_loc
                    })

                # ── JS / TS / JSX / TSX: heuristic complexity ────────────────
                elif file_path.suffix in {".js", ".ts", ".jsx", ".tsx"}:
                    cc, mi = self._estimate_js_complexity(content)
                    total_cc += cc
                    max_cc = max(max_cc, cc)
                    if cc > 10:
                        complex_functions_count += 1
                    total_mi += mi
                    file_count += 1
                    
                    # Track by extension
                    complexity_by_extension[ext]['total_cc'] += cc
                    complexity_by_extension[ext]['total_mi'] += mi
                    complexity_by_extension[ext]['file_count'] += 1
                    complexity_by_extension[ext]['max_cc'] = max(complexity_by_extension[ext]['max_cc'], cc)
                    complexity_by_extension[ext]['total_loc'] += file_loc
                    complexity_by_extension[ext]['files'].append({
                        'name': file_path.name,
                        'cc': cc,
                        'mi': mi,
                        'loc': file_loc
                    })

                # ── HTML: heuristic complexity ────────────────────────────────
                elif file_path.suffix in {".html", ".htm"}:
                    cc, mi = self._estimate_html_complexity(content)
                    total_cc += cc
                    max_cc = max(max_cc, cc)
                    total_mi += mi
                    file_count += 1
                    
                    # Track by extension
                    complexity_by_extension[ext]['total_cc'] += cc
                    complexity_by_extension[ext]['total_mi'] += mi
                    complexity_by_extension[ext]['file_count'] += 1
                    complexity_by_extension[ext]['max_cc'] = max(complexity_by_extension[ext]['max_cc'], cc)
                    complexity_by_extension[ext]['total_loc'] += file_loc
                    complexity_by_extension[ext]['files'].append({
                        'name': file_path.name,
                        'cc': cc,
                        'mi': mi,
                        'loc': file_loc
                    })

                # ── CSS: heuristic complexity ─────────────────────────────────
                elif file_path.suffix == ".css":
                    cc, mi = self._estimate_css_complexity(content)
                    total_cc += cc
                    max_cc = max(max_cc, cc)
                    total_mi += mi
                    file_count += 1
                    
                    # Track by extension
                    complexity_by_extension[ext]['total_cc'] += cc
                    complexity_by_extension[ext]['total_mi'] += mi
                    complexity_by_extension[ext]['file_count'] += 1
                    complexity_by_extension[ext]['max_cc'] = max(complexity_by_extension[ext]['max_cc'], cc)
                    complexity_by_extension[ext]['total_loc'] += file_loc
                    complexity_by_extension[ext]['files'].append({
                        'name': file_path.name,
                        'cc': cc,
                        'mi': mi,
                        'loc': file_loc
                    })

            except Exception:
                # Skip binary files or files with encoding issues
                continue

        # Count dependencies from package.json and requirements.txt
        dependency_count = self._count_dependencies(files)

        avg_cc = total_cc / file_count if file_count > 0 else 0
        avg_mi = total_mi / file_count if file_count > 0 else 0

        # Calculate average complexity by extension
        for ext in complexity_by_extension:
            if complexity_by_extension[ext]['file_count'] > 0:
                complexity_by_extension[ext]['avg_cc'] = round(
                    complexity_by_extension[ext]['total_cc'] / complexity_by_extension[ext]['file_count'], 2
                )
                complexity_by_extension[ext]['avg_mi'] = round(
                    complexity_by_extension[ext]['total_mi'] / complexity_by_extension[ext]['file_count'], 2
                )
            # Sort files by complexity
            complexity_by_extension[ext]['files'].sort(key=lambda x: x['cc'], reverse=True)

        return ComplexityMetrics(
            average_cyclomatic_complexity=round(avg_cc, 2),
            maintainability_index=round(avg_mi, 2),
            max_complexity=max_cc,
            complex_functions=complex_functions_count,
            total_files=file_count,
            total_loc=total_loc,
            file_types=len(file_extensions),
            folder_depth=self._calculate_folder_depth(files),
            dependency_count=dependency_count,
            keyword_score=keyword_score,
            complexity_by_extension=complexity_by_extension
        )

    def _calculate_folder_depth(self, files: List[Path]) -> int:
        """Calculate maximum folder depth from root."""
        if not files:
            return 0
        
        max_depth = 0
        for file_path in files:
            # Get relative path parts (excluding filename)
            parts = list(file_path.parent.parts)
            depth = len(parts)
            max_depth = max(max_depth, depth)
        
        return max_depth

    def _count_dependencies(self, files: List[Path]) -> int:
        """Count dependencies from package.json and requirements.txt."""
        total_deps = 0
        
        for file_path in files:
            try:
                if file_path.name == "package.json":
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                    # Count dependencies sections and entries
                    deps_sections = re.findall(r'"(dependencies|devDependencies)"\s*:\s*\{([^}]*)\}', content)
                    for section in deps_sections:
                        # Count comma-separated entries in the dependencies object
                        entries = section[1].strip()
                        if entries:
                            total_deps += entries.count(',') + 1
                
                elif file_path.name == "requirements.txt":
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                    # Count non-empty, non-comment lines
                    deps = [line for line in content.splitlines() 
                           if line.strip() and not line.strip().startswith('#')]
                    total_deps += len(deps)
                    
            except Exception:
                continue
        
        return total_deps

    def _compute_keyword_complexity(self, content: str) -> int:
        """Count occurrences of complexity keywords in content."""
        keywords = [
            r'\bif\b', r'\bfor\b', r'\bwhile\b', 
            r'\bswitch\b', r'\btry\b', r'\bcatch\b'
        ]
        
        count = 0
        for keyword in keywords:
            count += len(re.findall(keyword, content, re.IGNORECASE))
        
        return count

    # ──────────────────────────────────────────────────────────────────────────
    # Heuristic cyclomatic complexity for JS/TS
    # Each branching keyword adds 1 to complexity (McCabe-style approximation)
    # ──────────────────────────────────────────────────────────────────────────
    def _estimate_js_complexity(self, content: str):
        """
        Returns (cyclomatic_complexity, maintainability_index) for a JS/TS file.
        CC is approximated by counting decision points.
        MI is approximated from line count and comment ratio.
        """
        branch_pattern = re.compile(
            r'\b(if|else\s+if|for|while|do|switch|case|catch|\?\s*\w|\&\&|\|\|)\b'
        )

        lines = content.splitlines()
        total_lines = len(lines)
        code_lines = 0
        comment_lines = 0
        branch_count = 1  # base complexity starts at 1

        in_block_comment = False
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if in_block_comment:
                comment_lines += 1
                if "*/" in stripped:
                    in_block_comment = False
                continue
            if stripped.startswith("/*"):
                comment_lines += 1
                if "*/" not in stripped:
                    in_block_comment = True
                continue
            if stripped.startswith("//"):
                comment_lines += 1
                continue
            code_lines += 1
            branch_count += len(branch_pattern.findall(line))

        # Maintainability Index approximation (0–100 scale, then normalised to 0–100)
        # Simple formula: higher comment ratio and fewer lines = more maintainable
        comment_ratio = comment_lines / total_lines if total_lines > 0 else 0
        # Rough MI: penalise large files, reward comments
        mi = max(0.0, min(100.0, 100 - (code_lines * 0.05) + (comment_ratio * 30)))

        return branch_count, round(mi, 2)

    # ──────────────────────────────────────────────────────────────────────────
    # Heuristic complexity for HTML
    # CC = number of conditional/loop-like constructs (JS inside script tags)
    # MI = based on file size and comment ratio
    # ──────────────────────────────────────────────────────────────────────────
    def _estimate_html_complexity(self, content: str):
        lines = content.splitlines()
        total_lines = len(lines)
        code_lines = 0
        comment_lines = 0
        branch_count = 1  # base

        in_comment = False
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if in_comment:
                comment_lines += 1
                if "-->" in stripped:
                    in_comment = False
                continue
            if stripped.startswith("<!--"):
                comment_lines += 1
                if "-->" not in stripped:
                    in_comment = True
                continue
            code_lines += 1
            # Count JS branches inside <script> blocks
            branch_count += len(re.findall(r'\b(if|for|while|switch|catch)\b', line))

        comment_ratio = comment_lines / total_lines if total_lines > 0 else 0
        mi = max(0.0, min(100.0, 100 - (code_lines * 0.03) + (comment_ratio * 20)))
        return branch_count, round(mi, 2)

    # ──────────────────────────────────────────────────────────────────────────
    # Heuristic complexity for CSS
    # CC = number of selectors (each rule block = 1 decision point)
    # MI = based on file size
    # ──────────────────────────────────────────────────────────────────────────
    def _estimate_css_complexity(self, content: str):
        lines = content.splitlines()
        total_lines = len(lines)
        # Count rule blocks (lines ending with '{')
        rule_count = sum(1 for l in lines if l.strip().endswith("{"))
        branch_count = max(1, rule_count)

        # MI: fewer rules and shorter file = more maintainable
        mi = max(0.0, min(100.0, 100 - (rule_count * 0.2) - (total_lines * 0.02)))
        return branch_count, round(mi, 2)