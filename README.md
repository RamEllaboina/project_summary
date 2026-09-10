# AI Code Analyzer - Complete Project Documentation

## 📋 Project Overview

The system combines static analysis, AI-based code evaluation, AI-generated code detection, and secure sandbox execution into a unified code intelligence platform.

### Workflow
Code Input → FastAPI Processing → Static Analysis → AI Quality Evaluation → AI Code Detection → Secure Execution → Result Aggregation → Unified Report

---

## 🏗️ System Architecture

```text
USER
│
├── Upload Code
├── Paste Code
└── Provide Prompt
│
▼
FRONTEND
│
├── Web Interface / VS Code UI
├── React / TypeScript
└── Code Upload & Input
│
▼
FASTAPI BACKEND
│
├── Request Handling
├── Authentication
├── Orchestration Service
└── Response Aggregation
│
▼
CORE ANALYSIS ENGINE
│
├── 1. STATIC CODE ANALYSIS
│   ├── Linting
│   ├── SAST
│   ├── Vulnerability Detection
│   └── Code Structure Analysis
│
├── 2. AI CODE QUALITY EVALUATION
│   ├── Code Review
│   ├── Maintainability
│   ├── Readability
│   ├── Efficiency
│   └── Quality Scoring
│
├── 3. AI-GENERATED CODE DETECTION
│   ├── Statistical Features
│   ├── AST / Code Features
│   ├── ML / LLM Classification
│   └── AI Generation Probability
│
└── 4. SECURE SANDBOX EXECUTION
    ├── Execute Submitted Code
    ├── Capture Output
    ├── Capture Errors
    └── Apply Resource Restrictions


SUPPORTING COMPONENTS

AI / ML MODELS
│
├── Code Quality Model
├── AI Detection Model
├── Vulnerability Detection Model
└── Ensemble / Hybrid Model


DATA STORAGE
│
├── Database
├── Analysis Results
├── Logs
└── Reports


SECURE SANDBOX ENVIRONMENT
│
├── Docker Container
├── Namespaces
├── cgroups
├── Seccomp-BPF
├── Network Isolation
└── CPU / Memory / Time Limits


EXTERNAL SERVICES
│
├── LLM API
├── CVE / CWE Database
└── Code Datasets


RESULT AGGREGATION
│
└── Combines:
    ├── Static Analysis Results
    ├── AI Quality Results
    ├── AI Detection Results
    └── Sandbox Execution Results
│
▼
OUTPUT / UNIFIED REPORT
│
├── Overall Score
├── Code Quality Score
├── Security Vulnerabilities
├── AI Detection Probability
├── Complexity Analysis
├── Strengths
├── Weaknesses
├── AI Summary
├── Suggestions & Explanation
└── Execution Output / Errors
```

---

## 📁 Complete Folder Structure

