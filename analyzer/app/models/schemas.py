from typing import List, Dict, Union, Any, Optional
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    projectId: str
    path: str

class ComplexityMetrics(BaseModel):
    average_cyclomatic_complexity: float = 0.0
    maintainability_index: float = 0.0
    max_complexity: int = 0
    complex_functions: int = 0
    total_files: int = 0
    total_loc: int = 0
    file_types: int = 0
    folder_depth: int = 0
    dependency_count: int = 0
    keyword_score: int = 0
    complexity_by_extension: Dict[str, Dict[str, Any]] = {}

class Metrics(BaseModel):
    qualityScore: float = 0.0
    structureScore: float = 0.0
    securityScore: float = 0.0
    complexity: ComplexityMetrics

class Issue(BaseModel):
    severity: str  # Critical, High, Medium, Low
    category: str  # specific (e.g., Security, Quality, Structure)
    message: str
    file: str
    line: int = 0
    code: Optional[str] = None

class SimpleSummary(BaseModel):
    path: str
    summary: str
    type: str  # backend, frontend, config, utility

class AnalysisResult(BaseModel):
    projectId: str
    language: str
    projectType: str = "unknown"
    metrics: Metrics
    issues: List[Issue] = []
    importantFiles: List[SimpleSummary] = []
    status: str = "completed"
