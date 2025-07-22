import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full ring-1 ring-inset';
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm'
  };
  
  const variantClasses = {
    default: 'bg-slate-50 text-slate-700 ring-slate-600/20',
    success: 'bg-green-50 text-green-700 ring-green-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};