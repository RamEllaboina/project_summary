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
    projectDescription: str = ""
    assessment: str
    novelFeatures: List[str]
    marketImpact: str = ""
    uniqueness: str = ""

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
    signals: Dict[str, Any] = {}  # Allow both strings and arrays

class WorkflowStep(BaseModel):
    step: int
    file: str
    action: str
    output: str

class UserFlowEvent(BaseModel):
    file: str
    process: str
    response: str

class UserFlowAction(BaseModel):
    action: str
    file: str
    process: str
    response: str

class UserFlow(BaseModel):
    onVisit: UserFlowEvent
    onAction: UserFlowAction

class ApiEndpoint(BaseModel):
    method: str
    endpoint: str
    purpose: str
    file: str

class DbCollection(BaseModel):
    name: str
    fields: List[str]
    purpose: str

class DatabaseSchema(BaseModel):
    collections: List[DbCollection]

class TechStack(BaseModel):
    frontend: List[str]
    backend: List[str]
    database: str
    tools: List[str]

class ProjectFlow(BaseModel):
    projectName: str = ""
    whatItDoes: str = ""
    completeWorkflow: List[WorkflowStep] = []
    userFlow: UserFlow
    dataFlow: str = ""
    apiEndpoints: List[ApiEndpoint] = []
    databaseSchema: DatabaseSchema
    techStack: TechStack

class EvaluationOutput(BaseModel):
    projectId: str
    summary: str = ""  # Add summary field
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
    projectFlow: Optional[ProjectFlow] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "projectId": "example-project-123",
                    "overview": "Web-based calculator application for educational purposes",
                    "architecture": "Simple client-side JavaScript application with modular design",
                    "complexity": "Low complexity with basic arithmetic operations and event handling",
                    "security": "Basic security with input validation and XSS prevention",
                    "aiDetection": {
                        "level": "low",
                        "score": 2.5,
                        "confidence": 0.9,
                        "reasoning": "Code shows natural human patterns with organic structure.",
                        "signals": {
                            "ai_phrases": [],
                            "naming_issues": [],
                            "structure_patterns": []
                        }
                    },
                    "innovation": {
                        "level": "medium",
                        "score": 6,
                        "projectDescription": "Web-based calculator application",
                        "assessment": "Medium innovation with intuitive UI and history features",
                        "novelFeatures": ["History tracking", "Interactive UI"],
                        "marketImpact": "Educational tool for students",
                        "uniqueness": "Focuses on providing step-by-step history"
                    },
                    "realWorldReadiness": "Moderately ready for educational use, needs production hardening",
                    "strengths": {
                        "technical": ["Clean, modular code structure"],
                        "architectural": ["Good user interface design"],
                        "performance": ["Efficient event handling"]
                    },
                    "weaknesses": {
                        "technical": ["No server-side validation"],
                        "architectural": ["Basic styling could be enhanced"],
                        "performance": ["No unit tests included"]
                    },
                    "suggestions": {
                        "technical": ["Implement server-side validation"],
                        "architectural": ["Add accessibility features"],
                        "performance": ["Consider framework migration for scalability"]
                    }
                }
            ]
        }
    }
