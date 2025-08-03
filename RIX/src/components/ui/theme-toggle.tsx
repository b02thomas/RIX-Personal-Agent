// /src/components/ui/theme-toggle.tsx
// Enhanced theme toggle component with smooth transitions and accessibility support
// Implements RIX design system theme switching with visual feedback and state persistence
// RELEVANT FILES: preferences-store.ts, design-system.css, globals.css

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/store/preferences-store';

// Dynamic icon imports for performance optimization
const Icons = {
  Sun: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sun })), { ssr: false }),
  Moon: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Moon })), { ssr: false }),
  Monitor: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Monitor })), { ssr: false })
};

export interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  disabled?: boolean;
  showSystemOption?: boolean;
  variant?: 'toggle' | 'dropdown';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  showLabel = false,
  className,
  disabled = false,
  showSystemOption = false,
  variant = 'toggle'
}) => {
  const { preferences, setTheme } = usePreferencesStore();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document element
  useEffect(() => {
    if (!mounted) return;

    const applyTheme = () => {
      const root = document.documentElement;
      
      if (preferences.theme === 'system') {
        // Use system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
        if (systemDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } else {
        // Use explicit theme
        root.setAttribute('data-theme', preferences.theme);
        if (preferences.theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [preferences.theme, mounted]);

  const handleThemeChange = async () => {
    if (disabled) return;

    setIsTransitioning(true);

    // Determine next theme based on current theme and options
    let nextTheme: 'light' | 'dark' | 'system';
    
    if (showSystemOption) {
      // Cycle through: light -> dark -> system -> light
      switch (preferences.theme) {
        case 'light':
          nextTheme = 'dark';
          break;
        case 'dark':
          nextTheme = 'system';
          break;
        case 'system':
        default:
          nextTheme = 'light';
          break;
      }
    } else {
      // Simple toggle: light <-> dark
      nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    }

    // Add transition class for smooth theme change
    document.documentElement.style.setProperty('transition', 'background-color 200ms ease, color 200ms ease');
    
    setTheme(nextTheme);

    // Remove transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      document.documentElement.style.removeProperty('transition');
    }, 200);
  };

  // Get current effective theme for display
  const getEffectiveTheme = () => {
    if (!mounted) return 'dark'; // Default during SSR
    
    if (preferences.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preferences.theme;
  };

  const effectiveTheme = getEffectiveTheme();
  const isDark = effectiveTheme === 'dark';

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-11 h-6',
      slider: 'w-4 h-4',
      icon: 'w-3 h-3',
      translate: 'translate-x-5'
    },
    md: {
      container: 'w-14 h-7',
      slider: 'w-5 h-5',
      icon: 'w-3 h-3',
      translate: 'translate-x-7'
    },
    lg: {
      container: 'w-16 h-8',
      slider: 'w-6 h-6',
      icon: 'w-4 h-4',
      translate: 'translate-x-8'
    }
  };

  const config = sizeConfig[size];

  if (!mounted) {
    // Render placeholder during SSR to prevent hydration mismatch
    return (
      <div className={cn(
        'rix-theme-toggle',
        config.container,
        'bg-gray-200 dark:bg-gray-700',
        className
      )}>
        <div className={cn(
          'rix-theme-toggle-slider',
          config.slider,
          'bg-white dark:bg-gray-800'
        )} />
      </div>
    );
  }

  if (variant === 'toggle') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          onClick={handleThemeChange}
          disabled={disabled || isTransitioning}
          className={cn(
            'rix-theme-toggle rix-interactive',
            config.container,
            'relative rounded-full border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            isDark 
              ? 'bg-blue-600/20 border-blue-500 rix-theme-toggle--dark' 
              : 'bg-gray-200 border-gray-300',
            disabled && 'opacity-50 cursor-not-allowed',
            isTransitioning && 'pointer-events-none'
          )}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          title={`Current theme: ${preferences.theme}${preferences.theme === 'system' ? ` (${effectiveTheme})` : ''}`}
        >
          <div
            className={cn(
              'rix-theme-toggle-slider',
              config.slider,
              'absolute left-1 top-1 rounded-full transition-all duration-200',
              'flex items-center justify-center shadow-sm',
              isDark
                ? cn(config.translate, 'bg-blue-500 border-blue-500 text-white')
                : 'translate-x-0 bg-white border-gray-300 text-gray-600'
            )}
          >
            {preferences.theme === 'system' ? (
              <Icons.Monitor className={config.icon} />
            ) : isDark ? (
              <Icons.Moon className={config.icon} />
            ) : (
              <Icons.Sun className={config.icon} />
            )}
          </div>
        </button>

        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {preferences.theme === 'system' ? `Auto (${effectiveTheme})` : preferences.theme}
          </span>
        )}
      </div>
    );
  }

  // Dropdown variant (for future implementation)
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleThemeChange}
        disabled={disabled}
        className={cn(
          'rix-interactive',
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
          'border border-gray-200 dark:border-gray-600',
          'text-sm font-medium text-gray-700 dark:text-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="Change theme"
      >
        {preferences.theme === 'system' ? (
          <Icons.Monitor className="w-4 h-4" />
        ) : isDark ? (
          <Icons.Moon className="w-4 h-4" />
        ) : (
          <Icons.Sun className="w-4 h-4" />
        )}
        
        {showLabel && (
          <span className="capitalize">
            {preferences.theme === 'system' ? 'Auto' : preferences.theme}
          </span>
        )}
      </button>
    </div>
  );
};

// Simple theme toggle hook for use in other components
export const useThemeToggle = () => {
  const { preferences, setTheme } = usePreferencesStore();
  
  const toggleTheme = () => {
    setTheme(preferences.theme === 'dark' ? 'light' : 'dark');
  };
  
  return {
    theme: preferences.theme,
    toggleTheme,
    setTheme
  };
};

// Theme-aware component wrapper
export const ThemeAware: React.FC<{
  children: React.ReactNode;
  lightClass?: string;
  darkClass?: string;
  className?: string;
}> = ({ children, lightClass = '', darkClass = '', className = '' }) => {
  const { preferences } = usePreferencesStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={className}>{children}</div>;

  const effectiveTheme = preferences.theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preferences.theme;

  return (
    <div className={cn(
      className,
      effectiveTheme === 'dark' ? darkClass : lightClass
    )}>
      {children}
    </div>
  );
};