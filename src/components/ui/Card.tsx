import React from 'react';
import { GlowingEffect } from './GlowingEffect';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  glow?: boolean;
  glowIntensity?: 'subtle' | 'normal' | 'strong';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = true,
  hover = false,
  glow = true,
  glowIntensity = 'subtle'
}) => {
  const getGlowProps = () => {
    switch (glowIntensity) {
      case 'subtle':
        return {
          spread: 30,
          proximity: 40,
          inactiveZone: 0.5,
          borderWidth: 1.5,
        };
      case 'normal':
        return {
          spread: 40,
          proximity: 60,
          inactiveZone: 0.3,
          borderWidth: 2,
        };
      case 'strong':
        return {
          spread: 50,
          proximity: 80,
          inactiveZone: 0.1,
          borderWidth: 3,
        };
      default:
        return {
          spread: 30,
          proximity: 40,
          inactiveZone: 0.5,
          borderWidth: 1.5,
        };
    }
  };

  return (
    <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 transition-all duration-200 ${
      hover ? 'hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5' : ''
    } ${padding ? 'p-6' : ''} ${className}`}>
      {glow && (
        <GlowingEffect
          {...getGlowProps()}
          glow={true}
          disabled={false}
        />
      )}
      {children}
    </div>
  );
};