```
bvrit_hack/
├── .git/                          # Git version control
├── .venv/                         # Python virtual environment
│
├── backend/                       # Node.js orchestration backend
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   │   └── projectController.js    # Upload, status, report endpoints
│   │   ├── jobs/                  # Background job processors
│   │   │   └── processJob.js          # Main job processing logic
│   │   ├── middlewares/           # Express middlewares
│   │   │   ├── auth.js                # Authentication middleware
│   │   │   └── upload.js              # File upload handling
│   │   ├── models/                 # Mongoose models
│   │   │   └── Project.js             # Project schema definition
│   │   ├── routes/                 # API route definitions
│   │   │   └── projectRoutes.js       # Route configurations
│   │   ├── services/               # Business logic services
│   │   │   ├── aiDetectionService.js  # AI detection API calls
│   │   │   ├── aiService.js           # AI engine API calls
│   │   │   ├── analyzerService.js     # Analyzer service API calls
│   │   │   ├── fileService.js         # File operations
│   │   │   └── sandboxService.js      # Sandbox execution service
│   │   ├── utils/                  # Helper utilities
│   │   ├── app.js                  # Express app configuration
│   │   └── server.js               # Server entry point
│   ├── storage/                   # Local file storage
│   │   ├── projects/              # Extracted project files
│   │   └── uploads/               # Uploaded zip files
│   ├── scripts/                   # Utility scripts
│   ├── .env.example              # Environment variables template
│   ├── package.json              # Node.js dependencies
│   ├── job_log.txt               # Job processing logs
│   └── README.md                 # Backend documentation
│
├── analyzer/                      # Python static analysis service
│   ├── app/
│   │   ├── api/                   # API endpoints
│   │   │   ├── __init__.py
│   │   │   └── routes.py             # FastAPI route definitions
│   │   ├── core/                  # Core configuration
│   │   │   ├── config.py              # Settings and constants
│   │   │   └── security.py            # Security utilities
│   │   ├── models/                # Data models
│   │   │   └── schemas.py            # Pydantic schemas
│   │   ├── services/              # Analysis services
│   │   │   ├── analysis_service.py    # Main analysis orchestration
│   │   │   ├── complexity_service.py   # Cyclomatic complexity analysis
│   │   │   ├── dynamic_scanner_local.py  # Dynamic code scanning
│   │   │   ├── project_scanner.py      # Project structure scanning
│   │   │   ├── project_summarizer.py   # File summarization
│   │   │   ├── quality_service.py      # Code quality analysis (pylint)
│   │   │   ├── security_service.py     # Security vulnerability scanning (bandit)
│   │   │   └── structure_service.py    # Code structure analysis
│   │   └── utils/                 # Utility functions
│   │       └── helpers.py            # Helper functions
│   ├── main.py                   # FastAPI application entry
│   ├── requirements.txt          # Python dependencies
│   ├── debug_output.json         # Debug output
│   └── README.md                 # Analyzer documentation
│
├── ai_engine/                     # Python AI evaluation service
│   ├── llm_provider/             # LLM provider implementations
│   │   ├── __init__.py
│   │   ├── base.py                  # Base LLM provider interface
│   │   ├── gemini_provider.py      # Google Gemini integration
│   │   ├── openai_provider.py      # OpenAI integration
│   │   ├── groq_provider.py        # Groq API integration
│   │   └── local_provider.py       # Local LLM integration
│   ├── ai_detection_service.py   # AI detection logic
│   ├── config.py                 # Service configuration
│   ├── main.py                   # FastAPI application entry
│   ├── models.py                 # Pydantic data models
│   ├── prompts.py                # LLM prompt templates
│   ├── service.py                # Main evaluation service
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example              # Environment variables template
│   └── README.md                 # AI engine documentation
│
├── ai_detection_service/         # Dedicated AI detection service
│   ├── llm_provider/             # LLM provider implementations
│   │   ├── __init__.py
│   │   ├── base.py                  # Base LLM provider interface
│   │   ├── gemini_provider.py      # Google Gemini integration
│   │   ├── openai_provider.py      # OpenAI integration
│   │   ├── groq_provider.py        # Groq API integration
│   │   └── local_provider.py       # Local LLM integration
│   ├── ai_detection_service.py   # AI detection logic
│   ├── config.py                 # Service configuration
│   ├── folder_scanner.py         # Folder scanning utilities
│   ├── main.py                   # FastAPI application entry
│   ├── models.py                 # Pydantic data models
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment variables template
│   └── README.md                 # AI detection documentation
│
├── analyzer_frontend/             # React frontend application
│   ├── public/                   # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/               # Asset files
│   │   ├── components/           # React components
│   │   │   ├── Dropzone.jsx          # File upload component
│   │   │   ├── DynamicInnovationShowcase.jsx  # Innovation display
│   │   │   ├── InnovationShowcase.jsx           # Innovation showcase
│   │   │   ├── SandboxViewer.jsx               # Code sandbox viewer
│   │   │   ├── Footer.jsx                      # Footer component
│   │   │   └── ui/                             # UI component library
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Progress.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── Alert.jsx
│   │   │       └── Loading.jsx
│   │   ├── context/              # React context providers
│   │   │   └── AppContext.jsx        # Global app state
│   │   ├── lib/                  # Utility libraries
│   │   ├── pages/                # Page components
│   │   │   ├── Home.jsx              # Landing page
│   │   │   ├── Upload.jsx            # Upload page
│   │   │   ├── Processing.jsx        # Processing status page
│   │   │   └── Report.jsx            # Report display page
│   │   ├── services/             # API service calls
│   │   │   └── api.js                # Backend API client
│   │   ├── App.jsx                # Main app component
│   │   ├── index.css              # Global styles
│   │   └── main.jsx               # React entry point
│   ├── .env.example              # Environment variables template
│   ├── .gitignore
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # HTML template
│   ├── package.json              # Node.js dependencies
│   ├── vite.config.js            # Vite configuration
│   └── README.md                 # Frontend documentation
│
├── sand_box_project/             # Code sandbox execution environment
│   ├── public/                   # Public assets
│   ├── routes/                   # Express routes
│   │   └── upload.js                 # Upload handling
│   ├── services/                 # Sandbox services
│   │   ├── dockerRunner.js          # Docker container execution
│   │   ├── entryDetector.js         # Entry point detection
│   │   ├── fileFilter.js            # File filtering
│   │   ├── packageManager.js        # Package manager operations
│   │   ├── projectScanner.js        # Project scanning
│   │   ├── runner.js                # Code execution
│   │   ├── security.js              # Security checks
│   │   ├── setupManager.js          # Setup management
│   │   ├── templateManager.js       # Template management
│   │   └── utils.js                 # Utility functions
│   ├── test-project/             # Test projects
│   ├── server.js                 # Sandbox server
│   ├── package.json              # Node.js dependencies
│   └── test files...              # Various test files
│
├── .gitignore                    # Git ignore rules
├── STARTUP_GUIDE.md              # Service startup instructions
├── WORKFLOW.md                   # End-to-end workflow documentation
└── README.md                     # This file
```

