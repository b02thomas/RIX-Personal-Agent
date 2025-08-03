// /src/components/navigation/mobile-navigation.tsx
// Mobile navigation component with bottom navigation bar and hamburger drawer
// Implements responsive navigation behavior for mobile devices with touch optimization
// RELEVANT FILES: enhanced-sidebar.tsx, navigation-store.ts, design-system.css

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useNavigationStore, useNavigationItems, useResponsiveNavigation } from '@/store/navigation-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/auth-store';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

// Dynamic icon imports for performance
const Icons = {
  // Primary navigation icons (bottom nav)
  LayoutGrid: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LayoutGrid })), { ssr: false }),
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  Menu: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Menu })), { ssr: false }),
  
  // Secondary navigation icons (drawer)
  FolderOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  
  // Project and UI icons
  Folder: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Folder })), { ssr: false }),
  PlusCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.PlusCircle })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  
  // User icons
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  LogOut: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LogOut })), { ssr: false }),
  
  // Brand icon
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false })
};

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutGrid: Icons.LayoutGrid,
  FolderOpen: Icons.FolderOpen,
  CheckSquare: Icons.CheckSquare,
  RotateCcw: Icons.RotateCcw,
  Calendar: Icons.Calendar,
  BarChart3: Icons.BarChart3,
  Settings: Icons.Settings,
  Folder: Icons.Folder,
  PlusCircle: Icons.PlusCircle
};

