import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AnimatedTabs } from '../components/ui/AnimatedTabs';
import {
  DiscoveryTargetsTable,
  DiscoveryScansTable,
  DiscoveredAccountsTable,
  CreateTargetModal,
  ScanSettingsModal,
  DiscoveryStatistics
} from '../components/discovery';
import { discoveryApi } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  RefreshCw,
  Target,
  Activity,
  Users,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

export interface DiscoveryTarget {
  id: string;
  name: string;
  target_type: 'linux' | 'windows' | 'aws' | 'database' | 'active_directory';
  hostname: string;
  connection_method: 'ssh' | 'winrm' | 'https' | 'aws_api' | 'database';
  credential_id: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryScan {
  id: string;
  target_id: string;
  target_name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  settings: Record<string, any>;
  metadata: Record<string, any> & {
    accounts_discovered?: number;
    accounts_stored?: number;
    completed_at?: string;
    error_message?: string;
    error?: string;
    scan_duration?: string;
    total_connections?: number;
  };
  started_at: string;
  completed_at?: string;
  created_at: string;
  discovery_targets?: {
    hostname?: string;
    name?: string;
    target_type?: string;
  };
}

export interface DiscoveredAccount {
  id: string;
  account_name: string;
  system_type: string;
  hostname_ip: string;
  status: 'pending_approval' | 'active' | 'rejected';
  discovered_at: string;
  discovery_scan_id: string;
  discovery_metadata: Record<string, any>;
  rejection_reason?: string;
}

export interface DiscoveryStatisticsData {
  total_targets: number;
  active_targets: number;
  total_scans: number;
  running_scans: number;
  total_discovered_accounts: number;
  pending_approval: number;
  approved_accounts: number;
  rejected_accounts: number;
  recent_activity: Array<{
    type: 'scan_completed' | 'target_created' | 'accounts_approved';
    message: string;
    timestamp: string;
  }>;
}

export const Discovery: React.FC = () => {
  const [activeTab, setActiveTab] = useState('targets');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [targets, setTargets] = useState<DiscoveryTarget[]>([]);
  const [scans, setScans] = useState<DiscoveryScan[]>([]);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [statistics, setStatistics] = useState<DiscoveryStatisticsData | null>(null);

  // Modal states
  const [showCreateTargetModal, setShowCreateTargetModal] = useState(false);
  const [showScanSettingsModal, setShowScanSettingsModal] = useState(false);
  const [selectedTargetForScan, setSelectedTargetForScan] = useState<DiscoveryTarget | null>(null);

  // Selected items for bulk operations
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const tabs = [
    { value: 'targets', label: 'Discovery Targets', icon: Target },
    { value: 'scans', label: 'Scans & Results', icon: Activity },
    { value: 'accounts', label: 'Discovered Accounts', icon: Users },
    { value: 'statistics', label: 'Statistics', icon: BarChart3 },
  ];

  // Fetch data functions
  const fetchTargets = async () => {
    try {
      const response = await discoveryApi.targets.list();
      setTargets(response.data || []);
    } catch (error) {
      console.error('Error fetching discovery targets:', error);
      setError('Failed to load discovery targets');
    }
  };

  const fetchScans = async () => {
    try {
      const response = await discoveryApi.scans.list(undefined, 50, 0);
      setScans(response.data || []);
    } catch (error) {
      console.error('Error fetching discovery scans:', error);
      setError('Failed to load discovery scans');
    }
  };

  const fetchDiscoveredAccounts = async () => {
    try {
      const response = await discoveryApi.accounts.list(undefined, 'pending_approval');
      setDiscoveredAccounts(response.data || []);
    } catch (error) {
      console.error('Error fetching discovered accounts:', error);
      setError('Failed to load discovered accounts');
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await discoveryApi.getStatistics('30d');
      setStatistics(response.data || null);
    } catch (error) {
      console.error('Error fetching discovery statistics:', error);
      setError('Failed to load discovery statistics');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTargets(),
        fetchScans(),
        fetchDiscoveredAccounts(),
        fetchStatistics()
      ]);
    } catch (error) {
      console.error('Error fetching discovery data:', error);
      setError('Failed to load discovery data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle scan start
  const handleStartScan = async (target: DiscoveryTarget) => {
    setSelectedTargetForScan(target);
    setShowScanSettingsModal(true);
  };

  // Handle scan execution
  const handleExecuteScan = async (targetId: string, scanSettings: any) => {
    try {
      setLoading(true);
      await discoveryApi.scans.start(targetId, scanSettings);
      toast.success('Discovery scan started successfully');
      await fetchScans();
      setShowScanSettingsModal(false);
      setSelectedTargetForScan(null);
    } catch (error: any) {
      console.error('Error starting scan:', error);
      toast.error(error.message || 'Failed to start discovery scan');
    } finally {
      setLoading(false);
    }
  };

  // Handle account approval
  const handleApproveAccounts = async (accountIds: string[], onboardingSettings?: any) => {
    try {
      setLoading(true);
      await discoveryApi.accounts.approve(accountIds, onboardingSettings);
      toast.success(`Approved ${accountIds.length} account(s) successfully`);
      await fetchDiscoveredAccounts();
      setSelectedAccounts([]);
    } catch (error: any) {
      console.error('Error approving accounts:', error);
      toast.error(error.message || 'Failed to approve accounts');
    } finally {
      setLoading(false);
    }
  };

  // Handle account rejection
  const handleRejectAccounts = async (accountIds: string[], reason: string) => {
    try {
      setLoading(true);
      await discoveryApi.accounts.reject(accountIds, reason);
      toast.success(`Rejected ${accountIds.length} account(s) successfully`);
      await fetchDiscoveredAccounts();
      setSelectedAccounts([]);
    } catch (error: any) {
      console.error('Error rejecting accounts:', error);
      toast.error(error.message || 'Failed to reject accounts');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading && !refreshing) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    switch (activeTab) {
      case 'targets':
        return (
          <DiscoveryTargetsTable
            targets={targets}
            onRefresh={fetchTargets}
            onStartScan={handleStartScan}
            onTargetCreated={fetchTargets}
          />
        );
      case 'scans':
        return (
          <DiscoveryScansTable
            scans={scans}
            targets={targets}
            onRefresh={fetchScans}
          />
        );
      case 'accounts':
        return (
          <DiscoveredAccountsTable
            accounts={discoveredAccounts}
            selectedAccounts={selectedAccounts}
            onSelectionChange={setSelectedAccounts}
            onApprove={handleApproveAccounts}
            onReject={handleRejectAccounts}
            onRefresh={fetchDiscoveredAccounts}
          />
        );
      case 'statistics':
        return (
          <DiscoveryStatistics
            statistics={statistics}
            onRefresh={fetchStatistics}
          />
        );
      default:
        return null;
    }
  };

  // Count running scans
  const runningScansCount = scans.filter(scan => scan.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-6 h-6" />
            Discovery Scan
          </h1>
          <p className="text-gray-500 mt-1">
            Discover and inventory privileged accounts across your infrastructure
            {refreshing && <span className="text-blue-500"> • Refreshing...</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={refreshData}
            variant="secondary"
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => setShowCreateTargetModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Discovery Target
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Targets</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.active_targets}</p>
                  <p className="text-xs text-gray-500">of {statistics.total_targets} total</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Running Scans</p>
                  <p className="text-2xl font-bold text-gray-900">{runningScansCount}</p>
                  <p className="text-xs text-gray-500">of {statistics.total_scans} total</p>
                </div>
                <div className="relative">
                  <Activity className="h-8 w-8 text-green-500" />
                  {runningScansCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pending_approval}</p>
                  <p className="text-xs text-gray-500">
                    {statistics.approved_accounts} approved
                  </p>
                </div>
                <div className="relative">
                  <Users className="h-8 w-8 text-orange-500" />
                  {statistics.pending_approval > 0 && (
                    <Badge
                      variant="warning"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {statistics.pending_approval}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Discovered</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_discovered_accounts}</p>
                  <p className="text-xs text-gray-500">
                    {statistics.rejected_accounts} rejected
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs and Content */}
      <div className="space-y-6">
        <AnimatedTabs
          tabs={tabs}
          onTabChange={setActiveTab}
          defaultValue="targets"
        />
        
        {renderTabContent()}
      </div>

      {/* Modals */}
      <CreateTargetModal
        isOpen={showCreateTargetModal}
        onClose={() => setShowCreateTargetModal(false)}
        onSuccess={() => {
          fetchTargets();
          setShowCreateTargetModal(false);
        }}
      />

      <ScanSettingsModal
        isOpen={showScanSettingsModal}
        onClose={() => {
          setShowScanSettingsModal(false);
          setSelectedTargetForScan(null);
        }}
        target={selectedTargetForScan}
        onExecute={handleExecuteScan}
      />
    </div>
  );
};
