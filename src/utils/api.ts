import { getAuthHeaders } from '../store/authStore';

// API base configuration
const API_BASE = '/api/v1';

// Backend URL for EventSource connections (which don't go through Vite proxy)
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
export const BACKEND_API_BASE = `${BACKEND_URL}/api/v1`;

// Rate limiting helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple request cache to prevent duplicate rapid requests
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Clear expired cache entries
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
};

// Request rate monitoring (in development)
let requestCount = 0;
let lastRequestTime = Date.now();

const logRequestRate = (endpoint: string) => {
  requestCount++;
  const now = Date.now();
  const timeDiff = now - lastRequestTime;
  
  if (timeDiff < 1000) { // Less than 1 second
    console.warn(`⚠️ Rapid API requests detected: ${requestCount} requests in ${timeDiff}ms to ${endpoint}`);
  }
  
  if (requestCount > 10) {
    console.warn(`⚠️ High request volume: ${requestCount} total requests`);
    // Reset counter periodically
    if (timeDiff > 60000) { // Reset every minute
      requestCount = 0;
      lastRequestTime = now;
    }
  }
};

// Exponential backoff retry for rate-limited requests
const retryWithBackoff = async (
  fn: () => Promise<Response>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fn();
      
      // If it's not a 429, return the response (success or other error)
      if (response.status !== 429) {
        return response;
      }
      
      // If it's the last attempt, don't retry
      if (attempt === maxRetries) {
        return response;
      }
      
      // Extract retry-after header if available
      const retryAfter = response.headers.get('Retry-After');
      const delayMs = retryAfter ? 
        parseInt(retryAfter) * 1000 : // Retry-After is in seconds
        baseDelay * Math.pow(2, attempt); // Exponential backoff
      
      console.log(`Rate limited (429). Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      await delay(delayMs);
      
    } catch (error) {
      // If it's the last attempt or not a network error, throw
      if (attempt === maxRetries || !(error instanceof TypeError)) {
        throw error;
      }
      
      // Exponential backoff for network errors too
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.log(`Network error. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      await delay(delayMs);
    }
  }
  
  throw new Error('Max retries exceeded');
};

