import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AccountValidationDashboard } from '../components/validation/AccountValidationDashboard';
import { JITSessionAccountStatus } from '../components/validation/JITSessionAccountStatus';
import { EnhancedAuditTrail } from '../components/validation/EnhancedAuditTrail';
import AdvancedSearchPanel from '../components/search/AdvancedSearchPanel';
import DashboardWidgets from '../components/dashboard/DashboardWidgets';
import NotificationSystem from '../components/notifications/NotificationSystem';
import { useRealTimeValidation } from '../hooks/useRealTimeValidation';
import { 
  accountValidationApi, 
  dashboardAnalyticsApi,
  userPreferencesApi 
} from '../utils/api';
import {
  Shield,
  Activity,
  Search,
  Settings,
  RefreshCw,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  component: React.ReactNode;
}

interface DashboardStats {
  validationStats: {
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
  };
  jitHealth: {
    active_sessions: number;
    sessions_with_validation_issues: number;
    expiring_sessions_with_failures: number;
    jit_validation_success_rate: number;
    average_jit_validation_time: number;
  };
  systemHealth: Array<{
    system_type: string;
    total_accounts: number;
    verified: number;
    failed: number;
    success_rate: number;
    last_validation: string;
  }>;
}

export const ComprehensiveValidationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [userPreferences, setUserPreferences] = useState({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    defaultTimeRange: '24h' as '24h' | '7d' | '30d',
    visibleWidgets: ['overview', 'jit-health', 'system-health'],
    notifications: {
      enableCriticalAlerts: true,
      enableSuccessNotifications: false,
      alertSounds: true
    }
  });

  // Real-time validation monitoring
  const { isConnected, lastEvent } = useRealTimeValidation({
    onValidationEvent: (event) => {
      // Update dashboard stats based on real-time events
      if (event.type === 'statistics_update' && event.data.statistics) {
        setDashboardStats(prev => prev ? {
          ...prev,
          validationStats: { ...prev.validationStats, ...event.data.statistics }
        } : null);
      }
    },
    onCriticalFailure: () => {
      // Trigger immediate refresh for critical failures
      refreshDashboardData();
    },
    enableNotifications: false, // Handled by NotificationSystem component
    enableCriticalAlerts: userPreferences.notifications.enableCriticalAlerts
  });

  // Auto-refresh functionality
  useEffect(() => {
    if (userPreferences.autoRefresh) {
      const interval = setInterval(() => {
        refreshDashboardData();
      }, userPreferences.refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [userPreferences.autoRefresh, userPreferences.refreshInterval]);

  // Load initial data and user preferences
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        
        // Load user preferences
        const [dashboardPrefs, notificationPrefs] = await Promise.all([
          userPreferencesApi.getDashboardPreferences(),
          userPreferencesApi.getNotificationPreferences()
        ]);
        
        setUserPreferences(prev => ({
          ...prev,
          ...dashboardPrefs,
          notifications: { ...prev.notifications, ...notificationPrefs }
        }));
        
        // Load dashboard data
        await loadDashboardData();
        
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardData, jitHealth, systemHealth] = await Promise.all([
        dashboardAnalyticsApi.getDashboardData(timeRange),
        dashboardAnalyticsApi.getJitHealthMetrics(timeRange),
        dashboardAnalyticsApi.getSystemHealthBreakdown(timeRange)
      ]);

      setDashboardStats({
        validationStats: dashboardData.validation_statistics,
        jitHealth: jitHealth,
        systemHealth: systemHealth.systems
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const refreshDashboardData = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTimeRangeChange = async (newRange: '24h' | '7d' | '30d') => {
    setTimeRange(newRange);
    setRefreshing(true);
    
    try {
      const [dashboardData, jitHealth, systemHealth] = await Promise.all([
        dashboardAnalyticsApi.getDashboardData(newRange),
        dashboardAnalyticsApi.getJitHealthMetrics(newRange),
        dashboardAnalyticsApi.getSystemHealthBreakdown(newRange)
      ]);

      setDashboardStats({
        validationStats: dashboardData.validation_statistics,
        jitHealth: jitHealth,
        systemHealth: systemHealth.systems
      });
    } catch (error) {
      console.error('Failed to load data for new time range:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportDashboard = async () => {
    try {
      const exportData = await accountValidationApi.exportReport({
        format: 'xlsx',
        date_range: { 
          start: new Date(Date.now() - (timeRange === '24h' ? 86400000 : timeRange === '7d' ? 604800000 : 2592000000)).toISOString(),
          end: new Date().toISOString()
        },
        include_fields: ['account_name', 'hostname', 'validation_status', 'last_validation_date', 'system_type']
      });
      
      // Trigger download
      const blob = new Blob([exportData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-dashboard-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export dashboard:', error);
    }
  };

  // Calculate alert counts for tab badges
  const alertCounts = dashboardStats ? {
    critical: dashboardStats.validationStats.critical_failures,
    failed: dashboardStats.validationStats.failed,
    jitIssues: dashboardStats.jitHealth.sessions_with_validation_issues
  } : { critical: 0, failed: 0, jitIssues: 0 };

  const tabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
      component: dashboardStats ? (
        <DashboardWidgets
          validationStats={dashboardStats.validationStats}
          jitHealth={dashboardStats.jitHealth}
          systemHealth={dashboardStats.systemHealth}
          loading={loading || refreshing}
        />
      ) : <LoadingSpinner />
    },
    {
      id: 'validation',
      label: 'Account Validation',
      icon: <Shield className="w-4 h-4" />,
      badge: alertCounts.failed > 0 ? alertCounts.failed : undefined,
      component: <AccountValidationDashboard />
    },
    {
      id: 'jit-sessions',
      label: 'JIT Sessions',
      icon: <Zap className="w-4 h-4" />,
      badge: alertCounts.jitIssues > 0 ? alertCounts.jitIssues : undefined,
      component: <JITSessionAccountStatus />
    },
    {
      id: 'audit-trail',
      label: 'Audit Trail',
      icon: <Activity className="w-4 h-4" />,
      component: <EnhancedAuditTrail />
    },
    {
      id: 'search',
      label: 'Advanced Search',
      icon: <Search className="w-4 h-4" />,
      component: (
        <div className="space-y-6">
          <AdvancedSearchPanel
            onFiltersChange={(filters) => {
              console.log('Filters updated:', filters);
            }}
            onSearch={(filters) => {
              // Handle advanced search
              console.log('Advanced search:', filters);
            }}
            availableOptions={{
              systemTypes: ['Windows', 'Linux', 'Database', 'Network Device', 'Application'],
              connectionMethods: ['SSH', 'RDP', 'WinRM', 'SQL', 'HTTP', 'HTTPS'],
              verificationMethods: ['SSH', 'WinRM', 'SMB', 'RDP', 'SQL'],
              errorCategories: ['connection', 'authentication', 'authorization', 'timeout', 'configuration']
            }}
          />
          <Card className="p-6">
            <p className="text-gray-500 text-center">Search results will appear here</p>
          </Card>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading validation dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Account Validation Dashboard</h1>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Real-time connected' : 'Offline'}
                </span>
              </div>
              
              {/* Real-time Event Indicator */}
              {lastEvent && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Latest: {lastEvent.type.replace('_', ' ')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Time Range Selector */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      timeRange === range 
                        ? 'bg-white text-blue-600 shadow-sm font-medium' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshDashboardData}
                disabled={refreshing}
                className="p-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportDashboard}
                className="p-2"
              >
                <Download className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <NotificationSystem
                onNotificationAction={(notification) => {
                  // Handle notification actions (e.g., navigate to specific account)
                  console.log('Notification action:', notification);
                }}
              />

              <Button
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Bar */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats.validationStats.total_accounts.toLocaleString()}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardStats.validationStats.success_rate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active JIT Sessions</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardStats.jitHealth.active_sessions}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboardStats.validationStats.critical_failures}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Card className="overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ComprehensiveValidationDashboard;
