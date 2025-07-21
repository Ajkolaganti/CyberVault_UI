import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getAuthHeaders } from '../store/authStore';
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
  const [selectedTab, setSelectedTab] = useState<'requests' | 'active' | 'history'>('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/jit', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch JIT access requests');
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching JIT access requests');
      } finally {
        setLoading(false);
      }
    };
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
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
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
                      <Button size="sm" variant="secondary">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="danger">
                        <XCircle className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </>
                  )}
                  {request.status === 'active' && (
                    <Button size="sm" variant="danger">
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
    </div>
  );
};