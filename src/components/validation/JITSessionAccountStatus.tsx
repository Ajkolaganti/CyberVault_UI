import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { jitValidationApi } from '../../utils/api';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  PlayCircle,
  Server,
  Eye,
  AlertCircle
} from 'lucide-react';

interface JITAccountStatus {
  account_id: string;
  account_name: string;
  hostname: string;
  username: string;
  system_type: string;
  validation_status: 'verified' | 'failed' | 'pending' | 'unknown';
  last_validated_at?: string;
  verification_method: string;
  error_message?: string;
  is_critical: boolean;
  response_time_ms?: number;
}

interface JITSessionValidation {
  session_id: string;
  session_name: string;
  requester: string;
  status: 'active' | 'pending' | 'expired';
  expires_at: string;
  accounts: JITAccountStatus[];
  overall_health: 'healthy' | 'degraded' | 'critical';
  last_validation_check: string;
}

interface JITAccountStatusProps {
  sessionId?: string;
  embedded?: boolean;
  onValidationRequired?: (accountIds: string[]) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'unknown':
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'verified':
      return <Badge variant="success">Verified</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'unknown':
      return <Badge variant="default">Unknown</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getHealthBadge = (health: string) => {
  switch (health) {
    case 'healthy':
      return <Badge variant="success">Healthy</Badge>;
    case 'degraded':
      return <Badge variant="warning">Degraded</Badge>;
    case 'critical':
      return <Badge variant="danger">Critical</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

export const JITSessionAccountStatus: React.FC<JITAccountStatusProps> = ({
  sessionId,
  onValidationRequired
}) => {
  const [sessionData, setSessionData] = useState<JITSessionValidation | null>(null);
  const [allSessions, setAllSessions] = useState<JITSessionValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [validatingAccount, setValidatingAccount] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<JITAccountStatus | null>(null);

  const fetchSessionValidation = async () => {
    try {
      setRefreshing(true);
      
      if (sessionId) {
        // Fetch specific session validation data
        const data = await jitValidationApi.getSessionAccountStatus(sessionId);
        setSessionData(data);
      } else {
        // Fetch all sessions with validation context
        const data = await jitValidationApi.getSessionsWithValidation({
          status: 'active',
          has_validation_issues: false
        });
        setAllSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching JIT validation data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleValidateAccount = async (accountId: string) => {
    try {
      setValidatingAccount(accountId);
      
      // Trigger validation through the callback or direct API call
      if (onValidationRequired) {
        onValidationRequired([accountId]);
      } else {
        // Direct validation call would go here
        console.log('Validating account:', accountId);
      }
      
      // Refresh data after validation
      setTimeout(() => {
        fetchSessionValidation();
        setValidatingAccount(null);
      }, 2000);
    } catch (error) {
      console.error('Error validating account:', error);
      setValidatingAccount(null);
    }
  };

  const handleShowDetails = (account: JITAccountStatus) => {
    setSelectedAccount(account);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    fetchSessionValidation();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner variant="lock" size="lg" text="Loading validation status..." />
      </div>
    );
  }

  // Single Session View
  if (sessionId && sessionData) {
    return (
      <div className="space-y-4">
        {/* Session Header */}
        <Card className="p-4" glowIntensity="subtle">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{sessionData.session_name}</h3>
              <p className="text-sm text-gray-500">
                Requester: {sessionData.requester} • 
                Expires: {new Date(sessionData.expires_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getHealthBadge(sessionData.overall_health)}
              <Button
                onClick={fetchSessionValidation}
                variant="secondary"
                size="sm"
                disabled={refreshing}
                className="flex items-center"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Status Cards */}
        <div className="space-y-3">
          {sessionData.accounts.map((account) => (
            <Card key={account.account_id} className="p-4" glowIntensity={account.is_critical ? "strong" : "subtle"}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Server className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{account.account_name}</p>
                      {getStatusIcon(account.validation_status)}
                      {getStatusBadge(account.validation_status)}
                      {account.is_critical && (
                        <Badge variant="danger">Critical</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <span>{account.hostname}</span>
                      <span>{account.username}</span>
                      <span>{account.system_type}</span>
                      <span>{account.verification_method}</span>
                    </div>
                    {account.last_validated_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last validated: {new Date(account.last_validated_at).toLocaleString()}
                        {account.response_time_ms && (
                          <span> • {(account.response_time_ms / 1000).toFixed(1)}s</span>
                        )}
                      </p>
                    )}
                    {account.error_message && (
                      <p className="text-sm text-red-600 mt-1">{account.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleShowDetails(account)}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Details
                  </Button>
                  {account.validation_status !== 'verified' && (
                    <Button
                      onClick={() => handleValidateAccount(account.account_id)}
                      variant="secondary"
                      size="sm"
                      disabled={validatingAccount === account.account_id}
                      className="flex items-center gap-1"
                    >
                      {validatingAccount === account.account_id ? (
                        <LoadingSpinner variant="spinner" size="sm" />
                      ) : (
                        <PlayCircle className="w-3 h-3" />
                      )}
                      Validate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Account Details Modal */}
        {selectedAccount && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title={`Account Details - ${selectedAccount.account_name}`}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(selectedAccount.validation_status)}
                    {getStatusBadge(selectedAccount.validation_status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">System Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.system_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Hostname</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.hostname}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Verification Method</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAccount.verification_method}</p>
                </div>
                {selectedAccount.response_time_ms && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Response Time</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {(selectedAccount.response_time_ms / 1000).toFixed(1)}s
                    </p>
                  </div>
                )}
              </div>
              
              {selectedAccount.last_validated_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Validation</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedAccount.last_validated_at).toLocaleString()}
                  </p>
                </div>
              )}
              
              {selectedAccount.error_message && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Error Details</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{selectedAccount.error_message}</p>
                  </div>
                </div>
              )}
              
              {selectedAccount.is_critical && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-medium text-red-800">Critical Account</p>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    This account is critical for the JIT session. Validation failures may impact session functionality.
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // All Sessions Overview
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">JIT Sessions - Account Status</h2>
        <Button
          onClick={fetchSessionValidation}
          variant="secondary"
          disabled={refreshing}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {allSessions.map((session) => (
          <Card key={session.session_id} className="p-4" glowIntensity="normal">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{session.session_name}</h3>
                <p className="text-sm text-gray-500">{session.requester}</p>
              </div>
              {getHealthBadge(session.overall_health)}
            </div>
            
            <div className="space-y-2">
              {session.accounts.slice(0, 3).map((account) => (
                <div key={account.account_id} className="flex items-center gap-2 text-sm">
                  {getStatusIcon(account.validation_status)}
                  <span className="flex-1 truncate">{account.account_name}</span>
                  {account.is_critical && (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              ))}
              {session.accounts.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{session.accounts.length - 3} more accounts
                </p>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Expires: {new Date(session.expires_at).toLocaleDateString()}</span>
                <span>
                  {session.accounts.filter(a => a.validation_status === 'verified').length}/
                  {session.accounts.length} verified
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {allSessions.length === 0 && (
        <Card className="p-8 text-center" glowIntensity="normal">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active JIT Sessions</h3>
          <p className="text-gray-500">
            JIT sessions with account validation will appear here when active.
          </p>
        </Card>
      )}
    </div>
  );
};
