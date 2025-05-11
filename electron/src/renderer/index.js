// This file is needed to compile the TypeScript to JavaScript
// It will be used by the Electron app to load the React components

const path = require('path');
const fs = require('fs');

// Create a sample .env file for testing if it doesn't exist
const envPath = path.join(process.env.APPDATA || process.env.HOME || process.env.USERPROFILE, '.env');
if (!fs.existsSync(envPath)) {
  console.log(`Creating sample .env file at ${envPath}`);
  const sampleEnv = `# Sample .env file for testing
OPENAI_API_KEY=sk-sample-key
ANTHROPIC_API_KEY=sk-ant-sample123
OLLAMA_API_URL=http://localhost:11434
# This is a commented line
`;
  fs.writeFileSync(envPath, sampleEnv);
}

// This file is intentionally left mostly empty as it's just a bridge
// The actual implementation is in the index.tsx file
