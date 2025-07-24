import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { realTimeEventsApi, validationApi } from '../utils/api';

export interface ValidationEvent {
  id: string;
  type: 'validation_started' | 'validation_completed' | 'validation_failed' | 'jit_verification_status' | 'critical_failure' | 'statistics_update';
  timestamp: string;
  data: {
    account_id?: string;
    account_name?: string;
    session_id?: string;
    status?: 'success' | 'failure' | 'pending';
    error_message?: string;
    error_category?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    statistics?: {
      total_accounts: number;
      pending: number;
      verified: number;
      failed: number;
      success_rate: number;
    };
  };
}

export interface UseRealTimeValidationOptions {
  onValidationEvent?: (event: ValidationEvent) => void;
  onCriticalFailure?: (event: ValidationEvent) => void;
  enableNotifications?: boolean;
  enableCriticalAlerts?: boolean;
}

export const useRealTimeValidation = (options: UseRealTimeValidationOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<ValidationEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<ValidationEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isPollingMode = useRef(false);
  
  const {
    onValidationEvent,
    onCriticalFailure,
    enableNotifications = true,
    enableCriticalAlerts = true
  } = options;

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_BASE_DELAY = 1000; // 1 second
  const POLLING_INTERVAL = 15000; // 15 seconds for polling fallback

  // Polling fallback function
  const startPollingFallback = () => {
    if (isPollingMode.current) return;
    
    isPollingMode.current = true;
    setConnectionStatus('disconnected');
    console.log('📊 Starting polling fallback for real-time updates...');
    
    const pollForUpdates = async () => {
      try {
        // Poll for recent validation events
        const recent = await validationApi.getRecent(10);
        if (recent && recent.length > 0) {
          // Convert recent validations to events format
          const newEvents = recent.map((validation: any) => ({
            id: validation.id || `${validation.account_id}_${Date.now()}`,
            type: validation.status === 'success' ? 'validation_completed' : 'validation_failed' as const,
            timestamp: validation.timestamp || new Date().toISOString(),
            data: {
              account_id: validation.account_id,
              account_name: validation.account_name,
              status: validation.status,
              error_message: validation.error_message
            }
          }));
          
          setEvents(prev => {
            const existingIds = new Set(prev.map(e => e.id));
            const uniqueNew = newEvents.filter((e: ValidationEvent) => !existingIds.has(e.id));
            return [...uniqueNew, ...prev.slice(0, 90)]; // Keep last 100 events
          });
          
          if (newEvents.length > 0) {
            setLastEvent(newEvents[0]);
            onValidationEvent?.(newEvents[0]);
          }
        }
      } catch (error) {
        console.warn('📊 Polling fallback error:', error);
      }
      
      // Schedule next poll
      pollingTimeoutRef.current = setTimeout(pollForUpdates, POLLING_INTERVAL);
    };
    
    pollForUpdates();
  };

  const stopPollingFallback = () => {
    isPollingMode.current = false;
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const connect = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Test endpoint availability first
    const connectionTest = await realTimeEventsApi.testConnection();
    if (!connectionTest.available) {
      console.warn('⚠️ EventSource endpoint not available, using polling fallback');
      startPollingFallback();
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Connect to Server-Sent Events endpoint using the direct backend URL
      // EventSource doesn't go through Vite proxy, so we need the full backend URL
      const eventSource = new EventSource(realTimeEventsApi.getEventsEndpoint(), {
        withCredentials: true
      });

      eventSource.onopen = () => {
        console.log('✅ Real-time validation connection established');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        stopPollingFallback(); // Stop polling if EventSource works
      };

      eventSource.onmessage = (event) => {
        try {
          const validationEvent: ValidationEvent = JSON.parse(event.data);
          console.log('📨 Received validation event:', validationEvent);
          
          setLastEvent(validationEvent);
          setEvents(prev => [validationEvent, ...prev.slice(0, 99)]); // Keep last 100 events
          
          // Handle different event types
          handleValidationEvent(validationEvent);
          
          // Call custom event handler
          onValidationEvent?.(validationEvent);
          
        } catch (error) {
          console.error('Error parsing validation event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.warn('⚠️ Real-time validation connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        eventSource.close();
        
        // Check if this is a 404 error (endpoint not found)
        // EventSource doesn't provide detailed error info, so we'll be less aggressive with reconnection
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`🔄 Attempting to reconnect to real-time validation (attempt ${reconnectAttempts.current})...`);
            connect();
          }, delay);
        } else {
          console.info('📡 Real-time validation monitoring is unavailable. Switching to polling mode.');
          startPollingFallback();
          
          if (enableCriticalAlerts) {
            toast.error('Real-time monitoring unavailable. Dashboard will refresh periodically.', {
              duration: 5000
            });
          }
        }
      };

      // Handle specific event types
      eventSource.addEventListener('validation_started', (event) => {
        const data = JSON.parse(event.data);
        if (enableNotifications) {
          toast.loading(`Validating account: ${data.account_name}`, { 
            id: `validation-${data.account_id}`,
            duration: 10000 
          });
        }
      });

      eventSource.addEventListener('validation_completed', (event) => {
        const data = JSON.parse(event.data);
        if (enableNotifications) {
          toast.dismiss(`validation-${data.account_id}`);
          if (data.status === 'success') {
            toast.success(`Account validation successful: ${data.account_name}`);
          } else {
            toast.error(`Account validation failed: ${data.account_name}`);
          }
        }
      });

      eventSource.addEventListener('critical_failure', (event) => {
        const validationEvent: ValidationEvent = JSON.parse(event.data);
        if (enableCriticalAlerts) {
          toast.error(
            `CRITICAL: Validation failure for ${validationEvent.data.account_name}`, 
            { 
              duration: 0, // Don't auto-dismiss
              style: {
                background: '#DC2626',
                color: 'white',
                fontWeight: 'bold'
              }
            }
          );
        }
        onCriticalFailure?.(validationEvent);
      });

      eventSource.addEventListener('jit_verification_status', (event) => {
        const data = JSON.parse(event.data);
        if (enableNotifications && data.status === 'failure') {
          toast.error(`JIT verification failed for session: ${data.session_id}`);
        }
      });

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('❌ Failed to establish real-time connection:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      startPollingFallback();
    }
  };

  const handleValidationEvent = (event: ValidationEvent) => {
    switch (event.type) {
      case 'validation_started':
        // Could trigger UI updates showing validation in progress
        break;
      case 'validation_completed':
        // Update validation status in UI
        break;
      case 'validation_failed':
        // Handle failed validation
        break;
      case 'critical_failure':
        // Handle critical failures
        if (enableCriticalAlerts) {
          // Could trigger modal or alert system
          console.warn('⚠️ CRITICAL VALIDATION FAILURE:', event.data);
        }
        break;
      case 'jit_verification_status':
        // Handle JIT verification status changes
        break;
      case 'statistics_update':
        // Update dashboard statistics
        break;
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopPollingFallback();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const reconnect = () => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  };

  // Initialize connection on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Return the hook's public interface
  return {
    isConnected,
    connectionStatus,
    events,
    lastEvent,
    connect: reconnect,
    disconnect,
    isPollingMode: isPollingMode.current
  };
};

// Export additional utility functions
export const createMockValidationEvent = (type: ValidationEvent['type'], data: Partial<ValidationEvent['data']> = {}): ValidationEvent => {
  return {
    id: `mock_${Date.now()}`,
    type,
    timestamp: new Date().toISOString(),
    data: {
      account_id: 'mock_account_123',
      account_name: 'Mock Account',
      status: 'success',
      ...data
    }
  };
};

export const validateEventData = (event: any): event is ValidationEvent => {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.data === 'object' &&
    event.data !== null
  );
};
