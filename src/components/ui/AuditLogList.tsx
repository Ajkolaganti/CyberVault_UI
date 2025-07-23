import React from 'react';
import { Card } from './Card';
import { StatusBadge, StatusType } from './StatusBadge';
import { Clock, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  result: 'success' | 'failure' | 'warning' | 'info';
  summary: string;
  metadata?: {
    reason?: string;
    duration?: number;
    source?: string;
    [key: string]: any;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface AuditLogListProps {
  logs: AuditLog[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const getResultIcon = (result: AuditLog['result']) => {
  switch (result) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failure':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'info':
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const getResultBadgeStatus = (result: AuditLog['result']): StatusType => {
  switch (result) {
    case 'success':
      return 'verified';
    case 'failure':
      return 'failed';
    case 'warning':
      return 'pending';
    case 'info':
    default:
      return 'active';
  }
};

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return {
      relative: formatRelativeTime(date),
      absolute: date.toLocaleString()
    };
  } catch {
    return {
      relative: 'Unknown',
      absolute: timestamp
    };
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const AuditLogList: React.FC<AuditLogListProps> = ({
  logs,
  loading = false,
  emptyMessage = 'No audit logs found',
  className = ''
}) => {
  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded-full mt-1"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className={`text-center py-8 ${className}`}>
        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
        
        <div className="space-y-3">
          {logs.map((log) => {
            const timeInfo = formatTimestamp(log.timestamp);
            
            return (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors duration-200"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getResultIcon(log.result)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {log.action}
                        </span>
                        <StatusBadge 
                          status={getResultBadgeStatus(log.result)} 
                          size="sm"
                        />
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{log.summary}</p>
                      
                      {log.metadata?.reason && (
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                          <strong>Reason:</strong> {log.metadata.reason}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div 
                        className="text-xs text-gray-500 cursor-help"
                        title={timeInfo.absolute}
                      >
                        {timeInfo.relative}
                      </div>
                      
                      {log.user && (
                        <div className="flex items-center space-x-1 mt-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {log.user.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {log.metadata && Object.keys(log.metadata).length > 1 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View details
                      </summary>
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
