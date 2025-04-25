import redis
import time
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('context_watcher')

class ContextWatcher:
    def __init__(
        self,
        redis_host: str = "redis",
        redis_port: int = 6379,
        redis_db: int = 0,
        poll_interval: int = 5,  # seconds
        critical_threshold: float = 0.9  # 90%
    ):
        """
        Initialize the Context Watcher to monitor token usage and set handover flags.
        
        Args:
            redis_host: Redis server hostname
            redis_port: Redis server port
            redis_db: Redis database number
            poll_interval: How often to check for updates (seconds)
            critical_threshold: Threshold ratio (token_count/max_tokens) to trigger handover
        """
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            decode_responses=True
        )
        self.poll_interval = poll_interval
        self.critical_threshold = critical_threshold
        self.stream_positions: Dict[str, str] = {}  # Track last read position for each stream
        self.running = False
        
    def start(self):
        """Start the watcher process"""
        self.running = True
        logger.info(f"Context Watcher started with critical threshold: {self.critical_threshold * 100}%")
        
        try:
            while self.running:
                self._process_all_streams()
                time.sleep(self.poll_interval)
        except KeyboardInterrupt:
            logger.info("Context Watcher stopped by user")
        except Exception as e:
            logger.error(f"Error in Context Watcher: {str(e)}")
            raise
        finally:
            self.running = False
            
    def stop(self):
        """Stop the watcher process"""
        self.running = False
        logger.info("Context Watcher stopping...")
    
    def _process_all_streams(self):
        """Process all context streams in Redis"""
        try:
            # Get all stream keys matching the pattern
            stream_keys = self.redis_client.keys("context:*")
            
            if not stream_keys:
                return
                
            for stream_key in stream_keys:
                self._process_stream(stream_key)
                
        except redis.RedisError as e:
            logger.error(f"Redis error while processing streams: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error while processing streams: {str(e)}")
    
    def _process_stream(self, stream_key: str):
        """
        Process a single context stream
        
        Args:
            stream_key: Redis stream key to process
        """
        # Get the last position we read from this stream, or start from beginning
        last_id = self.stream_positions.get(stream_key, '0-0')
        
        try:
            # Read new entries from the stream
            entries = self.redis_client.xread({stream_key: last_id}, count=100, block=0)
            
            if not entries:
                return
                
            # Process each entry
            for stream_name, stream_entries in entries:
                for entry_id, data in stream_entries:
                    self._process_entry(entry_id, data)
                    
                    # Update the last processed position
                    self.stream_positions[stream_key] = entry_id
        
        except redis.RedisError as e:
            logger.error(f"Redis error while processing stream {stream_key}: {str(e)}")
    
    def _process_entry(self, entry_id: str, data: Dict[str, str]):
        """
        Process a single stream entry and set handover flag if needed
        
        Args:
            entry_id: Redis stream entry ID
            data: Entry data containing task_id, token_count, max_tokens, etc.
        """
        try:
            task_id = data.get('task_id')
            
            if not task_id:
                logger.warning(f"Entry {entry_id} missing task_id, skipping")
                return
                
            # Get token counts
            token_count = int(data.get('token_count', 0))
            max_tokens = int(data.get('max_tokens', 1))  # Default to 1 to avoid division by zero
            
            # Calculate usage ratio
            usage_ratio = token_count / max_tokens
            
            # Check if we need to set the handover flag
            if usage_ratio >= self.critical_threshold:
                logger.warning(
                    f"Critical token usage for task {task_id}: "
                    f"{token_count}/{max_tokens} tokens "
                    f"({usage_ratio:.1%})"
                )
                
                # Set the handover required flag in Redis
                handover_key = f"handover_required:{task_id}"
                self.redis_client.set(handover_key, "true")
                logger.info(f"Set handover flag: {handover_key} = true")
            
        except (ValueError, TypeError) as e:
            logger.error(f"Error parsing data for entry {entry_id}: {str(e)}")
        except redis.RedisError as e:
            logger.error(f"Redis error while setting handover flag: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error processing entry {entry_id}: {str(e)}")


if __name__ == "__main__":
    # When run directly, start the watcher process
    watcher = ContextWatcher()
    watcher.start()
