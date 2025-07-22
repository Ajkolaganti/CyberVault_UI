import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { GlowingEffect } from './GlowingEffect';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  glow = true,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:ring-blue-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-slate-500/20 border border-slate-200',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 focus:ring-red-500/20',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-500/20'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const shouldShowGlow = glow && (variant === 'primary' || variant === 'danger') && !loading && !disabled;

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        (loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={loading || disabled}
      {...props}
    >
      {shouldShowGlow && (
        <GlowingEffect
          spread={25}
          proximity={30}
          inactiveZone={0.6}
          borderWidth={1}
          glow={true}
          disabled={false}
        />
      )}
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};