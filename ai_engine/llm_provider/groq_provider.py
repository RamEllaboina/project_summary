import openai
import json
import asyncio
import time
from typing import Dict, Any
from .base import BaseLLMProvider

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str):
        # Support comma-separated API keys for rotation/load balancing
        raw_keys = [k.strip() for k in api_key.split(',') if k.strip()]
        if not raw_keys:
            raise ValueError("No API keys provided for Groq")
            
        self.clients = [
            {
                "client": openai.AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.groq.com/openai/v1"
                ),
                "key": key,
                "available_at": 0
            } 
            for key in raw_keys
        ]
        self.model = model
        self.current_idx = 0
        self.lock = asyncio.Lock()

    async def _get_next_client(self):
        async with self.lock:
            now = time.time()
            # Try to find an available client
            for _ in range(len(self.clients)):
                c = self.clients[self.current_idx]
                if now >= c["available_at"]:
                    self.current_idx = (self.current_idx + 1) % len(self.clients)
                    return c
                self.current_idx = (self.current_idx + 1) % len(self.clients)
            
            # If all are exhausted, just pick the next one
            c = self.clients[self.current_idx]
            self.current_idx = (self.current_idx + 1) % len(self.clients)
            return c

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        last_error = None
        max_attempts = len(self.clients) * 2
        
        for attempt in range(max_attempts):
            try:
                client_dict = await self._get_next_client()
                
                # Check delay needed
                now = time.time()
                if now < client_dict["available_at"]:
                    await asyncio.sleep(client_dict["available_at"] - now)
                
                response = await client_dict["client"].chat.completions.create(
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
                error_str = str(e).lower()
                last_error = e
                
                if "429" in error_str or "rate limit" in error_str or "too many requests" in error_str:
                    # Mark unavailable for backoff
                    async with self.lock:
                        client_dict["available_at"] = time.time() + 10
                else:
                    await asyncio.sleep(1)
        
        raise Exception(f"All Groq clients failed after {max_attempts} attempts. Last error: {last_error}")

    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Not used anymore, but kept for interface compatibility."""
        raise Exception(error_message)