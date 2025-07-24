import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AnimatedTabs } from '../ui/AnimatedTabs';
import { auditValidationApi } from '../../utils/api';
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Activity,
  Calendar,
  User,
  Zap
} from 'lucide-react';

interface AuditLog {
  id: string;
  event_type: 'account_verification' | 'jit_account_verification' | 'jit_critical_verification_failure';
  timestamp: string;
  account_id?: string;
  account_name?: string;
  session_id?: string;
  session_name?: string;
  user_id?: string;
  user_email?: string;
  status: 'success' | 'failure' | 'pending';
  verification_method?: string;
  error_category?: string;
  error_message?: string;
  details: {
    hostname?: string;
    system_type?: string;
    duration_ms?: number;
    triggered_by?: 'manual' | 'scheduled' | 'jit_request';
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  metadata?: Record<string, any>;
}

interface AuditFilters {
  event_type?: 'account_verification' | 'jit_account_verification' | 'jit_critical_verification_failure';
  status?: 'success' | 'failure' | 'pending';
  session_id?: string;
  account_id?: string;
  date_range?: { start: string; end: string };
  search_term?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  triggered_by?: 'manual' | 'scheduled' | 'jit_request';
  limit?: number;
  offset?: number;
}

const getEventTypeIcon = (eventType: string) => {
  switch (eventType) {
    case 'account_verification':
      return <Shield className="w-4 h-4 text-blue-500" />;
    case 'jit_account_verification':
      return <Zap className="w-4 h-4 text-purple-500" />;
    case 'jit_critical_verification_failure':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failure':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
};

const getEventTypeBadge = (eventType: string) => {
  switch (eventType) {
    case 'account_verification':
      return <Badge variant="info">Account Verification</Badge>;
    case 'jit_account_verification':
      return <Badge variant="warning">JIT Verification</Badge>;
    case 'jit_critical_verification_failure':
      return <Badge variant="danger">Critical JIT Failure</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <Badge variant="success">Success</Badge>;
    case 'failure':
      return <Badge variant="danger">Failure</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getSeverityBadge = (severity?: string) => {
  if (!severity) return null;
  
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

export const EnhancedAuditTrail: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'regular' | 'jit' | 'critical'>('all');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchAuditLogs = async () => {
    try {
      setRefreshing(true);
      
      const apiFilters: AuditFilters = {
        search_term: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as 'success' | 'failure' | 'pending' : undefined,
        severity: severityFilter !== 'all' ? severityFilter as 'low' | 'medium' | 'high' | 'critical' : undefined,
        date_range: dateRange.start && dateRange.end ? dateRange : undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      };

      // Add event type filter based on selected tab
      if (selectedTab === 'regular') {
        apiFilters.event_type = 'account_verification';
      } else if (selectedTab === 'jit') {
        apiFilters.event_type = 'jit_account_verification';
      } else if (selectedTab === 'critical') {
        apiFilters.event_type = 'jit_critical_verification_failure';
      }

      let response;
      if (selectedTab === 'critical') {
        // For critical failures, use different API with specific filters
        const criticalFilters = {
          severity: (severityFilter !== 'all' ? severityFilter : undefined) as 'high' | 'critical' | undefined,
          since: dateRange.start || undefined
        };
        response = await auditValidationApi.getCriticalFailures(criticalFilters);
      } else if (selectedTab === 'jit') {
        // For JIT-specific logs
        const jitFilters = {
          session_id: apiFilters.session_id,
          date_range: apiFilters.date_range
        };
        response = await auditValidationApi.getJitVerificationLogs(jitFilters);
      } else {
        // For regular verification logs, exclude pending status if not supported
        const verificationFilters = {
          ...apiFilters,
          status: apiFilters.status === 'pending' ? undefined : apiFilters.status as 'success' | 'failure' | undefined
        };
        response = await auditValidationApi.getVerificationLogs(verificationFilters);
      }
      
      setAuditLogs(response.logs || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      // Get all logs for export (no pagination)
      const exportFilters = { 
        search_term: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as 'success' | 'failure' : undefined,
        limit: 10000, 
        offset: 0 
      };
      const response = await auditValidationApi.getVerificationLogs(exportFilters);
      
      const exportData = {
        logs: response.logs || [],
        filters: {
          search_term: searchTerm,
          status_filter: statusFilter,
          severity_filter: severityFilter,
          date_range: dateRange
        },
        exported_at: new Date().toISOString(),
        total_records: response.total || 0
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value as any);
    setCurrentPage(1);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatEventDetails = (log: AuditLog) => {
    const details = [];
    
    if (log.details.hostname) details.push(`Host: ${log.details.hostname}`);
    if (log.details.system_type) details.push(`Type: ${log.details.system_type}`);
    if (log.details.duration_ms) details.push(`Duration: ${formatDuration(log.details.duration_ms)}`);
    if (log.verification_method) details.push(`Method: ${log.verification_method}`);
    
    return details.join(' • ');
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedTab, currentPage, statusFilter, severityFilter]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (currentPage === 1) {
        fetchAuditLogs();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const tabs = [
    { label: 'All Events', value: 'all' },
    { label: 'Regular Verification', value: 'regular' },
    { label: 'JIT Verification', value: 'jit' },
    { label: 'Critical Failures', value: 'critical' }
  ];

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner variant="lock" size="lg" text="Loading audit trail..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Enhanced Audit Trail
          </h1>
          <p className="text-gray-500 mt-1">
            Comprehensive verification and JIT validation logs
            {refreshing && <span className="text-blue-500"> • Refreshing...</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={fetchAuditLogs}
            variant="secondary"
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportLogs}
            variant="secondary"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <AnimatedTabs
          tabs={tabs}
          onTabChange={handleTabChange}
          defaultValue="all"
        />
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search logs..."
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
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="pending">Pending</option>
          </select>
          
          {(selectedTab === 'critical' || selectedTab === 'all') && (
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
          
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-40"
              placeholder="Start date"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-40"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4" glowIntensity="subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-lg font-semibold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4" glowIntensity="subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-lg font-semibold text-gray-900">
                {auditLogs.filter(log => log.status === 'success').length}
              </p>
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
              <p className="text-lg font-semibold text-gray-900">
                {auditLogs.filter(log => log.status === 'failure').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4" glowIntensity="subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">JIT Events</p>
              <p className="text-lg font-semibold text-gray-900">
                {auditLogs.filter(log => log.event_type.includes('jit')).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Logs List */}
      <Card className="p-6" glowIntensity="normal">
        <div className="space-y-4">
          {auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mt-1">
                  {getEventTypeIcon(log.event_type)}
                  {getStatusIcon(log.status)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getEventTypeBadge(log.event_type)}
                    {getStatusBadge(log.status)}
                    {getSeverityBadge(log.details.severity)}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      {log.account_name && (
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Account: {log.account_name}
                        </p>
                      )}
                      {log.session_name && (
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Session: {log.session_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">{formatEventDetails(log)}</p>
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.user_email && (
                        <div className="flex items-center gap-1 mb-1">
                          <User className="w-3 h-3" />
                          <span>{log.user_email}</span>
                        </div>
                      )}
                      {log.details.triggered_by && (
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>Triggered by: {log.details.triggered_by}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} events
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * pageSize >= totalCount}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
