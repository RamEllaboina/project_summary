import json
import asyncio
import sys
import os
import logging
from typing import Dict, Any

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from shared_lib.groq_manager import GroqKeyManager
from .base import BaseLLMProvider

logger = logging.getLogger("service")

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str):
        # We ignore api_key param because GroqKeyManager reads exactly from environment per requirements
        self.manager = GroqKeyManager()
        # Fallback to init model if the env var isn't explicitly set in testing
        self.model = os.getenv("GROQ_MODEL", model)

    async def evaluate_project(self, prompt: str) -> Dict[str, Any]:
        last_error = None
        # We set attempts so that it cycles through the keys multiple times in case all are sleeping briefly
        max_attempts = max(len(self.manager.clients) * 2, 3) 
        
        for attempt in range(max_attempts):
            try:
                c = await self.manager.get_next_client()
            except Exception as e:
                # all keys rate limited at the exact same moment
                await asyncio.sleep(2)
                last_error = e
                continue
                
            client_id = c["id"]
            client = c["client"]
            
            try:
                logger.info(f"Groq request started using {client_id}")
                
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a senior software architect evaluating a project. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )
                
                logger.info(f"Groq request successful using {client_id}")
                
                content = response.choices[0].message.content.strip()
                if content.startswith("```json"): content = content[7:]
                if content.startswith("```"): content = content[3:]
                if content.endswith("```"): content = content[:-3]
                
                return json.loads(content.strip())
                
            except Exception as e:
                error_str = str(e).lower()
                last_error = e
                
                if "429" in error_str or "rate limit" in error_str:
                    logger.warning(f"Groq {client_id} rate limited, rotating.")
                    await self.manager.mark_rate_limited(client_id)
                elif "401" in error_str or "403" in error_str:
                    await self.manager.mark_invalid(client_id)
                elif "400" in error_str and ("model" in error_str or "decommissioned" in error_str):
                    logger.error(f"FATAL: Model '{self.model}' is invalid/decommissioned.")
                    raise Exception(f"Model configuration error: {e}")
                else:
                    await asyncio.sleep(2)
        
        raise Exception(f"All retries failed across Groq keys. Last error: {last_error}")

    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        raise Exception(error_message)