// Clear cache manually (useful for forced refreshes)
export const clearApiCache = (endpoint?: string) => {
  if (endpoint) {
    // Clear specific endpoint
    for (const key of requestCache.keys()) {
      if (key.startsWith(endpoint)) {
        requestCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    requestCache.clear();
  }
};

// Cached API request for GET endpoints to prevent rapid duplicate calls
export const cachedApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Only cache GET requests
  if (options.method && options.method !== 'GET') {
    return apiRequest(endpoint, options);
  }
  
  const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
  const now = Date.now();
  
  // Check if we have a valid cached request
  const cached = requestCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached request for: ${endpoint}`);
    return cached.promise;
  }
  
  // Clear expired entries occasionally
  if (requestCache.size > 50) {
    clearExpiredCache();
  }
  
  // Make new request and cache it
  const promise = apiRequest(endpoint, options);
  requestCache.set(cacheKey, { promise, timestamp: now });
  
  // Remove from cache if the request fails
  promise.catch(() => {
    requestCache.delete(cacheKey);
  });
  
  return promise;
};

// Generic API request function with better error handling and rate limiting
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  
  // Log request rate in development
  if (import.meta.env.DEV) {
    logRequestRate(endpoint);
  }
  
  // Increase timeout for deployed environments (Render wake-up time)
  const timeoutMs = import.meta.env.DEV ? 10000 : 60000; // 10s local, 60s deployed
  
  const defaultOptions: RequestInit = {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Add cache-control headers to prevent stale data in deployed env
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    credentials: 'include',
    ...options,
  };

  console.log(`Making API request to: ${url}`);
  console.log('Request options:', defaultOptions);

  try {
    // Create a timeout promise for deployed environments
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms - this may be due to backend cold start`));
      }, timeoutMs);
    });

    const fetchPromise = retryWithBackoff(
      () => fetch(url, defaultOptions),
      import.meta.env.DEV ? 3 : 5, // More retries in deployed environment
      import.meta.env.DEV ? 1000 : 2000 // Longer delays in deployed environment
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log(`Response status: ${response.status}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Provide specific messaging for rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        errorMessage = `Rate limit exceeded. ${retryAfter ? `Please try again in ${retryAfter} seconds.` : 'Please try again later.'}`;
      } else if (response.status === 503 || response.status === 502) {
        // Common Render wake-up error codes
        errorMessage = `Service temporarily unavailable - backend may be starting up. Please try again in a moment.`;
      } else {
        try {
          // Check if response is JSON before trying to parse
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            // If it's HTML or other content type, don't try to parse as JSON
            console.warn(`Received non-JSON error response (${contentType}) for ${url}`);
            if (response.status === 404) {
              errorMessage = `Endpoint not found: ${url}. This feature may not be implemented yet.`;
            }
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          if (response.status === 404) {
            errorMessage = `Endpoint not found: ${url}. This feature may not be implemented yet.`;
          }
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection.');
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS error: Cross-origin request blocked. Please check server configuration.');
      }
    }
    
    throw error;
  }
};

// User Experience and Preferences API functions
export const userPreferencesApi = {
  // Get user notification preferences (cached to prevent rapid duplicate calls)
  getNotificationPreferences: () => 
    cachedApiRequest('/user/preferences/notifications', {
      method: 'GET',
    }),
    
  // Update notification preferences
  updateNotificationPreferences: async (preferences: {
    email_notifications?: boolean;
    in_app_notifications?: boolean;
    critical_failures_only?: boolean;
    validation_success_notifications?: boolean;
    jit_session_notifications?: boolean;
    notification_frequency?: 'immediate' | 'hourly' | 'daily';
    quiet_hours?: { start: string; end: string };
  }) => {
    const result = await apiRequest('/user/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    // Clear cache after successful update
    clearApiCache('/user/preferences/notifications');
    return result;
  },
    
  // Get dashboard preferences (cached to prevent rapid duplicate calls)
  getDashboardPreferences: () => 
    cachedApiRequest('/user/preferences/dashboard', {
      method: 'GET',
    }),
    
  // Update dashboard preferences
  updateDashboardPreferences: async (preferences: {
    default_time_range?: '24h' | '7d' | '30d';
    visible_widgets?: string[];
    widget_order?: string[];
    auto_refresh?: boolean;
    refresh_interval?: number;
    theme?: 'light' | 'dark' | 'auto';
  }) => {
    const result = await apiRequest('/user/preferences/dashboard', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    // Clear cache after successful update
    clearApiCache('/user/preferences/dashboard');
    return result;
  },
};

// Dashboard Analytics API functions (with fallbacks for missing endpoints)
export const dashboardAnalyticsApi = {
  getDashboardData: async (_timeRange?: string) => {
    // Note: timeRange parameter kept for API compatibility but not used in fallback implementations
    try {
      // Try the new validation statistics endpoint first
      const stats = await validationApi.getStatistics();
      const recent = await validationApi.getRecent(50);
      
      // Transform to expected dashboard format with all required properties
      return {
        validation_statistics: {
          total_accounts: stats.total_accounts || 0,
          pending: stats.pending || 0,
          verified: stats.verified || 0,
          failed: stats.failed || 0,
          never_validated: stats.never_validated || 0,
          success_rate: stats.success_rate || 0,
          average_validation_time: stats.average_validation_time || 0,
          last_24h_attempts: stats.last_24h_attempts || 0,
          weekly_trend: stats.weekly_trend || 0,
          critical_failures: stats.critical_failures || 0,
          last_validation: stats.last_validation,
          recent_validations: recent.validations || []
        }
      };
    } catch (error) {
      console.warn('New validation endpoints not available, falling back to account validation API');
      try {
        // Fallback to existing account validation API
        const accountStats = await accountValidationApi.getStatistics();
        return {
          validation_statistics: {
            // Map existing properties
            total_accounts: accountStats.total_accounts || 0,
            pending: accountStats.pending || 0,
            verified: accountStats.verified || 0,
            failed: accountStats.failed || 0,
            success_rate: accountStats.success_rate || 0,
            last_validation: accountStats.last_validation,
            // Add missing properties with safe defaults
            never_validated: accountStats.never_validated || 0,
            average_validation_time: accountStats.average_validation_time || 0,
            last_24h_attempts: accountStats.last_24h_attempts || 0,
            weekly_trend: accountStats.weekly_trend || 0,
            critical_failures: accountStats.critical_failures || 0,
            recent_validations: accountStats.recent_validations || []
          }
        };
      } catch (fallbackError) {
        console.error('All dashboard data endpoints failed:', fallbackError);
        // Return mock data to prevent UI crashes with all required properties
        return {
          validation_statistics: {
            total_accounts: 0,
            pending: 0,
            verified: 0,
            failed: 0,
            never_validated: 0,
            success_rate: 0,
            average_validation_time: 0,
            last_24h_attempts: 0,
            weekly_trend: 0,
            critical_failures: 0,
            last_validation: null,
            recent_validations: []
          }
        };
      }
    }
  },
    
  getJitHealthMetrics: async (_timeRange?: string) => {
    // Note: timeRange parameter kept for API compatibility but not used in fallback implementations
    try {
      return await jitValidationApi.getStatus();
    } catch (error) {
      console.warn('JIT health metrics not available:', error);
      // Return mock data to prevent UI crashes
      return {
        active_sessions: 0,
        validation_success_rate: 0,
        average_validation_time: 0,
        failed_validations: 0
      };
    }
  },
    
  getSystemHealthBreakdown: async (_timeRange?: string) => {
    // Note: timeRange parameter kept for API compatibility but not used in fallback implementations
    try {
      // Try to get system health from various sources
      const [health, accountStatus] = await Promise.allSettled([
        getHealthStatus(),
        accountValidationApi.getStatus()
      ]);
      
      // Transform to array format expected by the component
      const systemHealthArray = [
        {
          system_type: 'Validation Engine',
          total_accounts: 0,
          verified: 0,
          failed: 0,
          success_rate: health.status === 'fulfilled' ? 100 : 0,
          last_validation: new Date().toISOString()
        },
        {
          system_type: 'Account Validation',
          total_accounts: accountStatus.status === 'fulfilled' ? 
            (accountStatus.value as any)?.total_accounts || 0 : 0,
          verified: accountStatus.status === 'fulfilled' ? 
            (accountStatus.value as any)?.verified || 0 : 0,
          failed: accountStatus.status === 'fulfilled' ? 
            (accountStatus.value as any)?.failed || 0 : 0,
          success_rate: accountStatus.status === 'fulfilled' ? 
            (accountStatus.value as any)?.success_rate || 0 : 0,
          last_validation: accountStatus.status === 'fulfilled' ? 
            (accountStatus.value as any)?.last_validation || new Date().toISOString() : new Date().toISOString()
        },
        {
          system_type: 'Real-time Events',
          total_accounts: 0,
          verified: 0,
          failed: 0,
          success_rate: 0, // Since EventSource is failing
          last_validation: new Date().toISOString()
        },
        {
          system_type: 'Database',
          total_accounts: 0,
          verified: 0,
          failed: 0,
          success_rate: 50, // Unknown status
          last_validation: new Date().toISOString()
        }
      ];
      
      return {
        systems: systemHealthArray
      };
    } catch (error) {
      console.warn('System health breakdown not available:', error);
      // Return mock data to prevent UI crashes with array structure
      return {
        systems: [
          {
            system_type: 'Validation Engine',
            total_accounts: 0,
            verified: 0,
            failed: 0,
            success_rate: 0,
            last_validation: new Date().toISOString()
          },
          {
            system_type: 'Account Validation',
            total_accounts: 0,
            verified: 0,
            failed: 0,
            success_rate: 0,
            last_validation: new Date().toISOString()
          },
          {
            system_type: 'Real-time Events',
            total_accounts: 0,
            verified: 0,
            failed: 0,
            success_rate: 0,
            last_validation: new Date().toISOString()
          },
          {
            system_type: 'Database',
            total_accounts: 0,
            verified: 0,
            failed: 0,
            success_rate: 0,
            last_validation: new Date().toISOString()
          }
        ]
      };
    }
  },
};

// Real-time Events API functions
export const realTimeEventsApi = {
  // Get Server-Sent Events endpoint - for EventSource connections (bypasses Vite proxy)
  getEventsEndpoint: () => {
    const baseUrl = `${BACKEND_API_BASE}/validation/stream`;
    
    // Check multiple possible token storage locations
    const token = localStorage.getItem('cybervault_token') || 
                  localStorage.getItem('token') || 
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('cybervault_token');
    
    // Add token as query parameter since EventSource doesn't support custom headers
    if (token) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.append('token', token);
        console.log('EventSource endpoint with auth:', url.toString().replace(/token=[^&]+/, 'token=[REDACTED]'));
        return url.toString();
      } catch (error) {
        console.error('Failed to construct EventSource URL:', error);
        return baseUrl;
      }
    }
    
    console.warn('No authentication token found for EventSource connection');
    return baseUrl;
  },
  
  // Get regular HTTP events endpoint - for fetch requests (uses Vite proxy)
  getHttpEventsEndpoint: () => '/api/v1/validation/stream',
  
  // Get WebSocket endpoint with auth token
  getWebSocketEndpoint: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const baseUrl = `${protocol}//${host}/api/v1/ws/validation`;
    
    // Check multiple possible token storage locations
    const token = localStorage.getItem('cybervault_token') || 
                  localStorage.getItem('token') || 
                  sessionStorage.getItem('token') ||
                  sessionStorage.getItem('cybervault_token');
    
    // Add token as query parameter for WebSocket auth
    if (token) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.append('token', token);
        console.log('WebSocket endpoint with auth:', url.toString().replace(/token=[^&]+/, 'token=[REDACTED]'));
        return url.toString();
      } catch (error) {
        console.error('Failed to construct WebSocket URL:', error);
        return baseUrl;
      }
    }
    
    console.warn('No authentication token found for WebSocket connection');
    return baseUrl;
  },
  
  // Subscribe to specific event types (if this endpoint still exists)
  subscribe: (eventTypes: string[], options?: {
    account_ids?: string[];
    session_ids?: string[];
    severity_filter?: 'low' | 'medium' | 'high' | 'critical';
  }) => 
    apiRequest('/validation/subscribe', {
      method: 'POST',
      body: JSON.stringify({ event_types: eventTypes, ...options }),
    }),
    
  // Test EventSource endpoint availability
  testConnection: async () => {
    try {
      const response = await fetch(realTimeEventsApi.getHttpEventsEndpoint(), {
        method: 'HEAD',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return {
        available: response.status !== 404,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Credential verification and history API functions
export const verifyCredential = async (credentialId: string) => {
  return await apiRequest(`/credentials/${credentialId}/verify`, {
    method: 'POST',
  });
};

export const getCredentialHistory = async (credentialId: string) => {
  return await apiRequest(`/credentials/${credentialId}/history`, {
    method: 'GET',
  });
};

export const verifyMultipleCredentials = async (credentialIds: string[]) => {
  return await apiRequest('/credentials/verify-multiple', {
    method: 'POST',
    body: JSON.stringify({ credential_ids: credentialIds }),
  });
};

// CPM (Credential Password Manager) API functions
export const getCPMStatus = async () => {
  return await apiRequest('/cpm/status', {
    method: 'GET',
  });
};

export const getCredentialsNeedingAttention = async () => {
  return await apiRequest('/cpm/credentials/attention', {
    method: 'GET',
  });
};

export const getHealthStatus = async () => {
  return await apiRequest('/health', {
    method: 'GET',
  });
};

export const getReadinessStatus = async () => {
  return await apiRequest('/health/ready', {
    method: 'GET',
  });
};

export const getLivenessStatus = async () => {
  return await apiRequest('/health/live', {
    method: 'GET',
  });
};

export const verifyAllCredentials = async () => {
  return await apiRequest('/credentials/verify-all', {
    method: 'POST',
  });
};

// Accounts API
export const accountsApi = {
  validate: async (accountId: string) => {
    return await apiRequest(`/accounts/${accountId}/validate`, {
      method: 'POST',
    });
  },
  
  list: async () => {
    return await cachedApiRequest('/accounts', {
      method: 'GET',
    });
  },

  create: async (accountData: any) => {
    clearApiCache('/accounts');
    return await apiRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  update: async (accountId: string, accountData: any) => {
    clearApiCache('/accounts');
    clearApiCache(`/accounts/${accountId}`);
    return await apiRequest(`/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
  },

  delete: async (accountId: string) => {
    clearApiCache('/accounts');
    clearApiCache(`/accounts/${accountId}`);
    return await apiRequest(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },

  get: async (accountId: string) => {
    return await cachedApiRequest(`/accounts/${accountId}`, {
      method: 'GET',
    });
  },

  getValidationHistory: async (accountId: string) => {
    return await cachedApiRequest(`/accounts/${accountId}/validation-history`, {
      method: 'GET',
    });
  },
};

// Credentials API
export const credentialsApi = {
  list: async () => {
    return await cachedApiRequest('/credentials', {
      method: 'GET',
    });
  },

  create: async (credentialData: any) => {
    clearApiCache('/credentials');
    return await apiRequest('/credentials', {
      method: 'POST',
      body: JSON.stringify(credentialData),
    });
  },

  update: async (credentialId: string, credentialData: any) => {
    clearApiCache('/credentials');
    clearApiCache(`/credentials/${credentialId}`);
    return await apiRequest(`/credentials/${credentialId}`, {
      method: 'PUT',
      body: JSON.stringify(credentialData),
    });
  },

  delete: async (credentialId: string) => {
    clearApiCache('/credentials');
    clearApiCache(`/credentials/${credentialId}`);
    return await apiRequest(`/credentials/${credentialId}`, {
      method: 'DELETE',
    });
  },

  get: async (credentialId: string) => {
    return await cachedApiRequest(`/credentials/${credentialId}`, {
      method: 'GET',
    });
  },

  verify: async (credentialId: string) => {
    return await apiRequest(`/credentials/${credentialId}/verify`, {
      method: 'POST',
    });
  },

  getHistory: async (credentialId: string) => {
    return await cachedApiRequest(`/credentials/${credentialId}/history`, {
      method: 'GET',
    });
  },

  verifyMultiple: async (credentialIds: string[]) => {
    return await apiRequest('/credentials/verify-multiple', {
      method: 'POST',
      body: JSON.stringify({ credential_ids: credentialIds }),
    });
  },

  verifyAll: async () => {
    return await apiRequest('/credentials/verify-all', {
      method: 'POST',
    });
  },
};

// Safes API
export const safesApi = {
  list: async () => {
    return await cachedApiRequest('/safes', {
      method: 'GET',
    });
  },

  getStatistics: async () => {
    return await cachedApiRequest('/safes/statistics', {
      method: 'GET',
    });
  },

  create: async (safeData: any) => {
    clearApiCache('/safes');
    clearApiCache('/safes/statistics');
    return await apiRequest('/safes', {
      method: 'POST',
      body: JSON.stringify(safeData),
    });
  },

  update: async (safeId: string, safeData: any) => {
    clearApiCache('/safes');
    clearApiCache('/safes/statistics');
    clearApiCache(`/safes/${safeId}`);
    return await apiRequest(`/safes/${safeId}`, {
      method: 'PUT',
      body: JSON.stringify(safeData),
    });
  },

  delete: async (safeId: string) => {
    clearApiCache('/safes');
    clearApiCache('/safes/statistics');
    clearApiCache(`/safes/${safeId}`);
    return await apiRequest(`/safes/${safeId}`, {
      method: 'DELETE',
    });
  },

  get: async (safeId: string) => {
    return await cachedApiRequest(`/safes/${safeId}`, {
      method: 'GET',
    });
  },
};

// Account Validation API
export const accountValidationApi = {
  getStatus: async () => {
    return await cachedApiRequest('/validation/accounts/status', {
      method: 'GET',
    });
  },

  getStatistics: async () => {
    return await cachedApiRequest('/validation/accounts/statistics', {
      method: 'GET',
    });
  },

  getHistory: async (options: { limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    
    const endpoint = `/validation/accounts/history${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  getFailures: async (options: { severity?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.severity) {
      params.append('severity', options.severity);
    }
    
    const endpoint = `/validation/accounts/failures${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  manualTrigger: async (accounts: string[], validateAll: boolean = false) => {
    clearApiCache('/validation/accounts/status');
    clearApiCache('/validation/accounts/statistics');
    clearApiCache('/validation/accounts/history');
    clearApiCache('/validation/accounts/failures');
    
    return await apiRequest('/validation/accounts/trigger', {
      method: 'POST',
      body: JSON.stringify({
        accounts,
        validate_all: validateAll,
      }),
    });
  },
};

// JIT (Just-In-Time) Validation API
export const jitValidationApi = {
  getSessionAccountStatus: async (sessionId: string) => {
    return await cachedApiRequest(`/validation/jit/sessions/${sessionId}/accounts`, {
      method: 'GET',
    });
  },

  getSessionsWithValidation: async (options: any = {}) => {
    const params = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined) {
        params.append(key, options[key].toString());
      }
    });
    
    const endpoint = `/validation/jit/sessions${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  triggerValidation: async (sessionId: string) => {
    clearApiCache(`/validation/jit/sessions/${sessionId}/accounts`);
    clearApiCache('/validation/jit/sessions');
    
    return await apiRequest(`/validation/jit/sessions/${sessionId}/validate`, {
      method: 'POST',
    });
  },

  getStatus: async () => {
    return await cachedApiRequest('/validation/jit/status', {
      method: 'GET',
    });
  },
};

// Audit Validation API
export const auditValidationApi = {
  getCriticalFailures: async (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key].toString());
      }
    });
    
    const endpoint = `/validation/audit/critical-failures${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  getJitVerificationLogs: async (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key].toString());
      }
    });
    
    const endpoint = `/validation/audit/jit-verification${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  getVerificationLogs: async (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key].toString());
      }
    });
    
    const endpoint = `/validation/audit/verification-logs${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  exportAuditData: async (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key].toString());
      }
    });
    
    const endpoint = `/validation/audit/export${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },
};

// Additional Validation API endpoints (new backend routes)
export const validationApi = {
  // Get validation statistics
  getStatistics: async () => {
    return await cachedApiRequest('/validation/statistics', {
      method: 'GET',
    });
  },

  // Get recent validations
  getRecent: async (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const endpoint = `/validation/recent${params.toString() ? `?${params.toString()}` : ''}`;
    return await cachedApiRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get status for a specific resource
  getResourceStatus: async (resourceType: string, resourceId: string) => {
    return await cachedApiRequest(`/validation/status/${resourceType}/${resourceId}`, {
      method: 'GET',
    });
  },

  // Stream endpoint for real-time events (reference only, use realTimeEventsApi for actual connections)
  getStreamEndpoint: () => '/api/v1/validation/stream',
};

// Utility function to check if an endpoint is available
export const checkEndpointAvailability = async (endpoint: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'HEAD', // Use HEAD to avoid downloading response body
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
      },
      credentials: 'include',
    });
    return response.status !== 404;
  } catch (error) {
    console.warn(`Endpoint availability check failed for ${endpoint}:`, error);
    return false;
  }
};

// Health check for critical endpoints
export const checkCriticalEndpoints = async () => {
  const endpoints = [
    '/validation/stream',
    '/validation/statistics', 
    '/validation/recent',
    '/accounts',
    '/health'
  ];
  
  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => ({
      endpoint,
      available: await checkEndpointAvailability(endpoint)
    }))
  );
  
  const endpointStatus = results.map(result => 
    result.status === 'fulfilled' ? result.value : { endpoint: 'unknown', available: false }
  );
  
  console.log('Endpoint availability check:', endpointStatus);
  return endpointStatus;
};

