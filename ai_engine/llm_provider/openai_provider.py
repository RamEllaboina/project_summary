import json
from typing import Dict, Any
from openai import AsyncOpenAI
from llm_provider.base import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior AI systems engineer evaluating software projects. You output strictly JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            # Return a default/fallback structure or re-raise
            return {
                "error": str(e),
                "aiProbability": 0,
                "innovationLevel": "low",
                "realWorldUse": "Error during evaluation",
                "strengths": [],
                "weaknesses": [],
                "suggestions": []
            }
