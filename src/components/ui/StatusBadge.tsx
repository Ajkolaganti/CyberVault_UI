import React from 'react';

export type StatusType = 'verified' | 'failed' | 'pending' | 'expired' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<StatusType, { 
  color: string; 
  bgColor: string; 
  text: string;
  icon?: string;
}> = {
  verified: {
    color: 'text-green-700',
    bgColor: 'bg-green-100 border-green-200',
    text: 'Verified',
    icon: '✓'
  },
  failed: {
    color: 'text-red-700',
    bgColor: 'bg-red-100 border-red-200',
    text: 'Failed',
    icon: '✗'
  },
  pending: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-200',
    text: 'Pending',
    icon: '⋯'
  },
  expired: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 border-orange-200',
    text: 'Expired',
    icon: '⚠'
  },
  active: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-200',
    text: 'Active',
    icon: '●'
  },
  inactive: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-200',
    text: 'Inactive',
    icon: '○'
  }
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '', 
  size = 'md' 
}) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.color} ${config.bgColor} ${sizeClasses[size]}
        ${className}
      `}
    >
      {config.icon && (
        <span className="text-xs leading-none">{config.icon}</span>
      )}
      {config.text}
    </span>
  );
};
