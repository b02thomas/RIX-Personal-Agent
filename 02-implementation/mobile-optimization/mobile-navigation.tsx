// /02-implementation/mobile-optimization/mobile-navigation.tsx
// Enhanced mobile navigation component with drawer menu and bottom navigation
// Provides seamless mobile experience with touch gestures, haptic feedback, and accessibility
// RELEVANT FILES: enhanced-sidebar.tsx, responsive-breakpoints.css, navigation-store.ts, touch-optimizations.css

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useNavigationStore, useNavigationItems, useResponsiveNavigation } from '@/store/navigation-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/auth-store';

// Dynamic icon imports for performance optimization
const Icons = {
  // Navigation icons
  Menu: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Menu })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  Home: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Home })), { ssr: false }),
  FolderOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen })), { ssr: false }),
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  
  // Interaction icons
  ChevronRight: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight })), { ssr: false }),
  ChevronDown: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown })), { ssr: false }),
  
  // User icons
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  LogOut: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LogOut })), { ssr: false }),
  
  // Brand icon
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false })
};

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<any>> = {
  Home: Icons.Home,
  FolderOpen: Icons.FolderOpen,
  CheckSquare: Icons.CheckSquare,
  RotateCcw: Icons.RotateCcw,
  Calendar: Icons.Calendar,
  Settings: Icons.Settings
};

interface MobileNavigationProps {
  className?: string;
}

