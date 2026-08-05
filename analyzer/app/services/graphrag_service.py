import re
from pathlib import Path
from typing import List, Dict, Any, Set
from collections import defaultdict

class GraphRagService:
    def __init__(self):
        # Regex for JS/TS imports
        self.js_import_pattern = re.compile(r'(?:import|from)\s+[\'"]([^\'"]+)[\'"]|require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)')
        # Regex for Python imports
        self.py_import_pattern = re.compile(r'^(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))', re.MULTILINE)

    def analyze(self, files: List[Path]) -> Dict[str, Any]:
        graph = defaultdict(list)
        in_degrees = defaultdict(int)
        
        # Build node registry
        nodes = {f.name: f for f in files}
        file_contents = {}

        # First pass: map dependencies
        for file in files:
            if file.name not in in_degrees:
                in_degrees[file.name] = 0
                
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                file_contents[file.name] = content
                deps = self._extract_dependencies(file, content)
                
                for dep in deps:
                    # Very simple matching: if the extracted dep is part of any node name
                    # this approximates local imports vs external packages 
                    matched_nodes = [n for n in nodes.keys() if dep in n or n.startswith(dep.split('.')[-1])]
                    for m in matched_nodes:
                        if m != file.name and m not in graph[file.name]:
                            graph[file.name].append(m)
                            in_degrees[m] += 1
            except Exception:
                continue
                
        total_nodes = len(files)
        total_edges = sum(len(edges) for edges in graph.values())
        
        isolated_count = sum(1 for n in nodes.keys() if len(graph[n]) == 0 and in_degrees[n] == 0)
        
        # Hub files (most out-degrees + in-degrees)
        degree_sums = {n: len(graph[n]) + in_degrees[n] for n in nodes.keys()}
        hub_files = sorted(degree_sums.items(), key=lambda x: x[1], reverse=True)
        hub_file_names_str = ", ".join(f[0] for f in hub_files[:3]) if hub_files else "None"
        
        # Critical files (most incoming edges - things depend on it)
        critical_files_list = sorted(in_degrees.items(), key=lambda x: x[1], reverse=True)
        critical_files_str = ", ".join(f[0] for f in critical_files_list[:3] if f[1] > 0) if critical_files_list and critical_files_list[0][1] > 0 else "None distributed evenly"

        # Coupling (edges to nodes ratio)
        ratio = total_edges / max(1, total_nodes)
        coupling_score = round(min(10.0, ratio * 2), 1)
        cohesion_score = round(max(0.0, 10.0 - coupling_score + (1.0 if isolated_count < total_nodes/2 else -2.0)), 1)
        cohesion_score = min(10.0, max(0.0, cohesion_score))
        
        circular_count = self._count_cycles(graph)
        max_depth = self._calculate_max_depth(graph)
        
        patterns = self._detect_patterns(nodes.keys())
        
        # Simple duplicate code block heuristic
        duplicate_percentage, duplicate_blocks = self._detect_duplicates(list(file_contents.values()))

        return {
            "totalNodes": total_nodes,
            "totalEdges": total_edges,
            "hubFiles": hub_file_names_str,
            "isolatedCount": isolated_count,
            "couplingScore": coupling_score,
            "cohesionScore": cohesion_score,
            "maxDepth": max_depth,
            "circularCount": circular_count,
            "duplicatePercentage": duplicate_percentage,
            "duplicateBlocks": duplicate_blocks,
            "criticalFiles": critical_files_str,
            "patternsDetected": patterns
        }

    def _extract_dependencies(self, file: Path, content: str) -> List[str]:
        deps = []
        if file.suffix in {'.js', '.jsx', '.ts', '.tsx'}:
            matches = self.js_import_pattern.findall(content)
            for m in matches:
                dep_path = m[0] or m[1]
                if dep_path:
                    deps.append(dep_path.split('/')[-1])
        elif file.suffix == '.py':
            matches = self.py_import_pattern.findall(content)
            for m in matches:
                dep_path = m[0] or m[1]
                if dep_path:
                    deps.append(dep_path.split('.')[0])
        return deps

    def _count_cycles(self, graph: Dict[str, List[str]]) -> int:
        visited = set()
        rec_stack = set()
        cycles = 0

        def dfs(node):
            nonlocal cycles
            visited.add(node)
            rec_stack.add(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor)
                elif neighbor in rec_stack:
                    cycles += 1
            rec_stack.remove(node)

        for node in list(graph.keys()):
            if node not in visited:
                dfs(node)
        return cycles

    def _calculate_max_depth(self, graph: Dict[str, List[str]]) -> int:
        memo = {}

        def dfs_depth(node, visited_path):
            if node in memo:
                return memo[node]
            if node in visited_path: # cycle
                return 0
                
            visited_path.add(node)
            max_d = 0
            for neighbor in graph.get(node, []):
                max_d = max(max_d, dfs_depth(neighbor, visited_path))
            visited_path.remove(node)
            
            memo[node] = max_d + 1
            return memo[node]

        max_overall = 0
        for node in graph.keys():
            max_overall = max(max_overall, dfs_depth(node, set()))
            
        return max_overall

    def _detect_patterns(self, filenames: Set[str]) -> str:
        patterns = []
        names = " ".join(filenames).lower()
        if 'service' in names or 'controller' in names or 'model' in names:
            patterns.append("N-Tier / MVC / Service Layer")
        if 'hook' in names or 'context' in names or 'provider' in names:
            patterns.append("React Hooks / Context Pattern")
        if 'factory' in names or 'builder' in names:
            patterns.append("Creational Patterns (Factory/Builder)")
        if 'schema' in names or 'dto' in names:
            patterns.append("Data Transfer Object (DTO) pattern")
            
        return ", ".join(patterns) if patterns else "Standard Modular Architecture"

    def _detect_duplicates(self, contents: List[str]):
        # Simple heuristic: exact matching chunks of 6+ lines
        blocks = set()
        duplicate_blocks = 0
        total_lines = 0
        duplicate_lines = 0
        
        for c in contents:
            lines = [l.strip() for l in c.splitlines() if len(l.strip()) > 10]
            total_lines += len(lines)
            
            for i in range(len(lines) - 5):
                chunk = "\\n".join(lines[i:i+6])
                if chunk in blocks:
                    duplicate_blocks += 1
                    duplicate_lines += 6
                else:
                    blocks.add(chunk)
                    
        percent = round((duplicate_lines / max(1, total_lines)) * 100, 1)
        # Cap logic to realistic boundaries
        return min(percent, 100.0), duplicate_blocks
