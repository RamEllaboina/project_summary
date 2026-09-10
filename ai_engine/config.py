import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_PORT = int(os.getenv("API_PORT", 8002))
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "local")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2", "")
    LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1")
    MODEL_NAME = os.getenv("MODEL_NAME", "llama3:latest")

    # Validation
    if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
        print("WARNING: GROQ_API_KEY is not set. Groq provider will fail.")
    elif LLM_PROVIDER == "openai" and not OPENAI_API_KEY:
        print("WARNING: OPENAI_API_KEY is not set. OpenAI provider will fail.")
    elif LLM_PROVIDER == "gemini" and not GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY is not set. Gemini provider will fail.")
    
    print(f"[*] AI Engine configured with: {LLM_PROVIDER} / {MODEL_NAME}")