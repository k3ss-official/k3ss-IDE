#!/bin/bash

# install_local.sh - Local installation script for k3ss-IDE
# This script sets up a local development environment for k3ss-IDE

# Exit on error
set -e

echo "Setting up k3ss-IDE local development environment..."

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Conda is required but not installed. Please install Miniconda or Anaconda."
    exit 1
fi

# Create and activate conda environment
echo "Creating conda environment..."
conda create -n k3ss python=3.10 -y
eval "$(conda shell.bash hook)"
conda activate k3ss

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd electron
npm install
cd ..

# Set up configuration
echo "Setting up configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template. Please edit it with your API keys."
fi

# Start Redis if not running
if ! command -v redis-cli &> /dev/null || ! redis-cli ping &> /dev/null; then
    echo "Starting Redis server..."
    redis-server --daemonize yes
fi

echo "k3ss-IDE local development environment setup complete!"
echo "To start the application, run: ./installers/start_local.sh"
