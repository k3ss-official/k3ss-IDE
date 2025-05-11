# k3ss-IDE Electron GUI Shell with Dynamic Model Menu

This implementation provides an Electron-based GUI shell for k3ss-IDE with a dynamic model menu that automatically detects and displays available models from the `.env` file.

## Features

- Hot-reloading `.env` file scanning
- Dynamic model dropdown menu
- "Reload Models" button for manual refresh
- Responsive UI design
- Accessibility support

## Implementation Details

### Main Process (main.ts)
- Uses `dotenv` to load the `.env` file
- Watches for changes to the `.env` file using `chokidar`
- Parses model information from environment variables
- Sends model updates to the renderer process via IPC

### Preload Script (preload.ts)
- Creates a secure bridge between main and renderer processes
- Exposes limited IPC functionality to the renderer

### React Components
- `ModelSelector` component with dropdown and reload button
- Handles empty state with appropriate messaging
- Preserves selection when models are updated
- Follows accessibility guidelines with aria-labels

## Usage

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with model configurations:
   ```
   OPENAI_API_KEY=your_api_key
   ANTHROPIC_API_KEY=your_api_key
   OLLAMA_API_URL=http://localhost:11434
   ```

3. Start the application:
   ```
   npm start
   ```

4. To build the application:
   ```
   npm run build
   ```

## Development

- The application watches for changes to the `.env` file in real-time
- Models are automatically updated in the dropdown when the `.env` file changes
- Use the "Reload Models" button to manually refresh the model list

## Project Structure

```
electron/
├── src/
│   ├── main/
│   │   └── main.ts         # Main process with .env watching
│   ├── preload/
│   │   └── preload.ts      # Preload script for IPC bridge
│   └── renderer/
│       ├── components/
│       │   ├── App.tsx     # Main application component
│       │   └── ModelSelector.tsx # Model dropdown component
│       ├── index.html      # HTML entry point
│       ├── index.tsx       # React entry point
│       └── styles.css      # Application styles
├── package.json           # Project configuration
└── tsconfig.json          # TypeScript configuration
```
