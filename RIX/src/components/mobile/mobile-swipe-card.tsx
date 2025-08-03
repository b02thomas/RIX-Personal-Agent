// /src/components/mobile/mobile-swipe-card.tsx
// Enhanced swipeable card component for mobile interactions with haptic feedback
// Provides swipe actions, haptic feedback, and touch-optimized interactions for projects and routines
// RELEVANT FILES: use-mobile-gestures.ts, use-haptic-feedback.ts, mobile-touch-optimizer.tsx

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileOptimization } from './mobile-touch-optimizer';
import dynamic from 'next/dynamic';

// Dynamic icon imports
const Icons = {
  Check: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Check })), { ssr: false }),
  Star: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Star })), { ssr: false }),
  Archive: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Archive })), { ssr: false }),
  Trash2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trash2 })), { ssr: false }),
  MoreHorizontal: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MoreHorizontal })), { ssr: false })
};

export interface SwipeAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  action: () => void;
}

interface MobileSwipeCardProps {
  children: React.ReactNode;
  className?: string;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onTap?: () => void;
  onLongPress?: () => void;
  enableSwipe?: boolean;
  enableHaptics?: boolean;
  swipeThreshold?: number;
}

export const MobileSwipeCard: React.FC<MobileSwipeCardProps> = ({
  children,
  className,
  leftActions = [],
  rightActions = [],
  onTap,
  onLongPress,
  enableSwipe = true,
  enableHaptics = true,
  swipeThreshold = 60
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback(enableHaptics);
  
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isActiveSwiping, setIsActiveSwiping] = useState(false);
  const [revealedSide, setRevealedSide] = useState<'left' | 'right' | null>(null);

  // Enhanced gesture handling with dynamic swipe feedback
  const { setupGestures } = useMobileGestures({
    onSwipeLeft: () => {
      if (rightActions.length > 0) {
        triggerHaptic('impact', 'medium');
        setRevealedSide('right');
        setSwipeOffset(-100);
      }
    },
    onSwipeRight: () => {
      if (leftActions.length > 0) {
        triggerHaptic('impact', 'medium');
        setRevealedSide('left');
        setSwipeOffset(100);
      }
    },
    onTap: () => {
      if (revealedSide) {
        // Close revealed actions
        triggerHaptic('selection');
        setRevealedSide(null);
        setSwipeOffset(0);
      } else if (onTap) {
        triggerHaptic('selection');
        onTap();
      }
    },
    onLongPress: () => {
      if (onLongPress) {
        triggerHaptic('impact', 'heavy');
        onLongPress();
      }
    },
    enabled: enableSwipe && isMobile,
    swipeThreshold
  });

  // Setup gesture handling
  useEffect(() => {
    if (cardRef.current && enableSwipe && isMobile) {
      return setupGestures(cardRef.current);
    }
  }, [setupGestures, enableSwipe, isMobile]);

  // Handle action execution
  const executeAction = (action: SwipeAction) => {
    triggerHaptic('impact', 'medium');
    action.action();
    // Close actions after execution
    setTimeout(() => {
      setRevealedSide(null);
      setSwipeOffset(0);
    }, 150);
  };

  // Get action color classes
  const getActionColorClasses = (color: SwipeAction['color']) => {
    const colorMap = {
      green: 'bg-green-500 text-white',
      blue: 'bg-blue-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      gray: 'bg-gray-500 text-white'
    };
    return colorMap[color];
  };

  if (!isMobile) {
    // Desktop fallback - just render the card normally
    return (
      <div className={cn('transition-all duration-200', className)}>
        {children}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-lg',
        'touch-manipulation select-none',
        className
      )}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div 
          className={cn(
            'absolute inset-y-0 left-0 flex items-center',
            'transition-all duration-300 ease-out',
            revealedSide === 'left' ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {leftActions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              className={cn(
                'h-full px-4 flex items-center justify-center',
                'min-w-[80px] touch-manipulation',
                'transition-all duration-200',
                getActionColorClasses(action.color),
                'hover:brightness-110 active:scale-95'
              )}
              style={{
                transitionDelay: `${index * 50}ms`
              }}
              aria-label={action.label}
            >
              <div className="flex flex-col items-center gap-1">
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div 
          className={cn(
            'absolute inset-y-0 right-0 flex items-center',
            'transition-all duration-300 ease-out',
            revealedSide === 'right' ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {rightActions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              className={cn(
                'h-full px-4 flex items-center justify-center',
                'min-w-[80px] touch-manipulation',
                'transition-all duration-200',
                getActionColorClasses(action.color),
                'hover:brightness-110 active:scale-95'
              )}
              style={{
                transitionDelay: `${index * 50}ms`
              }}
              aria-label={action.label}
            >
              <div className="flex flex-col items-center gap-1">
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Card Content */}
      <div
        ref={cardRef}
        className={cn(
          'transition-transform duration-300 ease-out',
          'will-change-transform',
          revealedSide && 'shadow-lg',
          isActiveSwiping && 'transition-none'
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`
        }}
      >
        <div className={cn(
          'bg-rix-bg-secondary',
          'transition-all duration-200',
          revealedSide && 'bg-rix-surface'
        )}>
          {children}
        </div>
      </div>

      {/* Swipe Hint Overlay */}
      {!revealedSide && (leftActions.length > 0 || rightActions.length > 0) && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 transition-opacity duration-200">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            Swipe for actions
          </div>
        </div>
      )}
    </div>
  );
};

// Quick action presets for common use cases
export const getProjectActions = (
  onStar: () => void,
  onEdit: () => void,
  onArchive: () => void,
  onDelete: () => void
): { left: SwipeAction[], right: SwipeAction[] } => ({
  left: [
    {
      id: 'star',
      label: 'Star',
      icon: Icons.Star,
      color: 'yellow',
      action: onStar
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Icons.MoreHorizontal,
      color: 'blue',
      action: onEdit
    }
  ],
  right: [
    {
      id: 'archive',
      label: 'Archive',
      icon: Icons.Archive,
      color: 'gray',
      action: onArchive
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Icons.Trash2,
      color: 'red',
      action: onDelete
    }
  ]
});

export const getRoutineActions = (
  onComplete: () => void,
  onEdit: () => void,
  onStar: () => void
): { left: SwipeAction[], right: SwipeAction[] } => ({
  left: [
    {
      id: 'complete',
      label: 'Complete',
      icon: Icons.Check,
      color: 'green',
      action: onComplete
    }
  ],
  right: [
    {
      id: 'star',
      label: 'Star',
      icon: Icons.Star,
      color: 'yellow',
      action: onStar
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Icons.MoreHorizontal,
      color: 'blue',
      action: onEdit
    }
  ]
});