import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { GlowingEffect } from './GlowingEffect';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  secure?: boolean;
  glow?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  secure = false,
  className = '',
  type = 'text',
  glow = true,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const inputType = secure ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          {glow && (
            <GlowingEffect
              spread={20}
              proximity={25}
              inactiveZone={0.8}
              borderWidth={1}
              glow={true}
              disabled={false}
            />
          )}
          <input
            type={inputType}
            className={`relative w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm ${
              error ? 'border-red-500 focus:ring-red-500' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {secure && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};