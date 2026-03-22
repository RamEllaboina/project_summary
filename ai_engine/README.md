# AI Engine Microservice

This microservice provides semantic evaluation of software projects using an LLM (OpenAI or Local).
It is part of a larger Code Analyzer system and focuses on human-level judgement and innovation assessment.

## Features

- **Project Understanding**: Explains codebase purpose and usability.
- **AI Detection**: Estimates probability of AI-generated code.
- **Innovation Score**: Classifies project as Basic, Moderate, or Innovative.
- **Real World Impact**: Assesses practical utility.
- **Human Feedback**: Provides strengths, weaknesses, and suggestions.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configuration**:
    Create a `.env` file based on your environment:
    ```env
    API_PORT=8002
    
    # Provider options: 'gemini', 'openai', 'local'
    LLM_PROVIDER=gemini 
    
    # Gemini Configuration
    GEMINI_API_KEY=AIzaSy...
    MODEL_NAME=gemini-1.5-flash

    # OpenAI Configuration (Optional)
    # OPENAI_API_KEY=sk-...

    # Local LLM Configuration (Optional)
    # LOCAL_LLM_URL=http://localhost:11434/v1
    # MODEL_NAME=llama3
    ```

3.  **Run the Service**:
    ```bash
    # Using python module (recommended)
    python -m ai_engine.main
    
    # Or using uvicorn directly (from parent dir)
    uvicorn ai_engine.main:app --reload --port 8002
    ```

## API Usage

**POST /evaluate**

Request Body:
```json
{
  "projectId": "proj_123",
  "language": "python",
  "metrics": {
    "complexity": 15,
    "maintainability": 85
  },
  "importantFiles": [
    { "path": "main.py", "content": "print('hello world')" }
  ],
  "readme": "# My Project..."
}
```

Response:
```json
{
  "projectId": "proj_123",
  "aiProbability": 10,
  "innovationLevel": "low",
  "realWorldUse": "Basic script for learning.",
  "strengths": ["Simple", "Readable"],
  "weaknesses": ["Limited functionality"],
  "suggestions": ["Add more features"]
}
```
