import subprocess
import json
import shutil
import sys
import re
import os
import asyncio
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import functools
from app.models.schemas import Issue


class SecurityService:
    # Configuration constants
    MAX_FILES_PER_LANGUAGE = 100
    BANDIT_TIMEOUT = 120
    DEDUCTION_WEIGHTS = {
        "Critical": 3.0,
        "High": 1.5,
        "Medium": 0.5,
        "Low": 0.1
    }
    
    # Security patterns by language with detailed explanations
    SECURITY_PATTERNS = {
        'python': {
            'hardcoded_secrets': [
                (r'(password|passwd|pwd)\s*=\s*["\'][^"\']{8,}["\']', 
                 "Hardcoded password detected", 
                 "High",
                 "❌ **Why this is a problem**: Hardcoded passwords in source code can be exposed if the repository is made public or accessed by unauthorized people. Anyone with access to the code can see and use these credentials.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Use environment variables: `os.environ.get('DB_PASSWORD')`\n"
                 "2. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)\n"
                 "3. Use configuration files that are NOT committed to version control\n"
                 "4. For development, use a `.env` file and add it to `.gitignore`\n\n"
                 "📚 **Example**:\n"
                 "```python\n"
                 "# ❌ Bad:\n"
                 "password = 'mysecretpassword123'\n\n"
                 "# ✅ Good:\n"
                 "import os\n"
                 "password = os.environ.get('DB_PASSWORD')\n"
                 "```"),
            ],
            'dangerous_functions': [
                (r'\beval\s*\(', 
                 "Dangerous eval() usage", 
                 "High",
                 "❌ **Why this is a problem**: `eval()` executes arbitrary strings as Python code. If an attacker can control any part of the string being evaluated, they could execute malicious code on your server.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Avoid `eval()` completely - there's almost always a safer alternative\n"
                 "2. Use `ast.literal_eval()` for safe evaluation of literals\n"
                 "3. Use proper data structures instead of evaluating strings\n\n"
                 "📚 **Example**:\n"
                 "```python\n"
                 "# ❌ Bad - if user_input is '__import__(\"os\").system(\"rm -rf /\")'\n"
                 "result = eval(user_input)\n\n"
                 "# ✅ Good - use proper data structures\n"
                 "if user_input == 'add':\n"
                 "    result = 5 + 3\n"
                 "```"),
            ],
            'sql_injection': [
                (r'execute\s*\(\s*["\'][^"\']*\%[^"\']*["\']\s*%', 
                 "Potential SQL injection with string formatting", 
                 "High",
                 "❌ **Why this is a problem**: Using string formatting (%) or concatenation to build SQL queries makes your application vulnerable to SQL injection attacks. Attackers can inject malicious SQL code that could delete data, bypass authentication, or steal information.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Always use parameterized queries/prepared statements\n"
                 "2. Use an ORM (SQLAlchemy, Django ORM) that handles escaping\n"
                 "3. Never trust user input directly in SQL strings\n\n"
                 "📚 **Example**:\n"
                 "```python\n"
                 "# ❌ Bad - vulnerable to: ' OR '1'='1\n"
                 "cursor.execute(f\"SELECT * FROM users WHERE name = '{user_input}'\")\n\n"
                 "# ✅ Good - parameterized query\n"
                 "cursor.execute(\"SELECT * FROM users WHERE name = %s\", (user_input,))\n"
                 "```"),
            ]
        },
        'javascript': {
            'xss_risks': [
                (r'\.innerHTML\s*=', 
                 "innerHTML assignment - XSS risk", 
                 "High",
                 "❌ **Why this is a problem**: Setting `innerHTML` with user-controlled content allows attackers to inject malicious scripts. If a user enters `<img src=x onerror=alert('XSS')>`, the script will execute in your application.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Use `textContent` or `innerText` instead of `innerHTML` when possible\n"
                 "2. Sanitize HTML with a library like DOMPurify\n"
                 "3. Use framework-specific safe methods (React's `dangerouslySetInnerHTML` is appropriately named to warn you)\n\n"
                 "📚 **Example**:\n"
                 "```javascript\n"
                 "# ❌ Bad:\n"
                 "element.innerHTML = userInput;  // User input: <script>stealCookies()</script>\n\n"
                 "# ✅ Good:\n"
                 "element.textContent = userInput;  // Displays as plain text: <script>stealCookies()</script>\n\n"
                 "# If you MUST use HTML:\n"
                 "import DOMPurify from 'dompurify';\n"
                 "element.innerHTML = DOMPurify.sanitize(userInput);\n"
                 "```"),
            ],
            'dangerous_functions': [
                (r'\beval\s*\(', 
                 "Dangerous eval() usage", 
                 "High",
                 "❌ **Why this is a problem**: `eval()` executes any string as JavaScript code. If an attacker can control any part of that string, they can run malicious code in your users' browsers, stealing cookies, session tokens, or performing actions on their behalf.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Never use `eval()` - there's always a better alternative\n"
                 "2. Use `JSON.parse()` for parsing JSON data\n"
                 "3. Use `Function` constructor carefully (still dangerous)\n"
                 "4. Use proper data structures and functions instead\n\n"
                 "📚 **Example**:\n"
                 "```javascript\n"
                 "# ❌ Bad:\n"
                 "const result = eval('(' + userInput + ')');  // If userInput is 'console.log(document.cookie)'\n\n"
                 "# ✅ Good:\n"
                 "const result = JSON.parse(userInput);  // Only parses JSON, no code execution\n"
                 "```"),
            ]
        },
        'html': {
            'missing_security_headers': [
                (r'<meta\s+http-equiv=["\']Content-Security-Policy["\']', 
                 "Content Security Policy (CSP) header not found", 
                 "Medium",
                 "❌ **Why this is a problem**: Without a Content Security Policy (CSP), your website is more vulnerable to XSS attacks. CSP tells the browser what sources are trusted for scripts, styles, and other resources. Without it, an attacker can inject and run scripts from any source.\n\n"
                 "✅ **How to fix**:\n"
                 "Add a CSP meta tag to your HTML `<head>`:\n"
                 "```html\n"
                 "<meta http-equiv=\"Content-Security-Policy\" content=\"\n"
                 "    default-src 'self';\n"
                 "    script-src 'self';\n"
                 "    style-src 'self';\n"
                 "    img-src 'self';\n"
                 "    connect-src 'self';\n"
                 "    font-src 'self';\n"
                 "    object-src 'none';\n"
                 "    frame-ancestors 'none';\n"
                 "\">\n"
                 "```\n\n"
                 "📚 **For development with external resources**:\n"
                 "```html\n"
                 "<meta http-equiv=\"Content-Security-Policy\" content=\"\n"
                 "    default-src 'self';\n"
                 "    script-src 'self' https://apis.google.com https://cdnjs.cloudflare.com;\n"
                 "    style-src 'self' 'unsafe-inline';\n"
                 "\">\n"
                 "```"),
            ],
            'xss_vectors': [
                (r'onerror\s*=', 
                 "Event handler with potential XSS", 
                 "High",
                 "❌ **Why this is a problem**: Event handlers like `onerror`, `onload`, `onclick` can execute JavaScript. If the attribute value comes from user input or contains unsanitized data, an attacker can inject malicious code.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Avoid inline event handlers entirely\n"
                 "2. Use `addEventListener()` in separate JavaScript files\n"
                 "3. Never put user input directly into event handler attributes\n\n"
                 "📚 **Example**:\n"
                 "```html\n"
                 "# ❌ Bad:\n"
                 "<img src=\"image.jpg\" onerror=\"alert('Error: ' + userInput)\">\n\n"
                 "# ✅ Good:\n"
                 "<img src=\"image.jpg\" id=\"myImage\">\n"
                 "<script>\n"
                 "document.getElementById('myImage').addEventListener('error', function() {\n"
                 "    console.log('Image failed to load');\n"
                 "    // Handle error safely\n"
                 "});\n"
                 "</script>\n"
                 "```"),
            ]
        },
        'css': {
            'injection_vectors': [
                (r'expression\s*\(', 
                 "CSS expression() - XSS vector", 
                 "High",
                 "❌ **Why this is a problem**: CSS `expression()` is an old IE feature that executes JavaScript. This can be used for XSS attacks in older browsers. Modern browsers have removed this, but legacy code might still contain it.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Remove `expression()` entirely\n"
                 "2. Use modern CSS features instead\n"
                 "3. Use JavaScript for dynamic styling when needed\n\n"
                 "📚 **Example**:\n"
                 "```css\n"
                 "# ❌ Bad (IE only, executes JS):\n"
                 ".box { width: expression(document.body.clientWidth > 400 ? '400px' : 'auto'); }\n\n"
                 "# ✅ Good:\n"
                 ".box { width: 100%; max-width: 400px; }\n"
                 "```"),
            ]
        },
        'config': {
            'env_secrets': [
                (r'.*',  # This is handled specially in _analyze_config_security
                 "Hardcoded secret in .env file", 
                 "High",
                 "❌ **Why this is a problem**: `.env` files containing actual secrets should NEVER be committed to version control. If your repository is made public, all your API keys, database passwords, and other secrets will be exposed.\n\n"
                 "✅ **How to fix**:\n"
                 "1. Add `.env` to your `.gitignore` file\n"
                 "2. Create a `.env.example` file with placeholder values\n"
                 "3. Use environment variables in production\n"
                 "4. Rotate any exposed secrets immediately\n\n"
                 "📚 **Example**:\n"
                 "```\n"
                 "# .gitignore - add this line:\n"
                 ".env\n\n"
                 "# .env.example (safe to commit):\n"
                 "DB_PASSWORD=your_db_password_here\n"
                 "API_KEY=your_api_key_here\n"
                 "```"),
            ]
        }
    }

    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=2)

    async def analyze(self, project_path: Path, files: List[Path] = None) -> Tuple[float, List[Issue]]:
        """Run comprehensive security analysis on the project."""
        try:
            # Run the analysis in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._sync_analyze,
                project_path,
                files
            )
            return result
        except asyncio.CancelledError:
            print("Security analysis cancelled")
            return 0.0, []
        except Exception as e:
            print(f"Error in security analysis: {e}")
            return 5.0, [Issue(
                severity="Medium",
                category="Security",
                message=f"Security analysis error: {str(e)}",
                explanation="The security analysis encountered an error and could not complete. This might be due to file permission issues, missing dependencies, or unexpected file formats.",
                file="System"
            )]

    def _sync_analyze(self, project_path: Path, files: List[Path] = None) -> Tuple[float, List[Issue]]:
        """Synchronous version of analyze for thread pool execution."""
        try:
            # If no files specified, scan the entire project
            if files is None:
                files = self._get_project_files(project_path)
            
            # Group files by language
            file_groups = self._group_files_by_language(files)
            
            all_issues = []
            group_scores = {}
            
            # Run analysis sequentially
            if file_groups['python']:
                py_score, py_issues = self._analyze_python_security(file_groups['python'])
                all_issues.extend(py_issues)
                group_scores['python'] = py_score
                
            if file_groups['javascript']:
                js_score, js_issues = self._analyze_js_security(file_groups['javascript'])
                all_issues.extend(js_issues)
                group_scores['javascript'] = js_score
                
            if file_groups['html']:
                html_score, html_issues = self._analyze_html_security(file_groups['html'])
                all_issues.extend(html_issues)
                group_scores['html'] = html_score
                
            if file_groups['css']:
                css_score, css_issues = self._analyze_css_security(file_groups['css'])
                all_issues.extend(css_issues)
                group_scores['css'] = css_score
                
            if file_groups['config']:
                config_score, config_issues = self._analyze_config_security(file_groups['config'])
                all_issues.extend(config_issues)
                group_scores['config'] = config_score
            
            # If no analysis was performed, return neutral score
            if not group_scores:
                return 8.0, []
            
            # Calculate final score with weighted average based on file count
            total_files = sum(len(group) for group in file_groups.values())
            
            if total_files == 0:
                return 8.0, all_issues
            
            weighted_sum = 0.0
            for group_name, group_files in file_groups.items():
                if group_files and group_name in group_scores:
                    weight = len(group_files) / total_files
                    weighted_sum += group_scores[group_name] * weight
            
            final_score = weighted_sum if weighted_sum > 0 else 8.0
            
            return round(final_score, 2), self._deduplicate_issues(all_issues)
            
        except KeyboardInterrupt:
            # Handle keyboard interrupt gracefully
            print("Security analysis interrupted by user")
            return 0.0, []
        except Exception as e:
            print(f"Unexpected error in security analysis: {e}")
            return 5.0, [Issue(
                severity="Medium",
                category="Security",
                message=f"Security analysis error: {str(e)}",
                explanation="The security analysis encountered an unexpected error.",
                file="System"
            )]

    def _get_project_files(self, project_path: Path) -> List[Path]:
        """Recursively get all relevant files from the project."""
        files = []
        excluded_dirs = {'.git', '__pycache__', 'node_modules', 'venv', 'env', '.env', 'dist', 'build', 'vendor'}
        
        try:
            for root, dirs, filenames in os.walk(project_path):
                # Modify dirs in-place to skip excluded directories
                dirs[:] = [d for d in dirs if d not in excluded_dirs]
                
                for filename in filenames:
                    file_path = Path(root) / filename
                    if self._is_analyzeable_file(file_path):
                        files.append(file_path)
        except Exception as e:
            print(f"Error walking directory: {e}")
        
        return files[:1000]  # Limit to prevent overwhelming

    def _is_analyzeable_file(self, file_path: Path) -> bool:
        """Check if file type should be analyzed."""
        analyzeable_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css', '.json', '.yml', '.yaml', '.env'}
        return file_path.suffix.lower() in analyzeable_extensions

    def _group_files_by_language(self, files: List[Path]) -> Dict[str, List[Path]]:
        """Group files by language for targeted analysis."""
        groups = {
            'python': [],
            'javascript': [],
            'html': [],
            'css': [],
            'config': []
        }
        
        for file in files:
            suffix = file.suffix.lower()
            if suffix == '.py':
                groups['python'].append(file)
            elif suffix in {'.js', '.ts', '.jsx', '.tsx'}:
                groups['javascript'].append(file)
            elif suffix in {'.html', '.htm'}:
                groups['html'].append(file)
            elif suffix == '.css':
                groups['css'].append(file)
            elif suffix in {'.json', '.yml', '.yaml', '.env'}:
                groups['config'].append(file)
        
        return groups

    def _analyze_python_security(self, python_files: List[Path]) -> Tuple[float, List[Issue]]:
        """Enhanced Python security analysis with bandit and heuristic patterns."""
        issues = []
        
        # Try using bandit first
        if shutil.which("bandit") or self._module_available("bandit"):
            bandit_score, bandit_issues = self._run_bandit(python_files)
            issues.extend(bandit_issues)
        else:
            issues.append(Issue(
                severity="Low",
                category="Security",
                message="Bandit not installed - consider installing for better Python security analysis",
                explanation="Bandit is a security linter for Python that can find common security issues. Without it, the analysis is limited to basic pattern matching.\n\n"
                           "✅ **How to install**:\n"
                           "```bash\n"
                           "pip install bandit\n"
                           "```",
                file="System",
                code="BANDIT_MISSING"
            ))
        
        # Additional heuristic analysis for patterns bandit might miss
        heuristic_issues = self._analyze_python_heuristics(python_files)
        issues.extend(heuristic_issues)
        
        # Calculate score
        score = self._calculate_score_from_issues(issues)
        return score, issues

    def _run_bandit(self, python_files: List[Path]) -> Tuple[float, List[Issue]]:
        """Run bandit security linter on Python files."""
        targets = [str(f) for f in python_files[:self.MAX_FILES_PER_LANGUAGE]]
        
        cmd = [sys.executable, "-m", "bandit", "-f", "json", "-q", "-ll"] + targets  # -ll for low confidence findings
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.BANDIT_TIMEOUT
            )
            
            if result.returncode not in {0, 1}:  # bandit returns 1 if issues found
                raise subprocess.CalledProcessError(result.returncode, cmd)
            
            output = json.loads(result.stdout)
            issues = self._parse_bandit_output(output)
            
            # Calculate score based on bandit metrics
            totals = output.get("metrics", {}).get("_totals", {})
            high = totals.get("SEVERITY.HIGH", 0)
            medium = totals.get("SEVERITY.MEDIUM", 0)
            low = totals.get("SEVERITY.LOW", 0)
            
            deduction = (high * 2.0) + (medium * 0.8) + (low * 0.2)
            score = max(0.0, round(10.0 - deduction, 2))
            
            return score, issues
            
        except subprocess.TimeoutExpired:
            return 5.0, [Issue(
                severity="Medium",
                category="Security",
                message="Bandit analysis timed out - project may be too large",
                explanation="The Bandit security scan took too long to complete. This usually happens with very large projects.\n\n"
                           "✅ **How to fix**:\n"
                           "1. Run Bandit locally on specific directories\n"
                           "2. Exclude test directories and third-party code\n"
                           "3. Consider incremental scanning",
                file="System",
                code="BANDIT_TIMEOUT"
            )]
        except Exception as e:
            return 5.0, [Issue(
                severity="Low",
                category="Security",
                message=f"Bandit analysis failed: {str(e)}",
                explanation="Bandit could not complete the security scan. This might be due to syntax errors in Python files or permission issues.",
                file="System",
                code="BANDIT_FAILED"
            )]

    def _parse_bandit_output(self, output: Dict) -> List[Issue]:
        """Parse bandit JSON output into Issue objects."""
        issues = []
        
        for res in output.get("results", []):
            # Map bandit severity to our severity levels
            severity_map = {
                "HIGH": "High",
                "MEDIUM": "Medium",
                "LOW": "Low"
            }
            
            # Get bandit's description or use default
            bandit_desc = res.get("issue_text", "Unknown security issue")
            test_id = res.get("test_id", "")
            
            # Add explanation based on bandit test ID
            explanations = {
                "B101": "❌ **Why this is a problem**: Using `assert` in production code can lead to security issues because assertions can be disabled globally with the `-O` flag. Security-critical checks should never use assertions.\n\n"
                       "✅ **How to fix**: Replace `assert` with proper conditional checks and error handling.",
                
                "B102": "❌ **Why this is a problem**: The `exec` function executes arbitrary strings as Python code. This is extremely dangerous if any part of the string comes from user input.\n\n"
                       "✅ **How to fix**: Avoid `exec` entirely. There's always a safer alternative.",
                
                "B301": "❌ **Why this is a problem**: Pickle is not secure against maliciously constructed data. Never unpickle data from untrusted sources.\n\n"
                       "✅ **How to fix**: Use a safer serialization format like JSON or implement proper validation.",
            }
            
            explanation = explanations.get(test_id, 
                f"This issue was detected by Bandit (test {test_id}). Check the Bandit documentation for more details.")
            
            issues.append(Issue(
                severity=severity_map.get(res.get("issue_severity", "LOW"), "Low"),
                category="Security",
                message=bandit_desc,
                explanation=explanation,
                file=res.get("filename", ""),
                line=res.get("line_number"),
                code=test_id
            ))
        
        return issues

    def _analyze_python_heuristics(self, python_files: List[Path]) -> List[Issue]:
        """Heuristic analysis for Python files."""
        issues = []
        patterns = self.SECURITY_PATTERNS['python']
        
        for file in python_files[:self.MAX_FILES_PER_LANGUAGE]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                
                # Check for hardcoded secrets
                for pattern, msg, severity, explanation in patterns['hardcoded_secrets']:
                    self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, "HARDCODED_SECRET", explanation)
                
                # Check for dangerous functions
                for pattern, msg, severity, explanation in patterns['dangerous_functions']:
                    self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, "DANGEROUS_FUNC", explanation)
                
                # Check for SQL injection vectors
                for pattern, msg, severity, explanation in patterns['sql_injection']:
                    self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, "SQL_INJECTION", explanation)
                
            except Exception as e:
                continue
        
        return issues

    def _analyze_js_security(self, js_files: List[Path]) -> Tuple[float, List[Issue]]:
        """Comprehensive JavaScript/TypeScript security analysis."""
        issues = []
        patterns = self.SECURITY_PATTERNS['javascript']
        
        # First, check for package.json dependencies (if exists)
        self._check_npm_dependencies(js_files, issues)
        
        for file in js_files[:self.MAX_FILES_PER_LANGUAGE]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                
                # Check all pattern categories
                for category, pattern_list in patterns.items():
                    for pattern, msg, severity, explanation in pattern_list:
                        self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, category.upper(), explanation)
                
                # Additional check for environment variable exposure
                if 'process.env' in content:
                    self._scan_env_variable_exposure(lines, file, issues)
                
            except Exception:
                continue
        
        score = self._calculate_score_from_issues(issues)
        return score, issues

    def _analyze_html_security(self, html_files: List[Path]) -> Tuple[float, List[Issue]]:
        """Enhanced HTML security analysis."""
        issues = []
        patterns = self.SECURITY_PATTERNS['html']
        
        for file in html_files[:self.MAX_FILES_PER_LANGUAGE]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                
                # Check security headers presence
                has_csp = False
                has_xcto = False
                
                for line in lines:
                    if 'Content-Security-Policy' in line or 'content-security-policy' in line.lower():
                        has_csp = True
                    if 'X-Content-Type-Options' in line or 'x-content-type-options' in line.lower():
                        has_xcto = True
                
                if not has_csp:
                    # Find the explanation for missing CSP
                    for pattern, msg, severity, explanation in patterns.get('missing_security_headers', []):
                        if 'CSP' in msg:
                            issues.append(Issue(
                                severity=severity,
                                category="Security",
                                message=msg,
                                explanation=explanation,
                                file=file.name,
                                line=1,
                                code="MISSING_CSP"
                            ))
                
                # Check XSS vectors
                for pattern, msg, severity, explanation in patterns.get('xss_vectors', []):
                    self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, "XSS_RISK", explanation, re.IGNORECASE)
                
                # Check form security
                for pattern, msg, severity, explanation in patterns.get('form_security', []):
                    self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, "FORM_SECURITY", explanation, re.IGNORECASE)
                
            except Exception:
                continue
        
        score = self._calculate_score_from_issues(issues)
        return score, issues

    def _analyze_css_security(self, css_files: List[Path]) -> Tuple[float, List[Issue]]:
        """Enhanced CSS security analysis."""
        issues = []
        patterns = self.SECURITY_PATTERNS['css']
        
        for file in css_files[:self.MAX_FILES_PER_LANGUAGE]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                
                for pattern, msg, severity, explanation in patterns.get('injection_vectors', []):
                    self._scan_pattern_in_lines(lines, pattern, msg, severity, file, issues, "CSS_INJECTION", explanation, re.IGNORECASE)
                
            except Exception:
                continue
        
        score = self._calculate_score_from_issues(issues)
        return score, issues

    def _analyze_config_security(self, config_files: List[Path]) -> Tuple[float, List[Issue]]:
        """Analyze configuration files for security issues."""
        issues = []
        
        for file in config_files[:self.MAX_FILES_PER_LANGUAGE]:
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                
                if file.suffix.lower() == '.env':
                    # Check .env files for sensitive data
                    lines = content.splitlines()
                    for i, line in enumerate(lines, 1):
                        if '=' in line and not line.strip().startswith('#'):
                            key, value = line.split('=', 1)
                            if value.strip() and not value.strip().startswith('$'):
                                # Find explanation for env secrets
                                for pattern, msg, severity, explanation in self.SECURITY_PATTERNS['config']['env_secrets']:
                                    issues.append(Issue(
                                        severity=severity,
                                        category="Security",
                                        message=f"Hardcoded secret in .env file: {key.strip()}",
                                        explanation=explanation,
                                        file=file.name,
                                        line=i,
                                        code="ENV_SECRET"
                                    ))
                
                elif file.suffix.lower() in {'.json', '.yml', '.yaml'}:
                    # Check for exposed secrets in config files
                    secret_patterns = [
                        (r'"(password|secret|token|api[_-]?key)"\s*:\s*"[^"\']{4,}"', 
                         "Hardcoded secret in config", 
                         "High",
                         "❌ **Why this is a problem**: Configuration files with hardcoded secrets should never be committed to version control. If your repository is made public, all your credentials will be exposed.\n\n"
                         "✅ **How to fix**:\n"
                         "1. Use environment variables: `${DB_PASSWORD}`\n"
                         "2. Use secrets management tools\n"
                         "3. Add config files to `.gitignore`\n"
                         "4. Use template files with placeholders"),
                    ]
                    
                    for pattern, msg, severity, explanation in secret_patterns:
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            issues.append(Issue(
                                severity=severity,
                                category="Security",
                                message=msg,
                                explanation=explanation,
                                file=file.name,
                                code="CONFIG_SECRET"
                            ))
                
            except Exception:
                continue
        
        score = self._calculate_score_from_issues(issues)
        return score, issues

    def _scan_pattern_in_lines(self, lines: List[str], pattern: str, message: str, 
                               severity: str, file: Path, issues: List[Issue], 
                               code: str, explanation: str = "", flags: int = 0):
        """Scan lines for a pattern and create issues."""
        try:
            compiled_pattern = re.compile(pattern, flags)
            for i, line in enumerate(lines, 1):
                if compiled_pattern.search(line):
                    # Skip if line is commented out
                    if self._is_commented_line(line, file.suffix):
                        continue
                    
                    # Use default explanation if none provided
                    if not explanation:
                        explanation = self._get_default_explanation(code, message)
                    
                    issues.append(Issue(
                        severity=severity,
                        category="Security",
                        message=message,
                        explanation=explanation,
                        file=file.name,
                        line=i,
                        code=code
                    ))
        except Exception:
            pass

    def _get_default_explanation(self, code: str, message: str) -> str:
        """Get default explanation for common security issues."""
        explanations = {
            "XSS_RISK": "❌ **Why this is a problem**: This pattern can lead to Cross-Site Scripting (XSS) vulnerabilities where attackers can inject malicious scripts into your web pages.\n\n"
                       "✅ **How to fix**: Sanitize user input, use safe APIs like textContent instead of innerHTML, and implement Content Security Policy.",
            
            "HARDCODED_SECRET": "❌ **Why this is a problem**: Hardcoded secrets in source code can be exposed if the repository is made public or accessed by unauthorized people.\n\n"
                               "✅ **How to fix**: Use environment variables, secrets managers, or configuration files not committed to version control.",
            
            "SQL_INJECTION": "❌ **Why this is a problem**: SQL injection allows attackers to manipulate your database queries, potentially stealing or destroying data.\n\n"
                            "✅ **How to fix**: Use parameterized queries/prepared statements and never concatenate user input directly into SQL strings.",
            
            "DANGEROUS_FUNC": "❌ **Why this is a problem**: This function can execute arbitrary code, making your application vulnerable to code injection attacks.\n\n"
                             "✅ **How to fix**: Avoid using this function entirely. Find safer alternatives for your use case.",
        }
        
        return explanations.get(code, f"Security issue detected: {message}. Review this code and follow security best practices to fix it.")

    def _scan_env_variable_exposure(self, lines: List[str], file: Path, issues: List[Issue]):
        """Check for environment variable exposure."""
        for i, line in enumerate(lines, 1):
            # Look for console.log that might expose env vars
            if 'console.log' in line and ('process.env' in line or 'env' in line):
                issues.append(Issue(
                    severity="Medium",
                    category="Security",
                    message="Potential environment variable exposure in console.log",
                    explanation="❌ **Why this is a problem**: Logging environment variables can expose sensitive information like API keys, database passwords, and tokens in log files.\n\n"
                               "✅ **How to fix**:\n"
                               "1. Remove console.log statements before production\n"
                               "2. Use a proper logging library that can redact sensitive data\n"
                               "3. Never log entire environment objects\n\n"
                               "📚 **Example**:\n"
                               "```javascript\n"
                               "# ❌ Bad:\n"
                               "console.log('Env:', process.env);  // Logs everything!\n\n"
                               "# ✅ Good:\n"
                               "console.log('App version:', process.env.APP_VERSION);  // Only log what's needed\n"
                               "```",
                    file=file.name,
                    line=i,
                    code="ENV_EXPOSURE"
                ))

    def _check_npm_dependencies(self, js_files: List[Path], issues: List[Issue]):
        """Check package.json for vulnerable dependencies (simplified version)."""
        package_json = None
        
        # Look for package.json in parent directories
        for file in js_files:
            potential_path = file.parent / 'package.json'
            if potential_path.exists():
                package_json = potential_path
                break
        
        if package_json and package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                
                # Check for known risky packages (simplified - in production, use npm audit or Snyk API)
                risky_packages = {
                    'jquery': {
                        'version': '<3.5.0',
                        'vulnerability': 'Prototype pollution and XSS vulnerabilities in older versions',
                        'fix': 'Update to jquery@3.5.0 or later'
                    },
                    'lodash': {
                        'version': '<4.17.21',
                        'vulnerability': 'Prototype pollution vulnerability',
                        'fix': 'Update to lodash@4.17.21 or later'
                    },
                    'axios': {
                        'version': '<0.21.1',
                        'vulnerability': 'Server-Side Request Forgery (SSRF) vulnerability',
                        'fix': 'Update to axios@0.21.1 or later'
                    },
                    'express': {
                        'version': '<4.17.2',
                        'vulnerability': 'Multiple security vulnerabilities in older versions',
                        'fix': 'Update to express@4.17.2 or later'
                    }
                }
                
                for pkg, info in risky_packages.items():
                    if pkg in deps:
                        issues.append(Issue(
                            severity="Low",
                            category="Security",
                            message=f"Consider updating {pkg} - {info['vulnerability']}",
                            explanation=f"❌ **Why this is a problem**: {info['vulnerability']}\n\n"
                                       f"✅ **How to fix**: {info['fix']}\n\n"
                                       f"Run: `npm install {pkg}@latest` or check for updates manually.",
                            file="package.json",
                            code="OUTDATED_DEP"
                        ))
                        
            except Exception:
                pass

    def _is_commented_line(self, line: str, file_suffix: str) -> bool:
        """Check if a line is commented out."""
        stripped = line.strip()
        
        if file_suffix == '.py':
            return stripped.startswith('#')
        elif file_suffix in {'.js', '.ts', '.jsx', '.tsx'}:
            return stripped.startswith('//') or stripped.startswith('/*')
        elif file_suffix in {'.html', '.htm'}:
            return stripped.startswith('<!--')
        elif file_suffix == '.css':
            return stripped.startswith('/*')
        
        return False

    def _calculate_score_from_issues(self, issues: List[Issue]) -> float:
        """Calculate security score based on issues found."""
        deduction = sum(self.DEDUCTION_WEIGHTS.get(i.severity, 0) for i in issues)
        return max(0.0, round(10.0 - deduction, 2))

    def _deduplicate_issues(self, issues: List[Issue]) -> List[Issue]:
        """Remove duplicate issues based on file, line, and code."""
        seen = set()
        unique_issues = []
        
        for issue in issues:
            # Create a unique key
            key = (issue.file, issue.line, issue.code, issue.message[:50])
            
            if key not in seen:
                seen.add(key)
                unique_issues.append(issue)
        
        return unique_issues

    @staticmethod
    def _module_available(name: str) -> bool:
        """Check if a Python module is available."""
        import importlib.util
        return importlib.util.find_spec(name) is not None

    def __del__(self):
        """Clean up thread pool executor."""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)