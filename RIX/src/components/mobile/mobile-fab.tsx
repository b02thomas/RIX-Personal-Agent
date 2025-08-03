// /src/components/mobile/mobile-fab.tsx
// Floating Action Button component optimized for mobile interactions
// Provides expandable FAB with smooth animations and haptic feedback for quick actions
// RELEVANT FILES: use-haptic-feedback.ts, mobile-touch-optimizer.tsx, design-system.css

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileOptimization } from './mobile-touch-optimizer';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamic icon imports
const Icons = {
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false })
};

export interface FABAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface MobileFABProps {
  actions?: FABAction[];
  primaryAction?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  expandDirection?: 'up' | 'left' | 'right';
  showLabels?: boolean;
  enableHaptics?: boolean;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  actions = [],
  primaryAction,
  position = 'bottom-right',
  className,
  expandDirection = 'up',
  showLabels = true,
  enableHaptics = true
}) => {
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback(enableHaptics);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        if (isExpanded) {
          triggerHaptic('selection');
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, triggerHaptic]);

  // Don't render on desktop unless there are actions
  if (!mounted || (!isMobile && actions.length === 0)) {
    return null;
  }

  const handlePrimaryClick = () => {
    triggerHaptic('impact', 'medium');
    
    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (primaryAction) {
      primaryAction();
    }
  };

  const handleActionClick = (action: FABAction) => {
    triggerHaptic('impact', 'light');
    action.onClick();
    setIsExpanded(false);
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-20 right-4 md:bottom-6 md:right-6`;
      case 'bottom-left':
        return `${baseClasses} bottom-20 left-4 md:bottom-6 md:left-6`;
      case 'bottom-center':
        return `${baseClasses} bottom-20 left-1/2 transform -translate-x-1/2 md:bottom-6`;
      default:
        return `${baseClasses} bottom-20 right-4 md:bottom-6 md:right-6`;
    }
  };

  const getActionPositionClasses = (index: number) => {
    const baseDistance = 70;
    const distance = baseDistance * (index + 1);
    
    switch (expandDirection) {
      case 'up':
        return {
          transform: isExpanded 
            ? `translateY(-${distance}px)` 
            : 'translateY(0px)',
          opacity: isExpanded ? 1 : 0
        };
      case 'left':
        return {
          transform: isExpanded 
            ? `translateX(-${distance}px)` 
            : 'translateX(0px)',
          opacity: isExpanded ? 1 : 0
        };
      case 'right':
        return {
          transform: isExpanded 
            ? `translateX(${distance}px)` 
            : 'translateX(0px)',
          opacity: isExpanded ? 1 : 0
        };
      default:
        return {
          transform: isExpanded 
            ? `translateY(-${distance}px)` 
            : 'translateY(0px)',
          opacity: isExpanded ? 1 : 0
        };
    }
  };

  const getActionColorClasses = (color: FABAction['color'] = 'primary') => {
    const colorMap = {
      primary: 'bg-rix-accent-primary hover:bg-rix-accent-hover text-white',
      secondary: 'bg-rix-surface hover:bg-rix-border-primary text-rix-text-primary border border-rix-border-primary',
      success: 'bg-rix-success hover:bg-green-600 text-white',
      warning: 'bg-rix-warning hover:bg-yellow-600 text-white',
      error: 'bg-rix-error hover:bg-red-600 text-white'
    };
    return colorMap[color];
  };

  return (
    <div ref={fabRef} className={cn(getPositionClasses(), className)}>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => {
            triggerHaptic('selection');
            setIsExpanded(false);
          }}
        />
      )}

      {/* Action Buttons */}
      {actions.map((action, index) => (
        <div
          key={action.id}
          className="absolute"
          style={{
            ...getActionPositionClasses(index),
            transitionDelay: isExpanded ? `${index * 50}ms` : '0ms',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <div className="flex items-center gap-2">
            {/* Action Label */}
            {showLabels && expandDirection !== 'right' && (
              <div 
                className={cn(
                  "bg-rix-bg-secondary/90 backdrop-blur-sm text-rix-text-primary",
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  "border border-rix-border-primary shadow-lg",
                  "whitespace-nowrap"
                )}
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.2s ease-out',
                  transitionDelay: isExpanded ? `${100 + index * 50}ms` : '0ms'
                }}
              >
                {action.label}
              </div>
            )}

            {/* Action Button */}
            <Button
              size="lg"
              onClick={() => handleActionClick(action)}
              className={cn(
                "w-12 h-12 rounded-full shadow-lg",
                "transition-all duration-200",
                "touch-manipulation active:scale-95",
                getActionColorClasses(action.color)
              )}
            >
              <action.icon className="w-5 h-5" />
            </Button>

            {/* Action Label (Right side) */}
            {showLabels && expandDirection === 'right' && (
              <div 
                className={cn(
                  "bg-rix-bg-secondary/90 backdrop-blur-sm text-rix-text-primary",
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  "border border-rix-border-primary shadow-lg",
                  "whitespace-nowrap"
                )}
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'scale(1)' : 'scale(0.8)',
                  transition: 'all 0.2s ease-out',
                  transitionDelay: isExpanded ? `${100 + index * 50}ms` : '0ms'
                }}
              >
                {action.label}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Main FAB Button */}
      <Button
        size="lg"
        onClick={handlePrimaryClick}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl",
          "bg-rix-accent-primary hover:bg-rix-accent-hover text-white",
          "transition-all duration-300",
          "touch-manipulation active:scale-95",
          "border-2 border-white/10",
          isExpanded && "rotate-45"
        )}
      >
        {actions.length > 0 ? (
          isExpanded ? (
            <Icons.X className="w-6 h-6" />
          ) : (
            <Icons.Plus className="w-6 h-6" />
          )
        ) : (
          <Icons.Plus className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
};

// Quick FAB presets for common use cases
export const getProjectFABActions = (
  onCreateProject: () => void,
  onCreateTask: () => void,
  onQuickNote: () => void
): FABAction[] => [
  {
    id: 'create-project',
    label: 'Neues Projekt',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderPlus })), { ssr: false }),
    onClick: onCreateProject,
    color: 'primary'
  },
  {
    id: 'create-task',
    label: 'Neue Aufgabe',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
    onClick: onCreateTask,
    color: 'secondary'
  },
  {
    id: 'quick-note',
    label: 'Schnellnotiz',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Edit3 })), { ssr: false }),
    onClick: onQuickNote,
    color: 'warning'
  }
];

export const getRoutineFABActions = (
  onCreateRoutine: () => void,
  onQuickHabit: () => void
): FABAction[] => [
  {
    id: 'create-routine',
    label: 'Neue Routine',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
    onClick: onCreateRoutine,
    color: 'primary'
  },
  {
    id: 'quick-habit',
    label: 'Schnelle Gewohnheit',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false }),
    onClick: onQuickHabit,
    color: 'success'
  }
];

export const getCalendarFABActions = (
  onCreateEvent: () => void,
  onQuickBlock: () => void,
  onSetReminder: () => void
): FABAction[] => [
  {
    id: 'create-event',
    label: 'Neuer Termin',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
    onClick: onCreateEvent,
    color: 'primary'
  },
  {
    id: 'quick-block',
    label: 'Zeitblock',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
    onClick: onQuickBlock,
    color: 'secondary'
  },
  {
    id: 'set-reminder',
    label: 'Erinnerung',
    icon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Bell })), { ssr: false }),
    onClick: onSetReminder,
    color: 'warning'
  }
];