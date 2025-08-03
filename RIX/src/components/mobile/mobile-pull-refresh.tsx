// /src/components/mobile/mobile-pull-refresh.tsx
// Pull-to-refresh component optimized for mobile PWA with haptic feedback
// Provides smooth pull-to-refresh interactions with visual feedback and loading states
// RELEVANT FILES: use-mobile-gestures.ts, use-haptic-feedback.ts, mobile-touch-optimizer.tsx

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileOptimization } from './mobile-touch-optimizer';
import dynamic from 'next/dynamic';

// Dynamic icon imports
const Icons = {
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  ChevronDown: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown })), { ssr: false })
};

interface MobilePullRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number;
  className?: string;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export const MobilePullRefresh: React.FC<MobilePullRefreshProps> = ({
  children,
  onRefresh,
  enabled = true,
  threshold = 80,
  className,
  refreshingText = 'Aktualisiere...',
  pullText = 'Zum Aktualisieren ziehen',
  releaseText = 'Loslassen zum Aktualisieren'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback();
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const [touchStart, setTouchStart] = useState<{ y: number; time: number } | null>(null);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !isMobile || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only enable pull-to-refresh when at the top of the scroll container
    if (container.scrollTop > 0) return;
    
    setTouchStart({
      y: e.touches[0].clientY,
      time: Date.now()
    });
  }, [enabled, isMobile, isRefreshing]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart || !enabled || !isMobile || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const deltaY = e.touches[0].clientY - touchStart.y;
    
    // Only handle downward pulls
    if (deltaY <= 0) {
      setPullDistance(0);
      setCanRefresh(false);
      return;
    }
    
    // Prevent default scrolling when pulling down
    e.preventDefault();
    
    // Apply resistance to the pull distance for a natural feel
    const resistance = 0.5;
    const adjustedDistance = Math.pow(deltaY * resistance, 0.8);
    const maxDistance = threshold * 1.5;
    const finalDistance = Math.min(adjustedDistance, maxDistance);
    
    setPullDistance(finalDistance);
    
    // Trigger haptic feedback when crossing threshold
    if (finalDistance >= threshold && !canRefresh) {
      triggerHaptic('impact', 'medium');
      setCanRefresh(true);
    } else if (finalDistance < threshold && canRefresh) {
      triggerHaptic('selection');
      setCanRefresh(false);
    }
  }, [touchStart, enabled, isMobile, isRefreshing, threshold, triggerHaptic, canRefresh]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!touchStart || !enabled || !isMobile || isRefreshing) return;
    
    setTouchStart(null);
    
    if (canRefresh && pullDistance >= threshold) {
      // Trigger refresh
      triggerHaptic('impact', 'heavy');
      setIsRefreshing(true);
      setCanRefresh(false);
      
      try {
        await onRefresh();
        triggerHaptic('notification', 'medium', 'success');
      } catch (error) {
        triggerHaptic('notification', 'heavy', 'error');
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Animate back to normal position
    setPullDistance(0);
    setCanRefresh(false);
  }, [touchStart, enabled, isMobile, isRefreshing, canRefresh, pullDistance, threshold, triggerHaptic, onRefresh]);

  // Setup touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || !isMobile) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate rotation and opacity for animations
  const rotation = Math.min((pullDistance / threshold) * 180, 180);
  const opacity = Math.min(pullDistance / (threshold * 0.5), 1);

  if (!isMobile || !enabled) {
    // Desktop fallback - just render children
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-auto',
        'touch-manipulation overscroll-contain',
        className
      )}
      style={{
        transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
        transition: touchStart ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'bg-rix-bg-secondary/90 backdrop-blur-sm',
          'border-b border-rix-border-primary',
          'transition-all duration-300 ease-out'
        )}
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
          transform: `translateY(-${Math.max(pullDistance, isRefreshing ? threshold : 0)}px)`
        }}
      >
        <div 
          className="flex items-center gap-2"
          style={{ opacity }}
        >
          {isRefreshing ? (
            <>
              <Icons.RefreshCw 
                className="w-5 h-5 text-rix-accent-primary animate-spin" 
              />
              <span className="text-sm font-medium text-rix-text-primary">
                {refreshingText}
              </span>
            </>
          ) : (
            <>
              <Icons.ChevronDown 
                className={cn(
                  "w-5 h-5 text-rix-text-secondary transition-all duration-200",
                  canRefresh && "text-rix-accent-primary"
                )}
                style={{
                  transform: `rotate(${rotation}deg)`
                }}
              />
              <span className={cn(
                "text-sm font-medium transition-colors duration-200",
                canRefresh ? "text-rix-accent-primary" : "text-rix-text-secondary"
              )}>
                {canRefresh ? releaseText : pullText}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-full">
        {children}
      </div>
    </div>
  );
};

// Hook for easy integration
export const usePullToRefresh = (onRefresh: () => Promise<void>, enabled = true) => {
  const { isMobile } = useMobileOptimization();
  
  const PullRefreshWrapper = useCallback(({ children, className }: { 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <MobilePullRefresh
      onRefresh={onRefresh}
      enabled={enabled && isMobile}
      className={className}
    >
      {children}
    </MobilePullRefresh>
  ), [onRefresh, enabled, isMobile]);

  return {
    PullRefreshWrapper,
    isSupported: isMobile && enabled
  };
};