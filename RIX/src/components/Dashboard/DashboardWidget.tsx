// /src/components/Dashboard/DashboardWidget.tsx
// Reusable dashboard widget with glassmorphism design and skeleton loading states
// Supports various widget types with accessibility and responsive design
// RELEVANT FILES: DashboardLayout.tsx, BreathingAnimation.tsx, theme-provider.tsx, dashboard.module.css

'use client';

import React, { ReactNode, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BreathingAnimation } from '../ui/BreathingAnimation';
import { useTheme } from '@/components/providers/theme-provider';

export interface DashboardWidgetProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  variant?: 'today' | 'goals' | 'calendar' | 'actions' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showHeader?: boolean;
  headerActions?: ReactNode;
  enableBreathing?: boolean;
}

const variantStyles = {
  today: {
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400'
  },
  goals: {
    gradient: 'from-green-500/10 via-green-500/5 to-transparent',
    border: 'border-green-500/20 hover:border-green-500/40',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400'
  },
  calendar: {
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400'
  },
  actions: {
    gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400'
  },
  default: {
    gradient: 'from-gray-500/10 via-gray-500/5 to-transparent',
    border: 'border-gray-500/20 hover:border-gray-500/30',
    iconBg: 'bg-gray-500/20',
    iconColor: 'text-gray-400'
  }
};

const sizeStyles = {
  sm: {
    container: 'p-4 min-h-[150px]',
    title: 'text-lg',
    subtitle: 'text-sm'
  },
  md: {
    container: 'p-6 min-h-[200px]',
    title: 'text-xl',
    subtitle: 'text-base'
  },
  lg: {
    container: 'p-6 min-h-[250px]',
    title: 'text-2xl',
    subtitle: 'text-lg'
  },
  xl: {
    container: 'p-8 min-h-[300px]',
    title: 'text-3xl',
    subtitle: 'text-xl'
  }
};

// Skeleton loading component
const WidgetSkeleton: React.FC<{ variant: keyof typeof variantStyles }> = ({ variant }) => {
  const styles = variantStyles[variant];
  
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className={cn('w-8 h-8 rounded-lg', styles.iconBg.replace('/20', '/30'))} />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
      </div>
      
      {/* Footer skeleton */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200/20 dark:border-gray-700/20">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  );
};

// Error state component
const WidgetError: React.FC<{ 
  error: string; 
  onRefresh?: () => void; 
  variant: keyof typeof variantStyles 
}> = ({ error, onRefresh, variant }) => {
  const styles = variantStyles[variant];
  
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
      <div className={cn('p-3 rounded-full', styles.iconBg)}>
        <svg className={cn('w-6 h-6', styles.iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
          Something went wrong
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">
          {error}
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
              'hover:bg-opacity-80 active:scale-95',
              styles.iconBg,
              styles.iconColor
            )}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  subtitle,
  icon,
  children,
  isLoading = false,
  error = null,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  onRefresh,
  refreshing = false,
  showHeader = true,
  headerActions,
  enableBreathing = true
}) => {
  const { effectiveTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  const styles = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  const widgetContent = (
    <div
      ref={widgetRef}
      className={cn(
        // Base styles
        'relative overflow-hidden rounded-2xl transition-all duration-300',
        sizeConfig.container,
        
        // Glassmorphism effect
        'backdrop-blur-sm',
        effectiveTheme === 'dark' 
          ? 'bg-gray-800/40 shadow-xl shadow-black/20' 
          : 'bg-white/60 shadow-lg shadow-black/10',
        
        // Border and gradient
        'border',
        styles.border,
        
        // Interactive states
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        isHovered && 'shadow-2xl',
        
        // Custom styles
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50',
        styles.gradient
      )} />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        {showHeader && (title || icon || headerActions) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  styles.iconBg
                )}>
                  <div className={cn('w-5 h-5', styles.iconColor)}>
                    {icon}
                  </div>
                </div>
              )}
              
              {(title || subtitle) && (
                <div className="space-y-1">
                  {title && (
                    <h3 className={cn(
                      'font-semibold text-gray-900 dark:text-white tracking-tight',
                      sizeConfig.title
                    )}>
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className={cn(
                      'text-gray-600 dark:text-gray-400',
                      sizeConfig.subtitle
                    )}>
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Header actions */}
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
            
            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                disabled={refreshing}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-200',
                  'hover:bg-black/5 dark:hover:bg-white/10',
                  refreshing && 'animate-spin cursor-not-allowed opacity-50',
                  styles.iconColor
                )}
                aria-label="Refresh widget"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content area */}
        <div className="flex-1 flex flex-col">
          {error ? (
            <WidgetError error={error} onRefresh={onRefresh} variant={variant} />
          ) : isLoading ? (
            <WidgetSkeleton variant={variant} />
          ) : (
            <div className="flex-1">
              {children}
            </div>
          )}
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className={cn(
        'absolute inset-0 opacity-0 transition-opacity duration-300',
        'bg-gradient-to-br from-white/5 to-transparent',
        isHovered && 'opacity-100'
      )} />
    </div>
  );

  return enableBreathing ? (
    <BreathingAnimation
      intensity="subtle"
      duration={4000}
      pauseOnHover
      enabled={!isLoading && !error}
    >
      {widgetContent}
    </BreathingAnimation>
  ) : (
    widgetContent
  );
};

// Preset widget variants
export const TodayWidget: React.FC<Omit<DashboardWidgetProps, 'variant'>> = (props) => (
  <DashboardWidget variant="today" {...props} />
);

export const GoalsWidget: React.FC<Omit<DashboardWidgetProps, 'variant'>> = (props) => (
  <DashboardWidget variant="goals" {...props} />
);

export const CalendarWidget: React.FC<Omit<DashboardWidgetProps, 'variant'>> = (props) => (
  <DashboardWidget variant="calendar" {...props} />
);

export const ActionsWidget: React.FC<Omit<DashboardWidgetProps, 'variant'>> = (props) => (
  <DashboardWidget variant="actions" {...props} />
);

export default DashboardWidget;