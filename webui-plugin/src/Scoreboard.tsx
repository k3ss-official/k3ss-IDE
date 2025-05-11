import React, { useEffect, useState } from 'react';

interface StatsData {
  tokens_total?: number;
  cost_total_usd?: number;
  requests_total?: number;
  model_requests?: Record<string, number>;
}

const Scoreboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8888/stats');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
        setError(false);
        setRetryCount(0);
      } catch (err) {
        console.error('Error fetching Helicone stats:', err);
        setError(true);
        setRetryCount((prev) => prev + 1);
      }
    };

    // Initial fetch
    fetchStats();

    // Set up polling with exponential backoff on errors
    const intervalId = setInterval(() => {
      const backoffTime = error ? Math.min(3000 * Math.pow(1.5, retryCount), 30000) : 3000;
      fetchStats();
    }, error ? Math.min(3000 * Math.pow(1.5, retryCount), 30000) : 3000);

    return () => clearInterval(intervalId);
  }, [error, retryCount]);

  // Format numbers with commas
  const formatNumber = (num?: number): string => {
    if (num === undefined) return '0';
    return num.toLocaleString();
  };

  // Format USD with 2 decimal places
  const formatUSD = (amount?: number): string => {
    if (amount === undefined) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const scoreboardStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#1e1e1e',
    color: error ? '#888888' : '#ffffff',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: '4px',
    opacity: error ? 0.7 : 1,
  };

  const separatorStyle: React.CSSProperties = {
    margin: '0 8px',
    color: '#666666',
  };

  if (error) {
    return <div style={scoreboardStyle}>Scoreboard unavailable</div>;
  }

  return (
    <div style={scoreboardStyle}>
      <span>Tokens: {formatNumber(stats?.tokens_total)}</span>
      <span style={separatorStyle}>|</span>
      <span>Cost: {formatUSD(stats?.cost_total_usd)}</span>
      {stats?.requests_total !== undefined && (
        <>
          <span style={separatorStyle}>|</span>
          <span>Calls: {formatNumber(stats?.requests_total)}</span>
        </>
      )}
    </div>
  );
};

export default Scoreboard;