---

## 🔧 Service Details

### 1. Backend (Node.js/Express) - Port 3000

**Purpose**: Orchestration layer that coordinates all services and manages project processing pipeline.

**Key Components**:
- **Controllers**: Handle HTTP requests for upload, status, and report retrieval
- **Jobs**: Background processing for project extraction, analysis, and report generation
- **Services**: Business logic for communicating with external services
- **Storage**: Manages file uploads and extracted project storage

**Main Functions**:
- Accept project uploads via zip files
- Extract and validate project structure
- Orchestrate analysis pipeline (static analysis → AI evaluation → AI detection)
- Aggregate results from multiple services
- Provide status tracking and report retrieval

**API Endpoints**:
- `POST /api/upload` - Upload project zip file
- `GET /api/status/:projectId` - Get processing status
- `GET /api/report/:projectId` - Get final analysis report

---

### 2. Analyzer Service (Python/FastAPI) - Port 8000

**Purpose**: Static code analysis using various Python tools to assess code quality, security, and complexity.

**Key Components**:
- **Analysis Service**: Main orchestration of static analysis
- **Complexity Service**: Cyclomatic complexity using `radon`
- **Quality Service**: Code quality scoring using `pylint`
- **Security Service**: Security vulnerability detection using `bandit`
- **Structure Service**: Code structure and architecture analysis
- **Project Scanner**: Directory structure and file detection

**Tools Used**:
- `pylint` - Python code quality analysis
- `bandit` - Security vulnerability scanner
- `radon` - Code complexity metrics
- `pathspec` - Gitignore-style pattern matching

**Analysis Metrics**:
- Quality Score (0-10)
- Structure Score (0-10)
- Security Score (0-10)
- Cyclomatic Complexity
- Maintainability Index
- Lines of Code
- Comment Ratio
- Security Issues
- Code Smells

