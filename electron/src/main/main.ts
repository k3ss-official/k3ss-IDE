import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as chokidar from 'chokidar';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

// Store the current list of models
let modelsList: string[] = [];

// Function to parse .env file and extract model information
function parseEnvFile(envPath: string = path.join(app.getPath('userData'), '.env')): string[] {
  try {
    if (!fs.existsSync(envPath)) {
      console.log(`No .env file found at ${envPath}`);
      return [];
    }

    // Load .env file
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    
    // Extract model information
    const models: string[] = [];
    
    for (const key in envConfig) {
      // Skip commented lines and empty values
      if (key.startsWith('#') || !envConfig[key]) continue;
      
      // Look for API keys and model URLs
      if (key.includes('_API_KEY') || 
          key.includes('_MODEL_URL') || 
          key === 'OLLAMA_API_URL') {
        
        // Extract provider name from key
        const provider = key.split('_')[0];
        
        // Add to models list if not already included
        if (!models.includes(provider)) {
          models.push(provider);
        }
      }
    }
    
    console.log('Found models:', models);
    return models;
  } catch (error) {
    console.error('Error parsing .env file:', error);
    return [];
  }
}

// Function to create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Initial model list parsing
  modelsList = parseEnvFile();
  
  // Send initial models list to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('models-updated', modelsList);
  });

  // Clean up on window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(() => {
  createWindow();
  
  // Set up .env file watcher
  const envPath = path.join(app.getPath('userData'), '.env');
  console.log(`Watching for .env file changes at: ${envPath}`);
  
  const watcher = chokidar.watch(envPath, {
    persistent: true,
    ignoreInitial: true
  });
  
  // Handle file changes
  watcher.on('add', (path) => {
    console.log(`.env file added at ${path}`);
    updateModels();
  });
  
  watcher.on('change', (path) => {
    console.log(`.env file changed at ${path}`);
    updateModels();
  });
  
  // Handle IPC messages from renderer
  ipcMain.on('reload-models', () => {
    console.log('Manual model reload requested');
    updateModels();
  });
  
  // MacOS-specific behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Function to update models and notify renderer
function updateModels() {
  const newModelsList = parseEnvFile();
  
  // Check if models list has changed
  if (JSON.stringify(modelsList) !== JSON.stringify(newModelsList)) {
    modelsList = newModelsList;
    
    // Notify renderer of updated models
    if (mainWindow) {
      mainWindow.webContents.send('models-updated', modelsList);
    }
  }
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
