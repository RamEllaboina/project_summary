from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Add parent path for imports
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from config import Config
from models import EvaluationInput
from ai_detection_service import get_ai_detection_service
from folder_scanner import FolderScanner

load_dotenv()

app = FastAPI(title="AI Detection Microservice", description="Dedicated AI Generation Detection Service")

# CORS (Allow all for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI detection service
ai_detection_service = None
folder_scanner = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "AI Detection Microservice",
        "version": "1.0",
        "api_key": "secondary" if Config.GROQ_API_KEY_2 else "primary"
    }

@app.post("/detect")
async def detect_ai_generation(input_data: EvaluationInput):
    """
    Analyze code for AI generation using dedicated service.
    Uses secondary Groq API key when available.
    """
    global ai_detection_service
    
    try:
        # Initialize AI detection service if not already done
        if ai_detection_service is None:
            ai_detection_service = get_ai_detection_service()
        
        # Convert important files to dict format if needed
        files = []
        if input_data.importantFiles:
            for file in input_data.importantFiles:
                if hasattr(file, 'model_dump'):
                    files.append(file.model_dump())
                elif isinstance(file, dict):
                    files.append(file)
                else:
                    # Handle ImportantFile objects
                    files.append({
                        "path": getattr(file, 'path', 'unknown'),
                        "content": getattr(file, 'content', '')
                    })
        
        # Perform AI detection analysis
        ai_detection_result = await ai_detection_service.analyze_code_for_ai_signals(
            files, input_data.projectId
        )
        
        return ai_detection_result
        
    except Exception as e:
        # Log unexpected errors
        print(f"AI Detection Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze AI generation: {str(e)}")

@app.post("/scan-folder")
async def scan_folder_for_ai(data: dict):
    """
    Scan a folder for AI generation detection
    """
    global folder_scanner
    
    try:
        # Initialize folder scanner if not already done
        if folder_scanner is None:
            folder_scanner = FolderScanner()
        
        folder_path = data.get("folderPath")
        project_id = data.get("projectId")
        
        if not folder_path:
            raise HTTPException(status_code=400, detail="folderPath is required")
        
        # Scan folder for AI detection
        result = await folder_scanner.scan_folder(folder_path, project_id)
        
        return result
        
    except Exception as e:
        print(f"Folder Scan Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan folder: {str(e)}")

@app.get("/config")
async def get_config():
    """Get current AI detection configuration"""
    return {
        "service": "AI Detection Microservice",
        "secondary_key_available": bool(Config.GROQ_API_KEY_2),
        "primary_key_available": bool(Config.GROQ_API_KEY),
        "model": Config.MODEL_NAME,
        "provider": "groq"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_DETECTION_PORT", "8003"))
    print(f"🚀 Starting AI Detection Microservice on port {port}")
    print(f"📋 Using {'secondary' if Config.GROQ_API_KEY_2 else 'primary'} API key")
    uvicorn.run(app, host="0.0.0.0", port=port)
