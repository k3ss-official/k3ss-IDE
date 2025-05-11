import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Send messages to main process
    send: (channel: string, data?: any) => {
      // Whitelist channels
      const validChannels = ['reload-models'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    
    // Receive messages from main process
    receive: (channel: string, func: (...args: any[]) => void) => {
      // Whitelist channels
      const validChannels = ['models-updated'];
      if (validChannels.includes(channel)) {
        // Remove the event listener to avoid duplicates
        ipcRenderer.removeAllListeners(channel);
        
        // Add a new listener
        ipcRenderer.on(channel, (_, ...args) => func(...args));
      }
    }
  }
);
