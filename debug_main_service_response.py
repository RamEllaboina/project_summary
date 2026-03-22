import requests
import json

def debug_main_service_response():
    """Debug main service response structure"""
    print("🔍 Debugging Main Service Response")
    print("=" * 50)
    
    # Test data
    test_data = {
        "projectId": "debug-main-response",
        "language": "JavaScript",
        "metrics": {"qualityScore": 75, "structureScore": 70, "securityScore": 65},
        "importantFiles": [
            {
                "path": "normal_code.js",
                "content": "import React from 'react';\n\nfunction UserDashboard({ user }) {\n  return <div>Welcome {user.name}</div>;\n}\n\nexport default UserDashboard;"
            }
        ],
        "readme": "Debug main service response"
    }
    
    try:
        response = requests.post("http://localhost:8002/evaluate", 
                            json=test_data, 
                            headers={"Content-Type": "application/json"}, 
                            timeout=60)
        
        print(f"📡 Raw Response Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"\n📡 Full Response Structure:")
                print(json.dumps(result, indent=2))
                
                # Check summary
                summary = result.get('summary', '')
                print(f"\n📝 Summary Check:")
                print(f"   Summary exists: {bool(summary)}")
                print(f"   Summary length: {len(summary)}")
                print(f"   Summary preview: {summary[:100]}...")
                
                # Check strengths
                strengths = result.get('strengths', {})
                print(f"\n💪 Strengths Check:")
                print(f"   Strengths type: {type(strengths)}")
                print(f"   Strengths keys: {list(strengths.keys()) if isinstance(strengths, dict) else 'Not a dict'}")
                
                if isinstance(strengths, dict):
                    for category, items in strengths.items():
                        print(f"   {category}: {len(items) if isinstance(items, list) else type(items)} items")
                        if isinstance(items, list) and items:
                            print(f"      Sample: {items[0]}")
                
                # Check weaknesses
                weaknesses = result.get('weaknesses', {})
                print(f"\n⚠️  Weaknesses Check:")
                print(f"   Weaknesses type: {type(weaknesses)}")
                print(f"   Weaknesses keys: {list(weaknesses.keys()) if isinstance(weaknesses, dict) else 'Not a dict'}")
                
                if isinstance(weaknesses, dict):
                    for category, items in weaknesses.items():
                        print(f"   {category}: {len(items) if isinstance(items, list) else type(items)} items")
                        if isinstance(items, list) and items:
                            print(f"      Sample: {items[0]}")
                
                # Check AI detection
                ai_detection = result.get('aiDetection', {})
                print(f"\n🤖 AI Detection Check:")
                print(f"   AI Detection exists: {bool(ai_detection)}")
                if ai_detection:
                    print(f"   Level: {ai_detection.get('level')}")
                    print(f"   Score: {ai_detection.get('score')}")
                    print(f"   Reasoning: {ai_detection.get('reasoning', '')[:100]}...")
                
                # Check for errors
                print(f"\n🔍 Error Check:")
                if 'error' in result:
                    print(f"   ❌ Error found: {result['error']}")
                else:
                    print(f"   ✅ No errors in response")
                
                # Validate structure
                print(f"\n✅ Structure Validation:")
                required_fields = ['projectId', 'summary', 'strengths', 'weaknesses', 'aiDetection']
                for field in required_fields:
                    exists = field in result
                    print(f"   {field}: {'✅' if exists else '❌'}")
                
                return True
                
            except json.JSONDecodeError as e:
                print(f"\n❌ JSON Parse Error: {str(e)}")
                print(f"📡 Raw Response Text: {response.text[:500]}...")
                return False
        else:
            print(f"\n❌ HTTP Error: {response.status_code}")
            print(f"📡 Response Text: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Request Error: {str(e)}")
        return False

if __name__ == "__main__":
    debug_main_service_response()
