import os
import time
import asyncio
import logging
from typing import Optional
from openai import AsyncOpenAI

logger = logging.getLogger("service")

class GroqKeyManager:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, 'initialized'):
            return
        self.initialized = True
        
        self.clients = []
        
        # Load all specific GROQ_API_KEY_N
        index = 1
        for k, v in sorted(os.environ.items()):
            if k.startswith("GROQ_API_KEY_") and v.strip():
                self.clients.append({
                    "id": f"key {index}",
                    "client": AsyncOpenAI(api_key=v.strip(), base_url="https://api.groq.com/openai/v1"),
                    "available_at": 0
                })
                index += 1
        
        # Backward compatibility for GROQ_API_KEY
        if len(self.clients) == 0:
            legacy_keys = os.getenv("GROQ_API_KEY", "")
            for k in legacy_keys.split(','):
                k = k.strip()
                if k:
                    self.clients.append({
                        "id": f"key {index}",
                        "client": AsyncOpenAI(api_key=k, base_url="https://api.groq.com/openai/v1"),
                        "available_at": 0
                    })
                    index += 1
                    
        self.cooldown = int(os.getenv("GROQ_KEY_COOLDOWN_SECONDS", "60"))
        self.lock = asyncio.Lock()
        self.current_idx = 0

    async def get_next_client(self):
        async with self.lock:
            if not self.clients:
                raise Exception("All configured Groq keys are currently unavailable. No keys loaded.")
                
            now = time.time()
            tried = 0
            num_clients = len(self.clients)
            
            while tried < num_clients:
                c = self.clients[self.current_idx]
                if now >= c["available_at"]:
                    self.current_idx = (self.current_idx + 1) % num_clients
                    return c
                self.current_idx = (self.current_idx + 1) % num_clients
                tried += 1
                
            raise Exception("All configured Groq keys are currently unavailable due to rate limits or errors.")
            
    async def mark_rate_limited(self, client_id: str):
        async with self.lock:
            for c in self.clients:
                if c["id"] == client_id:
                    c["available_at"] = time.time() + self.cooldown
                    logger.warning(f"Groq {client_id} rate limited, marking unavailable for {self.cooldown} seconds.")
                    break
                    
    async def mark_invalid(self, client_id: str):
        async with self.lock:
            for c in self.clients:
                if c["id"] == client_id:
                    c["available_at"] = time.time() + 999999999
                    logger.error(f"Groq {client_id} returned auth error. Marking invalid.")
                    break
