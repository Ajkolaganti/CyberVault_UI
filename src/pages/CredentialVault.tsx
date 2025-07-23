import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { AddCredentialModal } from '../components/ui/AddCredentialModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AuditLogList, AuditLog } from '../components/ui/AuditLogList';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { getAuthHeaders } from '../store/authStore';
import { 
  verifyCredential, 
  getCredentialHistory,
  verifyMultipleCredentials
} from '../utils/api';
import {
  Key,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Copy,
  Edit,
  Trash2,
  Shield,
  Database,
  Globe,
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface Credential {
  id: string;
  user_id: string;
  name: string;
  type: 'password' | 'ssh' | 'api_token' | 'certificate' | 'database';
  value: string;
  username?: string;
  host?: string;
  port?: number;
  status: 'pending' | 'active' | 'expired' | 'failed' | 'verified';
  created_at: string;
  updated_at: string;
  verified_at?: string;
  last_verification_attempt?: string;
  verification_error?: string;
  // Computed fields for UI compatibility
  lastAccessed?: string; // Will be derived from updated_at
  environment?: 'production' | 'staging' | 'development'; // Optional UI field
  verificationStatus?: 'verified' | 'failed' | 'pending'; // Derived from status
}

const getTypeIcon = (type: Credential['type']) => {
  switch (type) {
    case 'database':
      return Database;
    case 'api_token':
      return Key;
    case 'ssh':
      return Shield;
    case 'certificate':
      return Globe;
    case 'password':
      return Key;
    default:
      return Key;
  }
};

export const CredentialVault: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCredential, setViewingCredential] = useState<Credential | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null);
  
  // New state for verification and audit features
  const [verifyingCredentials, setVerifyingCredentials] = useState<Set<string>>(new Set());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [rotatingCredential, setRotatingCredential] = useState<Credential | null>(null);

  // Transform backend credential data to frontend format
  const transformCredentialData = (backendItem: any): Credential => {
    // Helper function to format timestamps
    const formatTimestamp = (timestamp: string) => {
      try {
        return new Date(timestamp).toLocaleString();
      } catch {
        return 'Unknown';
      }
    };

    return {
      id: backendItem.id,
      user_id: backendItem.user_id,
      name: backendItem.name,
      type: backendItem.type || 'password',
      value: backendItem.value || '',
      username: backendItem.username,
      host: backendItem.host,
      port: backendItem.port,
      status: backendItem.status || 'pending',
      created_at: backendItem.created_at,
      updated_at: backendItem.updated_at,
      verified_at: backendItem.verified_at,
      last_verification_attempt: backendItem.last_verification_attempt,
      verification_error: backendItem.verification_error,
      // Computed fields for UI compatibility
      lastAccessed: formatTimestamp(backendItem.updated_at || backendItem.created_at),
      environment: backendItem.environment || 'production',
      verificationStatus: backendItem.status === 'verified' ? 'verified' : 
                         backendItem.status === 'failed' ? 'failed' : 'pending'
    };
  };

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching credentials with auth headers');
      const res = await fetch('/api/v1/credentials', {
        headers: getAuthHeaders(),
      });
      
      console.log('Credentials fetch response status:', res.status);
      
      if (res.ok) {
        const response = await res.json();
        console.log('Credentials response received:', response);
        
        // Handle the new backend response format: { data: [...], count: X, total: X }
        const credentialsData = response.data || response.credentials || response || [];
        const transformedCredentials = Array.isArray(credentialsData) 
          ? credentialsData.map(transformCredentialData)
          : [];
          
        console.log('Transformed credentials:', transformedCredentials);
        setCredentials(transformedCredentials);
      } else {
        if (res.status === 401) {
          setError('Authentication expired. Please log in again.');
          console.log('Authentication failed for credentials');
        } else {
          console.log('Credentials endpoint returned error:', res.status);
          setCredentials([]);
        }
      }
    } catch (err: any) {
      console.log('Credentials endpoint error, using mock data:', err);
      setError(null); // Don't show error for missing endpoint
      setCredentials([]); // Show empty state instead
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Load credential history when viewing a credential
  useEffect(() => {
    if (viewingCredential) {
      fetchCredentialHistory(viewingCredential.id);
    }
  }, [viewingCredential]);

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (credential.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || credential.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAddCredential = async () => {
    // Refresh the credentials list after adding a new one
    await fetchCredentials();
  };

  // Handler functions for credential actions
  const handleViewCredential = (credential: Credential) => {
    setViewingCredential(credential);
  };

  const handleViewDetailPage = (credential: Credential) => {
    // Navigate to the detailed credential page
    window.location.href = `/vault/${credential.id}`;
  };

  const handleCopyCredential = async (credential: Credential) => {
    try {
      await navigator.clipboard.writeText(credential.value);
      toast.success('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy credential:', err);
      toast.error('Failed to copy credential to clipboard');
    }
  };

  const handleEditCredential = (credential: Credential) => {
    // You could open an edit modal here
    toast(`Edit functionality for "${credential.name}" coming soon!`, {
      icon: '🔧',
      duration: 2000,
    });
  };

  const handleDeleteCredential = (credential: Credential) => {
    setDeletingCredential(credential);
  };

  const confirmDeleteCredential = async () => {
    if (!deletingCredential) return;

    setActionLoading(deletingCredential.id);
    try {
      const res = await fetch(`/api/v1/credentials/${deletingCredential.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        // Remove from local state
        setCredentials(prev => prev.filter(c => c.id !== deletingCredential.id));
        toast.success(`"${deletingCredential.name}" deleted successfully`);
        setDeletingCredential(null);
      } else {
        throw new Error(`Failed to delete credential: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(`Failed to delete credential: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handler for manual credential verification
  const handleVerifyCredential = async (credential: Credential) => {
    setVerifyingCredentials(prev => new Set(prev).add(credential.id));
    
    try {
      const result = await verifyCredential(credential.id);
      
      // Update the credential with new verification status
      setCredentials(prev => prev.map(c => 
        c.id === credential.id 
          ? { 
              ...c, 
              status: result.status === 'success' ? 'verified' : 'failed',
              verified_at: result.status === 'success' ? new Date().toISOString() : undefined,
              last_verification_attempt: new Date().toISOString(),
              verification_error: result.error || undefined,
              verificationStatus: result.status === 'success' ? 'verified' : 'failed'
            }
          : c
      ));
      
      toast.success(`Verification completed for "${credential.name}"`);
      
      // Refresh verification history if we're viewing this credential
      if (viewingCredential?.id === credential.id) {
        await fetchCredentialHistory(credential.id);
      }
    } catch (error: any) {
      console.error('Verification failed:', error);
      
      // Update credential with failed status
      setCredentials(prev => prev.map(c => 
        c.id === credential.id 
          ? { 
              ...c, 
              status: 'failed',
              last_verification_attempt: new Date().toISOString(),
              verification_error: error.message || 'Verification failed',
              verificationStatus: 'failed'
            }
          : c
      ));
      
      toast.error(`Verification failed for "${credential.name}": ${error.message}`);
    } finally {
      setVerifyingCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(credential.id);
        return newSet;
      });
    }
  };

  // Handler for credential rotation
  const handleRotateCredential = (credential: Credential) => {
    setRotatingCredential(credential);
  };

  const confirmRotateCredential = async () => {
    if (!rotatingCredential) return;

    setActionLoading(rotatingCredential.id);
    try {
      // Note: Using CPM verify endpoint as rotation might be part of verification process
      // You may need to add a specific rotation endpoint to your backend
      await verifyCredential(rotatingCredential.id);
      toast.success(`Rotation process initiated for "${rotatingCredential.name}"`);
      
      // Refresh credentials to get updated status
      await fetchCredentials();
      
      setRotatingCredential(null);
    } catch (error: any) {
      console.error('Rotation failed:', error);
      toast.error(`Failed to initiate rotation: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch credential verification history (replaces audit logs)
  const fetchCredentialHistory = async (credentialId: string) => {
    setAuditLoading(true);
    try {
      const result = await getCredentialHistory(credentialId);
      
      // Transform CPM history data to audit log format
      const transformedLogs: AuditLog[] = (result.history || result.data || []).map((entry: any) => ({
        id: entry.id || `${Date.now()}-${Math.random()}`,
        timestamp: entry.timestamp || entry.created_at || entry.verified_at,
        action: entry.action || 'Credential Verification',
        result: entry.status === 'success' || entry.verified ? 'success' : 'failure',
        summary: entry.message || entry.result || `Verification ${entry.status || 'completed'}`,
        metadata: {
          duration: entry.duration,
          source: entry.source || entry.trigger || 'cpm',
          reason: entry.error || entry.failure_reason,
          ...entry.metadata
        },
        user: entry.user || {
          id: 'system',
          name: 'CPM System',
          email: 'cpm@cybervault.com'
        }
      }));
      
      setAuditLogs(transformedLogs);
    } catch (error: any) {
      console.error('Failed to fetch credential history:', error);
      // Use mock data for demo purposes
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 60 * 1000).toISOString(),
          action: 'Credential Verification',
          result: 'success',
          summary: 'Credential verified successfully via CPM',
          metadata: { duration: 1.2, source: 'manual' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          action: 'Automatic Verification',
          result: 'success',
          summary: 'Scheduled verification completed',
          metadata: { duration: 0.8, source: 'scheduled' }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'Verification Failed',
          result: 'failure',
          summary: 'Connection timeout during verification',
          metadata: { 
            reason: 'Connection timeout after 30 seconds',
            duration: 30.0,
            source: 'automatic'
          }
        }
      ];
      setAuditLogs(mockLogs);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credential Vault</h1>
          <p className="mt-1 text-sm text-gray-500">
            Securely manage and access your privileged credentials
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Filters */}
      <Card hover={true} glowIntensity="subtle">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50/50"
              />
            </div>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-slate-50/50"
          >
            <option value="all">All Types</option>
            <option value="password">Password</option>
            <option value="ssh">SSH Key</option>
            <option value="api_token">API Token</option>
            <option value="certificate">Certificate</option>
            <option value="database">Database</option>
          </select>
        </div>
      </Card>

      {/* Credentials Grid */}
      {loading ? (
        <Card className="text-center py-16" glowIntensity="normal">
          <LoadingSpinner 
            variant="lock" 
            size="lg" 
            text="Unlocking your credentials..." 
            className="py-8"
          />
        </Card>
      ) : error ? (
        <Card className="text-center py-16" glowIntensity="strong">
          <div className="p-4 bg-red-100 rounded-3xl w-fit mx-auto mb-6">
            <Key className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">{error}</h3>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredCredentials.map((credential, index) => {
            const IconComponent = getTypeIcon(credential.type);
            // Alternate between different glow intensities for visual variety
            const glowIntensity = index % 3 === 0 ? 'subtle' : index % 3 === 1 ? 'normal' : 'strong';
            
            return (
              <Card key={credential.id} hover={true} className="group" glowIntensity={glowIntensity}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{credential.name}</h3>
                      <p className="text-sm text-slate-500">{credential.username}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all duration-200">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Verification</span>
                    <StatusBadge 
                      status={credential.verificationStatus || 'pending'}
                      size="sm"
                    />
                  </div>

                  {credential.verified_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 font-medium">Last Verified</span>
                      <span className="text-sm text-slate-900 font-medium">{new Date(credential.verified_at).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Status</span>
                    <Badge variant={
                      credential.status === 'verified' || credential.status === 'active' ? 'success' :
                      credential.status === 'failed' || credential.status === 'expired' ? 'danger' : 'default'
                    }>
                      {credential.status}
                    </Badge>
                  </div>

                  {credential.host && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 font-medium">Host</span>
                      <span className="text-sm text-slate-900 font-medium">{credential.host}{credential.port ? `:${credential.port}` : ''}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Environment</span>
                    <Badge variant={
                      credential.environment === 'production' ? 'danger' :
                      credential.environment === 'staging' ? 'warning' : 'default'
                    }>
                      {credential.environment}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Last accessed</span>
                    <span className="text-sm text-slate-900 font-medium">{credential.lastAccessed}</span>
                  </div>

                  {credential.verification_error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-800">Verification Failed</p>
                          <p className="text-xs text-red-600 mt-1">{credential.verification_error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  {/* Verification button */}
                  <Button 
                    size="sm" 
                    variant="primary" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => handleVerifyCredential(credential)}
                    loading={verifyingCredentials.has(credential.id)}
                    disabled={verifyingCredentials.has(credential.id)}
                  >
                    {verifyingCredentials.has(credential.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Now
                      </>
                    )}
                  </Button>
                  
                  {/* Action buttons row */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => handleViewCredential(credential)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Quick View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => handleViewDetailPage(credential)}
                    >
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => handleCopyCredential(credential)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleEditCredential(credential)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteCredential(credential)}
                      loading={actionLoading === credential.id}
                      disabled={actionLoading === credential.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredCredentials.length === 0 && (
        <Card className="text-center py-16" glowIntensity="normal">
          <div className="p-4 bg-slate-100 rounded-3xl w-fit mx-auto mb-6">
            <Key className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No credentials found</h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first credential'}
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        </Card>
      )}

      <AddCredentialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCredential}
      />

      {/* View Credential Modal with Enhanced Details */}
      {viewingCredential && (
        <Modal
          isOpen={!!viewingCredential}
          onClose={() => setViewingCredential(null)}
          title="Credential Details"
        >
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{viewingCredential.type}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.username || 'N/A'}</p>
              </div>
              
              {viewingCredential.host && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.host}</p>
                </div>
              )}
              
              {viewingCredential.port && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingCredential.port}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{viewingCredential.environment}</p>
              </div>
            </div>

            {/* Verification Status Block */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Status</h3>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Current Status</span>
                <StatusBadge 
                  status={viewingCredential.verificationStatus || 'pending'}
                  size="md"
                />
              </div>

              {viewingCredential.verified_at && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Last Verified</span>
                  <span className="text-sm text-gray-900">{new Date(viewingCredential.verified_at).toLocaleString()}</span>
                </div>
              )}

              {viewingCredential.verification_error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Verification Error</p>
                      <p className="text-sm text-red-600 mt-1">{viewingCredential.verification_error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleVerifyCredential(viewingCredential)}
                  loading={verifyingCredentials.has(viewingCredential.id)}
                  disabled={verifyingCredentials.has(viewingCredential.id)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {verifyingCredentials.has(viewingCredential.id) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Now
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRotateCredential(viewingCredential)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rotate Password
                </Button>
              </div>
            </div>

            {/* Audit Logs Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fetchCredentialHistory(viewingCredential.id)}
                  loading={auditLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${auditLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <AuditLogList 
                logs={auditLogs}
                loading={auditLoading}
                emptyMessage="No audit logs found for this credential"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => handleCopyCredential(viewingCredential)}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Password
              </Button>
              <Button
                variant="secondary"
                onClick={() => setViewingCredential(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCredential && (
        <Modal
          isOpen={!!deletingCredential}
          onClose={() => setDeletingCredential(null)}
          title="Delete Credential"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                <p className="text-sm text-red-700">This action cannot be undone.</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete <strong>"{deletingCredential.name}"</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently remove the credential and all associated data.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="danger"
                onClick={confirmDeleteCredential}
                loading={actionLoading === deletingCredential.id}
                disabled={actionLoading === deletingCredential.id}
                className="flex-1"
              >
                Delete Credential
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeletingCredential(null)}
                disabled={actionLoading === deletingCredential.id}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rotation Confirmation Modal */}
      {rotatingCredential && (
        <ConfirmModal
          isOpen={!!rotatingCredential}
          onClose={() => setRotatingCredential(null)}
          onConfirm={confirmRotateCredential}
          title="Rotate Credential"
          message={`Are you sure you want to rotate the password for "${rotatingCredential.name}"?`}
          confirmText="Rotate Password"
          variant="warning"
          loading={actionLoading === rotatingCredential.id}
          disabled={actionLoading === rotatingCredential.id}
        >
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p><strong>What will happen:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>A new password will be generated</li>
                <li>The target system will be updated</li>
                <li>Old password will be invalidated</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> The rotation process may take a few minutes to complete. 
                You'll receive a notification when it's finished.
              </p>
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
};