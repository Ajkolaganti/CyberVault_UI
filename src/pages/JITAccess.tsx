import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { getAuthHeaders, useAuthStore } from '../store/authStore';
import {
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Timer,
  User
} from 'lucide-react';

interface AccessRequest {
  id: string;
  requester: string;
  resource: string;
  reason: string;
  requestedDuration: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'active';
  requestTime: string;
  approver?: string;
  expiresAt?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const JITAccess: React.FC = () => {
  const { user, token } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'requests' | 'active' | 'history'>('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to convert duration string to minutes
  const convertDurationToMinutes = (duration: string): number => {
    const durationLower = duration.toLowerCase();
    if (durationLower.includes('30 minutes')) return 30;
    if (durationLower.includes('1 hour')) return 60;
    if (durationLower.includes('2 hours')) return 120;
    if (durationLower.includes('4 hours')) return 240;
    if (durationLower.includes('8 hours')) return 480;
    if (durationLower.includes('24 hours')) return 1440;
    
    // Default fallback
    return 60;
  };

  // Transform backend data to frontend format
  const transformBackendData = (backendItem: any): AccessRequest => {
    console.log('Transforming backend item:', backendItem);
    
    // Format timestamps for display
    const formatTimestamp = (timestamp: string) => {
      try {
        return new Date(timestamp).toLocaleString();
      } catch {
        return timestamp;
      }
    };

    // Calculate time remaining for expires_at
    const formatExpiresAt = (expiresAt: string) => {
      if (!expiresAt) return undefined;
      try {
        const expiryTime = new Date(expiresAt);
        const now = new Date();
        const diffMs = expiryTime.getTime() - now.getTime();
        
        if (diffMs <= 0) return 'Expired';
        
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
          return `${hours}h ${minutes % 60}m`;
        } else {
          return `${minutes}m`;
        }
      } catch {
        return expiresAt;
      }
    };

    const transformed = {
      id: backendItem.id,
      requester: backendItem.username || backendItem.user_email || backendItem.requester || (backendItem.user_id ? `User ID: ${backendItem.user_id}` : 'Current User'),
      resource: backendItem.resource || backendItem.system || 'Unknown Resource',
      reason: backendItem.business_justification || backendItem.reason || backendItem.justification || backendItem.description || 'No reason provided',
      requestedDuration: backendItem.requested_duration || backendItem.requestedDuration || backendItem.duration || '1 hour',
      status: backendItem.active === true ? 'active' : 
              backendItem.status || 
              (backendItem.approved === true ? 'approved' : 
               backendItem.denied === true ? 'denied' : 
               backendItem.active === false ? 'expired' : 'pending'),
      requestTime: formatTimestamp(backendItem.created_at || backendItem.requestTime || new Date().toISOString()),
      approver: backendItem.approver || backendItem.approved_by,
      expiresAt: formatExpiresAt(backendItem.expires_at || backendItem.expiresAt),
      riskLevel: backendItem.risk_level || backendItem.riskLevel || 'medium'
    };
    
    console.log('Transformed to:', transformed);
    return transformed;
  };

  // API Functions
  const fetchRequests = async () => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    
    // Check if user is authenticated
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      console.log('No auth token found, user not logged in');
      setError('Please log in to view JIT access requests');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      console.log('Making JIT request with headers:', authHeaders);
      const res = await fetch('/api/v1/jit', {
        headers: authHeaders,
      });
      
      console.log('JIT fetch response status:', res.status, res.statusText);
      
      if (res.ok) {
        const data = await res.json();
        console.log('JIT fetch data received:', data);
        
        // Handle different possible response structures
        const rawRequestsList = data.requests || data.items || data || [];
        console.log('Raw requests list:', rawRequestsList);
        
        // Transform backend data to frontend format
        const transformedRequests = Array.isArray(rawRequestsList) 
          ? rawRequestsList.map((item, index) => {
              console.log(`Transforming item ${index}:`, item);
              const transformed = transformBackendData(item);
              console.log(`Transformed item ${index}:`, transformed);
              return transformed;
            })
          : [];
        
        console.log('Final transformed requests:', transformedRequests);
        setRequests(transformedRequests);
      } else {
        // Handle different error statuses
        console.log('JIT endpoint returned error status:', res.status);
        if (res.status === 401) {
          setError('Authentication expired. Please log in again.');
          console.log('Authentication failed, removing token');
          localStorage.removeItem('cybervault_token');
        } else if (res.status === 404) {
          console.log('JIT endpoint not found, using empty array');
          setRequests([]);
        } else {
          // For other errors, try to parse error message
          const errorData = await res.text();
          console.log('Error response:', errorData);
          setError(`Server error: ${res.status}`);
          setRequests([]);
        }
      }
    } catch (err: any) {
      console.log('JIT endpoint error:', err);
      // If there's a network error or endpoint doesn't exist, start with empty array
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateRequest = async (requestData: {
    resource: string;
    system?: string;
    reason: string;
    duration: string;
  }) => {
    try {
      setActionLoading('create');
      console.log('Creating JIT request with data:', requestData);
      
      const res = await fetch('/api/v1/jit', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource: requestData.resource,
          ...(requestData.system && { system: requestData.system }),
          reason: requestData.reason,
          durationMinutes: convertDurationToMinutes(requestData.duration),
        }),
      });

      console.log('Create request response status:', res.status, res.statusText);