**API Endpoint**:
- `POST /api/v1/analyze` - Analyze project at given path

---

### 3. AI Engine Service (Python/FastAPI) - Port 8002

**Purpose**: Semantic evaluation using LLMs to assess innovation, real-world impact, and provide human-like feedback.

**Key Components**:
- **LLM Providers**: Multiple LLM integrations (Gemini, OpenAI, Groq, Local)
- **Service**: Main evaluation logic and prompt engineering
- **Prompts**: Structured prompt templates for consistent LLM responses
- **Models**: Pydantic models for request/response validation

**Supported LLM Providers**:
- Google Gemini (gemini-1.5-flash)
- OpenAI (GPT models)
- Groq (Fast inference)
- Local LLMs (Ollama, etc.)

**Evaluation Dimensions**:
- AI Generation Probability (0-100%)
- Innovation Level (Low/Medium/High)
- Real-World Impact Assessment
- Strengths Analysis
- Weaknesses Analysis
- Improvement Suggestions

**API Endpoint**:
- `POST /evaluate` - Evaluate project using LLM

---

### 4. AI Detection Service (Python/FastAPI) - Port 8005

**Purpose**: Specialized service for detecting AI-generated code patterns using a separate API key for isolation.

**Key Components**:
- **AI Detection Service**: Pattern matching and AI signal detection
- **Folder Scanner**: Recursive code scanning
- **LLM Provider**: Dedicated LLM integration for detection

**Detection Signals**:
- AI-generated phrases and patterns
- Naming convention analysis
- Structure pattern detection
- Comment analysis
- Complexity analysis
- File-level suspicious activity

**Output**:
- AI Detection Level (High/Medium/Low)
- AI Probability Score (0.0-1.0)
- Confidence Score
- Detailed reasoning
- Signal breakdown
- Suspicious files list

**API Endpoint**:
- `POST /detect` - Detect AI-generated code patterns

---

### 5. Frontend (React/Vite) - Port 5173

**Purpose**: User interface for project upload, processing status, and report visualization.

**Key Components**:
- **Dropzone**: Drag-and-drop file upload with client-side zipping
- **Processing Page**: Real-time status polling and progress display
- **Report Page**: Interactive visualization of analysis results
- **Sandbox Viewer**: Code execution and preview environment

**Features**:
- Client-side zip file generation using JSZip
- Automatic filtering of node_modules, .git, build artifacts
- Real-time status polling every 2 seconds
- Beautiful data visualizations
- Responsive design with modern UI

**Tech Stack**:
- React 18
- Vite (build tool)
- TailwindCSS (styling)
- JSZip (client-side zipping)
- Lucide Icons

---

### 6. Sandbox Service (Node.js) - Separate Port

**Purpose**: Safe code execution environment for running and testing uploaded projects.

**Key Components**:
- **Docker Runner**: Containerized code execution
- **Entry Detector**: Automatic entry point detection
- **File Filter**: Security-focused file filtering
- **Package Manager**: Dependency management
- **Security**: Execution sandbox and isolation

**Features**:
- Docker-based isolation
- Automatic dependency installation
- Entry point detection (main.py, app.js, index.html, etc.)
- Security checks and validation
- Template-based project setup

---

## 🔄 End-to-End Workflow

### DASHBOARD MAPPING

| Architecture Component | Dashboard Output |
| :--- | :--- |
| Static Analysis | Security Health |
| Complexity Analysis | Complexity |
| AI Quality Evaluation | Code Quality / Overall Score |
| AI Code Detection | AI Generation Probability |
| Secure Sandbox | Sandbox / Execution Result |
| Result Aggregation | Overall Score |
| AI Analysis | AI Summary |
| Analysis Engine | Strengths & Weaknesses |

