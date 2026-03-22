try:
    import openai
except ImportError:
    print("Please install: pip install openai")
    raise ImportError("openai package not found")
    
import json
from typing import Dict, Any
from llm_provider.base import BaseLLMProvider

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str):
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        self.model = model

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        try:
            # Use Groq API (compatible with OpenAI format)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior software architect evaluating a project. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            # Extract text from response
            content = response.choices[0].message.content
            
            # Parse JSON
            # Groq might return markdown code block ```json ... ```, so we strip that if present
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
            print(f"Error calling Groq: {e}")
            # Return a valid structured response instead of raw error
            return self._get_fallback_response(str(e))
    
    def _ensure_valid_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure response has all required fields with proper structure."""
        try:
            # Handle different possible response structures
            if isinstance(data, dict):
                # Convert lists to categorized format if needed
                if 'strengths' in data and isinstance(data['strengths'], list):
                    points = data['strengths']
                    data['strengths'] = {
                        'technical': points[:len(points)//3 or 1],
                        'architectural': points[len(points)//3:2*len(points)//3 or 1],
                        'performance': points[2*len(points)//3:] or [points[0]] if points else []
                    }
                if 'weaknesses' in data and isinstance(data['weaknesses'], list):
                    points = data['weaknesses']
                    data['weaknesses'] = {
                        'technical': points[:len(points)//3 or 1],
                        'architectural': points[len(points)//3:2*len(points)//3 or 1],
                        'performance': points[2*len(points)//3:] or [points[0]] if points else []
                    }
                if 'suggestions' in data and isinstance(data['suggestions'], list):
                    points = data['suggestions']
                    data['suggestions'] = {
                        'technical': points[:len(points)//3 or 1],
                        'architectural': points[len(points)//3:2*len(points)//3 or 1],
                        'performance': points[2*len(points)//3:] or [points[0]] if points else []
                    }
                
                # Handle innovation field structure
                if 'innovation' in data:
                    if isinstance(data['innovation'], str):
                        # Convert string to object format
                        data['innovation'] = {
                            'level': data['innovation'],
                            'score': 5,  # Default score
                            'assessment': data['innovation'],
                            'novelFeatures': []
                        }
                    elif isinstance(data['innovation'], dict):
                        # Ensure required fields
                        if 'level' not in data['innovation']:
                            data['innovation']['level'] = 'Unknown'
                        if 'score' not in data['innovation']:
                            data['innovation']['score'] = 5
                        if 'novelFeatures' not in data['innovation']:
                            data['innovation']['novelFeatures'] = []
                
                # Ensure all required fields exist
                return {
                    "projectId": data.get("projectId", "unknown"),
                    "overview": data.get("overview", "Analysis incomplete"),
                    "architecture": data.get("architecture", "Analysis incomplete"),
                    "complexity": data.get("complexity", "Analysis incomplete"),
                    "security": data.get("security", "Analysis incomplete"),
                    "aiDetection": data.get("aiDetection", "Analysis incomplete"),
                    "innovation": data.get("innovation", {"level": "Unknown", "score": 5, "assessment": "Analysis incomplete", "novelFeatures": []}),
                    "realWorldReadiness": data.get("realWorldReadiness", "Analysis incomplete"),
                    "strengths": data.get("strengths", {"technical": [], "architectural": [], "performance": []}),
                    "weaknesses": data.get("weaknesses", {"technical": [], "architectural": [], "performance": []}),
                    "suggestions": data.get("suggestions", {"technical": [], "architectural": [], "performance": []})
                }
            else:
                # If data is not a dict, return fallback
                return self._get_fallback_response("Invalid response format")
                
        except Exception as e:
            print(f"Error ensuring valid response: {e}")
            return self._get_fallback_response(f"Response validation error: {str(e)}")
    
    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Return a valid Pydantic-compatible response when Groq fails."""
        return {
            "projectId": "error",
            "overview": f"Groq API error: {error_message}",
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
