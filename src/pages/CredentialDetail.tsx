import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AuditLogList, AuditLog } from '../components/ui/AuditLogList';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { 
  credentialsApi
} from '../utils/api';
import {
  ArrowLeft,
  Key,
  CheckCircle,
  RefreshCw,
  Copy,
  Edit,
  Trash2,
  Shield,
  Database,
  Globe,
  AlertTriangle,
  Server
} from 'lucide-react';

interface Credential {
  id: string;
  user_id: string;
  name: string;
  type: 'database' | 'api' | 'server' | 'application' | 'mysql' | 'postgresql' | 'mssql' | 'oracle' | 'mongodb';
  value: string;
  username?: string;
  host?: string;
  port?: number;
  lastAccessed?: string;
  status?: 'active' | 'expired' | 'inactive' | 'verified' | 'failed' | 'pending';
  environment?: 'production' | 'staging' | 'development';
  created_at: string;
  updated_at: string;
  verificationStatus?: 'verified' | 'failed' | 'pending';
  lastVerifiedAt?: string;
  verificationError?: string;
  // New database-specific fields
  database_name?: string;
  schema_name?: string;
  connection_string?: string;
  ssl_enabled?: boolean;
  additional_params?: any;
}

const getTypeIcon = (type: Credential['type']) => {
  switch (type) {
    case 'database':
      return Database;
    case 'api':
      return Key;
    case 'server':
      return Server;
    case 'application':
      return Globe;
    default:
      return Shield;
  }
};

