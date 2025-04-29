# k3ss-IDE: Modular Mixture-of-Experts AI Platform

k3ss-IDE is a comprehensive AI platform that unifies browser automation, local system control, dynamic API model management, persistent memory, real-time cost tracking, and context window monitoring into a cohesive system.

## Features

- **Dynamic Model Menu**: Switch between AI models from different providers based on your .env configuration
- **Browser Automation**: Control web browsers for complex tasks
- **Local System Control**: Execute commands on your local machine
- **Persistent Memory**: Store and retrieve information using Redis and LiteFS
- **Cost Tracking**: Monitor API usage costs with Helicone integration
- **Context Window Monitoring**: Get alerts when approaching context limits

## System Architecture

The k3ss-IDE platform consists of several integrated components:

- **Electron Shell**: The main GUI application with dynamic model selection
- **Agent Sidecar**: Connects to Open Interpreter for executing tasks
- **Memory API**: Redis and LiteFS-based persistent storage
- **Helicone Scoreboard**: Tracks API usage and costs
- **Context Window Monitor**: Alerts when approaching token limits
- **WebUI Plugin**: Visualization components for the platform

## Installation

### Local Installation (Recommended)

This method uses a comprehensive script to check dependencies, set up the Conda environment, and install necessary packages.

1. Clone the repository:
   ```bash
   git clone https://github.com/k3ss-official/k3ss-IDE.git
   cd k3ss-IDE
   ```

2. Run the installation script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   The script will guide you through dependency checks and setup.

3. Follow the on-screen instructions provided by the script upon successful completion to activate the environment, configure `.env`, and start the application.

### Local Docker Compose Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/k3ss-official/k3ss-IDE.git
   cd k3ss-IDE
   ```

2. Configure your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. Build and start the containers:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. Access the application:
   - WebUI: http://localhost:3000
   - Memory API: http://localhost:8080
   - Helicone Dashboard: http://localhost:8888

### Server Docker Compose Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/k3ss-official/k3ss-IDE.git
   cd k3ss-IDE
   ```

2. Configure your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. Build and start the containers:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. Access the application:
   - WebUI: http://your-server-ip:3000
   - Memory API: http://your-server-ip:8080
   - Helicone Dashboard: http://your-server-ip:8888

## Testing

### Testing the Dynamic Model Menu

1. Edit your `.env` file to enable/disable different API providers
2. Restart the application
3. Observe how the available models change based on your configuration

### Testing the Memory API

1. Start the application
2. Use the Memory API endpoints to store and retrieve information:
   ```bash
   # Store information
   curl -X POST http://localhost:8080/memory \
     -H "Content-Type: application/json" \
     -d '{"key": "test", "value": "This is a test memory"}'
   
   # Retrieve information
   curl http://localhost:8080/memory/test
   ```

### Testing the Context Window Monitor

1. Start the application
2. Send requests with increasing token counts
3. Observe the alerts when approaching the configured threshold

## Component Integration

The k3ss-IDE platform integrates several components:

- The Electron shell provides the main user interface
- The Agent Sidecar connects to the Open Interpreter
- The Memory API provides persistent storage
- The Helicone Scoreboard tracks API usage and costs
- The Context Window Monitor alerts when approaching token limits

All components communicate through well-defined APIs and share configuration through the `.env` file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
