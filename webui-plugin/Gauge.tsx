import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface GaugeProps {
  projectId: string;
  pollInterval?: number; // in milliseconds
  width?: string | number;
  height?: string | number;
}

interface ContextData {
  task_id: string;
  token_count: number;
  max_tokens: number;
  usage_percentage: number;
  timestamp: number;
}

const Gauge: React.FC<GaugeProps> = ({
  projectId,
  pollInterval = 5000, // Default to 5 seconds
  width = '100%',
  height = '40px'
}) => {
  const [contextData, setContextData] = useState<ContextData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isWarningFlashing, setIsWarningFlashing] = useState(false);

  // Function to fetch context data from Redis stream
  const fetchContextData = async () => {
    try {
      // In a real implementation, this would be an API endpoint that reads from Redis stream
      const response = await axios.get(`/api/context-stream/${projectId}`);
      
      if (response.data && Array.isArray(response.data)) {
        setContextData(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching context data:', err);
      setError('Failed to fetch context data');
    }
  };

  // Set up polling interval
  useEffect(() => {
    fetchContextData(); // Initial fetch
    
    const intervalId = setInterval(fetchContextData, pollInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [projectId, pollInterval]);

  // Calculate the highest usage percentage across all tasks
  const highestUsage = contextData.length > 0
    ? Math.max(...contextData.map(data => data.usage_percentage))
    : 0;

  // Determine color based on usage percentage
  const getZoneColor = (percentage: number): string => {
    if (percentage >= 90) return '#ff4d4d'; // Red
    if (percentage >= 75) return '#ffa64d'; // Orange
    return '#4dff4d'; // Green
  };

  // Handle warning flash effect for red zone
  useEffect(() => {
    if (highestUsage >= 90) {
      const flashInterval = setInterval(() => {
        setIsWarningFlashing(prev => !prev);
      }, 500); // Flash every 500ms
      
      return () => clearInterval(flashInterval);
    } else {
      setIsWarningFlashing(false);
    }
  }, [highestUsage]);

  // Gauge bar style
  const gaugeBarStyle: React.CSSProperties = {
    width: width,
    height: height,
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  // Gauge fill style
  const gaugeFillStyle: React.CSSProperties = {
    width: `${highestUsage}%`,
    height: '100%',
    backgroundColor: isWarningFlashing && highestUsage >= 90 
      ? (isWarningFlashing ? '#ff4d4d' : '#ff8080') // Flash between red and light red
      : getZoneColor(highestUsage),
    transition: highestUsage >= 90 ? 'none' : 'width 0.5s ease, background-color 0.5s ease',
  };

  // Zone markers
  const zoneMarkerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRight: '2px dashed rgba(0, 0, 0, 0.2)',
  };

  return (
    <div className="context-gauge-container" style={{ marginBottom: '10px' }}>
      <div className="gauge-label" style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Context Window Usage</span>
        <span>{highestUsage.toFixed(1)}%</span>
      </div>
      
      <div className="gauge-bar" style={gaugeBarStyle}>
        {/* Fill */}
        <div className="gauge-fill" style={gaugeFillStyle}></div>
        
        {/* Zone markers */}
        <div className="zone-marker-75" style={{ ...zoneMarkerStyle, left: '75%' }}></div>
        <div className="zone-marker-90" style={{ ...zoneMarkerStyle, left: '90%' }}></div>
        
        {/* Zone labels */}
        <div style={{ position: 'absolute', top: '50%', left: '37.5%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', color: '#333' }}>
          Safe
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '82.5%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', color: '#333' }}>
          Warning
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '95%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', color: '#333' }}>
          Critical
        </div>
      </div>
      
      {error && (
        <div className="gauge-error" style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>
          {error}
        </div>
      )}
      
      {highestUsage >= 90 && (
        <div className="gauge-warning" style={{ 
          color: '#ff4d4d', 
          fontWeight: 'bold', 
          marginTop: '5px',
          animation: 'fadeInOut 1s infinite'
        }}>
          Warning: Context window nearly full! Handover preparation required.
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default Gauge;