// Discovery Scan API endpoints
export const discoveryApi = {
  // Discovery Targets Management
  targets: {
    list: async () => {
      return await cachedApiRequest('/discovery/targets', {
        method: 'GET',
      });
    },

    create: async (targetData: {
      name: string;
      targetType: 'linux' | 'windows' | 'aws' | 'database' | 'active_directory';
      hostname: string;
      connectionMethod: 'ssh' | 'winrm' | 'https' | 'aws_api' | 'database';
      credentialId: string;
      description?: string;
      settings?: Record<string, any>;
    }) => {
      clearApiCache('/discovery/targets');
      return await apiRequest('/discovery/targets', {
        method: 'POST',
        body: JSON.stringify(targetData),
      });
    },

    get: async (targetId: string) => {
      return await cachedApiRequest(`/discovery/targets/${targetId}`, {
        method: 'GET',
      });
    },

    update: async (targetId: string, targetData: any) => {
      clearApiCache('/discovery/targets');
      clearApiCache(`/discovery/targets/${targetId}`);
      return await apiRequest(`/discovery/targets/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(targetData),
      });
    },

    delete: async (targetId: string) => {
      clearApiCache('/discovery/targets');
      clearApiCache(`/discovery/targets/${targetId}`);
      return await apiRequest(`/discovery/targets/${targetId}`, {
        method: 'DELETE',
      });
    },
  },

  // Discovery Scans Management
  scans: {
    list: async (targetId?: string, limit: number = 50, offset: number = 0) => {
      const params = new URLSearchParams();
      if (targetId) params.append('targetId', targetId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const endpoint = `/discovery/scans${params.toString() ? `?${params.toString()}` : ''}`;
      // Use non-cached request for scans to get real-time data
      return await apiRequest(endpoint, {
        method: 'GET',
      });
    },

    start: async (targetId: string, scanSettings?: {
      includeSystemAccounts?: boolean;
      timeout?: number;
      maxAccounts?: number;
    }) => {
      clearApiCache('/discovery/scans');
      return await apiRequest(`/discovery/targets/${targetId}/scan`, {
        method: 'POST',
        body: JSON.stringify({ scanSettings }),
      });
    },

    get: async (scanId: string) => {
      // Use non-cached request for individual scan details to get real-time data
      return await apiRequest(`/discovery/scans/${scanId}`, {
        method: 'GET',
      });
    },

    cancel: async (scanId: string) => {
      clearApiCache('/discovery/scans');
      clearApiCache(`/discovery/scans/${scanId}`);
      return await apiRequest(`/discovery/scans/${scanId}/cancel`, {
        method: 'POST',
      });
    },
  },

  // Discovered Accounts Management
  accounts: {
    list: async (scanId?: string, status: 'pending_approval' | 'active' | 'rejected' = 'pending_approval') => {
      const params = new URLSearchParams();
      if (scanId) params.append('scanId', scanId);
      params.append('status', status);
      
      const endpoint = `/discovery/accounts${params.toString() ? `?${params.toString()}` : ''}`;
      // Use non-cached request for accounts to get real-time data
      return await apiRequest(endpoint, {
        method: 'GET',
      });
    },

    approve: async (accountIds: string[], onboardingSettings?: {
      rotationPolicy?: string;
      monitoring?: boolean;
      autoRotate?: boolean;
    }) => {
      clearApiCache('/discovery/accounts');
      return await apiRequest('/discovery/accounts/approve', {
        method: 'POST',
        body: JSON.stringify({ accountIds, onboardingSettings }),
      });
    },

    reject: async (accountIds: string[], reason: string) => {
      clearApiCache('/discovery/accounts');
      return await apiRequest('/discovery/accounts/reject', {
        method: 'POST',
        body: JSON.stringify({ accountIds, reason }),
      });
    },
  },

  // Discovery Statistics
  getStatistics: async (range: '1h' | '24h' | '7d' | '30d' = '30d') => {
    const params = new URLSearchParams();
    params.append('range', range);
    
    const endpoint = `/discovery/statistics?${params.toString()}`;
    // Use non-cached request for statistics to get real-time data
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },
};

// Keep-alive mechanism for deployed environments to prevent Render service sleep
let keepAliveInterval: NodeJS.Timeout | null = null;

export const startKeepAlive = () => {
  // Only run keep-alive in production (deployed environment)
  if (import.meta.env.DEV) return;
  
  if (keepAliveInterval) return; // Already running
  
  console.log('Starting keep-alive mechanism for deployed environment');
  
  // Ping health endpoint every 10 minutes to keep Render service awake
  keepAliveInterval = setInterval(async () => {
    try {
      console.log('Keep-alive ping...');
      await fetch('/api/v1/health', { 
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
    } catch (error) {
      console.warn('Keep-alive ping failed:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('Stopped keep-alive mechanism');
  }
};

// Enhanced error handling for deployed environments
export const handleDeployedEnvironmentError = async (error: any, endpoint: string, retryFn: () => Promise<any>) => {
  console.warn(`Deployed environment error for ${endpoint}:`, error);
  
  // If it's a timeout or service unavailable error, try to wake up the service
  if (error.message?.includes('timeout') || 
      error.message?.includes('503') || 
      error.message?.includes('502') ||
      error.message?.includes('ECONNRESET')) {
    
    console.log('Attempting to wake up backend service...');
    
    try {
      // Try a simple health check first to wake up the service
      await fetch('/api/v1/health', { 
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      // Wait a bit for the service to fully wake up
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Retry the original request
      console.log('Retrying original request after wake-up...');
      return await retryFn();
      
    } catch (wakeUpError) {
      console.error('Failed to wake up service:', wakeUpError);
      throw error; // Throw the original error
    }
  }
  
  throw error; // Re-throw if not a wake-up scenario
};