import React, { useState } from 'react';
import { Gauge } from '../components/Gauge';

interface AppProps {
  projectId: string;
}

const App: React.FC<AppProps> = ({ projectId = 'default' }) => {
  const [activeTab, setActiveTab] = useState('editor');
  
  return (
    <div className="k3ss-ide-container">
      <header className="ide-header">
        <div className="logo">k3ss-IDE</div>
        <div className="header-controls">
          {/* Context Window Gauge - Always visible in header */}
          <div className="context-monitor">
            <Gauge projectId={projectId} width="250px" />
          </div>
          <div className="user-controls">
            <button>Settings</button>
            <button>Help</button>
          </div>
        </div>
      </header>
      
      <div className="ide-main">
        <nav className="ide-sidebar">
          <ul>
            <li className={activeTab === 'editor' ? 'active' : ''} onClick={() => setActiveTab('editor')}>Editor</li>
            <li className={activeTab === 'terminal' ? 'active' : ''} onClick={() => setActiveTab('terminal')}>Terminal</li>
            <li className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>Tasks</li>
            <li className={activeTab === 'debug' ? 'active' : ''} onClick={() => setActiveTab('debug')}>Debug</li>
          </ul>
        </nav>
        
        <main className="ide-content">
          {activeTab === 'editor' && (
            <div className="editor-container">
              <div className="editor-tabs">
                <div className="tab active">main.py</div>
                <div className="tab">utils.py</div>
                <div className="tab">README.md</div>
              </div>
              <div className="editor-area">
                <pre>
                  <code>
                    # k3ss-IDE Sample Code
                    
                    def hello_world():
                        print("Hello from k3ss-IDE!")
                        
                    if __name__ == "__main__":
                        hello_world()
                  </code>
                </pre>
              </div>
            </div>
          )}
          
          {activeTab === 'terminal' && (
            <div className="terminal-container">
              <div className="terminal-output">
                $ python main.py<br />
                Hello from k3ss-IDE!<br />
                $
              </div>
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="tasks-container">
              <h2>Active Tasks</h2>
              <div className="task-list">
                <div className="task-item">
                  <div className="task-header">
                    <span className="task-name">Task 1: Data Processing</span>
                    <span className="task-status running">Running</span>
                  </div>
                  <div className="task-details">
                    <div className="task-progress">
                      <div className="progress-label">Progress:</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '65%' }}></div>
                      </div>
                      <div className="progress-value">65%</div>
                    </div>
                    <div className="task-context">
                      <div className="context-label">Context Usage:</div>
                      <Gauge projectId="task1" height="20px" />
                    </div>
                  </div>
                </div>
                
                <div className="task-item">
                  <div className="task-header">
                    <span className="task-name">Task 2: Model Training</span>
                    <span className="task-status pending">Pending</span>
                  </div>
                  <div className="task-details">
                    <div className="task-progress">
                      <div className="progress-label">Progress:</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '0%' }}></div>
                      </div>
                      <div className="progress-value">0%</div>
                    </div>
                    <div className="task-context">
                      <div className="context-label">Context Usage:</div>
                      <Gauge projectId="task2" height="20px" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'debug' && (
            <div className="debug-container">
              <h2>Debug Console</h2>
              <div className="debug-output">
                <p>[INFO] Application started</p>
                <p>[INFO] Connected to Redis server</p>
                <p>[INFO] Context monitor initialized</p>
                <p>[WARNING] Task 1 approaching context limit (75%)</p>
              </div>
              
              <div className="system-monitors">
                <h3>System Monitors</h3>
                <div className="monitor-grid">
                  <div className="monitor-item">
                    <h4>CPU Usage</h4>
                    <div className="monitor-gauge">
                      <div className="gauge-fill" style={{ width: '45%' }}></div>
                    </div>
                    <div className="monitor-value">45%</div>
                  </div>
                  
                  <div className="monitor-item">
                    <h4>Memory Usage</h4>
                    <div className="monitor-gauge">
                      <div className="gauge-fill" style={{ width: '60%' }}></div>
                    </div>
                    <div className="monitor-value">60%</div>
                  </div>
                  
                  <div className="monitor-item">
                    <h4>Context Window</h4>
                    <Gauge projectId={projectId} height="25px" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      <footer className="ide-footer">
        <div className="status-bar">
          <div className="status-item">Ready</div>
          <div className="status-item">Python 3.9.5</div>
          <div className="status-item">UTF-8</div>
        </div>
      </footer>
      
      <style jsx>{`
        .k3ss-ide-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .ide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: #1e1e1e;
          color: white;
          border-bottom: 1px solid #333;
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .context-monitor {
          min-width: 250px;
        }
        
        .user-controls {
          display: flex;
          gap: 0.5rem;
        }
        
        .ide-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .ide-sidebar {
          width: 200px;
          background-color: #252526;
          color: #cccccc;
          border-right: 1px solid #333;
        }
        
        .ide-sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .ide-sidebar li {
          padding: 0.75rem 1rem;
          cursor: pointer;
        }
        
        .ide-sidebar li:hover {
          background-color: #2a2d2e;
        }
        
        .ide-sidebar li.active {
          background-color: #37373d;
          border-left: 3px solid #007acc;
        }
        
        .ide-content {
          flex: 1;
          background-color: #1e1e1e;
          color: #d4d4d4;
          overflow: auto;
        }
        
        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .editor-tabs {
          display: flex;
          background-color: #252526;
          border-bottom: 1px solid #333;
        }
        
        .tab {
          padding: 0.5rem 1rem;
          border-right: 1px solid #333;
          cursor: pointer;
        }
        
        .tab.active {
          background-color: #1e1e1e;
          border-bottom: 2px solid #007acc;
        }
        
        .editor-area {
          flex: 1;
          padding: 1rem;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          overflow: auto;
        }
        
        .terminal-container, .tasks-container, .debug-container {
          padding: 1rem;
          height: 100%;
          overflow: auto;
        }
        
        .terminal-output {
          font-family: 'Consolas', 'Courier New', monospace;
          background-color: #0e0e0e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 4px;
          height: calc(100% - 2rem);
          overflow: auto;
        }
        
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .task-item {
          background-color: #252526;
          border-radius: 4px;
          padding: 1rem;
        }
        
        .task-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .task-status {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .task-status.running {
          background-color: #294e2c;
          color: #4caf50;
        }
        
        .task-status.pending {
          background-color: #332b00;
          color: #ffc107;
        }
        
        .task-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .task-progress, .task-context {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .progress-label, .context-label {
          width: 100px;
        }
        
        .progress-bar {
          flex: 1;
          height: 10px;
          background-color: #333;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #007acc;
        }
        
        .debug-output {
          font-family: 'Consolas', 'Courier New', monospace;
          background-color: #0e0e0e;
          color: #d4d4d4;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          max-height: 200px;
          overflow: auto;
        }
        
        .system-monitors {
          background-color: #252526;
          border-radius: 4px;
          padding: 1rem;
        }
        
        .monitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .monitor-item {
          background-color: #333;
          border-radius: 4px;
          padding: 1rem;
        }
        
        .monitor-gauge {
          height: 10px;
          background-color: #444;
          border-radius: 5px;
          overflow: hidden;
          margin: 0.5rem 0;
        }
        
        .monitor-value {
          text-align: right;
          font-size: 0.9rem;
          color: #999;
        }
        
        .ide-footer {
          background-color: #007acc;
          color: white;
          padding: 0.25rem 1rem;
          font-size: 0.8rem;
        }
        
        .status-bar {
          display: flex;
          gap: 1rem;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .ide-sidebar {
            width: 60px;
          }
          
          .ide-sidebar li {
            text-align: center;
            padding: 1rem 0.5rem;
          }
          
          .context-monitor {
            min-width: 150px;
          }
          
          .monitor-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
