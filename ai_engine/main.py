from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from config import Config
from models import EvaluationInput, EvaluationOutput
from service import AIAnalysisService

app = FastAPI(title="AI Engine Microservice", description="Semantic Evaluation of Software Projects using LLM")

# CORS (Allow all for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = AIAnalysisService()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AI Engine", "version": "1.0"}

@app.post("/evaluate", response_model=EvaluationOutput)
async def evaluate_project(input_data: EvaluationInput):
    """
    Evaluates a software project based on metrics, code snippets, and README.
    """
    try:
        evaluation = await service.evaluate_project(input_data)
        return evaluation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log unexpected errors
        print(f"Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate project: {str(e)}")

@app.post("/ai-detection")
async def ai_detection(input_data: EvaluationInput):
    """
    Analyze code for AI generation using dedicated AI detection service.
    Uses secondary Groq API key when available.
    """
    try:
        ai_analysis = await service.analyze_ai_generation(input_data)
        return ai_analysis
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log unexpected errors
        print(f"AI Detection Internal Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze AI generation: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok", "provider": Config.LLM_PROVIDER}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=Config.API_PORT)
