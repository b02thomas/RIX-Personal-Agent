// /frontend-fixes/components/RIXCubeLogo.tsx
// 3D RIX cube logo component with neural network design and animation
// Features hardware-accelerated animations and theme-aware styling
// RELEVANT FILES: FixedSidebar.tsx, design-system.css, theme-toggle.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RIXCubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export const RIXCubeLogo: React.FC<RIXCubeLogoProps> = ({
  size = 'md',
  animated = true,
  className,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn(getSizeClasses(size), "bg-rix-accent-primary rounded", className)} />;
  }

  const sizeClasses = getSizeClasses(size);
  const animationClasses = animated ? getAnimationClasses() : '';

  return (
    <div
      className={cn(
        'relative cursor-pointer select-none',
        sizeClasses,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="RIX Logo"
    >
      {/* Outer Cube Container */}
      <div className={cn(
        'relative w-full h-full',
        'transform-gpu',
        animated && 'transition-transform duration-300 ease-out',
        isHovered && 'scale-110 rotate-12'
      )}>
        
        {/* Main Cube */}
        <div className={cn(
          'absolute inset-0 rounded-lg',
          'bg-gradient-to-br from-rix-accent-primary via-blue-500 to-blue-700',
          'shadow-lg',
          animated && animationClasses
        )}>
          
          {/* Neural Network Pattern Overlay */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <svg
              className="w-full h-full opacity-30"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Neural Network Nodes */}
              <circle cx="4" cy="4" r="1" fill="white" className={animated ? 'animate-pulse' : ''} />
              <circle cx="12" cy="4" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.2s' }} />
              <circle cx="20" cy="4" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.4s' }} />
              
              <circle cx="8" cy="12" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.1s' }} />
              <circle cx="16" cy="12" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.3s' }} />
              
              <circle cx="4" cy="20" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.5s' }} />
              <circle cx="12" cy="20" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.6s' }} />
              <circle cx="20" cy="20" r="1" fill="white" className={animated ? 'animate-pulse' : ''} style={{ animationDelay: '0.7s' }} />
              
              {/* Neural Network Connections */}
              <path d="M4 4L8 12M12 4L8 12M20 4L16 12M8 12L4 20M8 12L12 20M16 12L12 20M16 12L20 20" 
                    stroke="white" 
                    strokeWidth="0.5" 
                    opacity="0.6"
                    className={animated ? 'animate-pulse' : ''} 
                    style={{ animationDelay: '0.8s' }} />
            </svg>
          </div>

          {/* 3D Effect Highlight */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 to-transparent" />
          
          {/* Inner Glow */}
          <div className={cn(
            'absolute inset-0 rounded-lg',
            'bg-gradient-to-br from-blue-300/20 to-transparent',
            animated && isHovered && 'animate-pulse'
          )} />
        </div>

        {/* RIX Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'font-bold text-white drop-shadow-sm',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}>
            RIX
          </span>
        </div>

        {/* Floating Particles (only for larger sizes) */}
        {size !== 'sm' && animated && (
          <>
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 -right-2 w-0.5 h-0.5 bg-blue-200 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
          </>
        )}
      </div>

      {/* Hover Ring Effect */}
      {animated && isHovered && (
        <div className="absolute inset-0 rounded-lg border-2 border-blue-300 animate-ping" />
      )}
    </div>
  );
};

// Helper function to get size classes
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-6 h-6';
    case 'md':
      return 'w-8 h-8';
    case 'lg':
      return 'w-12 h-12';
    default:
      return 'w-8 h-8';
  }
}

// Helper function to get animation classes
function getAnimationClasses(): string {
  return 'transition-all duration-300 ease-out hover:shadow-xl';
}

export default RIXCubeLogo;