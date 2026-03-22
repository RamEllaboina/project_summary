try:
    import google.genai as genai
    from google.genai import types
except ImportError:
    print("Please install: pip install google-genai")
    raise ImportError("google-genai package not found")
    
import json
from typing import Dict, Any
from llm_provider.base import BaseLLMProvider

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        try:
            # Use the new google-genai API
            response = await self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            # Extract text from response
            content = response.text
            
            # Parse JSON
            # Gemini might return markdown code block ```json ... ```, so we strip that if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            data = json.loads(content)
            
            # Ensure required fields exist with fallbacks
            return self._ensure_valid_response(data)
            
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            # Return a valid structured response instead of raw error
            return self._get_fallback_response(str(e))
    
    def _ensure_valid_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure response has all required fields with proper structure."""
        try:
            # Handle different possible response structures
            if isinstance(data, dict):
                # Convert lists to objects if needed
                if 'strengths' in data and isinstance(data['strengths'], list):
                    data['strengths'] = {"points": data['strengths']}
                if 'weaknesses' in data and isinstance(data['weaknesses'], list):
                    data['weaknesses'] = {"points": data['weaknesses']}
                if 'suggestions' in data and isinstance(data['suggestions'], list):
                    data['suggestions'] = {"points": data['suggestions']}
                
                # Ensure all required fields exist
                return {
                    "projectId": data.get("projectId", "unknown"),
                    "overview": data.get("overview", "Analysis incomplete"),
                    "architecture": data.get("architecture", "Analysis incomplete"),
                    "complexity": data.get("complexity", "Analysis incomplete"),
                    "security": data.get("security", "Analysis incomplete"),
                    "aiDetection": data.get("aiDetection", "Analysis incomplete"),
                    "innovation": data.get("innovation", "Analysis incomplete"),
                    "realWorldReadiness": data.get("realWorldReadiness", "Analysis incomplete"),
                    "strengths": data.get("strengths", {"points": []}),
                    "weaknesses": data.get("weaknesses", {"points": []}),
                    "suggestions": data.get("suggestions", {"points": []})
                }
            else:
                # If data is not a dict, return fallback
                return self._get_fallback_response("Invalid response format")
                
        except Exception as e:
            print(f"Error ensuring valid response: {e}")
            return self._get_fallback_response(f"Response validation error: {str(e)}")
    
    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Return a valid Pydantic-compatible response when Gemini fails."""
        return {
            "projectId": "error",
            "overview": f"Gemini API error: {error_message}",
            "architecture": "Analysis failed due to API error",
            "complexity": "Analysis failed due to API error",
            "security": "Analysis failed due to API error",
            "aiDetection": "Analysis failed due to API error",
            "innovation": "Analysis failed due to API error",
            "realWorldReadiness": "Analysis failed due to API error",
            "strengths": {"points": ["Analysis incomplete due to API error"]},
            "weaknesses": {"points": ["API error prevented analysis"]},
            "suggestions": {"points": ["Check API configuration and retry"]}
        }
