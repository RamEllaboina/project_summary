from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ImportantFile(BaseModel):
    path: str
    content: str

class EvaluationInput(BaseModel):
    projectId: str
    language: str = Field(..., description="python | javascript | mixed")
    metrics: Dict[str, Any]
    importantFiles: List[ImportantFile] = []
    readme: Optional[str] = ""

class Overview(BaseModel):
    purpose: str
    targetUsers: str
    domain: str
    functionality: str

class Architecture(BaseModel):
    designPatterns: List[str]
    structure: str
    dataFlow: str
    techStack: str
    scalability: str

class Complexity(BaseModel):
    score: int = Field(..., ge=1, le=10)
    assessment: str
    learningCurve: str
    maintenance: str

class Security(BaseModel):
    score: int = Field(..., ge=1, le=10)
    assessment: str
    vulnerabilities: List[str]
    recommendations: List[str]

class AIDetection(BaseModel):
    probability: int = Field(..., ge=0, le=100)
    reasoning: str
    indicators: List[str]

class Innovation(BaseModel):
    level: str = Field(..., pattern="^(low|medium|high)$")
    score: int = Field(..., ge=1, le=10)
    assessment: str
    novelFeatures: List[str]

class Strengths(BaseModel):
    technical: List[str] = []
    architectural: List[str] = []
    performance: List[str] = []

class Weaknesses(BaseModel):
    technical: List[str] = []
    architectural: List[str] = []
    performance: List[str] = []

class Suggestions(BaseModel):
    technical: List[str] = []
    architectural: List[str] = []
    performance: List[str] = []

class RealWorldReadiness(BaseModel):
    score: int = Field(..., ge=1, le=10)
    deploymentReady: bool
    marketPotential: str
    userExperience: str

class AIDetection(BaseModel):
    level: str = Field(..., pattern="^(low|medium|high)$")
    score: float = Field(..., ge=0, le=10)
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str
    signals: Dict[str, str] = {}

class EvaluationOutput(BaseModel):
    projectId: str
    overview: str
    architecture: str
    complexity: str
    security: str
    aiDetection: AIDetection  # Use nested AIDetection object
    innovation: Innovation  # Use nested Innovation object
    realWorldReadiness: str
    strengths: Strengths
    weaknesses: Weaknesses
    suggestions: Suggestions

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "projectId": "example-project-123",
                    "overview": "Web-based calculator application for educational purposes",
                    "architecture": "Simple client-side JavaScript application with modular design",
                    "complexity": "Low complexity with basic arithmetic operations and event handling",
                    "security": "Basic security with input validation and XSS prevention",
                    "aiDetection": "Low probability of AI-generated code - shows human learning patterns",
                    "innovation": "Medium innovation with intuitive UI and history features",
                    "realWorldReadiness": "Moderately ready for educational use, needs production hardening",
                    "strengths": {
                        "points": [
                            "Clean, modular code structure",
                            "Good user interface design",
                            "Proper input validation",
                            "Efficient event handling"
                        ]
                    },
                    "weaknesses": {
                        "points": [
                            "Limited error handling",
                            "No server-side validation",
                            "Basic styling could be enhanced",
                            "No unit tests included"
                        ]
                    },
                    "suggestions": {
                        "points": [
                            "Add comprehensive unit tests",
                            "Implement server-side validation",
                            "Add accessibility features",
                            "Consider framework migration for scalability"
                        ]
                    }
                }
            ]
        }
    }
