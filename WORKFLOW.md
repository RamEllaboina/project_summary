# End-to-End System Workflow

This document outlines the complete data flow and processing pipeline of the AI Code Analyzer application.

## 1. User Interaction (Frontend)
- **Action**: User drags and drops a **Project Folder** or selects a folder via the upload dialog.
- **Process**: 
  - The frontend (`Dropzone.jsx`) recursively reads all files in the folder.
  - Bundles them into a single `.zip` file in the browser using `JSZip`.
  - Filters out `node_modules`, `.git`, and build artifacts before zipping.
  - Calls `POST /api/upload` with the generated zip file.
  - Receives a `projectId` and navigates to the `Processing` page.

## 2. Ingestion & Preprocessing (Backend)
- **API Endpoint**: `POST /upload` (handled by `projectController.js`).
- **Storage**: 
  - File is saved to `storage/uploads/`.
  - Database entry created in MongoDB with status `uploaded`.
- **Background Job**: 
  - A background process (`processJob.js`) is triggered.
  - **Extraction**: Unzips the file to `storage/extracted/<projectId>`.
  - **Nested Root Detection**: Checks if the unzipped content is inside a single subdirectory (common with zipped folders) and updates the project path to point to the *actual* code root.
  - **Cleaning**: Removes any remaining noise directories to prepare for analysis.
  - **Status Update**: DB status updated to `cleaning` -> `analyzing`.

## 3. Static Analysis (Analyzer Service)
- **Service Call**: Backend sends a request to the Python Analyzer Service (`http://localhost:8000/api/v1/analyze`).
- **Input**: Absolute path to the extracted source code.
- **Process**:
  - Scans directory structure using `pathspec`.
  - Calculates complexity (Cyclomatic Complexity).
  - Checks for security vulnerabilities using text patterns (e.g., hardcoded keys).
  - Analyzes code quality metrics (lines of code, comment ratio).
  - Extracts "Important Files" (e.g., `main.py`, `App.jsx`) for context.
- **Output**: Returns a JSON object with metrics, issues, and file summaries.

## 4. AI Evaluation (AI Engine Service)
- **Pre-Computation**: Backend receives the static analysis report.
- **Status Update**: DB status updated to `ai_evaluation`.
- **Service Call**: Backend sends a request to the Python AI Engine (`http://localhost:8002/evaluate`).
- **Input**: 
  - Analysis metrics.
  - List of important files with content/summaries.
  - `README.md` content (if available).
- **Process**:
  - Constructs a prompt for the Large Language Model (Gemini/OpenAI).
  - Asks the LLM to evaluate:
    - **Innovation Level** (Low/Medium/High).
    - **AI Generation Probability** (Based on code patterns).
    - **Real-World Impact**.
    - **Strengths & Weaknesses**.
  - Parses the LLM response into structured JSON.
- **Output**: Returns JSON with the semantic evaluation.

## 5. Report Generation & Display
- **Aggregation**: Backend merges the *Static Analysis Report* and the *AI Evaluation Report* into a single JSON object.
- **Storage**: Saves the final JSON report to `storage/reports/<projectId>.json` and updates DB status to `completed`.
- **Frontend Polling**: 
  - The `Processing` page polls `GET /api/status/<projectId>` every 2 seconds.
  - Once status is `completed`, it fetches the report via `GET /api/report/<projectId>`.
- **Visualization**: 
  - Redirects to `/report`.
  - Displays scores, charts, and AI insights using the `Report.jsx` component.
