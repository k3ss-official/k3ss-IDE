#!/bin/bash

# Comprehensive Installation Script for k3ss-IDE

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
DEFAULT_CONDA_ENV_NAME="k3ss_ide"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALLERS_DIR="$SCRIPT_DIR/installers"
ELECTRON_DIR="$SCRIPT_DIR/electron"
CONDA_ENV_FILE="$INSTALLERS_DIR/conda_env.yml"

# --- Colors and Formatting ---
# Use printf for better compatibility with escape sequences
GREEN=$(printf 	'\033[0;32m	')
YELLOW=$(printf 	'\033[1;33m	')
RED=$(printf 	'\033[0;31m	')
NC=$(printf 	'\033[0m	') # No Color
CHECKMARK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"

# --- Helper Functions ---

# Print a step message
print_step() {
    echo -e "\n${YELLOW}>>> $1${NC}"
}

# Print a success message for a sub-step
print_success() {
    echo -e "  ${CHECKMARK} $1"
}

# Print a failure message and exit
print_fail() {
    echo -e "  ${CROSS} $1${NC}"
    echo -e "${RED}Installation failed.${NC}"
    exit 1
}

# Print an informational message
print_info() {
    echo -e "  $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check for a dependency
# Usage: check_dependency <command_name> <install_instructions_url>
check_dependency() {
    local cmd="$1"
    local url="$2"
    echo -n "  Checking for $cmd... "
    if command_exists "$cmd"; then
        echo -e "${CHECKMARK}"
        return 0
    else
        echo -e "${CROSS}"
        print_info "    ${YELLOW}Warning: Command 	'$cmd	' not found.${NC}"
        print_info "    Please install it. See: ${YELLOW}$url${NC}"
        return 1
    fi
}

# --- Main Installation Logic ---

print_step "Starting k3ss-IDE Installation"

# 1. Check System Dependencies
print_step "Checking System Dependencies"

dependency_missing=0

check_dependency "git" "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git" || dependency_missing=1
check_dependency "conda" "https://docs.conda.io/projects/miniconda/en/latest/" || dependency_missing=1
check_dependency "node" "https://nodejs.org/" || dependency_missing=1
check_dependency "npm" "https://nodejs.org/" || dependency_missing=1
check_dependency "rustc" "https://www.rust-lang.org/tools/install" || dependency_missing=1 # Needed for some potential underlying libs

if [ $dependency_missing -eq 1 ]; then
    print_fail "One or more critical dependencies are missing. Please install them and re-run the script."
else
    print_success "All system dependencies found."
fi

# 2. Setup Conda Environment (Interactive)
print_step "Configuring Conda Environment"

USE_EXISTING_ENV=""
while [[ ! "$USE_EXISTING_ENV" =~ ^[YyNn]$ ]]; do
    read -p "Do you want to use an existing Conda environment? (y/N): " USE_EXISTING_ENV
    USE_EXISTING_ENV=${USE_EXISTING_ENV:-N} # Default to No
done

if [[ "$USE_EXISTING_ENV" =~ ^[Yy]$ ]]; then
    print_info "Available Conda environments:"
    conda env list | grep -v "^#" | sed 	's/^/  /	'
    while true; do
        read -p "Enter the name of the existing environment to use: " CONDA_ENV_NAME
        if conda env list | grep -q "^${CONDA_ENV_NAME} "; then
            print_success "Using existing environment: $CONDA_ENV_NAME"
            # Automatically update the existing environment
            print_info "Updating environment '$CONDA_ENV_NAME' with packages from $CONDA_ENV_FILE..."
            conda env update -n "$CONDA_ENV_NAME" -f "$CONDA_ENV_FILE" --prune || print_fail "Failed to update Conda environment '$CONDA_ENV_NAME'."
            print_success "Environment '$CONDA_ENV_NAME' updated successfully."
            break
        else
            print_info "${RED}Environment 	'$CONDA_ENV_NAME	' not found. Please try again.${NC}"
        fi
    done
else
    read -p "Enter a name for the new Conda environment [${DEFAULT_CONDA_ENV_NAME}]: " CONDA_ENV_NAME
    CONDA_ENV_NAME=${CONDA_ENV_NAME:-$DEFAULT_CONDA_ENV_NAME}

    # Basic validation for environment name (no spaces)
    if [[ "$CONDA_ENV_NAME" =~ \s ]]; then
        print_fail "Environment name cannot contain spaces: 	'$CONDA_ENV_NAME	'"
    fi

    if conda env list | grep -q "^${CONDA_ENV_NAME} "; then
        print_fail "Environment 	'$CONDA_ENV_NAME	' already exists. Please remove it first (conda env remove -n $CONDA_ENV_NAME) or choose a different name."
    else
        if [ -f "$CONDA_ENV_FILE" ]; then
            print_info "Creating new environment 	'$CONDA_ENV_NAME	' from $CONDA_ENV_FILE..."
            # Modify the environment file to set the name
            sed -i.bak "s/^name: .*/name: $CONDA_ENV_NAME/" "$CONDA_ENV_FILE"
            conda env create -f "$CONDA_ENV_FILE" || print_fail "Failed to create Conda environment."
            # Restore the original environment file name (optional, but good practice)
            mv "${CONDA_ENV_FILE}.bak" "$CONDA_ENV_FILE"
            print_success "Conda environment 	'$CONDA_ENV_NAME	' created successfully."
        else
            print_fail "Conda environment file not found: $CONDA_ENV_FILE"
        fi
    fi
fi

# 3. Install Node.js Dependencies (Electron)
print_step "Installing Node.js Dependencies for Electron UI"

if [ -d "$ELECTRON_DIR" ]; then
    cd "$ELECTRON_DIR" || print_fail "Could not change directory to $ELECTRON_DIR"
    print_info "Running npm install in $ELECTRON_DIR... (This may take a while)"
    npm install || print_fail "npm install failed in $ELECTRON_DIR"
    print_success "Node.js dependencies installed successfully."
    cd "$SCRIPT_DIR" || print_fail "Could not change directory back to $SCRIPT_DIR"
else
    print_fail "Electron directory not found: $ELECTRON_DIR"
fi

# 4. Verification
print_step "Verifying Installation"
verification_passed=1

# Check if node_modules exists
echo -n "  Checking for Electron node_modules... "
if [ -d "$ELECTRON_DIR/node_modules" ]; then
    echo -e "${CHECKMARK}"
else
    echo -e "${CROSS}"
    print_info "    Electron node_modules directory not found."
    verification_passed=0
fi

# Check if a key Python package can be imported
echo -n "  Checking Conda environment packages (fastapi)... "
if conda run -n "$CONDA_ENV_NAME" python -c "import fastapi" &> /dev/null; then
    echo -e "${CHECKMARK}"
else
    echo -e "${CROSS}"
    print_info "    Failed to import 	'fastapi	' in 	'$CONDA_ENV_NAME	' environment."
    verification_passed=0
fi

if [ $verification_passed -eq 0 ]; then
    print_fail "Installation verification failed. Please check the errors above."
else
    print_success "Installation verified successfully."
fi

# 5. Final Report & Instructions
print_step "Installation Complete!"

echo -e "${GREEN}k3ss-IDE has been successfully installed using Conda environment 	'$CONDA_ENV_NAME	'.${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Activate the Conda environment: ${GREEN}conda activate $CONDA_ENV_NAME${NC}"
echo -e "2. Configure your API keys and settings:"
echo -e "   ${GREEN}cp .env.example .env${NC}"
echo -e "   ${GREEN}nano .env${NC}  (or your preferred editor)"
echo -e "3. Start the application using the dedicated script:"
echo -e "   ${GREEN}./installers/start_local.sh${NC}"

exit 0