interface MobileNavigationProps {
  className?: string;
  enableGestures?: boolean;
  enableHaptics?: boolean;
  enableSwipeToClose?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  className,
  enableGestures = true,
  enableHaptics = true,
  enableSwipeToClose = true
}) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isMobile } = useResponsiveNavigation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const {
    isMobileDrawerOpen,
    projects,
    activeProject,
    toggleMobileDrawer,
    closeMobileDrawer,
    setActiveProject,
    setActiveNavItem
  } = useNavigationStore();
  
  const { navigationItems, activeNavItem } = useNavigationItems();
  const [mounted, setMounted] = useState(false);
  const [isDrawerAnimating, setIsDrawerAnimating] = useState(false);
  const [lastTouchY, setLastTouchY] = useState<number | null>(null);
  
  // Enhanced mobile interaction hooks
  const { triggerHaptic } = useHapticFeedback(enableHaptics);
  const { setupSwipeToClose } = useMobileGestures({
    onSwipeLeft: enableSwipeToClose ? closeMobileDrawer : undefined,
    onSwipeRight: undefined,
    enabled: enableGestures
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update active nav item based on pathname
  useEffect(() => {
    const currentItem = navigationItems.find(item => pathname.startsWith(item.href));
    if (currentItem && currentItem.id !== activeNavItem) {
      setActiveNavItem(currentItem.id);
    }
  }, [pathname, navigationItems, activeNavItem, setActiveNavItem]);

  // Enhanced keyboard and gesture handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        triggerHaptic('impact', 'light');
        closeMobileDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileDrawerOpen, closeMobileDrawer, triggerHaptic]);

  // Setup swipe to close gesture
  useEffect(() => {
    if (enableSwipeToClose && drawerRef.current && isMobileDrawerOpen) {
      return setupSwipeToClose(drawerRef.current);
    }
  }, [enableSwipeToClose, setupSwipeToClose, isMobileDrawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileDrawerOpen]);

  // Define callbacks before any early returns
  const handleNavItemClick = useCallback((item: any) => {
    // Provide haptic feedback for all navigation interactions
    triggerHaptic('impact', 'light');
    
    if (item.action === 'drawer') {
      setIsDrawerAnimating(true);
      toggleMobileDrawer();
      setTimeout(() => setIsDrawerAnimating(false), 300);
    } else {
      setActiveNavItem(item.id);
      if (isMobileDrawerOpen) {
        setIsDrawerAnimating(true);
        closeMobileDrawer();
        setTimeout(() => setIsDrawerAnimating(false), 300);
      }
    }
  }, [triggerHaptic, toggleMobileDrawer, setActiveNavItem, isMobileDrawerOpen, closeMobileDrawer]);

  const handleProjectClick = useCallback((projectId: string) => {
    triggerHaptic('impact', 'light');
    setActiveProject(activeProject === projectId ? null : projectId);
  }, [triggerHaptic, setActiveProject, activeProject]);

  // Don't render on desktop
  if (!mounted || !isMobile) {
    return null;
  }

  // Primary navigation items for bottom nav (5 items max)
  const primaryNavItems = [
    navigationItems.find(item => item.id === 'dashboard'),
    navigationItems.find(item => item.id === 'tasks'),
    navigationItems.find(item => item.id === 'calendar'),
    navigationItems.find(item => item.id === 'intelligence'),
    // Menu item (opens drawer)
    {
      id: 'menu',
      name: 'Menu',
      href: '#',
      icon: 'Menu',
      description: 'More options',
      action: 'drawer' as const
    }
  ].filter(Boolean) as Array<{
    id: string;
    name: string;
    href: string;
    icon: string;
    description: string;
    expandable?: boolean;
    action?: 'drawer';
  }>;

  // Secondary navigation items for drawer
  const secondaryNavItems = navigationItems.filter(item => 
    !['dashboard', 'tasks', 'calendar', 'intelligence'].includes(item.id)
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="rix-mobile-drawer-overlay rix-mobile-drawer-overlay--visible"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'rix-mobile-drawer',
          isMobileDrawerOpen && 'rix-mobile-drawer--open'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Icons.Zap className="w-8 h-8 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">RIX</h2>
          </div>
          
          <button
            onClick={closeMobileDrawer}
            className={cn(
              'p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
              'transition-colors duration-150 touch-manipulation'
            )}
            aria-label="Close menu"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Secondary Navigation Items */}
          {secondaryNavItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Icons.LayoutGrid;
            const isActive = activeNavItem === item.id;

            return (
              <div key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => handleNavItemClick(item)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-150',
                    'min-h-[56px] touch-manipulation',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <IconComponent className="w-6 h-6 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm opacity-70 mt-1">{item.description}</div>
                  </div>
                </Link>

                {/* Projects Submenu in Drawer */}
                {item.id === 'projects' && projects.length > 0 && (
                  <div className="ml-6 mt-2 space-y-1">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className={cn(
                          'flex items-center w-full space-x-3 px-4 py-2 rounded-lg text-sm',
                          'min-h-[44px] touch-manipulation transition-colors duration-150',
                          activeProject === project.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        )}
                      >
                        <Icons.Folder className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left truncate">{project.name}</span>
                        {project.isActive && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => {
                        // TODO: Implement add project
                        console.log('Add new project');
                      }}
                      className={cn(
                        'flex items-center w-full space-x-3 px-4 py-2 rounded-lg text-sm',
                        'min-h-[44px] touch-manipulation transition-colors duration-150',
                        'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      )}
                    >
                      <Icons.PlusCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left">Projekt hinzufügen</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </span>
            <ThemeToggle size="sm" showLabel={false} />
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : <Icons.User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.firstName || user.email || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav 
        className={cn('rix-mobile-nav', className)}
        role="navigation"
        aria-label="Primary navigation"
      >
        {primaryNavItems.map((item) => {
          if (!item) return null;
          
          const IconComponent = item.action === 'drawer' ? Icons.Menu : iconMap[item.icon] || Icons.LayoutGrid;
          const isActive = activeNavItem === item.id;
          const isMenuButton = item.action === 'drawer';

          if (isMenuButton) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item)}
                className={cn(
                  'rix-mobile-nav-item',
                  isMobileDrawerOpen && 'rix-mobile-nav-item--active'
                )}
                aria-label="Open menu"
                aria-expanded={isMobileDrawerOpen}
              >
                <IconComponent className="rix-mobile-nav-item__icon" />
                <span className="rix-mobile-nav-item__label">
                  {isMobileDrawerOpen ? 'Close' : 'Menu'}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleNavItemClick(item)}
              className={cn(
                'rix-mobile-nav-item',
                isActive && 'rix-mobile-nav-item--active'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <IconComponent className="rix-mobile-nav-item__icon" />
              <span className="rix-mobile-nav-item__label">
                {item.name.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};