import { getAuthHeaders, getCurrentUserId } from '../store/authStore';

// API base configuration
const API_BASE = '/api/v1';

// Generic API request function with better error handling
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    ...options,
  };

  console.log(`Making API request to: ${url}`);
  console.log('Request options:', defaultOptions);

  try {
    const response = await fetch(url, defaultOptions);
    
    console.log(`Response status: ${response.status}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
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

// Accounts API functions
export const accountsApi = {
  create: (accountData: any) => 
    apiRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    }),
    
  list: () => 
    apiRequest('/accounts', {
      method: 'GET',
    }),
    
  get: (id: string) => 
    apiRequest(`/accounts/${id}`, {
      method: 'GET',
    }),
    
  update: (id: string, accountData: any) => 
    apiRequest(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    }),
    
  delete: (id: string) => 
    apiRequest(`/accounts/${id}`, {
      method: 'DELETE',
    }),
};

// Safes API functions
export const safesApi = {
  create: (safeData: {
    name: string;
    description?: string;
    safe_type?: 'standard' | 'shared' | 'department' | 'application';
    access_level?: 'private' | 'team' | 'department' | 'public';
    settings?: object;
  }) => {
    const currentUserId = getCurrentUserId();
    const requestBody = {
      ...safeData,
      owner_id: currentUserId
    };
    
    return apiRequest('/safes', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  },
    
  list: () => 
    apiRequest('/safes', {
      method: 'GET',
    }),
    
  get: (id: string) => 
    apiRequest(`/safes/${id}`, {
      method: 'GET',
    }),
    
  update: (id: string, safeData: {
    name?: string;
    description?: string;
    safe_type?: 'standard' | 'shared' | 'department' | 'application';
    access_level?: 'private' | 'team' | 'department' | 'public';
    status?: 'active' | 'inactive' | 'archived';
    settings?: object;
  }) => 
    apiRequest(`/safes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(safeData),
    }),
    
  delete: (id: string) => 
    apiRequest(`/safes/${id}`, {
      method: 'DELETE',
    }),
    
  getStatistics: () => 
    apiRequest('/safes/statistics', {
      method: 'GET',
    }),
    
  grantPermission: (id: string, permissionData: {
    userId: string;
    permission_level: 'read' | 'write' | 'admin' | 'owner';
  }) => 
    apiRequest(`/safes/${id}/permissions`, {
      method: 'POST',
      body: JSON.stringify(permissionData),
    }),
    
  listPermissions: (id: string) => 
    apiRequest(`/safes/${id}/permissions`, {
      method: 'GET',
    }),
    
  revokePermission: (id: string, permissionId: string) => 
    apiRequest(`/safes/${id}/permissions/${permissionId}`, {
      method: 'DELETE',
    }),
    
  listActivity: (id: string) => 
    apiRequest(`/safes/${id}/activity`, {
      method: 'GET',
    }),
    
  listAccounts: (id: string) => 
    apiRequest(`/safes/${id}/accounts`, {
      method: 'GET',
    }),
    
  moveAccounts: (moveData: {
    sourceId: string;
    targetId: string;
    accountIds: string[];
  }) => 
    apiRequest('/safes/move-accounts', {
      method: 'POST',
      body: JSON.stringify(moveData),
    }),
};

// CPM (Credential Protection Management) API functions
export const getCPMStatus = async () => {
  try {
    return await apiRequest('/cpm/status');
  } catch (error) {
    console.error('Failed to get CPM status:', error);
    throw error;
  }
};

// Trigger manual credential verification
export const verifyCredential = async (credentialId: string, force: boolean = false) => {
  try {
    const body = {
      credential_ids: [credentialId], // Send as array of UUIDs
      force: force                    // Optional boolean parameter
    };
    return await apiRequest('/cpm/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Failed to verify credential:', error);
    throw error;
  }
};

// Trigger manual verification for multiple credentials
export const verifyMultipleCredentials = async (credentialIds: string[], force: boolean = false) => {
  try {
    const body = {
      credential_ids: credentialIds, // Array of credential UUIDs
      force: force                   // Optional boolean parameter
    };
    return await apiRequest('/cpm/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Failed to verify credentials:', error);
    throw error;
  }
};

// Trigger global verification for all credentials
export const verifyAllCredentials = async (force: boolean = false) => {
  try {
    // First, get all credentials to get their IDs
    const credentialsResponse = await apiRequest('/credentials');
    const credentials = credentialsResponse.data || credentialsResponse.credentials || credentialsResponse || [];
    
    // Extract all credential IDs
    const credentialIds = credentials.map((cred: any) => cred.id).filter(Boolean);
    
    if (credentialIds.length === 0) {
      throw new Error('No credentials found to verify');
    }
    
    // Verify all credentials
    const body = {
      credential_ids: credentialIds,
      force: force
    };
    return await apiRequest('/cpm/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Failed to trigger global verification:', error);
    throw error;
  }
};

// Get verification history for a specific credential
export const getCredentialHistory = async (credentialId: string) => {
  try {
    return await apiRequest(`/cpm/credentials/${credentialId}/history`);
  } catch (error) {
    console.error('Failed to fetch credential history:', error);
    throw error;
  }
};

// Get credentials that need attention
export const getCredentialsNeedingAttention = async () => {
  try {
    return await apiRequest('/cpm/credentials/attention');
  } catch (error) {
    console.error('Failed to fetch credentials needing attention:', error);
    throw error;
  }
};

// Batch update credential status (Admin only)
export const batchUpdateCredentials = async (updates: Array<{
  credentialId: string;
  status: string;
  reason?: string;
}>) => {
  try {
    return await apiRequest('/cpm/credentials/batch-update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  } catch (error) {
    console.error('Failed to batch update credentials:', error);
    throw error;
  }
};

// Get CPM configuration (Admin only)
export const getCPMConfiguration = async () => {
  try {
    return await apiRequest('/cpm/configuration');
  } catch (error) {
    console.error('Failed to get CPM configuration:', error);
    throw error;
  }
};

// Health check endpoints
export const getHealthStatus = async () => {
  try {
    const response = await fetch('/health');
    return await response.json();
  } catch (error) {
    console.error('Failed to get health status:', error);
    throw error;
  }
};

export const getReadinessStatus = async () => {
  try {
    const response = await fetch('/ready');
    return await response.json();
  } catch (error) {
    console.error('Failed to get readiness status:', error);
    throw error;
  }
};

export const getLivenessStatus = async () => {
  try {
    const response = await fetch('/live');
    return await response.json();
  } catch (error) {
    console.error('Failed to get liveness status:', error);
    throw error;
  }
};

export const getServiceMetrics = async () => {
  try {
    const response = await fetch('/metrics');
    return await response.text(); // Metrics are usually returned as text
  } catch (error) {
    console.error('Failed to get service metrics:', error);
    throw error;
  }
};

// Test function to verify API connectivity
export const testApiConnectivity = async () => {
  try {
    console.log('Testing API connectivity...');
    
    // Test a simple endpoint first (like dashboard stats)
    const response = await fetch('/api/v1/dashboard/stats', {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    console.log(`Connectivity test - Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ API connectivity is working');
      return true;
    } else {
      console.log('❌ API connectivity test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ API connectivity test error:', error);
    return false;
  }
};

/**
 * Credential verification API functions
 * 
 * The backend expects:
 * - credential_ids: array of UUIDs (must contain valid credential IDs)
 * - force: optional boolean parameter
 * 
 * For global verification, we first fetch all credential IDs and then verify them all.
 */
