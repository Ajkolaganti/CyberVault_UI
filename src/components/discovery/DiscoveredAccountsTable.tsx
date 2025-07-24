import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { DiscoveredAccount } from '../../pages/Discovery';
import toast from 'react-hot-toast';
import {
  Users,
  Check,
  X,
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Monitor,
  Calendar
} from 'lucide-react';

interface DiscoveredAccountsTableProps {
  accounts: DiscoveredAccount[];
  selectedAccounts: string[];
  onSelectionChange: (accountIds: string[]) => void;
  onApprove: (accountIds: string[], onboardingSettings?: any) => void;
  onReject: (accountIds: string[], reason: string) => void;
  onRefresh: () => void;
}

export const DiscoveredAccountsTable: React.FC<DiscoveredAccountsTableProps> = ({
  accounts,
  selectedAccounts,
  onSelectionChange,
  onApprove,
  onReject,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'active' | 'rejected'>('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState<DiscoveredAccount | null>(null);

  // Filter accounts based on search term and status
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = (
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.hostname_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.system_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredAccounts.map(account => account.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAccounts, accountId]);
    } else {
      onSelectionChange(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const getStatusBadge = (status: DiscoveredAccount['status']) => {
    switch (status) {
      case 'pending_approval':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getSystemTypeIcon = (systemType: string) => {
    switch (systemType.toLowerCase()) {
      case 'linux':
      case 'unix':
        return <Server className="h-4 w-4" />;
      case 'windows':
        return <Monitor className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  if (accounts.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Discovered Accounts</h3>
          <p className="text-gray-500 mb-4">
            Run discovery scans to find privileged accounts across your infrastructure.
          </p>
          <Button onClick={onRefresh} variant="secondary">
            Refresh
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search accounts, hostnames, or system types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedAccounts.length} account(s) selected
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => setShowApprovalModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowRejectionModal(true)}
              >
                <X className="h-3 w-3 mr-1" />
                Reject Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Accounts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discovered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                          {getSystemTypeIcon(account.system_type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.account_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.hostname_ip}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default" className="capitalize">
                      {account.system_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(account.status)}
                    {account.rejection_reason && (
                      <div className="text-xs text-red-600 mt-1">
                        {account.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(account.discovered_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(account.discovered_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowAccountDetails(account)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {account.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              onSelectionChange([account.id]);
                              setShowApprovalModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              onSelectionChange([account.id]);
                              setShowRejectionModal(true);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          onSelectionChange([]);
        }}
        selectedCount={selectedAccounts.length}
        onApprove={onApprove}
        selectedAccounts={selectedAccounts}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          onSelectionChange([]);
        }}
        selectedCount={selectedAccounts.length}
        onReject={onReject}
        selectedAccounts={selectedAccounts}
      />

      {/* Account Details Modal */}
      {showAccountDetails && (
        <AccountDetailsModal
          account={showAccountDetails}
          isOpen={!!showAccountDetails}
          onClose={() => setShowAccountDetails(null)}
        />
      )}
    </div>
  );
};

// Approval Modal Component
interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedAccounts: string[];
  onApprove: (accountIds: string[], onboardingSettings?: any) => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  selectedAccounts,
  onApprove,
}) => {
  const [loading, setLoading] = useState(false);
  const [onboardingSettings, setOnboardingSettings] = useState({
    rotationPolicy: '30days',
    monitoring: true,
    autoRotate: false,
  });

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(selectedAccounts, onboardingSettings);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Discovered Accounts">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You are about to approve <strong>{selectedCount}</strong> discovered account(s).
          Configure the onboarding settings below:
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rotationPolicy">Rotation Policy</Label>
            <select
              id="rotationPolicy"
              value={onboardingSettings.rotationPolicy}
              onChange={(e) =>
                setOnboardingSettings({
                  ...onboardingSettings,
                  rotationPolicy: e.target.value,
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30days">30 Days</option>
              <option value="60days">60 Days</option>
              <option value="90days">90 Days</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="monitoring"
              checked={onboardingSettings.monitoring}
              onChange={(e) =>
                setOnboardingSettings({
                  ...onboardingSettings,
                  monitoring: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="monitoring">Enable monitoring</Label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoRotate"
              checked={onboardingSettings.autoRotate}
              onChange={(e) =>
                setOnboardingSettings({
                  ...onboardingSettings,
                  autoRotate: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="autoRotate">Enable automatic rotation</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <LoadingSpinner size="sm" /> : `Approve ${selectedCount} Account(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Rejection Modal Component
interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedAccounts: string[];
  onReject: (accountIds: string[], reason: string) => void;
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  selectedAccounts,
  onReject,
}) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await onReject(selectedAccounts, reason);
      onClose();
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Discovered Accounts">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          You are about to reject <strong>{selectedCount}</strong> discovered account(s).
          Please provide a reason for the rejection:
        </p>

        <div>
          <Label htmlFor="reason">Rejection Reason *</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Security policy violation, Inactive account, etc."
            rows={3}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading || !reason.trim()}
            variant="danger"
          >
            {loading ? <LoadingSpinner size="sm" /> : `Reject ${selectedCount} Account(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Account Details Modal Component
interface AccountDetailsModalProps {
  account: DiscoveredAccount;
  isOpen: boolean;
  onClose: () => void;
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Account Details</h2>
            <Button variant="secondary" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Account Name:</span>
                  <span className="ml-2 font-medium">{account.account_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">System Type:</span>
                  <span className="ml-2">{account.system_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Host/IP:</span>
                  <span className="ml-2">{account.hostname_ip}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2">{account.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Discovered:</span>
                  <span className="ml-2">{new Date(account.discovered_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Scan ID:</span>
                  <span className="ml-2 font-mono text-xs">{account.discovery_scan_id}</span>
                </div>
              </div>
            </Card>

            {account.discovery_metadata && Object.keys(account.discovery_metadata).length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Discovery Metadata</h3>
                <div className="text-sm text-gray-600">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(account.discovery_metadata, null, 2)}
                  </pre>
                </div>
              </Card>
            )}

            {account.rejection_reason && (
              <Card className="p-4 bg-red-50 border-red-200">
                <h3 className="text-sm font-medium text-red-900 mb-2">Rejection Reason</h3>
                <p className="text-sm text-red-800">{account.rejection_reason}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