      if (res.ok) {
        const responseData = await res.json();
        console.log('Create request response data:', responseData);
        
        setShowNewRequestModal(false);
        
        // If the response includes the created request, transform and add it to local state
        if (responseData && responseData.id) {
          const transformedRequest = transformBackendData(responseData);
          
          // Add the new request to the beginning of the list
          setRequests(prevRequests => [transformedRequest, ...prevRequests]);
          console.log('Added new request to local state:', transformedRequest);
        }
        
        // Also refresh the list to get latest data from backend
        await fetchRequests();
        console.log('Refreshed requests list after creation');
      } else {
        const errorData = await res.text();
        console.log('Create request error response:', errorData);
        throw new Error(`Failed to create request (${res.status}): ${errorData}`);
      }
    } catch (err: any) {
      console.error('Create request error:', err);
      setError(err.message || 'Failed to create request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      // Note: Backend might need an approve endpoint, using update for now
      const res = await fetch(`/api/v1/jit/${requestId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        await fetchRequests(); // Refresh the list
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      // Note: Backend might need a deny endpoint, using update for now
      const res = await fetch(`/api/v1/jit/${requestId}/deny`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        await fetchRequests(); // Refresh the list
      } else {
        throw new Error('Failed to deny request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deny request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const res = await fetch(`/api/v1/jit/${requestId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        await fetchRequests(); // Refresh the list
      } else {
        throw new Error('Failed to revoke access');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    switch (selectedTab) {
      case 'requests':
        return request.status === 'pending';
      case 'active':
        return request.status === 'active' || request.status === 'approved';
      case 'history':
        return request.status === 'denied' || request.status === 'expired';
      default:
        return true;
    }
  });

  const getStatusIcon = (status: AccessRequest['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Timer className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Tab counts
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const activeCount = requests.filter(r => r.status === 'active' || r.status === 'approved').length;
  const historyCount = requests.filter(r => r.status === 'denied' || r.status === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Just-in-Time Access</h1>
          <p className="mt-1 text-sm text-gray-500">
            Request and manage temporary privileged access
            {refreshing && <span className="text-blue-500"> • Refreshing...</span>}
          </p>
        </div>
        <Button
          onClick={() => setShowNewRequestModal(true)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      {/* Optionally fetch and display stats from backend */}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'requests', label: 'Pending Requests', count: pendingCount },
            { key: 'active', label: 'Active Access', count: activeCount },
            { key: 'history', label: 'History', count: historyCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <Badge variant="default">
                {tab.count}
              </Badge>
            </button>
          ))}
        </nav>
      </div>

      {/* Requests List */}
      {loading ? (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading requests...
          </h3>
        </Card>
      ) : error ? (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            {error}
          </h3>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    {getStatusIcon(request.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {request.resource}
                      </h3>
                      <Badge variant={
                        request.riskLevel === 'high' ? 'danger' :
                        request.riskLevel === 'medium' ? 'warning' : 'success'
                      }>
                        {request.riskLevel} risk
                      </Badge>
                      <Badge variant={
                        request.status === 'pending' ? 'warning' :
                        request.status === 'active' || request.status === 'approved' ? 'success' :
                        request.status === 'denied' ? 'danger' : 'default'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <User className="h-4 w-4 mr-1" />
                      <span>{request.requester}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{request.requestTime}</span>
                      {request.expiresAt && (
                        <>
                          <span className="mx-2">•</span>
                          <Timer className="h-4 w-4 mr-1" />
                          <span>Expires in {request.expiresAt}</span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{request.reason}</p>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Duration: {request.requestedDuration}</span>
                      {request.approver && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Approved by: {request.approver}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(request.id)}
                        size="sm"
                        variant="secondary"
                        loading={actionLoading === request.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleDeny(request.id)}
                        size="sm"
                        variant="danger"
                        loading={actionLoading === request.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </>
                  )}
                  {request.status === 'active' && (
                    <Button
                      onClick={() => handleRevoke(request.id)}
                      size="sm"
                      variant="danger"
                      loading={actionLoading === request.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && filteredRequests.length === 0 && (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {selectedTab} requests
          </h3>
          <p className="text-gray-500">
            {selectedTab === 'requests' ? 'All requests have been processed' : 'No items to display'}
          </p>
        </Card>
      )}

      {/* New Request Modal */}
      <Modal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        title="Request Just-in-Time Access"
      >
        <NewRequestForm
          onSubmit={handleCreateRequest}
          onCancel={() => setShowNewRequestModal(false)}
          loading={actionLoading === 'create'}
        />
      </Modal>
    </div>
  );
};

interface NewRequestFormProps {
  onSubmit: (data: { resource: string; system?: string; reason: string; duration: string }) => void;
  onCancel: () => void;
  loading: boolean;
}

const NewRequestForm: React.FC<NewRequestFormProps> = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    resource: '',
    system: '',
    reason: '',
    duration: '1 hour'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const durationOptions = [
    '30 minutes',
    '1 hour',
    '2 hours',
    '4 hours',
    '8 hours',
    '24 hours'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="resource" className="block text-sm font-medium text-gray-700 mb-1">
          Resource/System
        </label>
        <Input
          id="resource"
          type="text"
          value={formData.resource}
          onChange={(e) => setFormData(prev => ({ ...prev, resource: e.target.value }))}
          placeholder="e.g., Database Server, AWS Console"
          required
        />
      </div>

      <div>
        <label htmlFor="system" className="block text-sm font-medium text-gray-700 mb-1">
          System Details (Optional)
        </label>
        <Input
          id="system"
          type="text"
          value={formData.system}
          onChange={(e) => setFormData(prev => ({ ...prev, system: e.target.value }))}
          placeholder="e.g., Production MySQL, EC2 Instance"
        />
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Business Justification
        </label>
        <textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Explain why you need this access..."
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          Requested Duration
        </label>
        <select
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {durationOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          Submit Request
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};