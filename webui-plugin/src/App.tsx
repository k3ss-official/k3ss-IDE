import React from 'react';
import Scoreboard from './Scoreboard';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>K3SS IDE</h1>
        </div>
        <div className="header-right">
          <Scoreboard />
        </div>
      </header>
      <main className="app-content">
        {/* Main application content goes here */}
        <div className="content-placeholder">
          <p>Main application content</p>
        </div>
      </main>
      <style jsx>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          background-color: #1e1e1e;
          color: white;
          height: 60px;
        }
        .header-left {
          display: flex;
          align-items: center;
        }
        .header-right {
          display: flex;
          align-items: center;
        }
        .app-content {
          flex: 1;
          padding: 16px;
          background-color: #252525;
          color: #e0e0e0;
        }
        .content-placeholder {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          border: 1px dashed #555;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default App;
