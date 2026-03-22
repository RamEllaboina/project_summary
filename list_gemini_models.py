import google.genai as genai

def list_available_models():
    """List all available Gemini models"""
    
    api_key = "AIzaSyA-klZ1Oce8RQetOvyJLHlmHXZgigOaYpc"
    client = genai.Client(api_key=api_key)
    
    try:
        print("🔍 Listing available Gemini models...")
        models = client.models.list()
        
        print(f"\n📋 Found {len(models)} models:")
        
        working_models = []
        for model in models:
            print(f"  - {model.name} (supports_generate_content: {getattr(model, 'supports_generate_content', False)})")
            
            # Try models that support content generation
            if hasattr(model, 'supports_generate_content') and model.supports_generate_content:
                working_models.append(model.name)
        
        print(f"\n✅ Models that support content generation:")
        for model in working_models:
            print(f"  - {model}")
            
        if working_models:
            # Extract just the model name (remove "models/" prefix)
            first_model = working_models[0].replace("models/", "")
            print(f"\n🎯 RECOMMENDED: Use '{first_model}' in your .env file")
        else:
            print("\n❌ No models found that support content generation")
            
    except Exception as e:
        print(f"❌ Error listing models: {e}")

if __name__ == "__main__":
    list_available_models()
