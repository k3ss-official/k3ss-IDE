"""
Memory API for k3ss-IDE
FastAPI module for memory operations with Redis streams and SQLite fallback
"""

import os
import json
import time
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

import redis
import apsw
from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API key configuration
API_KEY_NAME = "X-API-KEY"
API_KEY = os.getenv("MANUS_API_KEY", "default-dev-key")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

# SQLite/LiteFS configuration
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "/data/memory.db")

# Initialize FastAPI app
app = FastAPI(
    title="k3ss-IDE Memory API",
    description="API for memory operations with Redis streams and SQLite fallback",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    db=REDIS_DB,
    decode_responses=True,
)

# Initialize SQLite connection
def get_sqlite_connection():
    """Get SQLite connection with LiteFS durability"""
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(SQLITE_DB_PATH), exist_ok=True)
        
        # Connect to SQLite database
        conn = apsw.Connection(SQLITE_DB_PATH)
        
        # Create memory table if it doesn't exist
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                data TEXT NOT NULL,
                metadata TEXT
            )
        """)
        
        return conn
    except Exception as e:
        print(f"SQLite connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Database connection error", "code": 500}
        )

# API key validation
async def verify_api_key(api_key_header: str = Depends(api_key_header)):
    """Verify API key middleware"""
    if api_key_header != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid API key", "code": 401}
        )
    return api_key_header

# Request models
class MemoryWriteRequest(BaseModel):
    """Model for memory write requests"""
    data: Dict[str, Any] = Field(..., description="Memory data to store")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")

class MemoryQueryRequest(BaseModel):
    """Model for memory query requests"""
    query: str = Field(..., description="Query string")
    limit: Optional[int] = Field(10, description="Maximum number of results")
    offset: Optional[int] = Field(0, description="Result offset")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters")

# Response models
class MemoryResponse(BaseModel):
    """Model for memory response"""
    id: str
    project: str
    timestamp: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class MemoryListResponse(BaseModel):
    """Model for memory list response"""
    items: List[MemoryResponse]
    total: int
    limit: int
    offset: int

# Error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    """Global error handling middleware"""
    try:
        return await call_next(request)
    except Exception as e:
        print(f"Unhandled exception: {e}")
        return Response(
            content=json.dumps({"error": "Internal server error", "code": 500}),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            media_type="application/json"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Redis connection
        redis_status = redis_client.ping()
        
        # Check SQLite connection
        sqlite_conn = get_sqlite_connection()
        cursor = sqlite_conn.cursor()
        cursor.execute("SELECT 1")
        sqlite_status = cursor.fetchone()[0] == 1
        
        if redis_status and sqlite_status:
            return {"status": "healthy", "redis": "connected", "sqlite": "connected"}
        else:
            return {
                "status": "degraded",
                "redis": "connected" if redis_status else "disconnected",
                "sqlite": "connected" if sqlite_status else "disconnected"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Memory API endpoints
@app.post("/memory/{project}/write", dependencies=[Depends(verify_api_key)])
async def write_memory(project: str, request: MemoryWriteRequest):
    """
    Write memory data to Redis stream and SQLite
    
    Args:
        project: Project identifier
        request: Memory data and optional metadata
        
    Returns:
        Dict with operation status and memory ID
    """
    try:
        # Validate project
        if not project or not project.isalnum():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Invalid project ID", "code": 400}
            )
        
        # Prepare data
        timestamp = datetime.now().isoformat()
        memory_data = request.data
        metadata = request.metadata or {}
        
        # Add to Redis stream
        stream_key = f"project:{project}"
        memory_id = redis_client.xadd(
            stream_key,
            {
                "data": json.dumps(memory_data),
                "metadata": json.dumps(metadata),
                "timestamp": timestamp
            }
        )
        
        # Backup to SQLite
        try:
            conn = get_sqlite_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO memory (project, timestamp, data, metadata) VALUES (?, ?, ?, ?)",
                (
                    project,
                    timestamp,
                    json.dumps(memory_data),
                    json.dumps(metadata) if metadata else None
                )
            )
        except Exception as e:
            print(f"SQLite backup error: {e}")
            # Continue even if SQLite fails, as Redis is primary storage
        
        return {
            "status": "success",
            "id": memory_id,
            "project": project,
            "timestamp": timestamp
        }
    
    except redis.RedisError as e:
        print(f"Redis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Memory storage error", "code": 500}
        )
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error", "code": 500}
        )

@app.get("/memory/{project}/read", dependencies=[Depends(verify_api_key)])
async def read_memory(
    project: str,
    limit: int = 10,
    offset: int = 0,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
):
    """
    Read memory data from Redis stream with optional time range
    
    Args:
        project: Project identifier
        limit: Maximum number of items to return
        offset: Number of items to skip
        start_time: Optional start time for range query (ISO format)
        end_time: Optional end time for range query (ISO format)
        
    Returns:
        List of memory items
    """
    try:
        # Validate project
        if not project or not project.isalnum():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Invalid project ID", "code": 400}
            )
        
        # Prepare stream key
        stream_key = f"project:{project}"
        
        # Check if stream exists
        if not redis_client.exists(stream_key):
            # Try to get from SQLite if Redis stream doesn't exist
            try:
                conn = get_sqlite_connection()
                cursor = conn.cursor()
                
                query = "SELECT id, timestamp, data, metadata FROM memory WHERE project = ?"
                params = [project]
                
                if start_time:
                    query += " AND timestamp >= ?"
                    params.append(start_time)
                
                if end_time:
                    query += " AND timestamp <= ?"
                    params.append(end_time)
                
                query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
                params.extend([limit, offset])
                
                cursor.execute(query, params)
                
                # Count total items
                count_cursor = conn.cursor()
                count_query = "SELECT COUNT(*) FROM memory WHERE project = ?"
                count_params = [project]
                
                if start_time:
                    count_query += " AND timestamp >= ?"
                    count_params.append(start_time)
                
                if end_time:
                    count_query += " AND timestamp <= ?"
                    count_params.append(end_time)
                
                count_cursor.execute(count_query, count_params)
                total = count_cursor.fetchone()[0]
                
                # Format results
                items = []
                for row in cursor:
                    items.append({
                        "id": str(row[0]),
                        "project": project,
                        "timestamp": row[1],
                        "data": json.loads(row[2]),
                        "metadata": json.loads(row[3]) if row[3] else None
                    })
                
                return {
                    "items": items,
                    "total": total,
                    "limit": limit,
                    "offset": offset
                }
            
            except Exception as e:
                print(f"SQLite fallback error: {e}")
                # Return empty result if both Redis and SQLite fail
                return {
                    "items": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset
                }
        
        # Prepare Redis range query
        start = "-" if not start_time else start_time
        end = "+" if not end_time else end_time
        
        # Get total count (approximate)
        total = redis_client.xlen(stream_key)
        
        # Get stream entries
        entries = redis_client.xrange(stream_key, start, end)
        
        # Apply offset and limit
        entries = entries[offset:offset+limit]
        
        # Format results
        items = []
        for entry_id, entry_data in entries:
            items.append({
                "id": entry_id,
                "project": project,
                "timestamp": entry_data.get("timestamp", ""),
                "data": json.loads(entry_data.get("data", "{}")),
                "metadata": json.loads(entry_data.get("metadata", "{}")) if entry_data.get("metadata") else None
            })
        
        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    
    except redis.RedisError as e:
        print(f"Redis error: {e}")
        # Try SQLite fallback on Redis error
        try:
            conn = get_sqlite_connection()
            cursor = conn.cursor()
            
            query = "SELECT id, timestamp, data, metadata FROM memory WHERE project = ?"
            params = [project]
            
            if start_time:
                query += " AND timestamp >= ?"
                params.append(start_time)
            
            if end_time:
                query += " AND timestamp <= ?"
                params.append(end_time)
            
            query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            
            # Count total items
            count_cursor = conn.cursor()
            count_query = "SELECT COUNT(*) FROM memory WHERE project = ?"
            count_params = [project]
            
            if start_time:
                count_query += " AND timestamp >= ?"
                count_params.append(start_time)
            
            if end_time:
                count_query += " AND timestamp <= ?"
                count_params.append(end_time)
            
            count_cursor.execute(count_query, count_params)
            total = count_cursor.fetchone()[0]
            
            # Format results
            items = []
            for row in cursor:
                items.append({
                    "id": str(row[0]),
                    "project": project,
                    "timestamp": row[1],
                    "data": json.loads(row[2]),
                    "metadata": json.loads(row[3]) if row[3] else None
                })
            
            return {
                "items": items,
                "total": total,
                "limit": limit,
                "offset": offset
            }
        
        except Exception as sqlite_e:
            print(f"SQLite fallback error: {sqlite_e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": "Memory retrieval error", "code": 500}
            )
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error", "code": 500}
        )

@app.post("/memory/{project}/query", dependencies=[Depends(verify_api_key)])
async def query_memory(project: str, request: MemoryQueryRequest):
    """
    Query memory data with advanced filtering
    
    Args:
        project: Project identifier
        request: Query parameters
        
    Returns:
        Filtered list of memory items
    """
    try:
        # Validate project
        if not project or not project.isalnum():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Invalid project ID", "code": 400}
            )
        
        # Prepare stream key
        stream_key = f"project:{project}"
        
        # For simple implementation, we'll retrieve all entries and filter in Python
        # In a production environment, this should be optimized with proper indexing
        
        # Get all entries from Redis
        try:
            entries = redis_client.xrange(stream_key, "-", "+")
            
            # Filter entries based on query
            filtered_entries = []
            query_lower = request.query.lower()
            
            for entry_id, entry_data in entries:
                data = json.loads(entry_data.get("data", "{}"))
                metadata = json.loads(entry_data.get("metadata", "{}")) if entry_data.get("metadata") else {}
                
                # Simple text search in data and metadata
                data_str = json.dumps(data).lower()
                metadata_str = json.dumps(metadata).lower()
                
                if query_lower in data_str or query_lower in metadata_str:
                    # Apply additional filters if provided
                    if request.filters:
                        match = True
                        for key, value in request.filters.items():
                            # Check in data
                            if key in data:
                                if data[key] != value:
                                    match = False
                                    break
                            # Check in metadata
                            elif metadata and key in metadata:
                                if metadata[key] != value:
                                    match = False
                                    break
                            else:
                                match = False
                                break
                        
                        if match:
                            filtered_entries.append((entry_id, entry_data))
                    else:
                        filtered_entries.append((entry_id, entry_data))
            
            # Apply offset and limit
            total = len(filtered_entries)
            filtered_entries = filtered_entries[request.offset:request.offset + request.limit]
            
            # Format results
            items = []
            for entry_id, entry_data in filtered_entries:
                items.append({
                    "id": entry_id,
                    "project": project,
                    "timestamp": entry_data.get("timestamp", ""),
                    "data": json.loads(entry_data.get("data", "{}")),
                    "metadata": json.loads(entry_data.get("metadata", "{}")) if entry_data.get("metadata") else None
                })
            
            return {
                "items": items,
                "total": total,
                "limit": request.limit,
                "offset": request.offset,
                "query": request.query
            }
        
        except redis.RedisError as e:
            print(f"Redis error: {e}")
            # Fall back to SQLite
            pass
        
        # SQLite fallback query
        conn = get_sqlite_connection()
        cursor = conn.cursor()
        
        # Build query with LIKE for text search
        query = """
            SELECT id, timestamp, data, metadata 
            FROM memory 
            WHERE project = ? AND (data LIKE ? OR metadata LIKE ?)
        """
        params = [project, f"%{request.query}%", f"%{request.query}%"]
        
        # Add filters if provided
        if request.filters:
            for key, value in request.filters.items():
                # This is a simplistic approach - in production, you'd need proper JSON querying
                query += f" AND (data LIKE ? OR metadata LIKE ?)"
                filter_pattern = f"%\"{key}\":\"{value}\"%"
                params.extend([filter_pattern, filter_pattern])
        
        # Add limit and offset
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([request.limit, request.offset])
        
        cursor.execute(query, params)
        
        # Count total matching items (without limit/offset)
        count_query = """
            SELECT COUNT(*) 
            FROM memory 
            WHERE project = ? AND (data LIKE ? OR metadata LIKE ?)
        """
        count_params = [project, f"%{request.query}%", f"%{request.query}%"]
        
        # Add filters to count query if provided
        if request.filters:
            for key, value in request.filters.items():
                count_query += f" AND (data LIKE ? OR metadata LIKE ?)"
                filter_pattern = f"%\"{key}\":\"{value}\"%"
                count_params.extend([filter_pattern, filter_pattern])
        
        count_cursor = conn.cursor()
        count_cursor.execute(count_query, count_params)
        total = count_cursor.fetchone()[0]
        
        # Format results
        items = []
        for row in cursor:
            items.append({
                "id": str(row[0]),
                "project": project,
                "timestamp": row[1],
                "data": json.loads(row[2]),
                "metadata": json.loads(row[3]) if row[3] else None
            })
        
        return {
            "items": items,
            "total": total,
            "limit": request.limit,
            "offset": request.offset,
            "query": request.query
        }
    
    except Exception as e:
        print(f"Query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Memory query error", "code": 500}
        )

@app.delete("/memory/{project}/purge", dependencies=[Depends(verify_api_key)])
async def purge_memory(project: str, confirm: bool = False):
    """
    Purge all memory data for a project
    
    Args:
        project: Project identifier
        confirm: Confirmation flag to prevent accidental deletion
        
    Returns:
        Operation status
    """
    try:
        # Validate project
        if not project or not project.isalnum():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Invalid project ID", "code": 400}
            )
        
        # Require confirmation
        if not confirm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "Confirmation required", "code": 400, "message": "Set confirm=true to purge all memory data"}
            )
        
        # Prepare stream key
        stream_key = f"project:{project}"
        
        # Delete from Redis
        redis_deleted = redis_client.delete(stream_key)
        
        # Delete from SQLite
        conn = get_sqlite_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM memory WHERE project = ?", (project,))
        sqlite_deleted = cursor.getconnection().changes()
        
        return {
            "status": "success",
            "project": project,
            "redis_deleted": bool(redis_deleted),
            "sqlite_deleted": sqlite_deleted,
            "timestamp": datetime.now().isoformat()
        }
    
    except redis.RedisError as e:
        print(f"Redis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Memory purge error", "code": 500}
        )
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal server error", "code": 500}
        )

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
