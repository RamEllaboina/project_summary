
## Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Analyzer  
cd analyzer
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3 - AI Engine
cd ai_engine
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Terminal 4 - AI Detection
cd ai_detection_service
uvicorn main:app --host 0.0.0.0 --port 8005 --reload

# Terminal 5 - Frontend
cd analyzer_frontend
npm run dev

## Benefits of API Key Separation

1. **Easy Maintenance**: Update AI detection without touching main service
2. **Better Performance**: Dedicated services for specific tasks
3. **Isolation**: Issues in one service don't affect others
4. **Scalability**: Scale services independently
5. **Cost Tracking**: Monitor API usage separately
6. **Development**: Test and deploy independently
