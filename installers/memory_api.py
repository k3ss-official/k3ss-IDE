from fastapi import FastAPI, HTTPException, Request
import redis
import json
import time
from typing import Dict, Any, Optional

app = FastAPI()

# Redis connection
redis_client = redis.Redis(host="redis", port=6379, db=0, decode_responses=True)

@app.post("/context-ping")
async def context_ping(request: Request) -> Dict[str, Any]:
    """
    Endpoint to receive context window usage data from tasks.
    
    Accepts JSON payload with:
    - task_id: Unique identifier for the task
    - token_count: Current token count used by the task
    - max_tokens: Maximum token limit for the task
    - timestamp: Time of the ping (optional, will use server time if not provided)
    
    Writes data to Redis stream with key format: context:{project_id}
    """
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["task_id", "token_count", "max_tokens"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Extract project_id from task_id (assuming format project_id:task_name)
        # If task_id doesn't contain project_id, use "default" as project_id
        task_id = data["task_id"]
        project_id = task_id.split(":")[0] if ":" in task_id else "default"
        
        # Use provided timestamp or current time
        timestamp = data.get("timestamp", int(time.time() * 1000))
        
        # Prepare data for Redis stream
        stream_data = {
            "task_id": task_id,
            "token_count": str(data["token_count"]),
            "max_tokens": str(data["max_tokens"]),
            "timestamp": str(timestamp),
            "usage_percentage": str(round((data["token_count"] / data["max_tokens"]) * 100, 2))
        }
        
        # Write to Redis stream
        stream_key = f"context:{project_id}"
        entry_id = redis_client.xadd(stream_key, stream_data)
        
        return {
            "status": "success",
            "message": "Context data recorded",
            "entry_id": entry_id,
            "stream_key": stream_key
        }
        
    except redis.RedisError as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Simple health check endpoint to verify API is running"""
    return {"status": "healthy"}
