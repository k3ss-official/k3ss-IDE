#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== K3SS IDE Local Installation ===${NC}"

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo -e "${YELLOW}Conda not found. Please install Miniconda or Anaconda first.${NC}"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Creating conda environment...${NC}"
conda env create -f "$SCRIPT_DIR/conda_env.yml" -y

echo -e "${GREEN}Activating conda environment...${NC}"
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate k3ss_ide

echo -e "${GREEN}Installing Electron dependencies...${NC}"
cd "$PROJECT_ROOT/electron"
npm install

echo -e "${GREEN}Setting up agent-sidecar directory...${NC}"
mkdir -p "$PROJECT_ROOT/agent-sidecar"
cat > "$PROJECT_ROOT/agent-sidecar/app.py" << 'EOF'
from fastapi import FastAPI
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="K3SS IDE Agent Sidecar")

@app.get("/")
async def root():
    return {"status": "ok", "message": "K3SS IDE Agent Sidecar is running"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
EOF

cat > "$PROJECT_ROOT/agent-sidecar/Dockerfile" << 'EOF'
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "app.py"]
EOF

cat > "$PROJECT_ROOT/agent-sidecar/requirements.txt" << 'EOF'
fastapi
uvicorn[standard]
python-dotenv
redis
open-interpreter
playwright
httpx
jinja2
EOF

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}To start the application:${NC}"
echo -e "1. Activate the conda environment: ${GREEN}conda activate k3ss_ide${NC}"
echo -e "2. Start the application: ${GREEN}cd $PROJECT_ROOT && docker-compose up${NC}"
echo -e "   Or for development: ${GREEN}cd $PROJECT_ROOT/electron && npm run dev${NC}"
