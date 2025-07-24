import React, { useState, useEffect } from 'react';
import { checkCriticalEndpoints, checkEndpointAvailability } from '../../utils/api';

export const ApiEndpointDebugger: React.FC = () => {
  const [endpointStatus, setEndpointStatus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEndpoints = async () => {
      setIsLoading(true);
      try {
        const results = await checkCriticalEndpoints();
        setEndpointStatus(results);
      } catch (error) {
        console.error('Failed to check endpoints:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkEndpoints();
  }, []);

  const testCustomEndpoint = async (endpoint: string) => {
    const available = await checkEndpointAvailability(endpoint);
    console.log(`Endpoint ${endpoint}: ${available ? 'Available' : 'Not Available'}`);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">API Endpoint Debugger</h3>
        <p>Checking endpoint availability...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">API Endpoint Status</h3>
      
      <div className="space-y-2">
        {endpointStatus.map((status, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
            <span className="font-mono text-sm">{status.endpoint}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              status.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status.available ? 'Available' : 'Not Available'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This debug component shows which API endpoints are available. 
          Red endpoints need to be implemented on the backend or may have incorrect URLs.
        </p>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Test Custom Endpoint</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="/api/v1/your-endpoint"
            className="flex-1 px-3 py-2 border rounded"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                testCustomEndpoint((e.target as HTMLInputElement).value);
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="/api/v1/your-endpoint"]') as HTMLInputElement;
              if (input?.value) {
                testCustomEndpoint(input.value);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiEndpointDebugger;
