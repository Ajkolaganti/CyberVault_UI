import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { realTimeEventsApi, checkEndpointAvailability } from '../../utils/api';
import { useRealTimeValidation } from '../../hooks/useRealTimeValidation';
import { 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  Activity,
  Database,
  Zap
} from 'lucide-react';

interface EndpointStatus {
  endpoint: string;
  name: string;
  available: boolean;
  status?: number;
  error?: string;
  description: string;
}

export const RealTimeConnectionDebugger: React.FC = () => {
  const [endpointStatuses, setEndpointStatuses] = useState<EndpointStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionTest, setConnectionTest] = useState<{
    testing: boolean;
    result: string | null;
    success: boolean | null;
  }>({ testing: false, result: null, success: null });

  const {
    isConnected,
    connectionStatus,
    events,
    lastEvent,
    connect: reconnectRealTime,
    disconnect: disconnectRealTime,
    isPollingMode
  } = useRealTimeValidation({
    enableNotifications: false,
    enableCriticalAlerts: false
  });

  const endpointsToCheck = [
    {
      endpoint: '/validation/stream',
      name: 'EventSource Stream',
      description: 'Real-time validation events via Server-Sent Events'
    },
    {
      endpoint: '/validation/statistics',
      name: 'Validation Statistics',
      description: 'Dashboard statistics and metrics'
    },
    {
      endpoint: '/validation/recent',
      name: 'Recent Validations',
      description: 'Recent validation results'
    },
    {
      endpoint: '/accounts',
      name: 'Accounts API',
      description: 'Account management endpoints'
    },
    {
      endpoint: '/user/preferences/notifications',
      name: 'User Preferences',
      description: 'User notification preferences'
    }
  ];

  const checkAllEndpoints = async () => {
    setLoading(true);
    const results: EndpointStatus[] = [];

    for (const endpoint of endpointsToCheck) {
      try {
        const available = await checkEndpointAvailability(endpoint.endpoint);
        results.push({
          ...endpoint,
          available,
          status: available ? 200 : 404
        });
      } catch (error) {
        results.push({
          ...endpoint,
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Special check for EventSource endpoint
    try {
      const eventSourceTest = await realTimeEventsApi.testConnection();
      const eventSourceIndex = results.findIndex(r => r.endpoint === '/validation/stream');
      if (eventSourceIndex >= 0) {
        results[eventSourceIndex] = {
          ...results[eventSourceIndex],
          available: eventSourceTest.available,
          status: eventSourceTest.available ? 200 : 404,
          error: eventSourceTest.error
        };
      }
    } catch (error) {
      console.error('EventSource test failed:', error);
    }

    setEndpointStatuses(results);
    setLoading(false);
  };

  const testEventSourceConnection = async () => {
    setConnectionTest({ testing: true, result: null, success: null });
    
    try {
      // Disconnect current connection
      disconnectRealTime();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to reconnect
      reconnectRealTime();
      
      // Wait for connection result
      const timeout = setTimeout(() => {
        setConnectionTest({
          testing: false,
          result: 'Connection test timed out after 10 seconds',
          success: false
        });
      }, 10000);
      
      // Check connection status periodically
      const checkStatus = () => {
        if (isConnected) {
          clearTimeout(timeout);
          setConnectionTest({
            testing: false,
            result: 'EventSource connection successful!',
            success: true
          });
        } else if (connectionStatus === 'error') {
          clearTimeout(timeout);
          setConnectionTest({
            testing: false,
            result: 'EventSource connection failed. Using polling fallback.',
            success: false
          });
        } else {
          setTimeout(checkStatus, 500);
        }
      };
      
      setTimeout(checkStatus, 500);
      
    } catch (error) {
      setConnectionTest({
        testing: false,
        result: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      });
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <LoadingSpinner className="w-5 h-5" />;
      case 'error':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'disconnected':
      default:
        return <WifiOff className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConnectionStatusColor = (): "success" | "default" | "danger" | "warning" | "info" => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'danger';
      case 'disconnected':
      default:
        return 'default';
    }
  };

  useEffect(() => {
    checkAllEndpoints();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-Time Connection Debugger</h2>
        <Button
          onClick={checkAllEndpoints}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Connection Status Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Real-Time Connection Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            {getConnectionStatusIcon()}
            <div>
              <div className="font-medium">Connection Status</div>
              <Badge variant={getConnectionStatusColor()}>
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium">Mode</div>
              <Badge variant={isPollingMode ? 'warning' : 'success'}>
                {isPollingMode ? 'Polling' : 'EventSource'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-500" />
            <div>
              <div className="font-medium">Events Received</div>
              <div className="text-sm text-gray-600">{events.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-orange-500" />
            <div>
              <div className="font-medium">Last Event</div>
              <div className="text-sm text-gray-600">
                {lastEvent ? new Date(lastEvent.timestamp).toLocaleTimeString() : 'None'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={testEventSourceConnection}
            disabled={connectionTest.testing}
            variant="secondary"
            className="flex items-center gap-2"
          >
            {connectionTest.testing ? (
              <LoadingSpinner className="w-4 h-4" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            Test EventSource Connection
          </Button>
          
          <Button
            onClick={reconnectRealTime}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </Button>
        </div>

        {connectionTest.result && (
          <div className={`mt-4 p-3 rounded-md ${
            connectionTest.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {connectionTest.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {connectionTest.result}
            </div>
          </div>
        )}
      </Card>

      {/* API Endpoint Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          API Endpoint Status
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-3">
            {endpointStatuses.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {endpoint.available ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{endpoint.name}</div>
                    <div className="text-sm text-gray-600">{endpoint.description}</div>
                    <div className="text-xs text-gray-500">{endpoint.endpoint}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {endpoint.status && (
                    <Badge variant={endpoint.available ? 'success' : 'danger'}>
                      HTTP {endpoint.status}
                    </Badge>
                  )}
                  {endpoint.error && (
                    <div title={endpoint.error}>
                      <Badge variant="danger" className="max-w-32 truncate">
                        Error
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* EventSource URL Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          EventSource Configuration
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">EventSource URL:</label>
            <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
              {realTimeEventsApi.getEventsEndpoint().replace(/token=[^&]+/, 'token=[REDACTED]')}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">HTTP Endpoint (for testing):</label>
            <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono">
              {realTimeEventsApi.getHttpEventsEndpoint()}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">WebSocket URL:</label>
            <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
              {realTimeEventsApi.getWebSocketEndpoint().replace(/token=[^&]+/, 'token=[REDACTED]')}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Events */}
      {events.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Events ({events.length})
          </h3>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.slice(0, 10).map((event, index) => (
              <div key={index} className="p-2 border rounded text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant="info">{event.type}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.data.account_name && (
                  <div className="mt-1 text-gray-600">
                    Account: {event.data.account_name}
                  </div>
                )}
                {event.data.status && (
                  <Badge 
                    variant={event.data.status === 'success' ? 'success' : 'danger'}
                    className="mt-1"
                  >
                    {event.data.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
