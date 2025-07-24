import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Server,
  Zap
} from 'lucide-react';

interface ValidationStatistics {
  total_accounts: number;
  verified: number;
  failed: number;
  pending: number;
  never_validated: number;
  success_rate: number;
  average_validation_time: number;
  last_24h_attempts: number;
  weekly_trend: number;
  critical_failures: number;
}

interface JITHealthMetrics {
  active_sessions: number;
  sessions_with_validation_issues: number;
  expiring_sessions_with_failures: number;
  jit_validation_success_rate: number;
  average_jit_validation_time: number;
}

interface SystemHealthData {
  system_type: string;
  total_accounts: number;
  verified: number;
  failed: number;
  success_rate: number;
  last_validation: string;
}

interface DashboardWidgetsProps {
  validationStats: ValidationStatistics;
  jitHealth: JITHealthMetrics;
  systemHealth: SystemHealthData[];
  loading?: boolean;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  validationStats,
  jitHealth,
  systemHealth,
  loading = false
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Ensure all required properties exist with safe defaults
  const safeValidationStats = {
    total_accounts: validationStats?.total_accounts ?? 0,
    verified: validationStats?.verified ?? 0,
    failed: validationStats?.failed ?? 0,
    pending: validationStats?.pending ?? 0,
    never_validated: validationStats?.never_validated ?? 0,
    success_rate: validationStats?.success_rate ?? 0,
    average_validation_time: validationStats?.average_validation_time ?? 0,
    last_24h_attempts: validationStats?.last_24h_attempts ?? 0,
    weekly_trend: validationStats?.weekly_trend ?? 0,
    critical_failures: validationStats?.critical_failures ?? 0,
  };

  const safeJitHealth = {
    active_sessions: jitHealth?.active_sessions ?? 0,
    sessions_with_validation_issues: jitHealth?.sessions_with_validation_issues ?? 0,
    expiring_sessions_with_failures: jitHealth?.expiring_sessions_with_failures ?? 0,
    jit_validation_success_rate: jitHealth?.jit_validation_success_rate ?? 0,
    average_jit_validation_time: jitHealth?.average_jit_validation_time ?? 0,
  };

  // Ensure systemHealth is an array
  const safeSystemHealth = Array.isArray(systemHealth) ? systemHealth : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <LoadingSpinner />
          </Card>
        ))}
      </div>
    );
  }

  // Calculate validation status distribution for donut chart
  const statusDistribution = [
    { name: 'Verified', value: safeValidationStats.verified, color: '#10B981' },
    { name: 'Failed', value: safeValidationStats.failed, color: '#EF4444' },
    { name: 'Pending', value: safeValidationStats.pending, color: '#F59E0B' },
    { name: 'Never Validated', value: safeValidationStats.never_validated, color: '#6B7280' }
  ];

  const totalAccountsWithStatus = statusDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Accounts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{safeValidationStats.total_accounts.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Managed credentials</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{safeValidationStats.success_rate.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                {safeValidationStats.weekly_trend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                )}
                <p className="text-xs text-gray-500">
                  {safeValidationStats.weekly_trend > 0 ? '+' : ''}{safeValidationStats.weekly_trend.toFixed(1)}% this week
                </p>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              safeValidationStats.success_rate >= 90 ? 'bg-green-100' : 
              safeValidationStats.success_rate >= 75 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <CheckCircle className={`w-6 h-6 ${
                safeValidationStats.success_rate >= 90 ? 'text-green-600' : 
                safeValidationStats.success_rate >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">24h Validations</p>
              <p className="text-2xl font-bold text-gray-900">{safeValidationStats.last_24h_attempts.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg {safeValidationStats.average_validation_time.toFixed(1)}s per check
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Critical Failures */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Failures</p>
              <p className="text-2xl font-bold text-gray-900">{safeValidationStats.critical_failures}</p>
              <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              safeValidationStats.critical_failures === 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                safeValidationStats.critical_failures === 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Validation Status Overview & JIT Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validation Status Donut Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Validation Status Distribution</h3>
            <Badge variant="info">{totalAccountsWithStatus} Total</Badge>
          </div>
          
          <div className="relative">
            {/* Simple visual representation - could be replaced with actual chart library */}
            <div className="grid grid-cols-2 gap-4">
              {statusDistribution.map((status) => {
                const percentage = totalAccountsWithStatus > 0 ? (status.value / totalAccountsWithStatus) * 100 : 0;
                return (
                  <div key={status.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3" 
                        style={{ backgroundColor: status.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{status.name}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold" style={{ color: status.color }}>
                      {status.value.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>{((safeValidationStats.verified / totalAccountsWithStatus) * 100).toFixed(1)}%</strong> of accounts 
              are currently verified and accessible
            </p>
          </div>
        </Card>

        {/* JIT Account Health */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">JIT Account Health</h3>
            <Zap className="w-5 h-5 text-purple-600" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Active Sessions</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{safeJitHealth.active_sessions}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">With Validation Issues</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{safeJitHealth.sessions_with_validation_issues}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Expiring with Failures</span>
              </div>
              <span className="text-lg font-bold text-red-600">{safeJitHealth.expiring_sessions_with_failures}</span>
            </div>

            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">JIT Success Rate</span>
                <span className="text-lg font-bold text-purple-800">
                  {safeJitHealth.jit_validation_success_rate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-2 bg-purple-200 rounded-full">
                <div 
                  className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${safeJitHealth.jit_validation_success_rate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Health Matrix */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">System Health Matrix</h3>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeRange === range 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">System Type</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Verified</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Failed</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Success Rate</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {safeSystemHealth.map((system) => {
                const healthColor = system.success_rate >= 90 ? 'green' : 
                                  system.success_rate >= 75 ? 'yellow' : 'red';
                
                return (
                  <tr key={system.system_type} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Server className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{system.system_type}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-600">{system.total_accounts}</td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        <span className="text-sm text-gray-900">{system.verified}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end">
                        <XCircle className="w-3 h-3 text-red-500 mr-1" />
                        <span className="text-sm text-gray-900">{system.failed}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge 
                        variant={healthColor === 'green' ? 'success' : healthColor === 'yellow' ? 'warning' : 'danger'}
                      >
                        {system.success_rate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4 text-xs text-gray-500">
                      {new Date(system.last_validation).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {safeSystemHealth.length === 0 && (
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No system health data available</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardWidgets;
