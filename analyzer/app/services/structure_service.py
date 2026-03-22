
from pathlib import Path
from typing import List, Dict, Tuple
from app.models.schemas import Issue

class StructureService:
    def __init__(self):
        self.large_file_threshold = 800 # lines
        self.large_function_threshold = 100 # lines
        self.parser_cache = {}

    def analyze(self, files: List[Path]) -> Tuple[float, List[Issue]]:
        issues = []
        file_metrics = []
        
        # Try to load tree-sitter
        try:
            from tree_sitter_languages import get_language, get_parser
            has_treesitter = True
        except ImportError:
            has_treesitter = False
        
        for file in files:
            try:
                # Basic line counting
                with open(file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    lines = content.splitlines()
                    count = len(lines)
                    file_metrics.append((file, count))
                    
                    if count > self.large_file_threshold:
                         issues.append(Issue(
                            severity="Medium",
                            category="Structure",
                            message=f"File exceeds {self.large_file_threshold} lines (God Class risk)",
                            file=str(file.name),
                            line=count,
                            code="SIZE_LIMIT"
                        ))
                    
                    # Separation of Concerns (Heuristics)
                    if file.suffix == ".py":
                        if "<html>" in content or "<div>" in content:
                             issues.append(Issue(
                                severity="Medium",
                                category="Structure",
                                message="HTML mixed in Python code (Improper Separation)",
                                file=str(file.name),
                                line=0,
                                code="MIXED_CONTENT"
                            ))
                        if "SELECT * FROM" in content.upper() or "INSERT INTO" in content.upper():
                             # If not a migration or sql file, flag it
                             if "migration" not in str(file) and "sql" not in str(file):
                                 issues.append(Issue(
                                    severity="Low",
                                    category="Structure",
                                    message="Hardcoded SQL in application logic",
                                    file=str(file.name),
                                    line=0,
                                    code="HARDCODED_SQL" 
                                ))
                    
                    # Tree Sitter Analysis for Function Size
                    if has_treesitter and file.suffix in [".py", ".js", ".ts", ".jsx", ".tsx"]:
                        lang_map = {
                            ".py": "python",
                            ".js": "javascript",
                            ".jsx": "javascript",
                            ".ts": "typescript",
                            ".tsx": "typescript",
                        }
                        lang_name = lang_map.get(file.suffix)
                        if lang_name:
                            self._check_function_sizes(content, lang_name, file, issues)

            except Exception as e:
                continue
                
        # Calculate Score
        # Start at 10.0
        # Deduct for large files
        large_file_penalty = len([f for f in file_metrics if f[1] > self.large_file_threshold]) * 0.5
        
        # Deduct for mixed content
        mixed_content_penalty = len([i for i in issues if i.code == "MIXED_CONTENT"]) * 1.0
        sql_penalty = len([i for i in issues if i.code == "HARDCODED_SQL"]) * 0.2
        large_func_penalty = len([i for i in issues if i.code == "LARGE_FUNCTION"]) * 0.2
        
        score = max(0.0, 10.0 - (large_file_penalty + mixed_content_penalty + sql_penalty + large_func_penalty))
        
        return round(score, 2), issues

    def _check_function_sizes(self, content: str, lang_name: str, file_path: Path, issues: List[Issue]):
        try:
            from tree_sitter_languages import get_parser
            parser = get_parser(lang_name)
            tree = parser.parse(bytes(content, "utf8"))
            
            # Query for functions
            # Simplified queries (might need adjustment per language version)
            # Python: function_definition, JS: function_declaration, arrow_function, method_definition
            
            queries = {
                "python": "(function_definition) @func",
                "javascript": "(function_declaration) @func (arrow_function) @func (method_definition) @func",
                "typescript": "(function_declaration) @func (arrow_function) @func (method_definition) @func"
            }
            
            query_str = queries.get(lang_name)
            if not query_str: return
            
            # Using tree traversal manually if query fails or for simplicity without building libraries
            # But standard query usage:
            # We can't easily use queries without `tree_sitter.Language` object which requires compiled lib.
            # safe fallback: Recursive walk
            
            self._walk_tree_for_size(tree.root_node, file_path, issues)
            
        except Exception:
            pass

    def _walk_tree_for_size(self, node, file_path, issues):
        type_ = node.type
        if type_ in ["function_definition", "function_declaration", "method_definition"]:
            start = node.start_point.row
            end = node.end_point.row
            length = end - start
            if length > self.large_function_threshold:
                 issues.append(Issue(
                    severity="Low",
                    category="Structure",
                    message=f"Function/Method exceeds {self.large_function_threshold} lines",
                    file=str(file_path.name),
                    line=start + 1,
                    code="LARGE_FUNCTION"
                ))
        
        for child in node.children:
            self._walk_tree_for_size(child, file_path, issues)
