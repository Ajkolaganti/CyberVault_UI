import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AnimatedTabs } from '../ui/AnimatedTabs';
import { accountValidationApi } from '../../utils/api';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  PlayCircle,
  Download,
  TrendingUp,
  Activity,
  Users,
  Timer
} from 'lucide-react';

interface ValidationStatus {
  total_accounts: number;
  pending: number;
  verified: number;
  failed: number;
  never_validated: number;
  last_updated: string;
}

interface ValidationStatistics {
  success_rate: number;
  average_validation_time: number;
  daily_validations: number;
  weekly_trend: number;
  critical_failures: number;
  last_24h_attempts: number;
  last_24h_successes: number;
  last_24h_failures: number;
}

interface ValidationAttempt {
  id: string;
  account_id: string;
  account_name: string;
  hostname: string;
  username: string;
  system_type: string;
  verification_method: string;
  status: 'success' | 'failure' | 'pending';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  error_category?: 'connection' | 'authentication' | 'authorization' | 'timeout' | 'configuration';
  triggered_by: 'manual' | 'scheduled' | 'jit_request';
  session_id?: string;
}

interface ValidationFailure {
  id: string;
  account_id: string;
  account_name: string;
  hostname: string;
  system_type: string;
  error_category: string;
  error_message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  first_failed_at: string;
  last_failed_at: string;
  failure_count: number;
  associated_jit_sessions?: string[];
}

const statusColors = {
  verified: 'success',
  pending: 'warning',
  failed: 'danger',
  never_validated: 'default'
} as const;

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'never_validated':
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <Badge variant="danger">Critical</Badge>;
    case 'high':
      return <Badge variant="danger">High</Badge>;
    case 'medium':
      return <Badge variant="warning">Medium</Badge>;
    case 'low':
      return <Badge variant="info">Low</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

