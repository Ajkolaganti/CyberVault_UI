import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AnimatedTabs } from '../components/ui/AnimatedTabs';
import { AccountCard } from '../components/accounts/AccountCardEnhanced';
import CreateAccountModal from '../components/accounts/CreateAccountModal';
import { ValidationHistoryModal } from '../components/accounts/ValidationHistoryModal';
import { getAuthHeaders } from '../store/authStore';
import { accountsApi } from '../utils/api';
import {
  Users,
  Plus,
  Search,
  Key,
  AlertTriangle,
  CheckCircle,
  Shield,
  Database,
  Globe,
  Server,
  Monitor,
  Wifi,
  RefreshCw
} from 'lucide-react';

interface Account {
  id: string;
  user_id: string;
  name: string;
  system_type: 'Windows' | 'Linux' | 'oracle' | 'mssql' | 'mysql' | 'postgresql' | 'mongodb' | 'AWS' | 'Azure' | 'Unix/AIX' | 'Network Device' | 'Security Appliance' | 'Application' | 'Website';
  hostname: string;
  port?: number;
  connection_method: 'RDP' | 'SSH' | 'SQL' | 'HTTPS' | 'HTTP' | 'Oracle' | 'MySQL' | 'PostgreSQL' | 'MongoDB' | 'Custom';
  platform_id: string;
  account_type: 'Local' | 'Domain' | 'Service' | 'Admin' | 'Database' | 'Application';
  safe_name: string;
  username: string;
  rotation_policy: string;
  rotation_status: 'no_policy' | 'current' | 'due_soon' | 'overdue';
  validation_status?: 'valid' | 'invalid' | 'pending' | 'untested';
  last_validation_date?: string;
  last_validation_result?: string;
  description?: string;
  tags?: string;
  owner_email?: string;
  business_justification?: string;
  last_rotated?: string;
  next_rotation?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface AccountStatistics {
  total: number;
  active: number;
  requiring_rotation: number;
  validation_valid?: number;
  validation_invalid?: number;
  validation_pending?: number;
  validation_untested?: number;
  last_updated: string;
}

const getSystemTypeIcon = (type: Account['system_type']) => {
  switch (type) {
    case 'Windows':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'Linux':
      return <Monitor className="w-4 h-4 text-orange-500" />;
    case 'oracle':
      return <Database className="w-4 h-4 text-red-500" />;
    case 'mssql':
      return <Database className="w-4 h-4 text-blue-600" />;
    case 'mysql':
      return <Database className="w-4 h-4 text-orange-600" />;
    case 'postgresql':
      return <Database className="w-4 h-4 text-blue-700" />;
    case 'mongodb':
      return <Database className="w-4 h-4 text-green-600" />;
    case 'AWS':
      return <Globe className="w-4 h-4 text-yellow-500" />;
    case 'Azure':
      return <Globe className="w-4 h-4 text-blue-400" />;
    case 'Unix/AIX':
      return <Server className="w-4 h-4 text-gray-600" />;
    case 'Network Device':
      return <Wifi className="w-4 h-4 text-green-500" />;
    case 'Security Appliance':
      return <Shield className="w-4 h-4 text-purple-500" />;
    case 'Application':
      return <Monitor className="w-4 h-4 text-teal-500" />;
    case 'Website':
      return <Globe className="w-4 h-4 text-indigo-500" />;
    default:
      return <Key className="w-4 h-4" />;
  }
};

const getRotationStatusBadge = (status: Account['rotation_status']) => {
  switch (status) {
    case 'current':
      return <Badge variant="success">Current</Badge>;
    case 'due_soon':
      return <Badge variant="warning">Due Soon</Badge>;
    case 'overdue':
      return <Badge variant="danger">Overdue</Badge>;
    case 'no_policy':
      return <Badge variant="default">No Policy</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statistics, setStatistics] = useState<AccountStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'rotation_due' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Validation-related state
  const [validationLoading, setValidationLoading] = useState<string | null>(null);
  const [showValidationHistory, setShowValidationHistory] = useState(false);
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState<{ id: string; name: string } | null>(null);

  // Fetch accounts based on selected tab
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) {
        setError('Please log in to view accounts');
        return;
      }
      
      let endpoint = '/api/v1/accounts';
      if (selectedTab === 'rotation_due') {
        endpoint += '?status=rotation_due';
      } else if (selectedTab === 'active') {
        endpoint += '?status=active';
      }
      
