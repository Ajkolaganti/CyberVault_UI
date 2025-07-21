import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = true,
  hover = false
}) => {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 transition-all duration-200 ${
      hover ? 'hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5' : ''
    } ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
};