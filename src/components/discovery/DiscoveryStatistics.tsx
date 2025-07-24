import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DiscoveryStatisticsData } from '../../pages/Discovery';
import {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface DiscoveryStatisticsProps {
  statistics: DiscoveryStatisticsData | null;
  onRefresh: () => void;
}

export const DiscoveryStatistics: React.FC<DiscoveryStatisticsProps> = ({
  statistics,
  onRefresh,
}) => {
  if (!statistics) {
    return (
      <Card>
        <div className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</h3>
          <p className="text-gray-500 mb-4">
            Discovery statistics will appear here once you have targets and scans.
          </p>
          <Button onClick={onRefresh} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>
    );
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'scan_completed':
        return <Activity className="h-3 w-3 text-green-600" />;
      case 'target_created':
        return <Target className="h-3 w-3 text-blue-600" />;
      case 'accounts_approved':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
    }
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'scan_completed':
        return <Badge variant="success">Scan Completed</Badge>;
      case 'target_created':
        return <Badge variant="info">Target Created</Badge>;
      case 'accounts_approved':
        return <Badge variant="success">Accounts Approved</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  // Calculate percentages
  const approvalRate = statistics.total_discovered_accounts > 0 
    ? Math.round((statistics.approved_accounts / statistics.total_discovered_accounts) * 100)
    : 0;

  const rejectionRate = statistics.total_discovered_accounts > 0 
    ? Math.round((statistics.rejected_accounts / statistics.total_discovered_accounts) * 100)
    : 0;

  const pendingRate = statistics.total_discovered_accounts > 0 
    ? Math.round((statistics.pending_approval / statistics.total_discovered_accounts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Discovery Targets</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_targets}</p>
                <p className="text-xs text-gray-500">
                  {statistics.active_targets} active
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_scans}</p>
                <p className="text-xs text-gray-500">
                  {statistics.running_scans} running
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accounts Discovered</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_discovered_accounts}</p>
                <p className="text-xs text-gray-500">
                  {statistics.pending_approval} pending
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">{approvalRate}%</p>
                <p className="text-xs text-gray-500">
                  {statistics.approved_accounts} approved
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Status Breakdown */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Account Status Distribution
            </h3>
            <Button onClick={onRefresh} variant="secondary" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Approved Accounts</span>
                  <span className="font-medium text-green-600">
                    {statistics.approved_accounts} ({approvalRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${approvalRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending Approval</span>
                  <span className="font-medium text-orange-600">
                    {statistics.pending_approval} ({pendingRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pendingRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rejected Accounts</span>
                  <span className="font-medium text-red-600">
                    {statistics.rejected_accounts} ({rejectionRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${rejectionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-900">{statistics.approved_accounts}</p>
                <p className="text-xs text-green-700">Approved</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-orange-900">{statistics.pending_approval}</p>
                <p className="text-xs text-orange-700">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-red-900">{statistics.rejected_accounts}</p>
                <p className="text-xs text-red-700">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>

          {statistics.recent_activity && statistics.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {statistics.recent_activity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getActivityTypeIcon(activity.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getActivityTypeBadge(activity.type)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </Card>

      {/* Key Metrics Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Discovery Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Target Coverage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Targets:</span>
                  <span className="font-medium">{statistics.total_targets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Targets:</span>
                  <span className="font-medium text-green-600">{statistics.active_targets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Coverage Rate:</span>
                  <span className="font-medium">
                    {statistics.total_targets > 0 
                      ? Math.round((statistics.active_targets / statistics.total_targets) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Scan Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Scans:</span>
                  <span className="font-medium">{statistics.total_scans}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Currently Running:</span>
                  <span className="font-medium text-blue-600">{statistics.running_scans}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg. Accounts/Scan:</span>
                  <span className="font-medium">
                    {statistics.total_scans > 0 
                      ? Math.round(statistics.total_discovered_accounts / statistics.total_scans)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
