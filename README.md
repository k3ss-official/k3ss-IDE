# k3ss-IDE: Modular Mixture-of-Experts AI Platform

k3ss-IDE is a comprehensive AI development environment that unifies browser automation, local system control, dynamic API model management, persistent memory, cost tracking, and context window monitoring into a single cohesive platform.

## Features

- **Dynamic Model Menu**: Automatically detects and loads models from your `.env` file
- **Open Interpreter Integration**: Built-in agent sidecar for code execution and system control
- **Persistent Memory**: Redis-based memory system with LiteFS for durability
- **Cost Tracking**: Helicone scoreboard for real-time API usage monitoring
- **Context Window Monitor**: Intelligent tracking with handover alerts when approaching limits
- **Electron GUI Shell**: Modern, responsive interface for seamless interaction

## System Architecture

The k3ss-IDE platform consists of several integrated components:

```
k3ss-IDE/
├─ electron/           # GUI shell with dynamic model menu
├─ agent-sidecar/      # Open Interpreter integration
├─ webui-plugin/       # Helicone scoreboard and UI extensions
├─ backend/            # Memory API and core services
├─ infra/              # Redis and LiteFS configuration
├─ installers/         # Installation scripts and utilities
└─ .github/            # CI/CD workflows
```

## Installation

k3ss-IDE supports multiple installation methods to fit your workflow.

### Local Installation (Conda)

1. Clone the repository:
   ```bash
   git clone https://github.com/k3ss-official/k3ss-IDE.git
   cd k3ss-IDE
   ```

2. Run the local installation script:
   ```bash
   chmod +x installers/install_local.sh
   ./installers/install_local.sh
   ```

3. Create a `.env` file based on the provided example:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. Start the application:
   ```bash
   conda activate k3ss-ide
   npm start
   ```

### Local Docker Compose Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/k3ss-official/k3ss-IDE.git
   cd k3ss-IDE
   ```

2. Create a `.env` file based on the provided example:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. Build and start the containers:
   ```bash
   docker-compose build
   docker-compose up
   ```

4. Access the application at `http://localhost:3000`

### Server Installation (Docker Compose)

1. Clone the repository on your server:
   ```bash
   git clone https://github.com/k3ss-official/k3ss-IDE.git
   cd k3ss-IDE
   ```

2. Create a `.env` file based on the provided example:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. Build and start the containers:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. The services will be available at:
   - Main UI: `http://your-server-ip:3000`
   - Memory API: `http://your-server-ip:8000`
   - Helicone Proxy: `http://your-server-ip:8888`

## Testing

### Testing the Dynamic Model Menu

1. Edit your `.env` file to add or comment out model API keys
2. The model dropdown will automatically update to reflect available models
3. Use the "Reload Models" button to manually refresh the list

### Testing the Memory API

1. Ensure Redis is running (automatically started with Docker Compose)
2. Send a test request to the memory API:
   ```bash
   curl -X POST http://localhost:8000/memory \
     -H "Content-Type: application/json" \
     -d '{"key": "test", "value": "Hello, world!"}'
   ```
3. Retrieve the stored memory:
   ```bash
   curl http://localhost:8000/memory/test
   ```

### Testing the Context Window Monitor

1. Start a conversation with a model
2. The context window monitor will track token usage
3. When approaching the model's context limit, a handover alert will be triggered

## Component Details

### Electron GUI Shell

The Electron-based GUI provides a responsive interface with:
- Dynamic model selection based on available API keys
- Real-time `.env` file monitoring
- Integrated terminal for command execution

### Open Interpreter Sidecar

The agent sidecar leverages Open Interpreter to:
- Execute code in multiple languages
- Control local system resources
- Integrate with the memory system for persistent context

### Memory API

The Redis-based memory system provides:
- Persistent storage across sessions
- Fast retrieval of conversation history
- LiteFS integration for durability and replication

### Helicone Scoreboard

The cost tracking system monitors:
- Token usage across all API calls
- Cost accumulation in real-time
- Model-specific usage statistics

### Context Window Monitor

The intelligent monitoring system:
- Tracks token usage for active conversations
- Calculates proximity to context limits
- Triggers handover alerts when thresholds are reached

## Development

### Prerequisites

- Node.js 16+
- Python 3.9+
- Conda (for local installation)
- Docker and Docker Compose (for containerized installation)

### Building from Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```

## License

[MIT License](LICENSE)

## Acknowledgments

- Open Interpreter for the agent sidecar functionality
- Helicone for the API usage tracking
- Redis and LiteFS for the memory system
