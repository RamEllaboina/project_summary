from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseLLMProvider(ABC):
    @abstractmethod
    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        """
        Sends the prompt to the LLM and returns parsed JSON response.
        """
        pass
