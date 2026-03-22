import os
import json
from typing import List, Dict, Any
from ai_detection_service import get_ai_detection_service
from models import EvaluationInput

class FolderScanner:
    """Scan uploaded folders for AI detection"""
    
    def __init__(self):
        self.ai_detection_service = get_ai_detection_service()
    
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
        
        code_files = []
        
        for root, dirs, files in os.walk(folder_path):
            # Skip hidden directories and common ignore directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', '.git', 'dist', 'build']]
            
            for file in files:
                if not file.startswith('.'):
                    file_path = os.path.join(root, file)
                    file_ext = os.path.splitext(file)[1].lower()
                    
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

# FastAPI endpoint for folder scanning
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="AI Detection Folder Scanner")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner = FolderScanner()

@app.get("/scan-folder")
async def scan_folder_endpoint(folder_path: str):
    """Scan a folder for AI detection"""
    try:
        result = await scanner.scan_folder(folder_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan-folder")
async def scan_folder_post(data: dict):
    """Scan a folder for AI detection (POST)"""
    folder_path = data.get("folderPath")
    project_id = data.get("projectId")
    
    if not folder_path:
        raise HTTPException(status_code=400, detail="folderPath is required")
    
    try:
        result = await scanner.scan_folder(folder_path, project_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "folder-scanner"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FOLDER_SCANNER_PORT", "8004"))
    print(f"🚀 Starting AI Detection Folder Scanner on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
