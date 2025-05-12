#!/bin/bash

# Comprehensive Installation Script for k3ss-IDE

# --- Configuration ---
DEFAULT_CONDA_ENV_NAME="k3ss_ide"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALLERS_DIR="$SCRIPT_DIR/installers"
ELECTRON_DIR="$SCRIPT_DIR/electron"
CONDA_ENV_FILE="$INSTALLERS_DIR/conda_env.yml"

# --- Debugging and Verbosity Options ---
STEP_MODE=false # Set to true to enable step-by-step execution
CONTINUE_ON_ERROR=false # Set to true to attempt to continue on error and summarize
ERROR_LOG_FILE="/tmp/k3ss_install_errors.log"

# Parse command-line arguments for debug modes
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --step)
            STEP_MODE=true
            shift # past argument
            ;;
        --continue-on-error)
            CONTINUE_ON_ERROR=true
            shift # past argument
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Initialize error log if continuing on error
if [ "$CONTINUE_ON_ERROR" = true ]; then
    echo "Installation Error Log:" > "$ERROR_LOG_FILE"
else
    # Exit immediately if a command exits with a non-zero status (default behavior)
    set -e
fi

# --- Colors and Formatting ---
GREEN=$(printf 	'\033[0;32m	')
YELLOW=$(printf 	'\033[1;33m	')
RED=$(printf 	'\033[0;31m	')
NC=$(printf 	'\033[0m	') # No Color
CHECKMARK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"

# --- Helper Functions ---

# Function to execute a command and handle errors based on CONTINUE_ON_ERROR
execute_command() {
    local cmd_string="$1"
    local success_msg="$2"
    local failure_msg="$3"

    print_info "Executing: $cmd_string"
    if [ "$CONTINUE_ON_ERROR" = true ]; then
        # Temporarily disable exit on error for this command
        set +e
        eval "$cmd_string"
        local exit_code=$?
        set -e # Re-enable exit on error if it was enabled before

        if [ $exit_code -eq 0 ]; then
            print_success "$success_msg"
        else
            local error_message="  ${CROSS} $failure_msg (Exit Code: $exit_code)"
            echo -e "$error_message" | tee -a "$ERROR_LOG_FILE"
            # Do not exit if CONTINUE_ON_ERROR is true
        fi
        return $exit_code
    else
        eval "$cmd_string" || print_fail "$failure_msg"
        print_success "$success_msg"
    fi
}

# Print a step message
print_step() {
    echo -e "\n${YELLOW}>>> $1${NC}"
}

# Print a success message for a sub-step
print_success() {
    echo -e "  ${CHECKMARK} $1 - Done!"
}

# Print a failure message and exit (if not in continue-on-error mode)
print_fail() {
    local message="  ${CROSS} $1${NC}"
    echo -e "$message"
    if [ "$CONTINUE_ON_ERROR" = true ]; then
        echo -e "$message" >> "$ERROR_LOG_FILE"
    else
        echo -e "${RED}Installation failed.${NC}"
        exit 1
    fi
}

# Print an informational message
print_info() {
    echo -e "  $1"
}