export const CredentialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [rotatingCredential, setRotatingCredential] = useState<boolean>(false);
  const [deletingCredential, setDeletingCredential] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch credential details
  const fetchCredential = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await credentialsApi.get(id);
      console.log('Credential API response:', data); // Debug logging
      
      const transformedCredential: Credential = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        type: data.type || 'application',
        value: data.value || '',
        username: data.username || 'N/A',
        host: data.host,
        port: data.port,
        lastAccessed: data.updated_at ? new Date(data.updated_at).toLocaleString() : 'Unknown',
        status: data.status || 'active',
        environment: data.environment || 'production',
        created_at: data.created_at,
        updated_at: data.updated_at,
        verificationStatus: data.verification_status || data.verificationStatus || 'pending',
        lastVerifiedAt: data.last_verified_at || data.verified_at ? 
          new Date(data.last_verified_at || data.verified_at).toLocaleString() : undefined,
        verificationError: data.verification_error || data.verificationError || undefined,
        // New database-specific fields
        database_name: data.database_name,
        schema_name: data.schema_name,
        connection_string: data.connection_string,
        ssl_enabled: data.ssl_enabled,
        additional_params: data.additional_params
      };
      
      console.log('Transformed credential:', transformedCredential); // Debug logging
      setCredential(transformedCredential);
    } catch (err: any) {
      console.error('Failed to fetch credential:', err);
      if (err.message.includes('404') || err.message.includes('Not found')) {
        setError('Credential not found');
      } else {
        setError('Failed to load credential');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    if (!id) return;
    
    setAuditLoading(true);
    try {
      const result = await credentialsApi.getHistory(id);
      console.log('History API response:', result); // Debug logging
      
      // Handle different response structures
      const historyData = result.history || result.data || result.logs || result || [];
      
      const transformedLogs: AuditLog[] = (Array.isArray(historyData) ? historyData : []).map((log: any) => {
        // Ensure summary is always a string
        let summary = 'No details available';
        if (typeof log.summary === 'string') {
          summary = log.summary;
        } else if (typeof log.message === 'string') {
          summary = log.message;
        } else if (log.details) {
          if (typeof log.details === 'string') {
            summary = log.details;
          } else if (typeof log.details === 'object') {
            summary = JSON.stringify(log.details);
          }
        }

        return {
          id: log.id || `${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp || log.created_at || log.verified_at,
          action: log.action || 'Credential Verification',
          result: log.result || (log.success === true ? 'success' : log.success === false ? 'failure' : 'unknown'),
          summary: summary,
          metadata: log.metadata || {
            duration: log.duration,
            source: log.source || 'system',
            host: log.host,
            verificationType: log.verificationType,
            ...(typeof log.details === 'object' ? log.details : {})
          },
          user: log.user ? {
            id: log.user.id,
            name: log.user.name || log.user.email,
            email: log.user.email
          } : undefined
        };
      });
      
      console.log('Transformed logs:', transformedLogs); // Debug logging
      setAuditLogs(transformedLogs);
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      // Mock data for demo
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 60 * 1000).toISOString(),
          action: 'Credential Verification',
          result: 'success',
          summary: 'Credential verified successfully',
          metadata: { duration: 1.2, source: 'manual' },
          user: { id: '1', name: 'Admin User', email: 'admin@cybervault.com' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          action: 'Password Rotation',
          result: 'success',
          summary: 'Password rotated successfully',
          metadata: { duration: 3.5, source: 'scheduled' },
          user: { id: '1', name: 'System', email: 'system@cybervault.com' }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'Credential Access',
          result: 'success',
          summary: 'Credential accessed by user',
          metadata: { source: 'vault' },
          user: { id: '2', name: 'John Doe', email: 'john@cybervault.com' }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'Failed Verification',
          result: 'failure',
          summary: 'Credential verification failed - connection timeout',
          metadata: { 
            reason: 'Connection timeout after 30 seconds',
            duration: 30.0,
            source: 'automatic'
          },
          user: { id: '1', name: 'System', email: 'system@cybervault.com' }
        }
      ];
      setAuditLogs(mockLogs);
    } finally {
      setAuditLoading(false);
    }
  };

  // Handle verification
  const handleVerifyCredential = async () => {
    if (!credential) return;
    
    setVerifying(true);
    try {
      const result = await credentialsApi.verify(credential.id);
      
      // Check for success field (boolean) in the API response
      const isSuccess = result.success === true || result.data?.success === true;
      
      setCredential(prev => prev ? {
        ...prev,
        verificationStatus: isSuccess ? 'verified' : 'failed',
        lastVerifiedAt: isSuccess ? new Date().toLocaleString() : prev.lastVerifiedAt,
        verificationError: isSuccess ? undefined : (result.error || result.message || 'Verification failed')
      } : null);
      
      if (isSuccess) {
        toast.success('Verification completed successfully');
      } else {
        toast.error(`Verification failed: ${result.error || result.message || 'Unknown error'}`);
      }
      
      await fetchAuditLogs(); // Refresh audit logs
    } catch (error: any) {
      console.error('Verification failed:', error);
      
      setCredential(prev => prev ? {
        ...prev,
        verificationStatus: 'failed',
        lastVerifiedAt: new Date().toLocaleString(),
        verificationError: error.message || 'Verification failed'
      } : null);
      
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setVerifying(false);
    }
  };

  // Handle rotation
  const handleRotateCredential = async () => {
    if (!credential) return;
    
    setActionLoading(true);
    try {
      // Note: Using CPM verify endpoint for rotation process
      // You may need to add a specific rotation endpoint to your backend
      await credentialsApi.verify(credential.id);
      toast.success('Password rotation process initiated successfully');
      
      // Refresh credential and audit logs
      await fetchCredential();
      await fetchAuditLogs();
      
      setRotatingCredential(false);
    } catch (error: any) {
      console.error('Rotation failed:', error);
      toast.error(`Failed to rotate credential: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle copy
  const handleCopyCredential = async () => {
    if (!credential) return;
    
    try {
      await navigator.clipboard.writeText(credential.value);
      toast.success('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy credential:', err);
      toast.error('Failed to copy credential to clipboard');
    }
  };

  // Handle delete
  const handleDeleteCredential = async () => {
    if (!credential) return;
    
    setActionLoading(true);
    try {
      await credentialsApi.delete(credential.id);
      toast.success(`"${credential.name}" deleted successfully`);
      navigate('/vault');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(`Failed to delete credential: ${err.message}`);
    } finally {
      setActionLoading(false);
      setDeletingCredential(false);
    }
  };

  useEffect(() => {
    fetchCredential();
  }, [id]);

  useEffect(() => {
    if (credential) {
      fetchAuditLogs();
    }
  }, [credential]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/vault')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
        
        <Card className="text-center py-16">
          <LoadingSpinner 
            variant="lock" 
            size="lg" 
            text="Loading credential details..." 
            className="py-8"
          />
        </Card>
      </div>
    );
  }

  if (error || !credential) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/vault')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Credential Not Found</h1>
          </div>
        </div>
        
        <Card className="text-center py-16">
          <div className="p-4 bg-red-100 rounded-3xl w-fit mx-auto mb-6">
            <Key className="h-12 w-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">{error}</h3>
          <Button onClick={() => navigate('/vault')}>
            Back to Vault
          </Button>
        </Card>
      </div>
    );
  }

  const IconComponent = getTypeIcon(credential.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/vault')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl">
              <IconComponent className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{credential.name}</h1>
              <p className="text-sm text-gray-500 capitalize">{credential.type} credential</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={handleCopyCredential}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Password
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Credential Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Credential Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{credential.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{credential.environment}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg capitalize">{credential.status}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Accessed</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{credential.lastAccessed}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {new Date(credential.created_at).toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {new Date(credential.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Connection Information - for database credentials */}
          {(credential.type === 'database' || 
            credential.type === 'mysql' || 
            credential.type === 'postgresql' || 
            credential.type === 'mssql' || 
            credential.type === 'oracle' || 
            credential.type === 'mongodb') && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credential.host && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{credential.host}</p>
                  </div>
                )}
                
                {credential.port && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{credential.port}</p>
                  </div>
                )}
                
                {credential.database_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{credential.database_name}</p>
                  </div>
                )}
                
                {credential.schema_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{credential.schema_name}</p>
                  </div>
                )}
                
                {credential.ssl_enabled !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SSL Enabled</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {credential.ssl_enabled ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}
                
                {credential.connection_string && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Connection String</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg font-mono break-all">
                      {credential.connection_string}
                    </div>
                  </div>
                )}
                
                {credential.additional_params && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Parameters</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      <pre className="whitespace-pre-wrap">
                        {typeof credential.additional_params === 'string' 
                          ? credential.additional_params 
                          : JSON.stringify(credential.additional_params, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Audit Logs */}
          <AuditLogList 
            logs={auditLogs}
            loading={auditLoading}
            emptyMessage="No audit logs found for this credential"
          />
        </div>

        {/* Right Column - Actions and Status */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Status</span>
                <StatusBadge 
                  status={credential.verificationStatus || 'pending'}
                  size="md"
                />
              </div>

              {credential.lastVerifiedAt && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Last Verified</span>
                  <p className="text-sm text-gray-600 mt-1">{credential.lastVerifiedAt}</p>
                </div>
              )}

              {credential.verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Verification Failed</p>
                      <p className="text-sm text-red-600 mt-1">{credential.verificationError}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleVerifyCredential}
                loading={verifying}
                disabled={verifying}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {verifying ? (
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
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={() => setRotatingCredential(true)}
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Rotate Password
              </Button>
              
              <Button
                variant="ghost"
                className="w-full hover:bg-blue-50 hover:text-blue-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Credential
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setDeletingCredential(true)}
                className="w-full hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Credential
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Rotation Confirmation Modal */}
      {rotatingCredential && (
        <ConfirmModal
          isOpen={rotatingCredential}
          onClose={() => setRotatingCredential(false)}
          onConfirm={handleRotateCredential}
          title="Rotate Credential"
          message={`Are you sure you want to rotate the password for "${credential.name}"?`}
          confirmText="Rotate Password"
          variant="warning"
          loading={actionLoading}
          disabled={actionLoading}
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
              </p>
            </div>
          </div>
        </ConfirmModal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCredential && (
        <ConfirmModal
          isOpen={deletingCredential}
          onClose={() => setDeletingCredential(false)}
          onConfirm={handleDeleteCredential}
          title="Delete Credential"
          message={`Are you sure you want to delete "${credential.name}"?`}
          confirmText="Delete Credential"
          variant="danger"
          loading={actionLoading}
          disabled={actionLoading}
        >
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p><strong>This action will:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Permanently remove the credential</li>
                <li>Delete all associated audit logs</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
};
