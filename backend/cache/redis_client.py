import os
import redis
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Connect to a Redis instance
try:
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        redis_client = redis.from_url(redis_url, decode_responses=True, socket_timeout=5, socket_connect_timeout=5)
    else:
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        redis_client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True, socket_timeout=1, socket_connect_timeout=1)
    
    redis_client.ping()
except Exception as e:
    redis_client = None
    logger.error(f"Failed to initialize Redis client: {e}")

def get_cached_weather(city: str):
    if not redis_client:
        return None
    try:
        key = f"weather:{city.lower()}"
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.error(f"Redis get error: {e}")
    return None

def set_cached_weather(city: str, data: list):
    if not redis_client:
        return
    try:
        key = f"weather:{city.lower()}"
        # Cache expiry: 1800 seconds (30 minutes)
        redis_client.setex(key, 1800, json.dumps(data))
    except Exception as e:
        logger.error(f"Redis set error: {e}")
