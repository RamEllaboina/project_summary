import requests
import json

def test_ai_engine_debug():
    """Debug AI Engine response structure"""
    
    url = "http://localhost:8002/evaluate"
    
    test_data = {
        "projectId": "test-debug",
        "language": "Python", 
        "metrics": {
            "projectType": "Web Application",
            "totalFiles": 2,
            "linesOfCode": 50
        },
        "importantFiles": [
            {
                "path": "main.py",
                "content": "def hello():\n    print('Hello World')\n    return True\n\ndef goodbye():\n    print('Goodbye')\n    return False"
            }
        ],
        "readme": "A Python project with hello and goodbye functions"
    }
    
    try:
        print("🧪 Testing AI Engine with debug...")
        response = requests.post(url, json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📄 Full Response:")
            print(json.dumps(result, indent=2))
            
            print(f"\n🔍 Structure Analysis:")
            print(f"strengths type: {type(result.get('strengths', 'NOT_FOUND'))}")
            print(f"strengths keys: {list(result.get('strengths', {}).keys()) if isinstance(result.get('strengths'), dict) else 'NOT_DICT'}")
            print(f"weaknesses type: {type(result.get('weaknesses', 'NOT_FOUND'))}")
            print(f"weaknesses keys: {list(result.get('weaknesses', {}).keys()) if isinstance(result.get('weaknesses'), dict) else 'NOT_DICT'}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_ai_engine_debug()
