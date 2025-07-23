import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusBadge } from '../ui/StatusBadge';
import { AuditLogList } from '../ui/AuditLogList';
import { ConfirmModal } from '../ui/ConfirmModal';
import { 
  getCPMStatus, 
  verifyCredential, 
  getCredentialHistory,
  getCredentialsNeedingAttention,
  getHealthStatus,
  getReadinessStatus,
  getLivenessStatus 
} from '../../utils/api';
import toast from 'react-hot-toast';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const CPMTestComponent: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testCredentialId, setTestCredentialId] = useState('test-credential-123');
  const [showModal, setShowModal] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      toast.success(`✅ ${testName} test passed`);
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
      toast.error(`❌ ${testName} test failed`);
    } finally {
      setLoading(null);
    }
  };

  const testCPMStatus = () => runTest('CPM Status', getCPMStatus);
  
  const testVerifyCredential = () => runTest('Verify Credential', () => 
    verifyCredential(testCredentialId)
  );
  
  const testCredentialHistory = () => runTest('Credential History', () => 
    getCredentialHistory(testCredentialId)
  );
  
  const testCredentialsAttention = () => runTest('Credentials Needing Attention', 
    getCredentialsNeedingAttention
  );
  
  const testHealthCheck = () => runTest('Health Check', getHealthStatus);
  
  const testReadinessCheck = () => runTest('Readiness Check', getReadinessStatus);
  
  const testLivenessCheck = () => runTest('Liveness Check', getLivenessStatus);

  const runAllTests = async () => {
    const tests = [
      testHealthCheck,
      testReadinessCheck, 
      testLivenessCheck,
      testCPMStatus,
      testCredentialsAttention,
      testVerifyCredential,
      testCredentialHistory
    ];

    for (const test of tests) {
      await test();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const mockAuditLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      action: 'VERIFICATION_SUCCESS',
      result: 'success' as const,
      summary: 'Credential verified successfully',
      user: { id: 'system', name: 'System' }
    },
    {
      id: '2', 
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'VERIFICATION_FAILED',
      result: 'failure' as const,
      summary: 'Authentication failed - invalid password',
      user: { id: 'system', name: 'System' }
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">CPM Integration Testing</h2>
        <Button 
          onClick={runAllTests}
          disabled={loading !== null}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Testing...' : 'Run All Tests'}
        </Button>
      </div>

      {/* Test Credential ID Input */}
      <Card className="p-4">
        <label className="block text-sm font-medium mb-2">
          Test Credential ID:
        </label>
        <input
          type="text"
          value={testCredentialId}
          onChange={(e) => setTestCredentialId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter credential ID to test"
        />
      </Card>

      {/* Individual API Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Health Endpoints */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Health Endpoints</h3>
          <div className="space-y-2">
            <Button 
              onClick={testHealthCheck}
              disabled={loading === 'Health Check'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'Health Check' ? 'Testing...' : 'Test Health'}
            </Button>
            <Button 
              onClick={testReadinessCheck}
              disabled={loading === 'Readiness Check'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'Readiness Check' ? 'Testing...' : 'Test Readiness'}
            </Button>
            <Button 
              onClick={testLivenessCheck}
              disabled={loading === 'Liveness Check'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'Liveness Check' ? 'Testing...' : 'Test Liveness'}
            </Button>
          </div>
        </Card>

        {/* CPM Core Functions */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">CPM Core</h3>
          <div className="space-y-2">
            <Button 
              onClick={testCPMStatus}
              disabled={loading === 'CPM Status'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'CPM Status' ? 'Testing...' : 'Test CPM Status'}
            </Button>
            <Button 
              onClick={testCredentialsAttention}
              disabled={loading === 'Credentials Needing Attention'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'Credentials Needing Attention' ? 'Testing...' : 'Test Attention List'}
            </Button>
          </div>
        </Card>

        {/* Credential Operations */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Credential Operations</h3>
          <div className="space-y-2">
            <Button 
              onClick={testVerifyCredential}
              disabled={loading === 'Verify Credential'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'Verify Credential' ? 'Testing...' : 'Test Verify'}
            </Button>
            <Button 
              onClick={testCredentialHistory}
              disabled={loading === 'Credential History'}
              size="sm" 
              variant="secondary"
              className="w-full"
            >
              {loading === 'Credential History' ? 'Testing...' : 'Test History'}
            </Button>
          </div>
        </Card>
      </div>

      {/* UI Component Tests */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">UI Component Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Status Badge Tests */}
          <div>
            <h4 className="text-sm font-medium mb-2">Status Badges:</h4>
            <div className="space-y-2">
              <StatusBadge status="verified" />
              <StatusBadge status="failed" />
              <StatusBadge status="pending" />
              <StatusBadge status="expired" />
            </div>
          </div>

          {/* Modal Tests */}
          <div>
            <h4 className="text-sm font-medium mb-2">Modals:</h4>
            <div className="space-y-2">
              <Button 
                size="sm" 
                onClick={() => setShowModal(true)}
              >
                Test Confirm Modal
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowAuditLogs(true)}
              >
                Test Audit Logs
              </Button>
            </div>
          </div>

          {/* Navigation Tests */}
          <div>
            <h4 className="text-sm font-medium mb-2">Navigation:</h4>
            <div className="space-y-2">
              <Button 
                size="sm" 
                onClick={() => window.location.href = '/credential-vault'}
              >
                Go to Vault
              </Button>
              <Button 
                size="sm" 
                onClick={() => window.location.href = '/cpm-dashboard'}
              >
                Go to CPM Dashboard
              </Button>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h4 className="text-sm font-medium mb-2">Results:</h4>
            <div className="space-y-1">
              {Object.entries(results).map(([test, result]: [string, any]) => (
                <div key={test} className="flex items-center space-x-2">
                  <Badge variant={result.success ? 'success' : 'danger'}>
                    {result.success ? '✅' : '❌'}
                  </Badge>
                  <span className="text-xs">{test}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Test Results Details */}
      {Object.keys(results).length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Detailed Results</h3>
          <div className="space-y-4">
            {Object.entries(results).map(([test, result]: [string, any]) => (
              <details key={test} className="border rounded p-3">
                <summary className="cursor-pointer font-medium">
                  {result.success ? '✅' : '❌'} {test}
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </Card>
      )}

      {/* Test Modals */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          toast.success('Confirm modal test passed!');
          setShowModal(false);
        }}
        title="Test Confirm Modal"
        message="This is a test of the ConfirmModal component."
        confirmText="Test Passed"
        cancelText="Close"
      />

      {showAuditLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Test Audit Logs</h3>
              <Button onClick={() => setShowAuditLogs(false)}>×</Button>
            </div>
            <AuditLogList logs={mockAuditLogs} />
          </Card>
        </div>
      )}
    </div>
  );
};
