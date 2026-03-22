from llm_provider.base import BaseLLMProvider
from llm_provider.openai_provider import OpenAIProvider
from llm_provider.local_provider import LocalProvider
from llm_provider.gemini_provider import GeminiProvider
from llm_provider.groq_provider import GroqProvider
from config import Config

def get_llm_provider() -> BaseLLMProvider:
    provider_type = Config.LLM_PROVIDER.lower()
    
    if provider_type == "openai":
        return OpenAIProvider(
            api_key=Config.OPENAI_API_KEY, 
            model=Config.MODEL_NAME
        )
    elif provider_type == "gemini":
        return GeminiProvider(
            api_key=Config.GEMINI_API_KEY,
            model=Config.MODEL_NAME
        )
    elif provider_type == "groq":
        return GroqProvider(
            api_key=Config.GROQ_API_KEY,
            model=Config.MODEL_NAME
        )
    elif provider_type == "local":
        return LocalProvider(
            base_url=Config.LOCAL_LLM_URL, 
            model=Config.MODEL_NAME
        )
    else:
        # Fallback to local or default behavior?
        print(f"Unknown provider '{provider_type}', falling back to LocalProvider")
        return LocalProvider(
            base_url=Config.LOCAL_LLM_URL,
            model=Config.MODEL_NAME
        )
