from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.schemas import AnalysisRequest, AnalysisResult
from app.services.analysis_service import AnalysisService
from pathlib import Path
import asyncio
import traceback

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_project(request: AnalysisRequest):
    """
    Analyzes a local project directory and returns a technical report.
    """
    project_path = Path(request.path)
    if not project_path.exists() or not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Invalid project path provided.")
    
    # Create a new instance for each request to avoid state sharing
    analysis_service = AnalysisService()
    
    try:
        from app.core.config import settings
        
        # Since analyze_project is now async, we don't need to_thread
        result = await asyncio.wait_for(
            analysis_service.analyze_project(
                request.projectId, 
                str(project_path)
            ),
            timeout=settings.TIMEOUT_SECONDS
        )
        
        return result
        
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=408, 
            detail="Analysis timed out. The project may be too large."
        )
    except asyncio.CancelledError:
        raise HTTPException(
            status_code=499, 
            detail="Analysis was cancelled by the client."
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Analysis failed: {str(e)}"
        )

# Optional: Add a background task endpoint for large projects
@router.post("/analyze/background", response_model=dict)
async def analyze_project_background(
    request: AnalysisRequest, 
    background_tasks: BackgroundTasks
):
    """
    Starts a background analysis for large projects.
    Returns a task ID that can be used to check status.
    """
    project_path = Path(request.path)
    if not project_path.exists() or not project_path.is_dir():
        raise HTTPException(status_code=400, detail="Invalid project path provided.")
    
    # Generate a task ID (you might want to use UUID)
    task_id = f"task_{request.projectId}"
    
    # Add to background tasks
    background_tasks.add_task(
        run_background_analysis,
        task_id,
        request.projectId,
        str(project_path)
    )
    
    return {
        "task_id": task_id,
        "status": "started",
        "message": "Analysis started in background"
    }

async def run_background_analysis(task_id: str, project_id: str, path: str):
    """Run analysis in background and store result."""
    try:
        analysis_service = AnalysisService()
        result = await analysis_service.analyze_project(project_id, path)
        
        # Store result somewhere (database, cache, etc.)
        # For now, just print
        print(f"Background analysis completed for task {task_id}")
        print(f"Result: {result}")
        
    except Exception as e:
        print(f"Background analysis failed for task {task_id}: {e}")