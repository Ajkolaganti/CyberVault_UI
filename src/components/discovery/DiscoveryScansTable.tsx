import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DiscoveryScan, DiscoveryTarget } from '../../pages/Discovery';
import { discoveryApi } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Activity,
  Eye,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  Calendar
} from 'lucide-react';

interface DiscoveryScansTableProps {
  scans: DiscoveryScan[];
  targets: DiscoveryTarget[];
  onRefresh: () => void;
}

export const DiscoveryScansTable: React.FC<DiscoveryScansTableProps> = ({
  scans,
  targets,
  onRefresh,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [viewingScan, setViewingScan] = useState<DiscoveryScan | null>(null);

  const getTargetName = (targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    return target?.name || 'Unknown Target';
  };

  const getStatusBadge = (status: DiscoveryScan['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <Activity className="h-3 w-3 animate-pulse" />
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Square className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleCancelScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to cancel this scan?')) {
      return;
    }

    try {
      setLoading(scanId);
      await discoveryApi.scans.cancel(scanId);
      toast.success('Scan cancelled successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error cancelling scan:', error);
      toast.error(error.message || 'Failed to cancel scan');
    } finally {
      setLoading(null);
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (scans.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Discovery Scans</h3>
          <p className="text-gray-500 mb-4">
            Start your first discovery scan by selecting a target and clicking "Scan".
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getTargetName(scan.target_id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {scan.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(scan.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {scan.metadata.accounts_discovered !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span>{scan.metadata.accounts_discovered} discovered</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    {scan.metadata.accounts_stored !== undefined && (
                      <div className="text-sm text-gray-500">
                        {scan.metadata.accounts_stored} stored
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDuration(scan.started_at, scan.completed_at)}
                    </div>
                    {scan.status === 'running' && (
                      <div className="text-xs text-blue-600 flex items-center">
                        <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full mr-1" />
                        In progress
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(scan.started_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(scan.started_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setViewingScan(scan)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {scan.status === 'running' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelScan(scan.id)}
                          disabled={loading === scan.id}
                        >
                          {loading === scan.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scan Details Modal */}
      {viewingScan && (
        <ScanDetailsModal
          scan={viewingScan}
          targetName={getTargetName(viewingScan.target_id)}
          isOpen={!!viewingScan}
          onClose={() => setViewingScan(null)}
        />
      )}
    </div>
  );
};

// Scan Details Modal Component
interface ScanDetailsModalProps {
  scan: DiscoveryScan;
  targetName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ScanDetailsModal: React.FC<ScanDetailsModalProps> = ({
  scan,
  targetName,
  isOpen,
  onClose,
}) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-medium text-gray-900">Scan Details</h2>
            <Button variant="secondary" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
            {/* Basic Information */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Scan Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Target:</span>
                  <span className="ml-2 font-medium">{targetName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 capitalize font-medium">{scan.status}</span>
                </div>
                {scan.discovery_targets?.hostname && (
                  <div>
                    <span className="text-gray-500">Hostname:</span>
                    <span className="ml-2 font-medium text-blue-600">{scan.discovery_targets.hostname}</span>
                  </div>
                )}
                {scan.discovery_targets?.target_type && (
                  <div>
                    <span className="text-gray-500">Target Type:</span>
                    <span className="ml-2 font-medium">{scan.discovery_targets.target_type}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Started:</span>
                  <span className="ml-2">{new Date(scan.started_at).toLocaleString()}</span>
                </div>
                {scan.completed_at && (
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2">{new Date(scan.completed_at).toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Scan ID:</span>
                  <span className="ml-2 font-mono text-xs">{scan.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Target ID:</span>
                  <span className="ml-2 font-mono text-xs">{scan.target_id}</span>
                </div>
              </div>
            </Card>

            {/* Results */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Scan Results
              </h3>
              
              {scan.metadata && Object.keys(scan.metadata).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {scan.metadata.accounts_discovered !== undefined ? (
                      <div>
                        <span className="text-gray-500">Accounts Discovered:</span>
                        <span className={`ml-2 font-medium ${
                          scan.metadata.accounts_discovered > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {scan.metadata.accounts_discovered}
                        </span>
                      </div>
                    ) : scan.metadata.error ? (
                      <div>
                        <span className="text-gray-500">Accounts Discovered:</span>
                        <span className="ml-2 font-medium text-red-600">
                          0 (Scan Failed)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-500">Accounts Discovered:</span>
                        <span className="ml-2 font-medium text-gray-400">
                          Pending...
                        </span>
                      </div>
                    )}
                    
                    {scan.metadata.accounts_stored !== undefined && (
                      <div>
                        <span className="text-gray-500">Accounts Stored:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {scan.metadata.accounts_stored}
                        </span>
                      </div>
                    )}
                    
                    {scan.metadata.scan_duration && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">
                          {scan.metadata.scan_duration}
                        </span>
                      </div>
                    )}
                    
                    {scan.metadata.total_connections && (
                      <div>
                        <span className="text-gray-500">Total Connections:</span>
                        <span className="ml-2 font-medium">
                          {scan.metadata.total_connections}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Summary based on scan status */}
                  {scan.status === 'failed' && scan.metadata.error && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <p className="text-sm text-orange-800">
                        <strong>Scan failed:</strong> The target system may not support the required commands or the connection failed. 
                        Check the error details below for more information.
                      </p>
                    </div>
                  )}
                  
                  {scan.status === 'completed' && (scan.metadata.accounts_discovered || 0) === 0 && !scan.metadata.error && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Scan completed successfully</strong> but no privileged accounts were discovered on this target.
                      </p>
                    </div>
                  )}
                  
                  {scan.status === 'completed' && (scan.metadata.accounts_discovered || 0) > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800">
                        <strong>Scan completed successfully!</strong> Found {scan.metadata.accounts_discovered || 0} account(s). 
                        Check the "Discovered Accounts" tab to review and approve them.
                      </p>
                    </div>
                  )}
                  
                  {/* Collapsible raw metadata */}
                  <details className="mt-4">
                    <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-800 p-2 bg-gray-100 rounded">
                      Show Raw Scan Data
                    </summary>
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded max-h-60 overflow-y-auto">
                      <pre className="p-3 text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(scan.metadata, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                  <p className="text-sm text-gray-500">No scan data available yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Results will appear here once the scan completes.
                  </p>
                </div>
              )}
            </Card>

            {/* Error Information */}
            {(scan.metadata?.error || scan.metadata?.error_message) && (
              <Card className="p-4 bg-red-50 border-red-200">
                <h3 className="text-sm font-medium text-red-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Error Details
                </h3>
                {(() => {
                  const errorMessage = scan.metadata.error || scan.metadata.error_message;
                  if (!errorMessage) return null;
                  
                  // Try to parse command results from the error message
                  const commandResultsMatch = errorMessage.match(/Command results: (\[.*?\])/s);
                  let commandResults = null;
                  let mainError = errorMessage;
                  
                  if (commandResultsMatch) {
                    try {
                      commandResults = JSON.parse(commandResultsMatch[1]);
                      mainError = errorMessage.split('Command results:')[0].trim();
                    } catch (e) {
                      // If parsing fails, keep original
                    }
                  }
                  
                  return (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">Main Error:</h4>
                        <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
                          {mainError}
                        </p>
                      </div>
                      
                      {commandResults && (
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-2">Failed Commands:</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {commandResults.map((cmd: any, index: number) => (
                              <div key={index} className="bg-red-100 p-3 rounded border border-red-200">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-mono text-xs text-red-900">{cmd.command}</span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    cmd.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                  }`}>
                                    {cmd.success ? 'Success' : `Failed (Exit: ${cmd.exitCode})`}
                                  </span>
                                </div>
                                {cmd.output && (
                                  <div className="text-xs text-red-700 mt-1">
                                    <strong>Output:</strong> {cmd.output}
                                  </div>
                                )}
                                {cmd.error && (
                                  <div className="text-xs text-red-700 mt-1">
                                    <strong>Error:</strong> {cmd.error}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <details className="mt-3">
                        <summary className="text-xs font-medium text-red-700 cursor-pointer hover:text-red-800 p-2 bg-red-100 rounded">
                          Show Raw Error Data
                        </summary>
                        <div className="mt-2 bg-red-100 border border-red-200 rounded max-h-40 overflow-y-auto">
                          <pre className="p-3 text-xs text-red-600 whitespace-pre-wrap">
                            {errorMessage}
                          </pre>
                        </div>
                      </details>
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* Settings */}
            {scan.settings && Object.keys(scan.settings).length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Scan Settings
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  {scan.settings.includeSystemAccounts !== undefined && (
                    <div>
                      <span className="text-gray-500">Include System Accounts:</span>
                      <span className="ml-2 font-medium">
                        {scan.settings.includeSystemAccounts ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {scan.settings.timeout && (
                    <div>
                      <span className="text-gray-500">Timeout:</span>
                      <span className="ml-2 font-medium">{scan.settings.timeout}ms</span>
                    </div>
                  )}
                  {scan.settings.maxAccounts && (
                    <div>
                      <span className="text-gray-500">Max Accounts:</span>
                      <span className="ml-2 font-medium">{scan.settings.maxAccounts}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Complete Settings Data:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded max-h-48 overflow-y-auto">
                    <pre className="p-3 text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(scan.settings, null, 2)}
                    </pre>
                  </div>
                </div>
              </Card>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