      const response = await fetch(endpoint, {
        headers: authHeaders,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      const accountsData = data.data || data.accounts || [];
      
      console.log('Raw accounts data from API:', accountsData); // Debug log
      
      // Normalize field names to match UI expectations
      const normalizedAccounts = accountsData.map((account: any) => ({
        ...account,
        // Map API field names to UI expectations
        hostname: account.hostname_ip || account.hostname || 'N/A',
        validation_status: account.last_validation_status || account.validation_status || 'untested',
        last_validation_date: account.last_validated_at || account.last_validation_date || null,
        last_validation_result: account.validation_message || account.last_validation_result || null,
        // Ensure other expected fields exist with proper defaults
        account_type: account.account_type || 'N/A',
        safe_name: account.safe_name || 'Unknown Safe', // Don't show UUID, show friendly name
        platform_id: account.platform_id || account.system_type || 'N/A',
        // Map system type from platform_id if needed
        system_type: account.system_type || (account.platform_id === 'linux' ? 'Linux' : 'Windows'),
        // Ensure connection method is properly mapped
        connection_method: account.connection_method || 'SSH',
        // Handle rotation status
        rotation_status: account.rotation_status || 'no_policy'
      }));
      
      console.log('Normalized accounts:', normalizedAccounts); // Debug log
      
      setAccounts(normalizedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (!authHeaders.Authorization) return;
      
      const response = await fetch('/api/v1/accounts/statistics', {
        headers: authHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Rotate account password
  const handleRotatePassword = async (accountId: string) => {
    try {
      setActionLoading(accountId);
      
      const response = await fetch(`/api/v1/accounts/${accountId}/rotate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to rotate password');
      }

      await fetchAccounts();
      await fetchStatistics();
    } catch (error) {
      console.error('Error rotating password:', error);
      setError('Failed to rotate password');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete account
  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      setActionLoading(accountId);
      
      const response = await fetch(`/api/v1/accounts/${accountId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      await fetchAccounts();
      await fetchStatistics();
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    } finally {
      setActionLoading(null);
    }
  };

  // Validate account credentials
  const handleValidateAccount = async (accountId: string) => {
    try {
      setValidationLoading(accountId);
      
      const response = await accountsApi.validate(accountId);
      console.log('Full validation response:', JSON.stringify(response, null, 2)); // Debug log
      
      if (response && response.success) {
        // Extract validation status and ensure it's a valid value
        const validationStatus = response.validation_status;
        const mappedStatus: Account['validation_status'] = 
          validationStatus === 'valid' ? 'valid' : 
          validationStatus === 'invalid' ? 'invalid' : 
          validationStatus === 'pending' ? 'pending' : 
          'untested';
        
        console.log('Mapped validation status:', mappedStatus); // Debug log
        
        // Immediately update the account's validation status in the UI
        setAccounts(prevAccounts => {
          const updatedAccounts = prevAccounts.map(account => {
            if (account.id === accountId) {
              const updatedAccount = {
                ...account,
                validation_status: mappedStatus,
                last_validation_date: response.validation_timestamp || new Date().toISOString(),
                last_validation_result: response.validation_message || 'Validation completed'
              };
              console.log('Account before update:', account);
              console.log('Account after update:', updatedAccount);
              return updatedAccount;
            }
            return account;
          });
          return updatedAccounts;
        });
        
        // Force a re-render by updating a separate state if needed
        setError(`Validation completed for account ${accountId} with status: ${mappedStatus}`);
        setTimeout(() => setError(null), 3000); // Clear after 3 seconds
      }
    } catch (error) {
      console.error('Error validating account:', error);
      setError('Failed to validate account credentials');
      
      // Set validation status to invalid on error
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === accountId 
            ? {
                ...account,
                validation_status: 'invalid' as Account['validation_status'],
                last_validation_date: new Date().toISOString(),
                last_validation_result: error instanceof Error ? error.message : 'Validation failed'
              }
            : account
        )
      );
    } finally {
      setValidationLoading(null);
    }
  };

  // Show validation history
  const handleShowValidationHistory = (account: Account) => {
    setSelectedAccountForHistory({ id: account.id, name: account.name });
    setShowValidationHistory(true);
  };

  // Copy password to clipboard
  const handleCopyPassword = async (accountId: string) => {
    try {
      const response = await fetch(`/api/v1/accounts/${accountId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve password');
      }

      const data = await response.json();
      await navigator.clipboard.writeText(data.password);
    } catch (error) {
      console.error('Error copying password:', error);
      setError('Failed to copy password');
    }
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(account =>
    (account.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.hostname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.system_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tab change handler
  const handleTabChange = (value: string) => {
    setSelectedTab(value as 'all' | 'rotation_due' | 'active');
  };

  useEffect(() => {
    fetchAccounts();
    fetchStatistics();
  }, [selectedTab]);

  const tabs = [
    { 
      label: `All Accounts (${statistics?.total || 0})`, 
      value: 'all' 
    },
    { 
      label: `Rotation Due (${statistics?.requiring_rotation || 0})`, 
      value: 'rotation_due' 
    },
    { 
      label: `Active (${statistics?.active || 0})`, 
      value: 'active' 
    }
  ];

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner variant="lock" size="lg" text="Loading accounts..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Account Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage privileged accounts and password rotations
            {refreshing && <span className="text-blue-500"> • Refreshing...</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              fetchAccounts();
              fetchStatistics();
            }}
            variant="secondary"
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rotation Required</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.requiring_rotation}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valid Credentials</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.validation_valid || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {statistics.validation_invalid ? `${statistics.validation_invalid} invalid` : 'All validated'}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <AnimatedTabs
          tabs={tabs}
          onTabChange={handleTabChange}
          defaultValue="all"
        />
        
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50" glowIntensity="strong">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
          <Button 
            onClick={fetchAccounts}
            variant="secondary"
            size="sm"
            className="mt-3"
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        {filteredAccounts.length === 0 ? (
          <Card className="p-8 text-center" glowIntensity="normal">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No accounts match your search criteria.' : 'Get started by adding your first account.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            )}
          </Card>
        ) : (
          filteredAccounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={account}
              index={index}
              getSystemTypeIcon={getSystemTypeIcon}
              getRotationStatusBadge={getRotationStatusBadge}
              validationLoading={validationLoading}
              actionLoading={actionLoading}
              onCopyPassword={handleCopyPassword}
              onValidateAccount={handleValidateAccount}
              onShowHistory={handleShowValidationHistory}
              onRotatePassword={handleRotatePassword}
              onDeleteAccount={handleDeleteAccount}
            />
          ))
        )}
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchAccounts();
          fetchStatistics();
        }}
      />

      {/* Validation History Modal */}
      {selectedAccountForHistory && (
        <ValidationHistoryModal
          isOpen={showValidationHistory}
          onClose={() => {
            setShowValidationHistory(false);
            setSelectedAccountForHistory(null);
          }}
          accountId={selectedAccountForHistory.id}
          accountName={selectedAccountForHistory.name}
        />
      )}
    </div>
  );
};
