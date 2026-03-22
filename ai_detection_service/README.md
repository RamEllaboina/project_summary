# AI Detection Microservice

Dedicated AI generation detection service using **secondary Groq API key** for clean separation from main analysis.

## 🚀 Key Features


- **🎯 Dedicated AI Detection**: Specialized service for AI generation analysis only
- **📊 Detailed Analysis**: AI phrases, naming patterns, structure analysis
- **🛡️ Rate Limiting**: Built-in delays and retry logic
- **🚀 RESTful API**: Clean FastAPI endpoints










**Request Body**:
```json
{
    "projectId": "string",
    "language": "string", 
    "metrics": {"qualityScore": 75},
    "importantFiles": [
        {"path": "file.js", "content": "code_here"}
    ],
    "readme": "string"
}
```

**Response**:
```json
{
    "aiDetection": {
        "level": "high|medium|low",
        "score": 0.0,
        "confidence": 0.0,
        "reasoning": "Detailed explanation",
        "signals": {
            "ai_phrases": ["phrase1", "phrase2"],
            "naming_issues": ["issue1", "issue2"],
            "structure_patterns": ["pattern1"],
            "comment_analysis": "analysis",
            "complexity_analysis": "analysis"
        },
        "suspicious_files": [
            {
                "file": "filename",
                "issues": ["issue1", "issue2"],
                "confidence": 0.0
            }
        ]
    },
    "projectId": "string",
    "fileCount": 0,
    "analysisMethod": "groq_ai_detection",
    "timestamp": 1234567890
}
```
### `GET /health`
Health check endpoint.

### `GET /config`
Get current configuration.

## 🛠️ Setup & Testing

### 1. Start Both Services
```bash
# Terminal 1: Main Service
cd ai_engine
python main.py

# Terminal 2: AI Detection Service  
cd ai_detection_service
python main.py
```

### 2. Test Both Services
```bash
# Test both services with their respective API keys
python test_both_services.py
```

### 3. Frontend Integration
```javascript
// Main Analysis (uses primary API key)
const mainAnalysis = await fetch('http://localhost:8002/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData)
});

// AI Detection (uses secondary API key)
const aiDetection = await fetch('http://localhost:8003/detect', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData)
});
```

## 🎯 Benefits of Separation

1. **🔧 Easy Updates**: Update AI detection logic without touching main service
2. **⚡ Better Performance**: Dedicated service for AI detection tasks
3. **🛡️ Isolation**: AI detection issues don't affect main evaluation
4. **📈 Scalability**: Scale and optimize services independently
5. **💰 Cost Management**: Track API usage separately for each service
6. **🔄 Development**: Test and deploy AI detection independently

## 🧪 Testing Results

When both services are working correctly:

```
🚀 Testing Both Services with Separat
✅ Main Service: WORKING 
✅ AI Detection: WORKING   
🎉 BOTH SERVICES WORKING PERFECTLY!
```