// Haptic feedback utility
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isMobile, isTablet, updateBreakpoint } = useResponsiveNavigation();
  
  const {
    expandedSections,
    projects,
    activeProject,
    toggleSection,
    setActiveProject,
    setActiveNavItem
  } = useNavigationStore();
  
  const { navigationItems, activeNavItem } = useNavigationItems();
  
  // Mobile navigation state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for gesture handling
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Handle responsive behavior
  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      updateBreakpoint(window.innerWidth);
      
      // Auto-close drawer on desktop/tablet
      if (window.innerWidth >= 1024) {
        setIsDrawerOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBreakpoint]);

  // Update active nav item based on pathname
  useEffect(() => {
    const currentItem = navigationItems.find(item => pathname.startsWith(item.href));
    if (currentItem && currentItem.id !== activeNavItem) {
      setActiveNavItem(currentItem.id);
    }
  }, [pathname, navigationItems, activeNavItem, setActiveNavItem]);

  // Primary navigation items for bottom nav
  const primaryNavItems = useMemo(() => 
    navigationItems.slice(0, 5).map(item => ({
      ...item,
      icon: iconMap[item.icon] || Icons.Home
    })),
    [navigationItems]
  );

  // Handle drawer toggle with haptic feedback
  const handleDrawerToggle = useCallback(() => {
    triggerHapticFeedback('light');
    setIsDrawerOpen(!isDrawerOpen);
  }, [isDrawerOpen]);

  // Handle navigation item click
  const handleNavItemClick = useCallback((item: any) => {
    triggerHapticFeedback('light');
    setActiveNavItem(item.id);
    
    // Close drawer for mobile navigation
    if (isMobile) {
      setIsDrawerOpen(false);
    }
    
    // Handle expandable items
    if (item.expandable) {
      toggleSection(item.id);
    }
  }, [setActiveNavItem, isMobile, toggleSection]);

  // Handle project selection
  const handleProjectClick = useCallback((projectId: string) => {
    triggerHapticFeedback('light');
    setActiveProject(activeProject === projectId ? null : projectId);
  }, [activeProject, setActiveProject]);

  // Touch gesture handlers for swipe-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(false);
    touchStartTimeRef.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isDrawerOpen) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Only handle horizontal swipes
    if (deltaY > 30) return;
    
    // Start dragging if swipe is significant
    if (Math.abs(deltaX) > 10 && !isDragging) {
      setIsDragging(true);
    }
    
    // Apply transform during drag
    if (isDragging && drawerRef.current) {
      const clampedDelta = Math.max(-280, Math.min(0, deltaX));
      drawerRef.current.style.transform = `translateX(${clampedDelta}px)`;
      
      // Update overlay opacity
      if (overlayRef.current) {
        const opacity = Math.max(0, 1 + (clampedDelta / 280));
        overlayRef.current.style.opacity = opacity.toString();
      }
    }
  }, [touchStart, isDrawerOpen, isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isDragging) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaTime = Date.now() - touchStartTimeRef.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Determine if drawer should close
    const shouldClose = deltaX < -70 || (velocity > 0.3 && deltaX < 0);
    
    // Reset transforms
    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
    }
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '';
    }
    
    // Close drawer if gesture indicates it
    if (shouldClose) {
      triggerHapticFeedback('medium');
      setIsDrawerOpen(false);
    }
    
    setTouchStart(null);
    setIsDragging(false);
  }, [touchStart, isDragging]);

  // Handle outside click to close drawer
  const handleOverlayClick = useCallback(() => {
    triggerHapticFeedback('light');
    setIsDrawerOpen(false);
  }, []);

  // Don't render on desktop (sidebar handles navigation)
  if (!mounted || (!isMobile && !isTablet)) {
    return null;
  }

  const isProjectsExpanded = expandedSections.includes('projects');

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="mobile-top-nav mobile-safe-top">
        <div className="mobile-top-nav__container">
          {/* Brand Section */}
          <div className="mobile-top-nav__brand">
            <Icons.Zap className="mobile-top-nav__brand-icon" />
            <span className="mobile-top-nav__brand-text">RIX</span>
          </div>
          
          {/* Menu Button */}
          <button
            onClick={handleDrawerToggle}
            className="mobile-touch-target mobile-top-nav__menu-button"
            aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-drawer-menu"
          >
            {isDrawerOpen ? (
              <Icons.X className="w-6 h-6" />
            ) : (
              <Icons.Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          ref={overlayRef}
          className="mobile-drawer-overlay"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      <nav
        ref={drawerRef}
        id="mobile-drawer-menu"
        className={cn(
          'mobile-drawer',
          isDrawerOpen && 'mobile-drawer--open'
        )}
        aria-label="Main navigation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer Header */}
        <div className="mobile-drawer__header mobile-safe-top">
          <div className="mobile-drawer__brand">
            <Icons.Zap className="mobile-drawer__brand-icon" />
            <span className="mobile-drawer__brand-text">RIX Personal Agent</span>
          </div>
          
          <button
            onClick={handleDrawerToggle}
            className="mobile-touch-target mobile-drawer__close-button"
            aria-label="Close navigation menu"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="mobile-drawer__content">
          {navigationItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Icons.Home;
            const isActive = activeNavItem === item.id;
            const isExpandable = item.expandable;
            const isSectionExpanded = isExpandable && expandedSections.includes(item.id);

            return (
              <div key={item.id} className="mobile-drawer__nav-section">
                {/* Main Navigation Item */}
                {isExpandable ? (
                  <button
                    onClick={() => handleNavItemClick(item)}
                    className={cn(
                      'mobile-drawer__nav-item mobile-touch-target',
                      isActive && 'mobile-drawer__nav-item--active'
                    )}
                    aria-expanded={isSectionExpanded}
                    aria-controls={`mobile-${item.id}-submenu`}
                  >
                    <IconComponent className="mobile-drawer__nav-icon" />
                    <span className="mobile-drawer__nav-label">{item.name}</span>
                    {isSectionExpanded ? (
                      <Icons.ChevronDown className="mobile-drawer__expand-icon" />
                    ) : (
                      <Icons.ChevronRight className="mobile-drawer__expand-icon" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleNavItemClick(item)}
                    className={cn(
                      'mobile-drawer__nav-item mobile-touch-target',
                      isActive && 'mobile-drawer__nav-item--active'
                    )}
                  >
                    <IconComponent className="mobile-drawer__nav-icon" />
                    <span className="mobile-drawer__nav-label">{item.name}</span>
                  </Link>
                )}

                {/* Projects Submenu */}
                {item.id === 'projects' && isSectionExpanded && (
                  <div 
                    id="mobile-projects-submenu"
                    className="mobile-drawer__submenu"
                  >
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className={cn(
                          'mobile-drawer__submenu-item mobile-touch-target',
                          activeProject === project.id && 'mobile-drawer__submenu-item--active'
                        )}
                      >
                        <div className="mobile-drawer__project-indicator" />
                        <span className="mobile-drawer__submenu-label">{project.name}</span>
                        <div 
                          className={cn(
                            'mobile-drawer__project-status',
                            project.isActive && 'mobile-drawer__project-status--active'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="mobile-drawer__footer mobile-safe-bottom">
          {/* Theme Toggle */}
          <div className="mobile-drawer__theme-section">
            <ThemeToggle 
              size="md" 
              showLabel={true}
              className="mobile-drawer__theme-toggle"
            />
          </div>

          {/* User Profile */}
          {user && (
            <div className="mobile-drawer__user">
              <div className="mobile-drawer__user-avatar">
                {user.firstName ? (
                  user.firstName.charAt(0).toUpperCase()
                ) : (
                  <Icons.User className="w-5 h-5" />
                )}
              </div>
              <div className="mobile-drawer__user-info">
                <div className="mobile-drawer__user-name">
                  {user.firstName || user.email || 'User'}
                </div>
                <div className="mobile-drawer__user-email">
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav mobile-safe-bottom" aria-label="Primary navigation">
        <div className="mobile-bottom-nav__container">
          {primaryNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeNavItem === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavItemClick(item)}
                className={cn(
                  'mobile-bottom-nav__item mobile-touch-target',
                  isActive && 'mobile-bottom-nav__item--active'
                )}
                aria-label={item.name}
              >
                <IconComponent className="mobile-bottom-nav__icon" />
                <span className="mobile-bottom-nav__label">{item.name}</span>
                {isActive && <div className="mobile-bottom-nav__active-indicator" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

// Pull-to-refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(distance);
      setIsPulling(distance > threshold);
    }
  }, [threshold, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHapticFeedback('medium');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setIsPulling(false);
    startY.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const pullProgress = Math.min(1, pullDistance / threshold);

  return (
    <div
      ref={containerRef}
      className={cn('mobile-pull-to-refresh', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          'mobile-pull-indicator',
          isPulling && 'mobile-pull-indicator--ready',
          isRefreshing && 'mobile-pull-indicator--refreshing'
        )}
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          opacity: pullProgress
        }}
      >
        <div className="mobile-pull-indicator__icon">
          {isRefreshing ? (
            <div className="mobile-refresh-spinner" />
          ) : (
            <Icons.ChevronDown 
              className={cn(
                'mobile-pull-arrow',
                isPulling && 'mobile-pull-arrow--flip'
              )} 
            />
          )}
        </div>
        <span className="mobile-pull-indicator__text">
          {isRefreshing ? 'Aktualisiere...' : isPulling ? 'Loslassen zum Aktualisieren' : 'Ziehen zum Aktualisieren'}
        </span>
      </div>
      
      {children}
    </div>
  );
};

export default MobileNavigation;