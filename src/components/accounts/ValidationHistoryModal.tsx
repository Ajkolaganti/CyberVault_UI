import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card } from '../ui/Card';
import { accountsApi } from '../../utils/api';
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar, User, Info } from 'lucide-react';

interface ValidationHistoryEntry {
  id: string;
  account_id: string;
  validation_status: 'success' | 'failed' | 'pending';
  error_message?: string;
  validation_details?: {
    connection_test?: boolean;
    credential_test?: boolean;
    response_time?: number;
    endpoint?: string;
  };
  validated_at: string;
  validated_by?: string;
  validation_type: 'manual' | 'scheduled' | 'triggered';
}

interface ValidationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
  mockData?: ValidationHistoryEntry[]; // For testing purposes
}

const getValidationStatusIcon = (status: ValidationHistoryEntry['validation_status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
};

const getValidationStatusBadge = (status: ValidationHistoryEntry['validation_status']) => {
  switch (status) {
    case 'success':
      return <Badge variant="success">Success</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getValidationTypeBadge = (type: ValidationHistoryEntry['validation_type']) => {
  switch (type) {
    case 'manual':
      return <Badge variant="info">Manual</Badge>;
    case 'scheduled':
      return <Badge variant="default">Scheduled</Badge>;
    case 'triggered':
      return <Badge variant="warning">Triggered</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

export const ValidationHistoryModal: React.FC<ValidationHistoryModalProps> = ({
  isOpen,
  onClose,
  accountId,
  accountName,
  mockData,
}) => {
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchValidationHistory = async () => {
    if (!isOpen || !accountId) return;

    // If mock data is provided, use it instead of API call
    if (mockData) {
      setHistory(mockData);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await accountsApi.getValidationHistory(accountId);
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching validation history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load validation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationHistory();
  }, [isOpen, accountId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Validation History - ${accountName}`}
      size="xl"
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner variant="lock" size="lg" text="Loading validation history..." />
          </div>
        )}

        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </Card>
        )}

        {!loading && !error && (
          <>
            {history.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation History</h3>
                <p className="text-gray-500">
                  This account hasn't been validated yet. Run a validation test to start tracking history.
                </p>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getValidationStatusIcon(entry.validation_status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getValidationStatusBadge(entry.validation_status)}
                            {getValidationTypeBadge(entry.validation_type)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(entry.validated_at)}</span>
                            </div>
                            
                            {entry.validated_by && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{entry.validated_by}</span>
                              </div>
                            )}
                            
                            {entry.validation_details?.response_time && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Response: {formatResponseTime(entry.validation_details.response_time)}</span>
                              </div>
                            )}
                            
                            {entry.validation_details?.endpoint && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Info className="w-4 h-4" />
                                <span className="truncate">{entry.validation_details.endpoint}</span>
                              </div>
                            )}
                          </div>

                          {entry.validation_details && (
                            <div className="mt-3 space-y-1">
                              {entry.validation_details.connection_test !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                  {entry.validation_details.connection_test ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span className="text-gray-600">
                                    Connection Test: {entry.validation_details.connection_test ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              )}
                              
                              {entry.validation_details.credential_test !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                  {entry.validation_details.credential_test ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span className="text-gray-600">
                                    Credential Test: {entry.validation_details.credential_test ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {entry.error_message && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Error Details</p>
                                  <p className="text-sm text-red-700 mt-1">{entry.error_message}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
