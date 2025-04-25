// Create a sample .env file for testing
const fs = require('fs');
const path = require('path');

// Path to create the sample .env file
const envPath = path.join(__dirname, '.env');

// Sample content with model configurations
const envContent = `# k3ss-IDE Environment Configuration
# API Keys for different model providers
OPENAI_API_KEY=sk-sample-openai-key
ANTHROPIC_API_KEY=sk-sample-anthropic-key
GOOGLE_API_KEY=sample-google-key

# Model URLs
OLLAMA_API_URL=http://localhost:11434
OPENAI_MODEL_URL=https://api.openai.com/v1
# COMMENTED_MODEL=this-should-not-appear

# Other configuration
DEBUG=false
`;

// Write the file
fs.writeFileSync(envPath, envContent);
console.log(`Sample .env file created at: ${envPath}`);