### 1. User Upload (Frontend)
1. User provides Source Code using Web Interface / VS Code UI (React/TypeScript).
2. Frontend sends request to the FastAPI Backend.

### 2. Ingestion & Preprocessing (FastAPI Backend)
1. Backend validates request.
2. Authenticates and prepares orchestration.

### 3. Static Code Analysis (Core Engine)
1. Analyzes Code Structure Analysis.
2. Performs Linting and Security Vulnerability Detection (SAST).
3. Evaluates cyclomatic complexity.

### 4. AI Code Quality Evaluation
1. Scores maintainability, readability, efficiency.
2. Integrates AI-based code review metric scoring.

### 5. AI-Generated Code Detection
1. Applies statistical feature mapping.
2. Generates ML/LLM classification scoring.
3. Provides AI generation probability.

### 6. Secure Sandbox Execution
1. Evaluates code dynamically using secure isolation (Docker, cgroups, constraints).
2. Captures executions outputs and errors.

### 7. Result Aggregation
1. Aggregates and correlates data models.
2. Generates cohesive unified report.

### 8. Display Dashboard
1. Provides visually separated views to the frontend reflecting overall scores, quality, and sandboxed metrics.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- MongoDB (local instance or Atlas)
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd bvrit_hack
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Analyzer Service Setup
```bash
cd analyzer
pip install -r requirements.txt
```

### 4. AI Engine Setup
```bash
cd ai_engine
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your LLM API keys
```

### 5. AI Detection Service Setup
```bash
cd ai_detection_service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your LLM API keys
```

### 6. Frontend Setup
```bash
cd analyzer_frontend
npm install
cp .env.example .env
# Edit .env with backend URL
```

### 7. Start MongoDB
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongodb
```

---

## 🎬 Running the Application

Open 5 separate terminals:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:3000`

### Terminal 2 - Analyzer Service
```bash
cd analyzer
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Service runs on `http://localhost:8000`

### Terminal 3 - AI Engine
```bash
cd ai_engine
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```
Service runs on `http://localhost:8002`

### Terminal 4 - AI Detection Service
```bash
cd ai_detection_service
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```
Service runs on `http://localhost:8005`

### Terminal 5 - Frontend
```bash
cd analyzer_frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=3000
DATABASE_LOCAL=mongodb://localhost:27017/ai-code-analyzer
ANALYZER_URL=http://localhost:8000/api/v1/analyze
AI_ENGINE_URL=http://localhost:8002/evaluate
AI_DETECTION_URL=http://localhost:8005/detect
```

### AI Engine (.env)
```env
API_PORT=8002
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
MODEL_NAME=gemini-1.5-flash
```

### AI Detection Service (.env)
```env
API_PORT=8005
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
MODEL_NAME=llama3-70b-8192
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

---

## 📊 API Documentation

### Backend API

#### Upload Project
```http
POST /api/upload
Content-Type: multipart/form-data

Body: project (zip file)

Response:
{
  "projectId": "uuid-string",
  "message": "Project uploaded successfully"
}
```

#### Get Status
```http
GET /api/status/:projectId

Response:
{
  "status": "uploaded" | "cleaning" | "analyzing" | "ai_evaluation" | "ai_detection" | "completed" | "failed",
  "progress": 0-100,
  "currentStep": "string"
}
```

#### Get Report
```http
GET /api/report/:projectId

Response:
{
  "projectId": "uuid-string",
  "staticAnalysis": { ... },
  "aiEvaluation": { ... },
  "aiDetection": { ... },
  "timestamp": "ISO-string"
}
```

### Analyzer Service API

#### Analyze Project
```http
POST /api/v1/analyze
Content-Type: application/json

Body:
{
  "projectId": "string",
  "path": "/absolute/path/to/project"
}

