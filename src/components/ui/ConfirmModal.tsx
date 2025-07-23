import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    confirmVariant: 'danger' as const
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    confirmVariant: 'primary' as const
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    confirmVariant: 'primary' as const
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    confirmVariant: 'primary' as const
  }
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
  disabled = false,
  children
}) => {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (!disabled && !loading) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Alert Section */}
        <div className={`
          flex items-start space-x-3 p-4 rounded-lg border
          ${config.bgColor} ${config.borderColor}
        `}>
          <div className="flex-shrink-0">
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${config.textColor}`}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </h3>
            <p className={`text-sm mt-1 ${config.textColor.replace('800', '700')}`}>
              {message}
            </p>
          </div>
        </div>

        {/* Custom Content */}
        {children && (
          <div className="border-t border-gray-200 pt-4">
            {children}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            disabled={disabled || loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
