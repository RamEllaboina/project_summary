import os
from .base import BaseLLMProvider

# Conditional imports - only import what's available
try:
    from .groq_provider import GroqProvider
except ImportError:
    GroqProvider = None

try:
    from .openai_provider import OpenAIProvider
except ImportError:
    OpenAIProvider = None

try:
    from .gemini_provider import GeminiProvider
except ImportError:
    GeminiProvider = None

try:
    from .local_provider import LocalProvider
except ImportError:
    LocalProvider = None

def get_llm_provider():
    """Get the configured LLM provider based on environment settings."""
    from config import Config
    
    provider_type = Config.LLM_PROVIDER.lower()
    
    if provider_type == "groq":
        if GroqProvider is None:
            raise ImportError("GroqProvider not available. Please install required dependencies.")
        if not Config.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set in environment variables")
        return GroqProvider(Config.GROQ_API_KEY, Config.MODEL_NAME)
    
    elif provider_type == "openai":
        if OpenAIProvider is None:
            raise ImportError("OpenAIProvider not available. Please install required dependencies.")
        if not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set in environment variables")
        return OpenAIProvider(Config.OPENAI_API_KEY, Config.MODEL_NAME)
    
    elif provider_type == "gemini":
        if GeminiProvider is None:
            raise ImportError("GeminiProvider not available. Please install required dependencies.")
        if not Config.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        return GeminiProvider(Config.GEMINI_API_KEY, Config.MODEL_NAME)
    
    elif provider_type == "local":
        if LocalProvider is None:
            raise ImportError("LocalProvider not available. Please install required dependencies.")
        return LocalProvider(Config.LOCAL_LLM_URL, Config.MODEL_NAME)
    
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_type}")

__all__ = [
    'BaseLLMProvider',
    'get_llm_provider'
]