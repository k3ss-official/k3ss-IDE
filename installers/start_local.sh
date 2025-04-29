#!/bin/bash

# start_local.sh - Start script for k3ss-IDE local development
# This script starts all components of the k3ss-IDE platform

# Exit on error
set -e

echo "Starting k3ss-IDE components..."

# Activate conda environment
eval "$(conda shell.bash hook)"
conda activate k3ss_ide

# Start Redis if not running
if ! redis-cli ping &> /dev/null; then
    echo "Starting Redis server..."
    redis-server --daemonize yes
fi

# Start Memory API
echo "Starting Memory API..."
cd backend
python memory_api.py &
MEMORY_PID=$!
cd ..

# Start Context Monitor
echo "Starting Context Window Monitor..."
cd backend
python context_watcher.py &
CONTEXT_PID=$!
cd ..

# Start Agent Sidecar
echo "Starting Agent Sidecar..."
cd agent-sidecar
npm start &
SIDECAR_PID=$!
cd ..

# Start Electron App
echo "Starting Electron App..."
cd electron
npm start &
ELECTRON_PID=$!
cd ..

echo "k3ss-IDE is now running!"
echo "Access the WebUI at: http://localhost:3000"
echo "Memory API is available at: http://localhost:8080"
echo "Context Monitor is available at: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all components"

# Handle shutdown
function cleanup {
    echo "Shutting down k3ss-IDE components..."
    kill $MEMORY_PID $CONTEXT_PID $SIDECAR_PID $ELECTRON_PID 2>/dev/null || true
    echo "Shutdown complete"
}

trap cleanup EXIT

# Wait for user to press Ctrl+C
wait
