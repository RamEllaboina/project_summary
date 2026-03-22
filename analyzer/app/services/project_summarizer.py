
import json
from pathlib import Path
from typing import List
from app.models.schemas import SimpleSummary


class ProjectSummarizer:
    def __init__(self):
        self.priority_files = [
            "main.py", "app.py", "manage.py", "wsgi.py", "asgi.py",
            "models.py", "schemas.py", "database.py",
            "views.py", "controllers.py", "routes.py", "endpoints.py",
            "config.py", "settings.py",
            "requirements.txt", "Pipfile", "pyproject.toml",
            "package.json", "index.js", "server.js", "app.js",
            "index.ts", "server.ts", "app.ts",
            "README.md"
        ]
        # Max characters of actual code to include per file for AI context
        self.MAX_CONTENT_CHARS = 3000

    def summarize(self, files: List[Path]) -> List[SimpleSummary]:
        selected_files = []

        # 1. Priority files first (exact name match)
        priority_lower = [p.lower() for p in self.priority_files]
        for f in files:
            if f.name.lower() in priority_lower and f not in selected_files:
                selected_files.append(f)

        # 2. Fill up to 15 with other source files (skip tests & migrations)
        if len(selected_files) < 15:
            for f in files:
                if (f.suffix in {".py", ".js", ".ts", ".jsx", ".tsx"}
                        and "test" not in f.name.lower()
                        and "migration" not in f.name.lower()
                        and f not in selected_files):
                    selected_files.append(f)
                    if len(selected_files) >= 15:
                        break

        summaries = []
        for f in selected_files[:15]:
            summary_text = self._generate_summary(f)
            type_ = self._determine_type(f)
            summaries.append(SimpleSummary(
                path=str(f.name),
                summary=summary_text,
                type=type_
            ))

        return summaries

    def _determine_type(self, file_path: Path) -> str:
        name = file_path.name.lower()
        if "main" in name or "app" in name or "server" in name or "index" in name:
            return "entry_point"
        if "model" in name or "schema" in name or "entity" in name:
            return "data_model"
        if "config" in name or "setting" in name or "env" in name:
            return "configuration"
        if "util" in name or "helper" in name or "common" in name:
            return "utility"
        if "route" in name or "view" in name or "controller" in name or "endpoint" in name:
            return "business_logic"
        if "test" in name or "spec" in name:
            return "test"
        if name in {"requirements.txt", "package.json", "pyproject.toml", "pipfile"}:
            return "dependency"
        if name == "readme.md":
            return "documentation"
        return "source_code"

    def _generate_summary(self, file_path: Path) -> str:
        """
        Generates a rich summary including:
        - Structural stats (classes, functions, imports)
        - Actual code snippet (first MAX_CONTENT_CHARS chars) for AI context
        """
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            lines = content.splitlines()
            line_count = len(lines)

            if line_count == 0:
                return "Empty file."

            # ── Structural stats ─────────────────────────────────────────────
            if file_path.suffix == ".py":
                classes = [l.strip() for l in lines if l.strip().startswith("class ")]
                funcs = [l.strip() for l in lines if l.strip().startswith("def ")]
                imports = [l.strip() for l in lines if l.strip().startswith(("import ", "from "))]
                stats = (
                    f"Python Module | {line_count} lines | "
                    f"{len(classes)} classes | {len(funcs)} functions | "
                    f"{len(imports)} imports"
                )
                if classes:
                    stats += f"\nClasses: {', '.join(c.split('(')[0].replace('class ', '') for c in classes[:5])}"
                if funcs:
                    stats += f"\nFunctions: {', '.join(f.split('(')[0].replace('def ', '') for f in funcs[:8])}"

            elif file_path.suffix in {".js", ".ts", ".jsx", ".tsx"}:
                imports = [l.strip() for l in lines if l.strip().startswith("import ") or "require(" in l]
                funcs = [l.strip() for l in lines if "function " in l or "=>" in l]
                exports = [l.strip() for l in lines if l.strip().startswith("export ")]
                stats = (
                    f"JS/TS Module | {line_count} lines | "
                    f"~{len(funcs)} functions/arrows | "
                    f"{len(imports)} imports | {len(exports)} exports"
                )

            elif file_path.name == "requirements.txt":
                deps = [l.strip() for l in lines if l.strip() and not l.startswith("#")]
                stats = f"Python Dependencies | {len(deps)} packages: {', '.join(deps[:10])}"

            elif file_path.name == "package.json":
                try:
                    pkg = json.loads(content)
                    dep_names = list(pkg.get("dependencies", {}).keys())
                    dev_names = list(pkg.get("devDependencies", {}).keys())
                    stats = (
                        f"Node.js Package | "
                        f"deps: {', '.join(dep_names[:8])} | "
                        f"devDeps: {', '.join(dev_names[:5])}"
                    )
                except Exception:
                    stats = "Node.js Package Configuration."

            elif file_path.name.lower() == "readme.md":
                # First 500 chars of README is very useful for AI
                stats = f"README | {line_count} lines"

            else:
                stats = f"Source File | {line_count} lines"

            # ── Code snippet (actual content for AI) ─────────────────────────
            snippet = content[:self.MAX_CONTENT_CHARS]
            if len(content) > self.MAX_CONTENT_CHARS:
                snippet += "\n... [truncated]"

            return f"{stats}\n\n--- CODE SNIPPET ---\n{snippet}"

        except Exception:
            return "Unable to read file."
