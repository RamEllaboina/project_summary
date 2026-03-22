
import subprocess
import json
import shutil
import re
from pathlib import Path
from typing import List, Tuple
from app.models.schemas import Issue


class QualityService:
    def analyze(self, project_path: Path, files: List[Path]) -> Tuple[float, List[Issue]]:
        """Run quality analysis on the project. Supports Python (pylint), JS/TS, HTML/CSS (heuristics), and unknown files."""

        # Known file types
        python_files = [f for f in files if f.suffix == ".py"]
        js_files = [f for f in files if f.suffix in {".js", ".ts", ".jsx", ".tsx"}]
        html_files = [f for f in files if f.suffix in {".html", ".htm"}]
        css_files = [f for f in files if f.suffix == ".css"]
        
        # Unknown file types - NEW
        known_extensions = {".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".htm", ".css"}
        unknown_files = [f for f in files if f.suffix not in known_extensions]

        all_issues = []
        scores = []

        # ── Python analysis via pylint ──────────────────────────────────────
        if python_files:
            py_score, py_issues = self._analyze_python(python_files)
            all_issues.extend(py_issues)
            scores.append(py_score)

        # ── JavaScript / TypeScript heuristic analysis ──────────────────────
        if js_files:
            js_score, js_issues = self._analyze_js(js_files)
            all_issues.extend(js_issues)
            scores.append(js_score)

        # ── HTML heuristic analysis ──────────────────────────────────────────
        if html_files:
            html_score, html_issues = self._analyze_html(html_files)
            all_issues.extend(html_issues)
            scores.append(html_score)

        # ── CSS heuristic analysis ───────────────────────────────────────────
        if css_files:
            css_score, css_issues = self._analyze_css(css_files)
            all_issues.extend(css_issues)
            scores.append(css_score)

        # ── Unknown file types analysis ───────────────────────────────────────
        if unknown_files:
            unknown_score, unknown_issues = self._analyze_unknown(unknown_files)
            all_issues.extend(unknown_issues)
            scores.append(unknown_score)

        if not scores:
            # No analysable files found - IMPROVED FALLBACK
            return 5.0, [Issue(
                severity="Medium", category="Quality",
                message="No supported files found for analysis",
                file="System"
            )]

        score = round(sum(scores) / len(scores), 2)
        return score, all_issues

    # ──────────────────────────────────────────────────────────────────────────
    # Python – pylint
    # ──────────────────────────────────────────────────────────────────────────
    def _analyze_python(self, python_files: List[Path]) -> Tuple[float, List[Issue]]:
        import sys

        # Limit to 30 files to avoid timeout
        targets = [str(f) for f in python_files[:30]]

        cmd = [
            sys.executable, "-m", "pylint",
            "--output-format=json",
            "--disable=C0114,C0115,C0116",
            "--score=y"
        ] + targets

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # ← FIXED: was missing before
            )

            issues = []
            try:
                lint_results = json.loads(result.stdout)
                severity_map = {
                    "fatal": "Critical", "error": "High",
                    "warning": "Medium", "convention": "Low",
                    "refactor": "Low", "info": "Low"
                }
                category_map = {
                    "fatal": "Structure", "error": "Quality",
                    "warning": "Quality", "convention": "Style",
                    "refactor": "Complexity", "info": "Info"
                }
                for item in lint_results:
                    issues.append(Issue(
                        severity=severity_map.get(item.get("type"), "Low"),
                        category=category_map.get(item.get("type"), "Quality"),
                        message=item.get("message"),
                        file=item.get("path"),
                        line=item.get("line"),
                        code=item.get("symbol")
                    ))
            except json.JSONDecodeError:
                pass

            deductions = sum({
                "Critical": 0.5, "High": 0.2, "Medium": 0.05, "Low": 0.01
            }.get(i.severity, 0) for i in issues)

            return max(0.0, 10.0 - deductions), issues

        except subprocess.TimeoutExpired:
            return 5.0, [Issue(
                severity="Medium", category="Quality",
                message="Pylint timed out (project too large or complex)", file="System"
            )]
        except Exception as e:
            return 0.0, [Issue(
                severity="Critical", category="Quality",
                message=f"Pylint failed: {e}", file="System"
            )]

    # ──────────────────────────────────────────────────────────────────────────
    # JavaScript / TypeScript – heuristic analysis
    # ──────────────────────────────────────────────────────────────────────────
    def _analyze_js(self, js_files: List[Path]) -> Tuple[float, List[Issue]]:
        issues = []

        for file in js_files[:50]:  # cap at 50 files
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                # ── console.log left in production code ──
                for i, line in enumerate(lines, 1):
                    stripped = line.strip()
                    if "console.log(" in stripped and not stripped.startswith("//"):
                        issues.append(Issue(
                            severity="Low", category="Quality",
                            message="console.log() left in code (remove before production)",
                            file=file.name, line=i, code="NO_CONSOLE"
                        ))

                # ── var usage (prefer const/let) ──
                var_lines = [i + 1 for i, l in enumerate(lines)
                             if re.search(r'\bvar\s+\w+', l) and not l.strip().startswith("//")]
                for ln in var_lines[:5]:  # report max 5 per file
                    issues.append(Issue(
                        severity="Low", category="Style",
                        message="Use 'const' or 'let' instead of 'var'",
                        file=file.name, line=ln, code="NO_VAR"
                    ))

                # ── == instead of === ──
                eq_lines = [i + 1 for i, l in enumerate(lines)
                            if re.search(r'[^=!<>]==[^=]', l) and not l.strip().startswith("//")]
                for ln in eq_lines[:3]:
                    issues.append(Issue(
                        severity="Medium", category="Quality",
                        message="Use '===' instead of '==' for strict equality",
                        file=file.name, line=ln, code="EQEQEQ"
                    ))

                # ── TODO / FIXME comments ──
                for i, line in enumerate(lines, 1):
                    if re.search(r'\b(TODO|FIXME|HACK|XXX)\b', line, re.IGNORECASE):
                        issues.append(Issue(
                            severity="Low", category="Quality",
                            message=f"Unresolved comment: {line.strip()[:80]}",
                            file=file.name, line=i, code="TODO"
                        ))

                # ── Hardcoded secrets heuristic ──
                for i, line in enumerate(lines, 1):
                    if re.search(
                        r'(password|secret|api_key|apikey|token)\s*=\s*["\'][^"\']{4,}["\']',
                        line, re.IGNORECASE
                    ):
                        issues.append(Issue(
                            severity="High", category="Security",
                            message="Possible hardcoded secret/password detected",
                            file=file.name, line=i, code="HARDCODED_SECRET"
                        ))

            except Exception:
                continue

        # Score calculation
        deductions = sum({
            "Critical": 0.5, "High": 0.3, "Medium": 0.1, "Low": 0.02
        }.get(i.severity, 0) for i in issues)

        return max(0.0, 10.0 - deductions), issues

    # ──────────────────────────────────────────────────────────────────────────
    # HTML – heuristic analysis
    # ──────────────────────────────────────────────────────────────────────────
    def _analyze_html(self, html_files: List[Path]) -> Tuple[float, List[Issue]]:
        issues = []

        for file in html_files[:50]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                for i, line in enumerate(lines, 1):
                    stripped = line.strip()

                    # Inline styles (bad practice)
                    if re.search(r'style\s*=\s*["\']', stripped, re.IGNORECASE):
                        issues.append(Issue(
                            severity="Low", category="Style",
                            message="Inline style attribute used — prefer external CSS",
                            file=file.name, line=i, code="INLINE_STYLE"
                        ))

                    # Missing alt on img tags
                    if re.search(r'<img(?![^>]*\balt\b)[^>]*>', stripped, re.IGNORECASE):
                        issues.append(Issue(
                            severity="Medium", category="Quality",
                            message="<img> tag missing 'alt' attribute (accessibility issue)",
                            file=file.name, line=i, code="MISSING_ALT"
                        ))

                    # Deprecated tags
                    for tag in ["<font", "<center", "<marquee", "<blink", "<strike"]:
                        if tag in stripped.lower():
                            issues.append(Issue(
                                severity="Low", category="Quality",
                                message=f"Deprecated HTML tag used: {tag}>",
                                file=file.name, line=i, code="DEPRECATED_TAG"
                            ))

                    # onclick / onload inline JS events
                    if re.search(r'\bon(click|load|submit|change)\s*=', stripped, re.IGNORECASE):
                        issues.append(Issue(
                            severity="Low", category="Style",
                            message="Inline event handler detected — prefer addEventListener()",
                            file=file.name, line=i, code="INLINE_EVENT"
                        ))

                # Check for missing doctype
                if content and "<!doctype" not in content[:200].lower():
                    issues.append(Issue(
                        severity="Low", category="Quality",
                        message="Missing <!DOCTYPE html> declaration",
                        file=file.name, line=1, code="MISSING_DOCTYPE"
                    ))

            except Exception:
                continue

        deductions = sum({
            "Critical": 0.5, "High": 0.3, "Medium": 0.1, "Low": 0.02
        }.get(i.severity, 0) for i in issues)

        return max(0.0, 10.0 - deductions), issues

    # ──────────────────────────────────────────────────────────────────────────
    # CSS – heuristic analysis
    # ──────────────────────────────────────────────────────────────────────────
    def _analyze_css(self, css_files: List[Path]) -> Tuple[float, List[Issue]]:
        issues = []

        for file in css_files[:50]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                for i, line in enumerate(lines, 1):
                    stripped = line.strip()

                    # !important overuse
                    if "!important" in stripped:
                        issues.append(Issue(
                            severity="Low", category="Style",
                            message="!important used — indicates specificity issues",
                            file=file.name, line=i, code="IMPORTANT_OVERUSE"
                        ))

                    # Hardcoded pixel font sizes (prefer rem/em)
                    if re.search(r'font-size\s*:\s*\d+px', stripped, re.IGNORECASE):
                        issues.append(Issue(
                            severity="Low", category="Style",
                            message="Hardcoded px font-size — consider using rem/em for accessibility",
                            file=file.name, line=i, code="PX_FONT_SIZE"
                        ))

                    # TODO / FIXME
                    if re.search(r'\b(TODO|FIXME|HACK)\b', stripped, re.IGNORECASE):
                        issues.append(Issue(
                            severity="Low", category="Quality",
                            message=f"Unresolved comment: {stripped[:80]}",
                            file=file.name, line=i, code="TODO"
                        ))

            except Exception:
                continue

        deductions = sum({
            "Critical": 0.5, "High": 0.3, "Medium": 0.1, "Low": 0.02
        }.get(i.severity, 0) for i in issues)

        return max(0.0, 10.0 - deductions), issues

    # ──────────────────────────────────────────────────────────────────────────
    # Unknown file types – heuristic analysis
    # ──────────────────────────────────────────────────────────────────────────
    def _analyze_unknown(self, files: List[Path]) -> Tuple[float, List[Issue]]:
        """Analyze unknown file types using heuristics."""
        issues = []
        
        # Limit to 20 files and skip files larger than 300KB
        analyzed_files = []
        for file in files[:20]:
            try:
                if file.stat().st_size <= 300 * 1024:  # 300KB limit
                    analyzed_files.append(file)
            except (OSError, PermissionError):
                continue
        
        if not analyzed_files:
            return 8.0, []
        
        for file in analyzed_files:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                
                # Skip empty files
                if not content.strip():
                    issues.append(Issue(
                        severity="Low", category="Quality",
                        message="Empty file detected",
                        file=file.name, line=1, code="EMPTY_FILE"
                    ))
                    continue
                
                # Check for long lines (>120 chars)
                long_line_count = 0
                for i, line in enumerate(lines, 1):
                    if len(line) > 120:
                        long_line_count += 1
                        if long_line_count <= 5:  # Report max 5 per file
                            issues.append(Issue(
                                severity="Low", category="Style",
                                message=f"Line too long ({len(line)} chars, >120 recommended)",
                                file=file.name, line=i, code="LONG_LINE"
                            ))
                
                # Check for too many comments (spam)
                comment_lines = 0
                total_lines = len([l for l in lines if l.strip()])
                for line in lines:
                    stripped = line.strip()
                    # Common comment patterns for various languages
                    if (stripped.startswith(('#', '//', '/*', '*', ';', '--', 'rem', '%')) or 
                        stripped.endswith('*/')):
                        comment_lines += 1
                
                if total_lines > 0 and comment_lines / total_lines > 0.3:  # >30% comments
                    issues.append(Issue(
                        severity="Low", category="Quality",
                        message=f"Too many comments ({comment_lines}/{total_lines} lines)",
                        file=file.name, code="COMMENT_SPAM"
                    ))
                
                # Check for repeated code patterns (potential duplication)
                if len(lines) > 10:
                    # Simple pattern detection - look for repeated lines
                    line_counts = {}
                    for line in lines:
                        normalized = re.sub(r'\s+', ' ', line.strip().lower())
                        if len(normalized) > 10:  # Skip very short lines
                            line_counts[normalized] = line_counts.get(normalized, 0) + 1
                    
                    repeated_patterns = [line for line, count in line_counts.items() if count > 3]
                    if repeated_patterns:
                        issues.append(Issue(
                            severity="Medium", category="Complexity",
                            message=f"Repeated code patterns detected ({len(repeated_patterns)} patterns)",
                            file=file.name, code="CODE_DUPLICATION"
                        ))
                
                # Check for TODO/FIXME comments
                todo_count = 0
                for i, line in enumerate(lines, 1):
                    if re.search(r'\b(TODO|FIXME|HACK|XXX|BUG|NOTE)\b', line, re.IGNORECASE):
                        todo_count += 1
                        if todo_count <= 3:  # Report max 3 per file
                            issues.append(Issue(
                                severity="Low", category="Quality",
                                message=f"Unresolved comment: {line.strip()[:80]}",
                                file=file.name, line=i, code="TODO"
                            ))
                
                # Check for potential hardcoded secrets (generic pattern)
                for i, line in enumerate(lines, 1):
                    # Look for common secret patterns
                    secret_patterns = [
                        r'(password|passwd|pwd|secret|token|key)\s*[:=]\s*["\'][^"\']{4,}["\']',
                        r'(api[_-]?key|auth[_-]?token)\s*[:=]\s*["\'][^"\']{8,}["\']',
                        r'(private[_-]?key|secret[_-]?key)\s*[:=]\s*["\'][^"\']{12,}["\']'
                    ]
                    
                    for pattern in secret_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            issues.append(Issue(
                                severity="High", category="Security",
                                message="Possible hardcoded secret/password detected",
                                file=file.name, line=i, code="HARDCODED_SECRET"
                            ))
                            break  # Only report once per line
                
                # Check for very long functions/methods (generic heuristic)
                if len(lines) > 50:
                    # Look for potential function boundaries (common patterns)
                    function_starts = []
                    for i, line in enumerate(lines):
                        stripped = line.strip()
                        # Common function/method patterns
                        if (re.search(r'\b(function|def|sub|proc|method)\s+\w+', stripped, re.IGNORECASE) or
                            re.search(r'\w+\s*\([^)]*\)\s*[{:]?\s*$', stripped)):
                            function_starts.append(i)
                    
                    # Check distance between function starts
                    if len(function_starts) > 1:
                        for i in range(len(function_starts) - 1):
                            func_length = function_starts[i + 1] - function_starts[i]
                            if func_length > 100:  # Very long function
                                issues.append(Issue(
                                    severity="Medium", category="Complexity",
                                    message=f"Very long function/method detected ({func_length} lines)",
                                    file=file.name, line=function_starts[i] + 1, code="LONG_FUNCTION"
                                ))
                
            except Exception:
                # Safety: always continue even if file analysis fails
                continue
        
        # Scoring logic using deduction model
        deductions = sum({
            "Critical": 0.5, "High": 0.3, "Medium": 0.1, "Low": 0.02
        }.get(i.severity, 0) for i in issues)
        
        score = max(0.0, 10.0 - deductions)
        
        # If no issues found but we had files, give a good score
        if not issues and analyzed_files:
            score = 9.0
        
        return score, issues
