import requests
import json

def debug_main_response():
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
        "readme": "Debug main service response structure"
    }
    
    try:
        response = requests.post("http://localhost:8002/evaluate", 
                            json=test_data, 
                            headers={"Content-Type": "application/json"}, 
                            timeout=60)
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n📋 Response Structure Analysis:")
            print(f"   Top-level keys: {list(result.keys())}")
            
            # Check summary
            summary = result.get('summary', '')
            print(f"\n📝 Summary Check:")
            print(f"   Summary exists: {bool(summary)}")
            print(f"   Summary length: {len(summary)}")
            print(f"   Summary preview: {summary[:100] if summary else 'None'}...")
            
            # Check strengths
            strengths = result.get('strengths', {})
            print(f"\n💪 Strengths Check:")
            print(f"   Strengths exists: {bool(strengths)}")
            print(f"   Strengths type: {type(strengths)}")
            if isinstance(strengths, dict):
                print(f"   Strengths keys: {list(strengths.keys())}")
                for category, items in strengths.items():
                    print(f"      {category}: {len(items) if isinstance(items, list) else type(items)} items")
                    if isinstance(items, list) and items:
                        print(f"         Sample: {items[0][:50]}...")
            
            # Check weaknesses
            weaknesses = result.get('weaknesses', {})
            print(f"\n⚠️  Weaknesses Check:")
            print(f"   Weaknesses exists: {bool(weaknesses)}")
            print(f"   Weaknesses type: {type(weaknesses)}")
            if isinstance(weaknesses, dict):
                print(f"   Weaknesses keys: {list(weaknesses.keys())}")
                for category, items in weaknesses.items():
                    print(f"      {category}: {len(items) if isinstance(items, list) else type(items)} items")
                    if isinstance(items, list) and items:
                        print(f"         Sample: {items[0][:50]}...")
            
            # Check realWorldReadiness
            real_world = result.get('realWorldReadiness', '')
            print(f"\n🌍 Real World Readiness Check:")
            print(f"   realWorldReadiness exists: {bool(real_world)}")
            print(f"   realWorldReadiness: {real_world[:100] if real_world else 'None'}...")
            
            # Check innovation
            innovation = result.get('innovation', {})
            print(f"\n💡 Innovation Check:")
            print(f"   Innovation exists: {bool(innovation)}")
            print(f"   Innovation type: {type(innovation)}")
            if isinstance(innovation, dict):
                print(f"   Innovation keys: {list(innovation.keys())}")
                print(f"   Innovation level: {innovation.get('level', 'None')}")
            
            # Check AI detection
            ai_detection = result.get('aiDetection', {})
            print(f"\n🤖 AI Detection Check:")
            print(f"   aiDetection exists: {bool(ai_detection)}")
            if ai_detection:
                print(f"   AI Detection keys: {list(ai_detection.keys())}")
                print(f"   Level: {ai_detection.get('level')}")
                print(f"   Score: {ai_detection.get('score')}")
                print(f"   Confidence: {ai_detection.get('confidence')}")
            
            return True
            
        else:
            print(f"\n❌ HTTP Error: {response.status_code}")
            print(f"📡 Response Text: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n❌ Request Error: {str(e)}")
        return False

if __name__ == "__main__":
    debug_main_response()