export const AccountValidationDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'attempts' | 'failures'>('overview');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus | null>(null);
  const [statistics, setStatistics] = useState<ValidationStatistics | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<ValidationAttempt[]>([]);
  const [failures, setFailures] = useState<ValidationFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkValidating, setBulkValidating] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [systemTypeFilter, setSystemTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchValidationData = async () => {
    try {
      setRefreshing(true);
      
      const [statusData, statsData, attemptsData, failuresData] = await Promise.all([
        accountValidationApi.getStatus(),
        accountValidationApi.getStatistics(),
        accountValidationApi.getHistory({ limit: 50 }),
        accountValidationApi.getFailures({ severity: severityFilter !== 'all' ? severityFilter as any : undefined })
      ]);
      
      setValidationStatus(statusData);
      setStatistics(statsData);
      setRecentAttempts(attemptsData.attempts || []);
      setFailures(failuresData.failures || []);
    } catch (error) {
      console.error('Error fetching validation data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBulkValidation = async () => {
    try {
      setBulkValidating(true);
      
      // Get failed accounts for bulk validation
      const failedAccounts = failures
        .filter(f => f.severity === 'high' || f.severity === 'critical')
        .map(f => f.account_id);
      
      if (failedAccounts.length > 0) {
        await accountValidationApi.manualTrigger(failedAccounts, true);
        await fetchValidationData();
      }
    } catch (error) {
      console.error('Error triggering bulk validation:', error);
    } finally {
      setBulkValidating(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        status: validationStatus,
        statistics,
        recent_attempts: recentAttempts,
        failures,
        generated_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const filteredAttempts = recentAttempts.filter(attempt => {
    const matchesSearch = searchTerm === '' || 
      attempt.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || attempt.status === statusFilter;
    const matchesSystemType = systemTypeFilter === 'all' || attempt.system_type === systemTypeFilter;
    
    return matchesSearch && matchesStatus && matchesSystemType;
  });

  const filteredFailures = failures.filter(failure => {
    const matchesSearch = searchTerm === '' || 
      failure.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      failure.hostname.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || failure.severity === severityFilter;
    const matchesSystemType = systemTypeFilter === 'all' || failure.system_type === systemTypeFilter;
    
    return matchesSearch && matchesSeverity && matchesSystemType;
  });

  useEffect(() => {
    fetchValidationData();
  }, [severityFilter]);

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: `Recent Attempts (${recentAttempts.length})`, value: 'attempts' },
    { label: `Failures (${failures.length})`, value: 'failures' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner variant="lock" size="lg" text="Loading validation dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Account Validation Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage account credential validation
            {refreshing && <span className="text-blue-500"> • Refreshing...</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={fetchValidationData}
            variant="secondary"
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleBulkValidation}
            variant="secondary"
            disabled={bulkValidating || !failures.some(f => f.severity === 'high' || f.severity === 'critical')}
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {bulkValidating ? 'Validating...' : 'Bulk Validate Critical'}
          </Button>
          <Button
            onClick={handleExportReport}
            variant="secondary"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {validationStatus && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.success_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {statistics.weekly_trend > 0 ? '↗' : '↘'} {Math.abs(statistics.weekly_trend).toFixed(1)}% this week
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Validation Time</p>
                <p className="text-2xl font-semibold text-gray-900">{(statistics.average_validation_time / 1000).toFixed(1)}s</p>
                <p className="text-xs text-gray-500 mt-1">{statistics.daily_validations} validations today</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Failures</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.critical_failures}</p>
                <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
              </div>
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 24h Activity</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.last_24h_attempts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {statistics.last_24h_successes} success, {statistics.last_24h_failures} failed
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Status Overview Cards */}
      {validationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-lg font-semibold text-gray-900">{validationStatus.total_accounts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-lg font-semibold text-gray-900">{validationStatus.verified}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-gray-900">{validationStatus.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-lg font-semibold text-gray-900">{validationStatus.failed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4" glowIntensity="subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Never Validated</p>
                <p className="text-lg font-semibold text-gray-900">{validationStatus.never_validated}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <AnimatedTabs
          tabs={tabs}
          onTabChange={(value) => setSelectedTab(value as any)}
          defaultValue="overview"
        />
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 w-32"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={systemTypeFilter}
            onChange={(e) => setSystemTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 w-32"
          >
            <option value="all">All Systems</option>
            <option value="Windows">Windows</option>
            <option value="Linux">Linux</option>
            <option value="Database">Database</option>
            <option value="Network">Network</option>
          </select>
          
          {selectedTab === 'failures' && (
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 w-32"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-6" glowIntensity="normal">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Validation Activity</h3>
            <div className="space-y-3">
              {recentAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(attempt.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attempt.account_name}</p>
                      <p className="text-xs text-gray-500">{attempt.hostname}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(attempt.started_at).toLocaleTimeString()}
                    </p>
                    {attempt.duration_ms && (
                      <p className="text-xs text-gray-400">{(attempt.duration_ms / 1000).toFixed(1)}s</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Critical Failures */}
          <Card className="p-6" glowIntensity="normal">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Critical Failures</h3>
            <div className="space-y-3">
              {failures.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 5).map((failure) => (
                <div key={failure.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{failure.account_name}</p>
                      <p className="text-xs text-gray-500">{failure.error_category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getSeverityBadge(failure.severity)}
                    <p className="text-xs text-gray-500 mt-1">{failure.failure_count} failures</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'attempts' && (
        <Card className="p-6" glowIntensity="normal">
          <div className="space-y-4">
            {filteredAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No validation attempts found</p>
              </div>
            ) : (
              filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(attempt.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{attempt.account_name}</p>
                        <Badge variant={statusColors[attempt.status as keyof typeof statusColors]}>
                          {attempt.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <span>{attempt.hostname}</span>
                        <span>{attempt.username}</span>
                        <span>{attempt.system_type}</span>
                        <span>{attempt.verification_method}</span>
                      </div>
                      {attempt.error_message && (
                        <p className="text-sm text-red-600 mt-2">{attempt.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{new Date(attempt.started_at).toLocaleString()}</p>
                    {attempt.duration_ms && (
                      <p>{(attempt.duration_ms / 1000).toFixed(1)}s</p>
                    )}
                    <Badge variant="info" className="mt-1">
                      {attempt.triggered_by}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {selectedTab === 'failures' && (
        <Card className="p-6" glowIntensity="normal">
          <div className="space-y-4">
            {filteredFailures.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No validation failures found</p>
              </div>
            ) : (
              filteredFailures.map((failure) => (
                <div key={failure.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{failure.account_name}</p>
                        {getSeverityBadge(failure.severity)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>{failure.hostname}</span>
                        <span>{failure.system_type}</span>
                        <span>{failure.error_category}</span>
                      </div>
                      <p className="text-sm text-red-600 mt-2">{failure.error_message}</p>
                      {failure.associated_jit_sessions && failure.associated_jit_sessions.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Associated with {failure.associated_jit_sessions.length} JIT session(s)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>First: {new Date(failure.first_failed_at).toLocaleDateString()}</p>
                    <p>Last: {new Date(failure.last_failed_at).toLocaleDateString()}</p>
                    <p className="font-medium">{failure.failure_count} failures</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
