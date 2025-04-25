import React from 'react';

interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  onReloadModels: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  selectedModel, 
  onModelChange, 
  onReloadModels 
}) => {
  // Handle model selection change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(event.target.value);
  };

  // Handle reload button click
  const handleReloadClick = () => {
    onReloadModels();
  };

  return (
    <div className="model-selector-container">
      <select 
        className="model-selector" 
        value={selectedModel} 
        onChange={handleChange}
        disabled={models.length === 0}
        aria-label="Model Selector"
      >
        {models.length === 0 ? (
          <option value="">No models found – please update .env</option>
        ) : (
          models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))
        )}
      </select>
      <button 
        className="reload-button" 
        onClick={handleReloadClick}
        aria-label="Reload Models"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      </button>
    </div>
  );
};
