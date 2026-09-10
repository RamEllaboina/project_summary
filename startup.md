# AI-POWERED CODE ANALYZER - STARTUP GUIDE

To run the entire system using the **NEW FastAPI Architecture**, you will need to open **6 separate terminal windows** and ensure MongoDB is running.

Here is the exact mapping of all the folders in this project:

| Folder Name               | Status                             | Description                                                             |
|---------------------------|------------------------------------|-------------------------------------------------------------------------|
| `backend`                 | 🚫 **DEPRECATED**                  | The old legacy Node.js Express backend. Contains old logic. DO NOT RUN. |
| `fastapi_backend`         | ✅ **ACTIVE (Terminal 1)**         | Your NEW centralized API orchestrator. Connects everything together.    |
| `analyzer_frontend`       | ✅ **ACTIVE (Terminal 2)**         | The React Dashboard User Interface.                                     |
| `analyzer`                | ✅ **ACTIVE (Terminal 3)**         | Static Analysis microservice.                                           |
| `ai_engine`               | ✅ **ACTIVE (Terminal 4)**         | Code Quality Evaluation microservice.                                   |
| `ai_detection_service`    | ✅ **ACTIVE (Terminal 5)**         | AI Detection mapping microservice.                                      |
| `sand_box_project`        | ✅ **ACTIVE (Terminal 6)**         | The Docker-enabled Secure Execution and restrictions sandbox.           |

---

### Step 0: Start MongoDB
Ensure that your MongoDB server is running locally on port `27017` (the default port).
```bash
# On Windows, you can start MongoDB from a terminal:
mongod
```

---

### Terminal 1: Core FastAPI Backend (The New Orchestrator)
This replaces the old Node.js `backend` folder. It serves as the central hub connecting the frontend and the AI engines.
```bash
cd fastapi_backend
# First time only: pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```
*Runs on `http://localhost:3000`*

---

### Terminal 2: React Frontend (Visual Dashboard)
The main User Interface, where you upload projects and view the Dashboard Mapping analysis.
```bash
cd analyzer_frontend
# First time only: npm install
npm run dev
```
*Runs on `http://localhost:5173`*

---

### Terminal 3: Static Analysis Engine
Performs code structure analysis, complexity calculation, and security/SAST checks.
```bash
cd analyzer
# First time only: pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Runs on `http://localhost:8000`*

---

### Terminal 4: AI Code Quality Engine
Performs Code Review, readability/maintainability checks, and overall Quality Scoring.
```bash
cd ai_engine
# First time only: pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```
*Runs on `http://localhost:8002`*

---

### Terminal 5: AI Detection Service
Applies ML classifications to identify AI-generated code features and probability.
```bash
cd ai_detection_service
# First time only: pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```
*Runs on `http://localhost:8005`*

---

### Terminal 6: Secure Sandbox Project
Provides the secure environment where uploaded code is safely evaluated.
```bash
cd sand_box_project
# First time only: npm install
node server.js
```
*Runs on `http://localhost:4000`*

---

### Verifying Everything Works
Once all components are running, navigate to `http://localhost:5173` in your browser. 
When you upload a ZIP file, the `fastapi_backend` will trigger endpoints on ports `4000`, `8000`, `8002`, and `8005`, collect the data sequentially, and generate the final unified report!
