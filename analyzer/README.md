
# Analysis Engine Microservice

A production-grade microservice for static code analysis, built with FastAPI and Python.

## Features

- **Project Detection**: Identifies Python, Node.js, Frontend, Backend projects.
- **Code Quality**: Uses `pylint` for Python linting and scoring.
- **Security Check**: Uses `bandit` to detect security vulnerabilities.
- **Complexity Analysis**: Uses `radon` for Cyclomatic Complexity and Maintainability Index.
- **Structural Analysis**: Uses `tree-sitter` (optional) and heuristics to find large files, mixed concerns, and "God classes".
- **File Summarization**: Extracts key files for downstream processing.

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: For `tree-sitter` features, `tree-sitter-languages` is included but requires a compatible environment. If it fails, the service gracefully falls back to heuristics.*

2. **Run Server**:
   ```bash
   uvicorn main:app --reload
   ```
   Or use the included `run.bat`.

## API Usage

**POST /api/v1/analyze**

Request:
```json
{
  "projectId": "12345",
  "path": "C:/path/to/project"
}
```

Response:
```json
{
  "projectId": "12345",
  "language": "Python",
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

## Configuration

Adjust settings in `app/core/config.py` (e.g., ignored directories, timeouts).
