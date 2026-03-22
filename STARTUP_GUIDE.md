
# AI Code Analyzer - Project Startup Guide

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (running locally on default port 27017)

## API Key Configuration

only

### Main Service (`ai_engine/.env`):
```bash
# Primary API Key for Main Analysis (Evaluation, Code Quality, etc.)


:
```bash
# Use Secondary API Key for AI Detection Only

## Setup Steps

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd analyzer_frontend
npm install
```

**Analyzer Service (Python):**
```bash
cd analyzer
pip install -r requirements.txt
```

**AI Engine Service (Python):**
```bash
cd ai_engine
pip install -r requirements.txt
```

**AI Detection Microservice (Python):**
```bash
cd ai_detection_service
pip install -r requirements.txt
```

### 2. Configuration (.env)

Ensure `backend/.env` has correct URLs:
```bash
ANALYZER_URL=http://localhost:8000/api/v1/analyze
AI_ENGINE_URL=http://localhost:8002/evaluate
AI_DETECTION_URL=http://localhost:8003/detect
```

### 3. Running Project

You need to run **5 terminals**:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Analyzer Service):**
```bash
cd analyzer
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 (AI Engine Service - Primary API Key):**
```bash
cd ai_engine
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

**Terminal 4 (AI Detection Service - Secondary API Key):**
```bash
cd ai_detection_service
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

**Terminal 5 (Frontend):**
```bash
cd analyzer_frontend
npm run dev
```

## Testing Services

### Test Both Services:
```bash
# Test both services with their respective API keys
python test_both_services.py
```

Expected Output:
```
 Main Service: WORKING (Primary API Key)
 AI Detection: WORKING (Secondary API Key)  
 BOTH SERVICES WORKING PERFECTLY!
```

Access the application at: `http://localhost:5173`

## Benefits of API Key Separation

1. **Easy Maintenance**: Update AI detection without touching main service
2. **Better Performance**: Dedicated services for specific tasks
3. **Isolation**: Issues in one service don't affect others
4. **Scalability**: Scale services independently
5. **Cost Tracking**: Monitor API usage separately
6. **Development**: Test and deploy independently