# Wait for user to press Enter if STEP_MODE is true
wait_for_continue() {
    if [ "$STEP_MODE" = true ]; then
        read -p "Press [Enter] to continue to the next step..."
    fi
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check for a dependency
check_dependency() {
    local cmd="$1"
    local url="$2"
    echo -n "  Checking for $cmd... "
    if command_exists "$cmd"; then
        echo -e "${CHECKMARK}"
        return 0
    else
        echo -e "${CROSS}"
        local error_msg="    ${YELLOW}Warning: Command '$cmd' not found.${NC} Please install it. See: ${YELLOW}$url${NC}"
        print_info "$error_msg"
        if [ "$CONTINUE_ON_ERROR" = true ]; then
            echo -e "$error_msg" >> "$ERROR_LOG_FILE"
        fi
        return 1 # Indicate dependency missing
    fi
}

# --- Main Installation Logic ---

print_step "Starting k3ss-IDE Installation"
print_info "Script directory: $SCRIPT_DIR"
print_info "Step mode: $STEP_MODE, Continue on error: $CONTINUE_ON_ERROR"
wait_for_continue

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
    print_success "All system dependencies found and verified."
fi
wait_for_continue

# 2. Setup Conda Environment (Interactive)
print_step "Configuring Conda Environment"
CONDA_ENV_NAME=""
USE_EXISTING_ENV=""
while [[ ! "$USE_EXISTING_ENV" =~ ^[YyNn]$ ]]; do
    read -p "Do you want to use an existing Conda environment? (y/N): " USE_EXISTING_ENV
    USE_EXISTING_ENV=${USE_EXISTING_ENV:-N} # Default to No
done

if [[ "$USE_EXISTING_ENV" =~ ^[Yy]$ ]]; then
    print_info "Available Conda environments:"
    conda env list | grep -v "^#" | sed '	 s/^/  /	'
    while true; do
        read -p "Enter the name of the existing environment to use: " CONDA_ENV_NAME_INPUT
        if conda env list | grep -q "^${CONDA_ENV_NAME_INPUT} "; then
            CONDA_ENV_NAME=$CONDA_ENV_NAME_INPUT
            print_success "Using existing environment: $CONDA_ENV_NAME"
            print_info "Updating environment '$CONDA_ENV_NAME' with packages from $CONDA_ENV_FILE..."
            execute_command "conda env update -n \"$CONDA_ENV_NAME\" -f \"$CONDA_ENV_FILE\" --prune" \
                            "Conda environment '$CONDA_ENV_NAME' updated successfully." \
                            "Failed to update Conda environment '$CONDA_ENV_NAME'."
            break
        else
            print_info "${RED}Environment '$CONDA_ENV_NAME_INPUT' not found. Please try again.${NC}"
        fi
    done
else
    read -p "Enter a name for the new Conda environment [${DEFAULT_CONDA_ENV_NAME}]: " CONDA_ENV_NAME_INPUT
    CONDA_ENV_NAME=${CONDA_ENV_NAME_INPUT:-$DEFAULT_CONDA_ENV_NAME}

    if [[ "$CONDA_ENV_NAME" =~ \s ]]; then
        print_fail "Environment name cannot contain spaces: '$CONDA_ENV_NAME'"
    fi

    if conda env list | grep -q "^${CONDA_ENV_NAME} "; then
        print_fail "Environment '$CONDA_ENV_NAME' already exists. Please remove it first (conda env remove -n $CONDA_ENV_NAME) or choose a different name."
    else
        if [ -f "$CONDA_ENV_FILE" ]; then
            print_info "Creating new environment '$CONDA_ENV_NAME' from $CONDA_ENV_FILE..."
            # Modify the environment file to set the name
            execute_command "cp \"$CONDA_ENV_FILE\" \"${CONDA_ENV_FILE}.tmp\" && sed -i.bak \"s/^name: .*/name: $CONDA_ENV_NAME/\" \"${CONDA_ENV_FILE}.tmp\"" \
                            "Temporarily modified conda env file for naming." \
                            "Failed to prepare conda env file for naming."
            if [ $? -eq 0 ]; then # Proceed only if sed was successful
                execute_command "conda env create -f \"${CONDA_ENV_FILE}.tmp\"" \
                                "Conda environment '$CONDA_ENV_NAME' created successfully." \
                                "Failed to create Conda environment."
                rm "${CONDA_ENV_FILE}.tmp" # Clean up temp file
                rm "${CONDA_ENV_FILE}.tmp.bak" # Clean up sed backup file
            fi
        else
            print_fail "Conda environment file not found: $CONDA_ENV_FILE"
        fi
    fi
fi
print_success "Conda environment configuration complete."
wait_for_continue

# 3. Install & Build Electron UI
print_step "Installing & Building Electron UI"
if [ -d "$ELECTRON_DIR" ]; then
    current_dir=$(pwd)
    cd "$ELECTRON_DIR" || print_fail "Could not change directory to $ELECTRON_DIR"
    print_info "Running npm install in $ELECTRON_DIR... (This may take a while)"
    execute_command "npm install" \
                    "Node.js dependencies installed successfully in $ELECTRON_DIR." \
                    "npm install failed in $ELECTRON_DIR"
    print_info "Running npm run build in $ELECTRON_DIR... (This may take a while)"
    execute_command "npm run build" \
                    "Electron UI built successfully in $ELECTRON_DIR." \
                    "npm run build failed in $ELECTRON_DIR"
    cd "$current_dir" || print_info "Warning: Could not change directory back to $current_dir (continuing)"
else
    print_fail "Electron directory not found: $ELECTRON_DIR"
fi
print_success "Electron UI installation and build process complete."
wait_for_continue

# 4. Verification
print_step "Verifying Installation"
overall_verification_passed=1

print_info "Checking for Electron node_modules..."
if [ -d "$ELECTRON_DIR/node_modules" ]; then
    print_success "Electron node_modules directory found."
else
    print_fail "Electron node_modules directory not found."
    overall_verification_passed=0
fi

print_info "Checking for Electron build output (dist/renderer/index.html)..."
if [ -f "$ELECTRON_DIR/dist/renderer/index.html" ]; then
    print_success "Electron build output (dist/renderer/index.html) found."
else
    print_fail "Electron build output (dist/renderer/index.html) not found."
    overall_verification_passed=0
fi

if [ -n "$CONDA_ENV_NAME" ]; then # Only check conda env if one was set up
    print_info "Checking Conda environment packages (fastapi) in '$CONDA_ENV_NAME'..."
    if conda run -n "$CONDA_ENV_NAME" python -c "import fastapi" &> /dev/null; then
        print_success "Successfully imported 'fastapi' in '$CONDA_ENV_NAME' environment."
    else
        print_fail "Failed to import 'fastapi' in '$CONDA_ENV_NAME' environment."
        overall_verification_passed=0
    fi
else
    print_info "Skipping Conda package check as CONDA_ENV_NAME is not set."
fi 

if [ $overall_verification_passed -eq 0 ]; then
    print_fail "Overall installation verification failed. Please check the errors above."
else
    print_success "Overall installation verified successfully."
fi
wait_for_continue

# 5. Final Report & Instructions
print_step "Installation Process Summary"

if [ "$CONTINUE_ON_ERROR" = true ] && [ -s "$ERROR_LOG_FILE" ] && [ "$(wc -l <"$ERROR_LOG_FILE")" -gt 1 ]; then
    echo -e "${RED}Installation completed with the following errors (see $ERROR_LOG_FILE for full details):${NC}"
    cat "$ERROR_LOG_FILE"
    echo -e "${YELLOW}Please review the errors above. Some parts of the application may not function correctly.${NC}"
elif [ $overall_verification_passed -eq 1 ]; then
    echo -e "${GREEN}k3ss-IDE installation process completed successfully using Conda environment '$CONDA_ENV_NAME'.${NC}"
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "1. Activate the Conda environment: ${GREEN}conda activate $CONDA_ENV_NAME${NC}"
    echo -e "2. Configure your API keys and settings by copying and editing the .env file:"
    echo -e "   ${GREEN}cp .env.example .env${NC}"
    echo -e "   ${GREEN}nano .env${NC}  (or your preferred editor)"
    echo -e "3. Start the application using the dedicated script:"
    echo -e "   ${GREEN}./installers/start_local.sh${NC}"
else
    echo -e "${RED}Installation process completed, but with verification failures. Please review the log above.${NC}"
fi

exit 0

