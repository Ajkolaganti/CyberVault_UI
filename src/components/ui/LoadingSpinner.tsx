import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'spinner' | 'lock';
  text?: string;
}

// Custom Lock Animation Component
const AnimatedLock: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="relative">
      <div className="relative p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl">
        <div className={`${sizeClasses[size]} relative mx-auto`}>
          {/* Lock Animation using transform and scale */}
          <svg 
            className="w-full h-full text-blue-600"
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Lock body */}
            <rect 
              x="6" 
              y="10" 
              width="12" 
              height="8" 
              rx="2" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="currentColor" 
              fillOpacity="0.1"
              className="animate-pulse"
            />
            
            {/* Lock shackle - will be animated with CSS */}
            <path
              d="M8 10V8c0-2.209 1.791-4 4-4s4 1.791 4 4v2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="lock-shackle"
            />
            
            {/* Keyhole */}
            <circle 
              cx="12" 
              cy="14" 
              r="1.5" 
              fill="currentColor"
              className="animate-pulse"
            />
          </svg>
          
          {/* Second lock for unlock animation */}
          <svg 
            className="w-full h-full text-blue-400 absolute inset-0 opacity-0 lock-unlocked"
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Lock body */}
            <rect 
              x="6" 
              y="10" 
              width="12" 
              height="8" 
              rx="2" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="currentColor" 
              fillOpacity="0.1"
            />
            
            {/* Open shackle */}
            <path
              d="M8 10V8c0-2.209 1.791-4 4-4s4 1.791 4 4v1"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            
            {/* Keyhole */}
            <circle 
              cx="12" 
              cy="14" 
              r="1.5" 
              fill="currentColor"
            />
          </svg>
        </div>
        
        {/* Glowing ring effect */}
        <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/30 animate-pulse"></div>
      </div>
      
      {/* CSS animations */}
      <style>{`
        .lock-shackle {
          animation: lockShackleAnimation 3s ease-in-out infinite;
        }
        
        .lock-unlocked {
          animation: unlockAnimation 3s ease-in-out infinite;
        }
        
        @keyframes lockShackleAnimation {
          0% { opacity: 1; transform: scaleY(1); }
          30% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0; transform: scaleY(0.7); }
          70% { opacity: 0; transform: scaleY(0.7); }
          100% { opacity: 1; transform: scaleY(1); }
        }
        
        @keyframes unlockAnimation {
          0% { opacity: 0; transform: rotate(0deg) scale(1); }
          30% { opacity: 0; transform: rotate(0deg) scale(1); }
          50% { opacity: 1; transform: rotate(15deg) scale(1.05); }
          70% { opacity: 1; transform: rotate(15deg) scale(1.05); }
          100% { opacity: 0; transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  variant = 'spinner',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'lock') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
        <AnimatedLock size={size} />
        
        {text && (
          <div className="text-center space-y-2">
            <p className={`font-semibold text-slate-900 ${textSizeClasses[size]}`}>
              {text}
            </p>
            <div className="flex space-x-1 justify-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {text && <span className={`text-slate-600 ${textSizeClasses[size]}`}>{text}</span>}
    </div>
  );
};