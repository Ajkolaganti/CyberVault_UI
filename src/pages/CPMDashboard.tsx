import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { 
  getCPMStatus, 
  getCredentialsNeedingAttention,
  getHealthStatus,
  verifyAllCredentials
} from '../utils/api';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Zap,
  Database,
  Settings,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CPMStatus {
  status: 'healthy' | 'warning' | 'error';
  totalCredentials: number;
  verifiedCredentials: number;
  failedCredentials: number;
  pendingCredentials: number;
  lastVerificationRun: string;
  nextScheduledRun: string;
  activeJobs: number;
  systemUptime: string;
}

interface CredentialAlert {
  id: string;
  name: string;
  type: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  lastAttempt: string;
}

export const CPMDashboard: React.FC = () => {
  const [cpmStatus, setCpmStatus] = useState<CPMStatus | null>(null);
  const [credentialAlerts, setCredentialAlerts] = useState<CredentialAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [triggeringVerification, setTriggeringVerification] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch CPM status and alerts
  const fetchCPMData = async () => {
    try {
      const [statusResult, alertsResult] = await Promise.allSettled([
        getCPMStatus(),
        getCredentialsNeedingAttention()
      ]);

      // Handle CPM status
      if (statusResult.status === 'fulfilled') {
        setCpmStatus(statusResult.value);
      } else {
        console.error('Failed to get CPM status:', statusResult.reason);
        throw new Error('Failed to fetch CPM status');
      }

      // Handle credential alerts
      if (alertsResult.status === 'fulfilled') {
        setCredentialAlerts(alertsResult.value.credentials || []);
      } else {
        console.error('Failed to get credentials needing attention:', alertsResult.reason);
        setCredentialAlerts([]);
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch CPM data:', err);
      setError(`Failed to load CPM dashboard data: ${err.message}`);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCPMData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // Trigger global verification
  const handleTriggerVerification = async () => {
    setTriggeringVerification(true);
    try {
      await verifyAllCredentials(); // Global verification for all credentials
      toast.success('Global verification process initiated');
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchCPMData();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to trigger verification:', error);
      toast.error(`Failed to trigger verification: ${error.message}`);
    } finally {
      setTriggeringVerification(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCPMData();
      setLoading(false);
    };

    loadData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchCPMData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const formatNextRun = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 1) return 'Starting soon';
      if (diffMinutes < 60) return `In ${diffMinutes}m`;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `In ${diffHours}h ${diffMinutes % 60}m`;
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CPM Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Credential Protection Management System Status
          </p>
        </div>
        
        <Card className="text-center py-16">
          <LoadingSpinner 
            variant="lock" 
            size="lg" 
            text="Loading CPM dashboard..." 
            className="py-8"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CPM Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Credential Protection Management System Status
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleTriggerVerification}
            loading={triggeringVerification}
            disabled={triggeringVerification}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {triggeringVerification ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Verification
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Status Overview */}
      {cpmStatus && (
        <>
          {/* Main Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">System Status</p>
                  <div className="mt-2">
                    <StatusBadge 
                      status={cpmStatus.status === 'healthy' ? 'verified' : cpmStatus.status === 'warning' ? 'pending' : 'failed'}
                      size="lg"
                    />
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Verified</p>
                  <p className="text-2xl font-bold text-green-900">{cpmStatus.verifiedCredentials}</p>
                  <p className="text-xs text-green-600">of {cpmStatus.totalCredentials} total</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{cpmStatus.failedCredentials}</p>
                  <p className="text-xs text-red-600">need attention</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-900">{cpmStatus.pendingCredentials}</p>
                  <p className="text-xs text-orange-600">in queue</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* System Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Active Jobs</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{cpmStatus.activeJobs}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">System Uptime</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{cpmStatus.systemUptime}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Last Run</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatTimeAgo(cpmStatus.lastVerificationRun)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Next Scheduled</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNextRun(cpmStatus.nextScheduledRun)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Credentials Needing Attention */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Credentials Needing Attention</h3>
                <Bell className="h-5 w-5 text-orange-500" />
              </div>

              {credentialAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All credentials are healthy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentialAlerts.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id} 
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Database className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{alert.name}</span>
                            <StatusBadge 
                              status={alert.severity === 'high' ? 'failed' : 'pending'}
                              size="sm"
                            />
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{alert.reason}</p>
                          <p className="text-xs text-gray-500">
                            Last attempt: {formatTimeAgo(alert.lastAttempt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {credentialAlerts.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm">
                        View all {credentialAlerts.length} alerts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
