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
  user_id: string;
  name: string;
  system_type: 'Windows' | 'Linux' | 'oracle' | 'mssql' | 'mysql' | 'postgresql' | 'mongodb' | 'AWS' | 'Azure' | 'Unix/AIX' | 'Network Device' | 'Security Appliance' | 'Application' | 'Website';
  hostname: string;
  port?: number;
  connection_method: 'RDP' | 'SSH' | 'SQL' | 'HTTPS' | 'HTTP' | 'Oracle' | 'MySQL' | 'PostgreSQL' | 'MongoDB' | 'Custom';
  platform_id: string;
  account_type: 'Local' | 'Domain' | 'Service' | 'Admin' | 'Database' | 'Application';
  safe_name: string;
  username: string;
  rotation_policy: string;
  rotation_status: 'no_policy' | 'current' | 'due_soon' | 'overdue';
  validation_status?: 'valid' | 'invalid' | 'pending' | 'untested';
  last_validation_date?: string;
  last_validation_result?: string;
  description?: string;
  tags?: string;
  owner_email?: string;
  business_justification?: string;
  last_rotated?: string;
  next_rotation?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  notes?: string;
}

interface AccountCardProps {
  account: Account;
  index: number;
  getSystemTypeIcon: (type: Account['system_type']) => React.ReactNode;
  getRotationStatusBadge: (status: Account['rotation_status']) => React.ReactNode;
  validationLoading: string | null;
  actionLoading: string | null;
  onCopyPassword: (id: string) => void;
  onValidateAccount: (id: string) => void;
  onShowHistory: (account: Account) => void;
  onRotatePassword: (id: string) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  index,
  getRotationStatusBadge,
  validationLoading,
  actionLoading,
  onCopyPassword,
  onValidateAccount,
  onShowHistory,
  onRotatePassword,
  onDeleteAccount
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'valid':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'invalid':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSystemIcon = (type: Account['system_type']) => {
    switch (type) {
      case 'oracle':
      case 'mssql':
      case 'mysql':
      case 'postgresql':
      case 'mongodb':
        return <Database className="w-5 h-5 text-blue-500" />;
      case 'Windows':
      case 'Linux':
      case 'Unix/AIX':
        return <Server className="w-5 h-5 text-gray-600" />;
      case 'Application':
      case 'Website':
        return <Globe className="w-5 h-5 text-green-500" />;
      case 'AWS':
      case 'Azure':
        return <Database className="w-5 h-5 text-purple-500" />;
      case 'Network Device':
      case 'Security Appliance':
        return <Shield className="w-5 h-5 text-red-500" />;
      default:
        return <Shield className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50 border border-gray-200 hover:border-blue-300 bg-white">
        {/* Hover gradient overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.02 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 pointer-events-none"
        />
        
        {/* Top accent bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 origin-left w-full"
        />

        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1">
              {/* System Type Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex-shrink-0 p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors"
              >
                {getSystemIcon(account.system_type)}
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-900 transition-colors">
                    {account.name}
                  </h3>
                  {getStatusIcon(account.validation_status || account.rotation_status)}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="info" className="text-xs">
                    {account.system_type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {account.hostname}{account.port ? `:${account.port}` : ''}
                  </span>
                </div>
              </div>
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

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Username</p>
              <p className="text-sm font-medium text-gray-900 truncate">{account.username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Safe</p>
              <p className="text-sm font-medium text-gray-900 truncate">{account.safe_name || 'N/A'}</p>
            </div>
          </div>

          {/* Expand Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors border-t border-gray-100 group-hover:border-blue-200"
          >
            <span className="mr-2">
              {isExpanded ? 'Show Less' : 'Show More Details'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.button>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-gray-100 pt-4 mt-4 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Platform Policy</p>
                    <p className="text-sm font-medium text-gray-900">{account.platform_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rotation Status</p>
                    <div className="mt-1">
                      {getRotationStatusBadge(account.rotation_status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account Type</p>
                    <p className="text-sm font-medium text-gray-900">{account.account_type || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    <p className="text-xs text-gray-500">Last Rotated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {account.last_rotated ? new Date(account.last_rotated).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(account.updated_at).toLocaleDateString()}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default AccountCard;
