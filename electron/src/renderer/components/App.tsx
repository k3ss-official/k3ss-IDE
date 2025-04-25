import React from 'react';

interface AppProps {
  selectedModel: string;
}

export const App: React.FC<AppProps> = ({ selectedModel }) => {
  return (
    <div className="app-container">
      <div className="content">
        <h1>k3ss-IDE</h1>
        <p>Welcome to k3ss-IDE with dynamic model loading.</p>
        {selectedModel ? (
          <div className="model-info">
            <h2>Current Model: {selectedModel}</h2>
            <p>The model has been loaded from your .env file.</p>
            <p>You can change the model by updating your .env file or selecting a different model from the dropdown.</p>
          </div>
        ) : (
          <div className="no-model">
            <h2>No Model Selected</h2>
            <p>Please add model information to your .env file.</p>
            <p>Example format:</p>
            <pre>
              OPENAI_API_KEY=your_api_key_here
              ANTHROPIC_API_KEY=your_api_key_here
              OLLAMA_API_URL=http://localhost:11434
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