Response:
{
  "projectId": "string",
  "language": "Python" | "JavaScript" | "Unknown",
  "metrics": {
    "qualityScore": 8.5,
    "structureScore": 9.0,
    "securityScore": 10.0,
    "complexity": { ... }
  },
  "issues": [ ... ],
  "importantFiles": [ ... ],
  "status": "completed"
}
```

### AI Engine API

#### Evaluate Project
```http
POST /evaluate
Content-Type: application/json

Body:
{
  "projectId": "string",
  "language": "string",
  "metrics": { ... },
  "importantFiles": [ ... ],
  "readme": "string"
}

Response:
{
  "projectId": "string",
  "aiProbability": 10,
  "innovationLevel": "low" | "medium" | "high",
  "realWorldUse": "string",
  "strengths": [ ... ],
  "weaknesses": [ ... ],
  "suggestions": [ ... ]
}
```

### AI Detection Service API

#### Detect AI Patterns
```http
POST /detect
Content-Type: application/json

Body:
{
  "projectId": "string",
  "language": "string",
  "metrics": { ... },
  "importantFiles": [ ... ],
  "readme": "string"
}

Response:
{
  "aiDetection": {
    "level": "high" | "medium" | "low",
    "score": 0.0,
    "confidence": 0.0,
    "reasoning": "string",
    "signals": { ... },
    "suspiciousFiles": [ ... ]
  },
  "projectId": "string"
}
```

---

## 🎯 Benefits of Microservices Architecture

1. **Easy Maintenance**: Update individual services without affecting others
2. **Better Performance**: Dedicated services for specific tasks
3. **Isolation**: Issues in one service don't affect others
4. **Scalability**: Scale services independently based on load
5. **Cost Tracking**: Monitor API usage separately for each service
6. **Development**: Test and deploy services independently
7. **Technology Flexibility**: Use different tech stacks per service
8. **Fault Tolerance**: Graceful degradation if one service fails

---

## 🔒 Security Features

- File upload validation and sanitization
- Extraction sandbox to prevent path traversal
- API key separation for different services
- MongoDB connection security
- Input validation on all endpoints
- Rate limiting capabilities
- Docker-based sandbox for code execution

---

## 📈 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **File Processing**: adm-zip, multer
- **Job Processing**: Custom job queue

### Python Services
- **Framework**: FastAPI
- **Analysis Tools**: pylint, bandit, radon
- **LLM Integration**: OpenAI, Google Gemini, Groq
- **Async Processing**: asyncio, aiohttp

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **File Processing**: JSZip
- **HTTP Client**: fetch API

---

## 🧪 Testing

### Test Backend
```bash
cd backend
npm test
```

### Test Analyzer Service
```bash
cd analyzer
pytest
```

### Test AI Services
```bash
# Test AI Engine
cd ai_engine
python -m pytest

# Test AI Detection
cd ai_detection_service
python -m pytest
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify MongoDB is not blocked by firewall

### Analyzer Service Not Responding
- Check if port 8000 is available
- Verify Python dependencies are installed
- Check logs for errors

### AI Service API Errors
- Verify API keys in `.env` files
- Check API key credits and quotas
- Ensure LLM provider is accessible

### Frontend Cannot Connect to Backend
- Check backend is running on port 3000
- Verify `VITE_API_URL` in frontend `.env`
- Check CORS configuration in backend

---

## 📝 Development Notes

### Adding New Analysis Metrics
1. Add metric calculation in `analyzer/app/services/`
2. Update response schema in `analyzer/app/models/`
3. Add frontend visualization in `analyzer_frontend/src/pages/Report.jsx`

### Adding New LLM Provider
1. Create provider in `ai_engine/llm_provider/`
2. Implement base interface methods
3. Add configuration in `config.py`
4. Update provider selection in `service.py`

### Modifying Workflow
1. Update job processing in `backend/src/jobs/processJob.js`
2. Add new service calls if needed
3. Update status transitions
4. Modify frontend polling logic if needed

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built for hackathon project - AI Code Analyzer

---

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Last Updated**: July 2026
