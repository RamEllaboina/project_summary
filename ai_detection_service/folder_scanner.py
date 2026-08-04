import os
import json
from typing import List, Dict, Any
from ai_detection_service import get_ai_detection_service
from models import EvaluationInput

class FolderScanner:
    """Scan uploaded folders for AI detection"""
    
    def __init__(self):
        self.ai_detection_service = None  # Lazy initialization
    
    async def scan_folder(self, folder_path: str, project_id: str = None) -> Dict[str, Any]:
        """
        Scan a folder for files and analyze them for AI generation
        """
        if not os.path.exists(folder_path):
            return {"error": f"Folder {folder_path} does not exist"}
        
        if not project_id:
            project_id = f"folder-scan-{os.path.basename(folder_path)}"
        
        # Get all code files from folder
        code_files = self._get_code_files(folder_path)
        
        if not code_files:
            return {"error": f"No code files found in {folder_path}"}
        
        print(f"🔍 Scanning {len(code_files)} files in {folder_path}")
        
        # Convert to format expected by AI detection service
        important_files = []
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    important_files.append({
                        "path": os.path.relpath(file_path, folder_path),
                        "content": content
                    })
            except Exception as e:
                print(f"⚠️  Could not read {file_path}: {str(e)}")
                continue
        
        # Initialize AI detection service if not already done
        if self.ai_detection_service is None:
            self.ai_detection_service = get_ai_detection_service()
        
        # Create evaluation input
        evaluation_input = EvaluationInput(
            projectId=project_id,
            language=self._detect_language(folder_path),
            metrics={"qualityScore": 50, "structureScore": 50, "securityScore": 50},
            importantFiles=important_files,
            readme=f"Folder scan of {os.path.basename(folder_path)}"
        )
        
        # Perform AI detection
        try:
            ai_detection_result = await self.ai_detection_service.analyze_code_for_ai_signals(
                important_files, project_id
            )
            
            return {
                "projectId": project_id,
                "folderPath": folder_path,
                "filesScanned": len(code_files),
                "aiDetection": ai_detection_result.get("aiDetection", {}),
                "scanTime": self._get_timestamp(),
                "files": important_files
            }
            
        except Exception as e:
            return {"error": f"AI detection failed: {str(e)}"}
    
    def _get_code_files(self, folder_path: str) -> List[str]:
        """Get all code files from folder"""
        code_extensions = {
            '.js', '.jsx', '.ts', '.tsx', '.vue',
            '.py', '.java', '.cpp', '.c', '.h',
            '.cs', '.php', '.rb', '.go', '.rs',
            '.html', '.css', '.scss', '.less',
            '.sql', '.sh', '.bat', '.ps1',
            '.dart', '.swift', '.kt', '.scala'
        }
        
        # Extensions to ignore (type definition files, etc.)
        ignored_extensions = {
            '.d.ts', '.d.tsx', '.d.jsx', '.d.mts', '.d.cts'
        }
        
        # Directories to ignore
        ignored_dirs = {
            'node_modules', '__pycache__', '.git', 'dist', 'build',
            '.next', 'out', 'target', 'coverage', '.vscode', '.idea',
            'vendor', '.nyc_output', '.pytest_cache', '.mypy_cache',
            '.tox', 'site-packages', 'bower_components', '.npm', '.cache',
            'tmp', 'temp', 'venv', '.venv'
        }
        
        code_files = []
        
        for root, dirs, files in os.walk(folder_path):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ignored_dirs]
            
            for file in files:
                if not file.startswith('.'):
                    file_path = os.path.join(root, file)
                    file_ext = os.path.splitext(file)[1].lower()
                    
                    # Skip type definition files
                    if file_ext in ignored_extensions:
                        continue
                    
                    if file_ext in code_extensions:
                        code_files.append(file_path)
        
        return code_files
    
    def _detect_language(self, folder_path: str) -> str:
        """Detect primary language from folder"""
        file_counts = {}
        
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext:
                    file_counts[ext] = file_counts.get(ext, 0) + 1
        
        if not file_counts:
            return "Unknown"
        
        # Determine primary language
        primary_ext = max(file_counts, key=file_counts.get)
        
        language_map = {
            '.js': 'JavaScript',
            '.jsx': 'JavaScript',
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript',
            '.vue': 'Vue',
            '.py': 'Python',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.html': 'HTML',
            '.css': 'CSS',
            '.sql': 'SQL'
        }
        
        return language_map.get(primary_ext, 'Unknown')
    
    def _get_timestamp(self) -> int:
        """Get current timestamp"""
        import time
        return int(time.time())