import { EventEmitter } from 'events';
import Redis from 'ioredis';
import WebSocket from 'ws';

/**
 * AgentBridge - Handles communication between k3ss-IDE and Open Interpreter
 * 
 * This class intercepts prompts beginning with "/agent", sends them to Open Interpreter
 * via WebSocket, and writes responses back to Redis while emitting canvas_update events.
 */
export class AgentBridge extends EventEmitter {
  private redis: Redis;
  private wsEndpoint: string = 'ws://localhost:3191/run';
  private isConnected: boolean = false;
  private currentProject: string = '';

  /**
   * Constructor for AgentBridge
   * @param redisUrl Redis connection URL
   */
  constructor(redisUrl: string = 'redis://localhost:6379') {
    super();
    this.redis = new Redis(redisUrl);
    
    // Handle Redis connection errors
    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err);
      this.emit('error', `Redis connection error: ${err.message}`);
    });
    
    console.log('AgentBridge initialized with Redis connection');
  }

  /**
   * Set the current project context
   * @param projectId The current project identifier
   */
  public setProject(projectId: string): void {
    this.currentProject = projectId;
    console.log(`Set current project to: ${projectId}`);
  }

  /**
   * Process a user prompt and route it to Open Interpreter if it starts with "/agent"
   * @param prompt The user prompt
   * @returns Promise<boolean> True if the prompt was handled by the agent
   */
  public async processPrompt(prompt: string): Promise<boolean> {
    if (!prompt.startsWith('/agent')) {
      return false;
    }

    if (!this.currentProject) {
      console.error('No project context set');
      this.emit('error', 'Cannot process agent prompt: No project context set');
      return false;
    }

    // Trim the "/agent" prefix
    const trimmedPrompt = prompt.substring(7).trim();
    
    try {
      await this.sendToInterpreter(trimmedPrompt);
      return true;
    } catch (error) {
      console.error('Failed to process agent prompt:', error);
      this.emit('error', `Failed to process agent prompt: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a prompt to Open Interpreter via WebSocket
   * @param prompt The prompt to send
   */
  private async sendToInterpreter(prompt: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.wsEndpoint);
        
        ws.on('open', () => {
          console.log('WebSocket connection established');
          this.isConnected = true;
          
          // Send the prompt to Open Interpreter
          ws.send(JSON.stringify({ 
            message: prompt 
          }));
        });

        ws.on('message', async (data) => {
          try {
            const response = JSON.parse(data.toString());
            
            // Write response to Redis and emit canvas_update event
            if (response.message) {
              await this.writeToRedis(response.message);
              this.emit('canvas_update', {
                project: this.currentProject,
                message: response.message
              });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          console.log('WebSocket connection closed');
          this.isConnected = false;
          resolve();
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(new Error(`WebSocket connection error: ${error.message}`));
        });
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        reject(new Error(`Failed to establish WebSocket connection: ${error.message}`));
      }
    });
  }

  /**
   * Write a message to Redis stream for the current project
   * @param message The message to write
   */
  private async writeToRedis(message: string): Promise<void> {
    try {
      const streamKey = `chat:${this.currentProject}`;
      await this.redis.xadd(streamKey, '*', 'message', message);
      console.log(`Added message to Redis stream: ${streamKey}`);
    } catch (error) {
      console.error('Error writing to Redis:', error);
      throw new Error(`Failed to write to Redis: ${error.message}`);
    }
  }

  /**
   * Check if the agent is connected to Open Interpreter
   * @returns boolean Connection status
   */
  public isAgentConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Clean up resources when shutting down
   */
  public async dispose(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('AgentBridge resources cleaned up');
    } catch (error) {
      console.error('Error during AgentBridge cleanup:', error);
    }
  }
}

export default AgentBridge;
