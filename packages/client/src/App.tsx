import { useEffect, useState } from 'react';
import { API_ROUTES, type ApiResponse, type HealthStatus } from '@test-project/iso';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch(API_ROUTES.health)
      .then((res) => res.json())
      .then((data: ApiResponse<HealthStatus>) => {
        if (data.success) setHealth(data.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '4rem auto' }}>
      <h1>Test Project</h1>
      <p>Express + React + TypeScript monorepo</p>
      {health ? (
        <p>
          Server status: <strong>{health.status}</strong> (
          {new Date(health.timestamp).toLocaleTimeString()})
        </p>
      ) : (
        <p>Connecting to server...</p>
      )}
    </div>
  );
}
