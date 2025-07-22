import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { testApiConnectivity, accountsApi } from '../../utils/api';

export const ApiTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnectivity = async () => {
    setLoading(true);
    addResult('🔄 Testing API connectivity...');
    
    try {
      const isConnected = await testApiConnectivity();
      if (isConnected) {
        addResult('✅ API connectivity test passed');
      } else {
        addResult('❌ API connectivity test failed');
      }
    } catch (error) {
      addResult(`❌ Connectivity error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  const testAccountsList = async () => {
    setLoading(true);
    addResult('🔄 Testing accounts list endpoint...');
    
    try {
      const accounts = await accountsApi.list();
      addResult(`✅ Accounts list retrieved: ${JSON.stringify(accounts).substring(0, 100)}...`);
    } catch (error) {
      addResult(`❌ Accounts list error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  const testAccountCreate = async () => {
    setLoading(true);
    addResult('🔄 Testing account creation with minimal data...');
    
    try {
      const testAccount = {
        name: `Test Account ${Date.now()}`,
        system_type: 'Windows',
        hostname: 'test.example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        account_type: 'Local',
        safe_name: 'Test-Safe'
      };

      const result = await accountsApi.create(testAccount);
      addResult(`✅ Test account created: ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
      addResult(`❌ Account creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 API Testing Dashboard</h3>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button 
          onClick={testConnectivity} 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Test Connectivity
        </Button>
        <Button 
          onClick={testAccountsList} 
          disabled={loading}
          className="bg-green-500 hover:bg-green-600"
        >
          Test Accounts List
        </Button>
        <Button 
          onClick={testAccountCreate} 
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600"
        >
          Test Account Creation
        </Button>
        <Button 
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600"
        >
          Clear Results
        </Button>
      </div>

      <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
        <h4 className="font-medium mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No tests run yet. Click a button above to start testing.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`text-sm font-mono ${
                  result.includes('✅') ? 'text-green-600' : 
                  result.includes('❌') ? 'text-red-600' : 
                  result.includes('🔄') ? 'text-blue-600' : 
                  'text-gray-600'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running test...
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Note:</strong> This component helps debug CORS and API connectivity issues.</p>
        <p>Use this before trying the full account creation modal to isolate any problems.</p>
      </div>
    </div>
  );
};
