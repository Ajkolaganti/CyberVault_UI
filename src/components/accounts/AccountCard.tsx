import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DropdownMenu } from '../ui/DropdownMenu';
import { 
  Copy, 
  PlayCircle, 
  History, 
  RotateCcw, 
  Trash2, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Server,
  Database,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Account {
  id: string;
  name: string;
  system_type: string;
  hostname: string;
  port?: number;
  username: string;
  platform_id: string;
  safe_name: string;
  rotation_status: string;
  validation_status?: string;
  account_type: string;
  connection_method: string;
  last_rotated?: string;
  last_validation_date?: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AccountCardProps {
  account: Account;
  index: number;
  getSystemTypeIcon: (type: string) => React.ReactNode;
  getRotationStatusBadge: (status: string) => React.ReactNode;
  validationLoading: string | null;
  actionLoading: string | null;
  onCopyPassword: (id: string) => void;
  onValidateAccount: (id: string) => void;
  onShowHistory: (account: Account) => void;
  onRotatePassword: (id: string) => void;
  onDeleteAccount: (id: string) => void;
}

const getValidationStatusBadge = (status?: string) => {
  switch (status) {
    case 'valid':
      return <Badge variant="success">Valid</Badge>;
    case 'invalid':
      return <Badge variant="danger">Invalid</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'untested':
      return <Badge variant="default">Untested</Badge>;
    default:
      return <Badge variant="default">Unknown</Badge>;
  }
};

const getValidationStatusIcon = (status?: string) => {
  switch (status) {
    case 'valid':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'invalid':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'untested':
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  }
};

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  index,
  getSystemTypeIcon,
  getRotationStatusBadge,
  validationLoading,
  actionLoading,
  onCopyPassword,
  onValidateAccount,
  onShowHistory,
  onRotatePassword,
  onDeleteAccount,
}) => {
  return (
    <motion.div
      className="group"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="p-6 overflow-hidden relative transition-all duration-300 hover:shadow-lg" 
        glowIntensity={index % 2 === 0 ? "subtle" : "normal"}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Basic Info - Always Visible */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                {getSystemTypeIcon(account.system_type || 'Windows')}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{account.name || 'Unknown Account'}</h3>
                <p className="text-sm text-gray-500">{account.system_type || 'Unknown'}</p>
              </div>
            </div>
            
            {/* Essential Info - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300 group-hover:-translate-y-2">
              <div>
                <p className="text-xs text-gray-500">Username</p>
                <p className="text-sm font-medium text-gray-900">{account.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hostname</p>
                <p className="text-sm font-medium text-gray-900">
                  {account.hostname || 'N/A'}{account.port ? `:${account.port}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Validation Status</p>
                <div className="mt-1 flex items-center gap-2">
                  {getValidationStatusIcon(account.validation_status)}
                  {getValidationStatusBadge(account.validation_status)}
                </div>
              </div>
            </div>

            {/* Expanded Details - Visible on Hover */}
            <motion.div 
              className="mt-6 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Platform Policy</p>
                    <p className="text-sm font-medium text-gray-900">{account.platform_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Safe</p>
                    <p className="text-sm font-medium text-gray-900">{account.safe_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rotation Status</p>
                    <div className="mt-1">
                      {getRotationStatusBadge(account.rotation_status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Account Type</p>
                    <p className="text-sm font-medium text-gray-900">{account.account_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Connection Method</p>
                    <p className="text-sm font-medium text-gray-900">{account.connection_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Validated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {account.last_validation_date ? new Date(account.last_validation_date).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Last Rotated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {account.last_rotated ? new Date(account.last_rotated).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {(account.description || account.notes) && (
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {account.description || account.notes || 'No description'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Actions Dropdown */}
          <div className="ml-4">
            <DropdownMenu
              variant="ghost"
              size="sm"
              options={[
                {
                  label: "Copy Password",
                  onClick: () => onCopyPassword(account.id),
                  Icon: <Copy className="w-4 h-4" />
                },
                {
                  label: "Validate",
                  onClick: () => onValidateAccount(account.id),
                  Icon: validationLoading === account.id ? (
                    <LoadingSpinner variant="spinner" size="sm" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )
                },
                {
                  label: "History",
                  onClick: () => onShowHistory(account),
                  Icon: <History className="w-4 h-4" />
                },
                {
                  label: "Rotate",
                  onClick: () => onRotatePassword(account.id),
                  Icon: actionLoading === account.id ? (
                    <LoadingSpinner variant="spinner" size="sm" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )
                },
                {
                  label: "Delete",
                  onClick: () => onDeleteAccount(account.id),
                  Icon: <Trash2 className="w-4 h-4" />,
                  variant: 'danger' as const
                }
              ]}
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
