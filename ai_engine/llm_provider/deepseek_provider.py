import openai
import json
from typing import Dict, Any
from llm_provider.base import BaseLLMProvider

class DeepSeekProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )
        self.model = model

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior software architect evaluating a project. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            
            # Clean up markdown
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            data = json.loads(content)
            return data
            
        except Exception as e:
            print(f"DeepSeek API Error: {e}")
            return self._get_fallback_response(str(e))

    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Return a valid response when DeepSeek fails."""
        return {
            "projectId": "error",
            "overview": f"DeepSeek API error: {error_message}",
            "summary": "Analysis failed due to API error. Please try again.",
            "architecture": "Analysis failed due to API error",
            "complexity": "Analysis failed due to API error",
            "security": "Analysis failed due to API error",
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
                "technical": ["Check API configuration and retry"],
                "architectural": [],
                "performance": []
            }
        }