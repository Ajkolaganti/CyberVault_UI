import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ValidationHistoryModal } from '../accounts/ValidationHistoryModal';
import { 
  PlayCircle, 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  Database,
  Globe
} from 'lucide-react';

// Mock account data for testing
const mockAccount = {
  id: 'test-account-123',
  name: 'Test Windows Server',
  system_type: 'Windows' as const,
  hostname: 'test-server.domain.com',
  port: 3389,
  username: 'administrator',
  validation_status: 'valid' as 'valid' | 'invalid' | 'pending' | 'untested',
  last_validation_date: '2024-01-15T10:30:00Z',
  account_type: 'Admin' as const,
  connection_method: 'RDP' as const,
};

// Mock validation history data
const mockValidationHistory = [
  {
    id: '1',
    account_id: 'test-account-123',
    validation_status: 'success' as const,
    validation_details: {
      connection_test: true,
      credential_test: true,
      response_time: 450,
      endpoint: 'test-server.domain.com:3389'
    },
    validated_at: '2024-01-15T10:30:00Z',
    validated_by: 'admin@company.com',
    validation_type: 'manual' as const
  },
  {
    id: '2',
    account_id: 'test-account-123',
    validation_status: 'failed' as const,
    error_message: 'Connection timeout - server may be unreachable',
    validation_details: {
      connection_test: false,
      credential_test: false,
      response_time: 30000,
      endpoint: 'test-server.domain.com:3389'
    },
    validated_at: '2024-01-14T14:20:00Z',
    validated_by: 'admin@company.com',
    validation_type: 'scheduled' as const
  },
  {
    id: '3',
    account_id: 'test-account-123',
    validation_status: 'success' as const,
    validation_details: {
      connection_test: true,
      credential_test: true,
      response_time: 380,
      endpoint: 'test-server.domain.com:3389'
    },
    validated_at: '2024-01-13T09:15:00Z',
    validated_by: 'system',
    validation_type: 'triggered' as const
  }
];

const getValidationStatusIcon = (status: string) => {
  switch (status) {
    case 'valid':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'invalid':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'untested':
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
};

const getValidationStatusBadge = (status: string) => {
  switch (status) {
    case 'valid':
      return <Badge variant="success">Valid</Badge>;
    case 'invalid':
      return <Badge variant="danger">Invalid</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'untested':
      return <Badge variant="default">Untested</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getSystemTypeIcon = (type: string) => {
  switch (type) {
    case 'Windows':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'Database':
      return <Database className="w-4 h-4 text-orange-500" />;
    case 'AWS':
      return <Globe className="w-4 h-4 text-yellow-500" />;
    default:
      return <Shield className="w-4 h-4 text-gray-500" />;
  }
};

export const AccountValidationTestComponent: React.FC = () => {
  const [validationLoading, setValidationLoading] = useState(false);
  const [showValidationHistory, setShowValidationHistory] = useState(false);
  const [account, setAccount] = useState(mockAccount);
  const [lastValidationResult, setLastValidationResult] = useState<string | null>(null);

  const handleValidateAccount = async () => {
    try {
      setValidationLoading(true);
      setLastValidationResult(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation result - randomly succeed or fail for demo
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setAccount(prev => ({
          ...prev,
          validation_status: 'valid',
          last_validation_date: new Date().toISOString()
        }));
        setLastValidationResult('✅ Validation successful! Account credentials are working.');
      } else {
        setAccount(prev => ({
          ...prev,
          validation_status: 'invalid',
          last_validation_date: new Date().toISOString()
        }));
        setLastValidationResult('❌ Validation failed! Please check account credentials.');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setLastValidationResult('❌ Validation error occurred.');
    } finally {
      setValidationLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowValidationHistory(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Validation Test</h2>
        <p className="text-gray-600">
          Test the new account validation features including validation status display, 
          manual validation, and validation history.
        </p>
      </div>

      {/* Test Account Card */}
      <Card className="p-6" glowIntensity="normal">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                {getSystemTypeIcon(account.system_type)}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{account.name}</h3>
                <p className="text-sm text-gray-500">{account.system_type}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm font-medium text-gray-900">{account.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hostname</p>
                <p className="text-sm font-medium text-gray-900">
                  {account.hostname}:{account.port}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Connection Method</p>
                <p className="text-sm font-medium text-gray-900">{account.connection_method}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Validation Status</p>
                <div className="mt-1 flex items-center gap-2">
                  {getValidationStatusIcon(account.validation_status)}
                  {getValidationStatusBadge(account.validation_status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-500">Account Type</p>
                <p className="text-sm font-medium text-gray-900">{account.account_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Validated</p>
                <p className="text-sm font-medium text-gray-900">
                  {account.last_validation_date 
                    ? new Date(account.last_validation_date).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>

            {lastValidationResult && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{lastValidationResult}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleValidateAccount}
              disabled={validationLoading}
              className="flex items-center gap-1"
            >
              {validationLoading ? (
                <LoadingSpinner variant="spinner" size="sm" />
              ) : (
                <PlayCircle className="w-3 h-3" />
              )}
              {validationLoading ? 'Validating...' : 'Validate'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleShowHistory}
              className="flex items-center gap-1"
            >
              <History className="w-3 h-3" />
              History
            </Button>
          </div>
        </div>
      </Card>

      {/* Feature Overview */}
      <Card className="p-6" glowIntensity="subtle">
        <h3 className="font-medium text-gray-900 mb-3">New Validation Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🎯 Smart Type Detection</h4>
            <p className="text-gray-600">
              Automatically maps account types to the correct verification method 
              (SSH, RDP, Database, API, etc.)
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔄 Reuses CPM Infrastructure</h4>
            <p className="text-gray-600">
              Uses the same verifiers that work with credentials for consistent results
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📊 Complete Audit Trail</h4>
            <p className="text-gray-600">
              Tracks all validation attempts with timestamps, results, and detailed logs
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔒 Security First</h4>
            <p className="text-gray-600">
              Respects user permissions and encrypts sensitive data during validation
            </p>
          </div>
        </div>
      </Card>

      {/* Mock Validation History Modal */}
      <ValidationHistoryModal
        isOpen={showValidationHistory}
        onClose={() => setShowValidationHistory(false)}
        accountId={account.id}
        accountName={account.name}
        mockData={mockValidationHistory}
      />
    </div>
  );
};
