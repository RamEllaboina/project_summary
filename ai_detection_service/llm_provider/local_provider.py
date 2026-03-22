import json
from typing import Dict, Any
from openai import AsyncOpenAI
from llm_provider.base import BaseLLMProvider

class LocalProvider(BaseLLMProvider):
    def __init__(self, base_url: str, model: str):
        # API key is typically dummy for local providers
        self.client = AsyncOpenAI(base_url=base_url, api_key="dummy")
        self.model = model

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        try:
            # Some local models don't support response_format={"type": "json_object"}
            # We rely on prompt engineering for JSON output.
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior AI systems engineer evaluating software projects. You output strictly JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2, # Low temp for deterministic output
            )
            content = response.choices[0].message.content
            # Clean up potential markdown blocks if local model includes them
            clean_content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_content)
        except Exception as e:
            print(f"Error calling Local LLM: {e}")
            return {
                "error": str(e),
                "aiProbability": 0,
                "innovationLevel": "low",
                "realWorldUse": "Error during evaluation",
                "strengths": [],
                "weaknesses": [],
                "suggestions": []
            }
