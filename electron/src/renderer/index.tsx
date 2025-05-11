import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ModelSelector } from './components/ModelSelector';
import { App } from './components/App';
import './styles.css';

// Declare the global window interface to include the API
declare global {
  interface Window {
    api: {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

const Root: React.FC = () => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Listen for model updates from the main process
  useEffect(() => {
    // Set up the listener for model updates
    window.api.receive('models-updated', (modelsList: string[]) => {
      console.log('Models updated:', modelsList);
      setModels(modelsList);
      
      // Auto-select first model if none selected or current selection is no longer valid
      if (modelsList.length > 0 && (!selectedModel || !modelsList.includes(selectedModel))) {
        setSelectedModel(modelsList[0]);
      }
    });
    
    // Request initial models list
    window.api.send('reload-models');
    
    // Cleanup listener on unmount
    return () => {
      // No direct way to remove listeners with our API, but this is handled in preload.ts
    };
  }, [selectedModel]);

  // Handle model selection change
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  // Handle reload button click
  const handleReloadModels = () => {
    window.api.send('reload-models');
  };

  return (
    <div className="root-container">
      <div className="toolbar">
        <ModelSelector 
          models={models} 
          selectedModel={selectedModel} 
          onModelChange={handleModelChange} 
          onReloadModels={handleReloadModels} 
        />
      </div>
      <App selectedModel={selectedModel} />
    </div>
  );
};

// Create root and render
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root />);
}
