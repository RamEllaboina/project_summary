
import os
import json
import pathspec
from typing import List, Set
from app.core.config import settings
from pathlib import Path
from app.utils.file_filter import FileFilter


class ProjectScanner:
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.ignore_spec = self._load_gitignore()
        self.file_filter = FileFilter()

    def _load_gitignore(self) -> pathspec.PathSpec:
        """Loads gitignore if present, otherwise defaults to common ignores."""
        ignore_patterns = [
            "node_modules", ".git", "dist", "build", "venv", ".venv",
            "__pycache__", "coverage", "logs", ".idea", ".vscode",
            "target", "bin", "obj", "analysis", "analyzis",
            "*.pyc", "*.pyo", ".DS_Store", "*.min.js", "*.min.css",
            "*.lock", "package-lock.json", "yarn.lock"
        ]

        gitignore_path = self.project_path / ".gitignore"
        if gitignore_path.exists():
            with open(gitignore_path, "r", encoding="utf-8", errors="ignore") as f:
                ignore_patterns.extend(f.readlines())

        return pathspec.PathSpec.from_lines("gitwildmatch", ignore_patterns)

    def scan(self) -> List[Path]:
        """Scans the directory for relevant source files using intelligent filtering."""
        print(f"🔍 Starting intelligent file scan for: {self.project_path}")
        
        # Use the new intelligent filtering
        valid_files, ignored_files = self.file_filter.filter_files(
            self.project_path,
            max_depth=15,
            include_non_source_code=False,  # Only keep source code files
            log_ignored=True
        )
        
        # Log filtering summary
        print(f"📊 Scan Summary:")
        print(f"   Source code files found: {len(valid_files)}")
        print(f"   Files ignored: {len(ignored_files)}")
        
        # Count ignored reasons
        ignored_reasons = {}
        for _, reason in ignored_files:
            ignored_reasons[reason] = ignored_reasons.get(reason, 0) + 1
        
        if ignored_reasons:
            print(f"   Ignore reasons: {dict(ignored_reasons)}")
        
        return valid_files

    def _is_ignored(self, path: Path) -> bool:
        """Checks if a path should be ignored using both old and new methods."""
        # Use new intelligent filtering first
        if self.file_filter.should_ignore(path, path.is_dir()):
            return True
        
        # Fall back to existing gitignore logic for compatibility
        try:
            rel_path = path.relative_to(self.project_path)
            # Fast check against hardcoded ignored dirs
            for part in rel_path.parts:
                if part in settings.IGNORED_DIRS:
                    return True
            # Gitignore-style check
            if self.ignore_spec.match_file(str(rel_path)):
                return True
            return False
        except ValueError:
            return True  # Outside project root — ignore

    def detect_project_type(self, scanned_files: List[Path] = None) -> tuple:
        """
        Detects main language and project type.
        Uses already-scanned files to avoid re-globbing (which was slow and hit node_modules).
        """
        # ── Check manifest files first (most reliable) ──────────────────────
        is_python = (
            (self.project_path / "requirements.txt").exists()
            or (self.project_path / "pyproject.toml").exists()
            or (self.project_path / "setup.py").exists()
        )
        is_node = (self.project_path / "package.json").exists()

        if is_python:
            type_ = "Backend"
            req_path = self.project_path / "requirements.txt"
            if req_path.exists():
                try:
                    content = req_path.read_text(encoding="utf-8", errors="ignore").lower()
                    if "django" in content:
                        type_ = "Backend (Django)"
                    elif "flask" in content:
                        type_ = "Backend (Flask)"
                    elif "fastapi" in content:
                        type_ = "Backend (FastAPI)"
                    elif "streamlit" in content:
                        type_ = "Frontend (Streamlit)"
                except Exception:
                    pass
            return "Python", type_

        if is_node:
            try:
                with open(self.project_path / "package.json", "r", encoding="utf-8", errors="ignore") as f:
                    pkg = json.load(f)
                    all_deps = list(pkg.get("dependencies", {}).keys()) + \
                               list(pkg.get("devDependencies", {}).keys())

                    if any(x in all_deps for x in ["react", "vue", "next", "nuxt", "svelte", "angular"]):
                        return "JavaScript", "Frontend (React/Vue/Next)"
                    elif any(x in all_deps for x in ["express", "nest", "fastify", "koa", "hapi"]):
                        return "JavaScript", "Backend (Node.js)"
                    elif "electron" in all_deps:
                        return "JavaScript", "Desktop (Electron)"
                    else:
                        return "JavaScript", "Full-Stack (Node.js)"
            except Exception:
                return "JavaScript", "Node.js"

        # ── Fallback: use already-scanned files (avoids re-globbing) ─────────
        if scanned_files:
            py_count = sum(1 for f in scanned_files if f.suffix == ".py")
            js_count = sum(1 for f in scanned_files if f.suffix in {".js", ".ts", ".jsx", ".tsx"})
            java_count = sum(1 for f in scanned_files if f.suffix == ".java")

            if py_count >= js_count and py_count >= java_count and py_count > 0:
                return "Python", "Backend"
            elif js_count > 0:
                return "JavaScript", "Frontend"
            elif java_count > 0:
                return "Java", "Backend"

        return "Unknown", "General"
