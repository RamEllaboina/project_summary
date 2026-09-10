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
            # Enforce JSON output for Ollama
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior software architect evaluating a project. Always respond with a single, valid JSON object containing your evaluation."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4000
            )
            content = response.choices[0].message.content
            
            import re
            
            # Robust JSON extraction
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                json_str = match.group(0)
                return json.loads(json_str)
            else:
                raise ValueError("No JSON object found in response.")
        except Exception as e:
            print(f"Error calling Local LLM: {e}")
            return self._get_fallback_response(str(e))

    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Return a valid response when Local LLM fails."""
        return {
            "projectId": "error",
            "overview": f"Local LLM API error: {error_message}",
            "summary": "Analysis failed due to API error. Please try again.",
            "architecture": "Analysis failed due to API error",
            "complexity": "Analysis failed due to API error",
            "security": "Analysis failed due to API error",
            "projectFlow": {
                "overallWorkflow": "Analysis unavailable",
                "components": [],
                "dataFlow": "Analysis unavailable"
            },
            "aiDetection": {
                "level": "low",
                "score": 0,
                "confidence": 0,
                "reasoning": "Analysis unavailable",
                "signals": {}
            },
            "innovation": {
                "level": "low",
                "score": 1,
                "projectDescription": "Project analysis unavailable",
                "assessment": "Analysis unavailable",
                "novelFeatures": [],
                "marketImpact": "Analysis unavailable",
                "uniqueness": "Analysis unavailable"
            },
            "realWorldReadiness": "Analysis failed due to API error",
            "strengths": {
                "technical": ["Analysis incomplete due to API error"],
                "architectural": [],
                "performance": []
            },
            "weaknesses": {
                "technical": ["API error prevented analysis"],
                "architectural": [],
                "performance": []
            },
            "suggestions": {
                "technical": ["Check API configuration and retry text generation"],
                "architectural": [],
                "performance": []
            }
        }
