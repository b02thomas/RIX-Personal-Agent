// /frontend-fixes/components/FixedSidebar.tsx
// Fixed sidebar component addressing critical issues: duplicate user info, missing logo, proper theme toggle, News tab
// Includes authentication persistence, RIX cube logo, and improved German language support
// RELEVANT FILES: RIXCubeLogo.tsx, useAuthPersistence.ts, navigation-store.ts, auth-store.ts

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useNavigationStore, useNavigationItems, useResponsiveNavigation } from '@/store/navigation-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RIXCubeLogo } from './RIXCubeLogo';
import { useAuthPersistence } from '../hooks/useAuthPersistence';

// Dynamic icon imports for performance optimization
const Icons = {
  // Navigation icons
  LayoutGrid: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LayoutGrid })), { ssr: false }),
  FolderOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen })), { ssr: false }),
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Newspaper: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Newspaper })), { ssr: false }),
  
  // Project icons
  Folder: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Folder })), { ssr: false }),
  PlusCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.PlusCircle })), { ssr: false }),
  
  // UI icons
  ChevronRight: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight })), { ssr: false }),
  PanelLeftClose: dynamic(() => import('lucide-react').then(mod => ({ default: mod.PanelLeftClose })), { ssr: false }),
  PanelLeftOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.PanelLeftOpen })), { ssr: false }),
  
  // User icons
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  LogOut: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LogOut })), { ssr: false }),
  
  // Status icons
  Wifi: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Wifi })), { ssr: false }),
  WifiOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.WifiOff })), { ssr: false })
};

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutGrid: Icons.LayoutGrid,
  FolderOpen: Icons.FolderOpen,
  CheckSquare: Icons.CheckSquare,
  RotateCcw: Icons.RotateCcw,
  Calendar: Icons.Calendar,
  BarChart3: Icons.BarChart3,
  Settings: Icons.Settings,
  Newspaper: Icons.Newspaper,
  Folder: Icons.Folder,
  PlusCircle: Icons.PlusCircle
};

interface FixedSidebarProps {
  className?: string;
}

export const FixedSidebar: React.FC<FixedSidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const { user, isAuthenticated, forceLogout } = useAuthPersistence();
  const { isMobile, updateBreakpoint } = useResponsiveNavigation();
  
  const {
    isCollapsed,
    expandedSections,
    projects,
    activeProject,
    toggleSidebar,
    toggleSection,
    setActiveProject,
    setActiveNavItem
  } = useNavigationStore();
  
  const [mounted, setMounted] = useState(false);

  // Enhanced navigation items with News tab
  const enhancedNavigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutGrid',
      description: 'Zentrale Übersicht'
    },
    {
      id: 'projects',
      name: 'Projekte',
      href: '/dashboard/projects',
      icon: 'FolderOpen',
      description: 'Projektmanagement',
      expandable: true
    },
    {
      id: 'tasks',
      name: 'Aufgaben',
      href: '/dashboard/tasks',
      icon: 'CheckSquare',
      description: 'Aufgabenverwaltung'
    },
    {
      id: 'routines',
      name: 'Routinen',
      href: '/dashboard/routines',
      icon: 'RotateCcw',
      description: 'Gewohnheiten & Routinen'
    },
    {
      id: 'calendar',
      name: 'Kalender',
      href: '/dashboard/calendar',
      icon: 'Calendar',
      description: 'Terminplanung'
    },
    {
      id: 'news',
      name: 'News',
      href: '/dashboard/news',
      icon: 'Newspaper',
      description: 'Trading Intelligence & Nachrichten'
    },
    {
      id: 'intelligence',
      name: 'Intelligence',
      href: '/dashboard/intelligence',
      icon: 'BarChart3',
      description: 'KI-Einblicke Dashboard'
    },
    {
      id: 'settings',
      name: 'Einstellungen',
      href: '/dashboard/settings',
      icon: 'Settings',
      description: 'System-Einstellungen'
    }
  ];

  const [activeNavItem, setActiveNavItemState] = useState('dashboard');

  // Handle responsive behavior
  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => {
      updateBreakpoint(window.innerWidth);
    };
    
    // Set initial breakpoint
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBreakpoint]);

  // Update active nav item based on current pathname
  useEffect(() => {
    const currentItem = enhancedNavigationItems.find(item => pathname.startsWith(item.href));
    if (currentItem && currentItem.id !== activeNavItem) {
      setActiveNavItemState(currentItem.id);
      setActiveNavItem(currentItem.id);
    }
  }, [pathname, activeNavItem, setActiveNavItem]);

  // Don't render on mobile (will be handled by mobile navigation)
  if (!mounted || isMobile) {
    return null;
  }

  const handleNavItemClick = (item: any) => {
    setActiveNavItemState(item.id);
    setActiveNavItem(item.id);
    
    // If clicking on projects, toggle the section
    if (item.id === 'projects' && item.expandable) {
      toggleSection('projects');
    }
  };

  const handleProjectClick = (projectId: string) => {
    setActiveProject(activeProject === projectId ? null : projectId);
  };

  const isProjectsExpanded = expandedSections.includes('projects');

  return (
    <aside
      className={cn(
        'rix-sidebar fixed left-0 top-0 z-40 h-screen',
        'bg-rix-surface border-r border-rix-border-primary',
        'transform transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-72',
        className
      )}
      aria-label="Haupt-Navigation"
    >
      {/* Sidebar Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-4 border-b border-rix-border-primary',
        isCollapsed && 'justify-center'
      )}>
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed && 'justify-center'
        )}>
          {/* RIX Cube Logo */}
          <RIXCubeLogo 
            size={isCollapsed ? 'sm' : 'md'} 
            animated={true}
            onClick={() => {
              // Navigate to dashboard on logo click
              window.location.href = '/dashboard';
            }}
          />
          
          {/* Brand Text */}
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-rix-text-primary">RIX</span>
              <span className="text-xs text-rix-text-secondary">Personal Agent</span>
            </div>
          )}
        </div>
        
        {/* Collapse Toggle */}
        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-rix-bg-secondary transition-colors"
            aria-label="Seitenleiste minimieren"
            title="Seitenleiste minimieren"
          >
            <Icons.PanelLeftClose className="w-4 h-4 text-rix-text-secondary" />
          </button>
        )}
        
        {/* Expand Toggle (collapsed state) */}
        {isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-4 p-2 bg-rix-surface border border-rix-border-primary rounded-full hover:bg-rix-bg-secondary transition-colors"
            aria-label="Seitenleiste erweitern"
            title="Seitenleiste erweitern"
          >
            <Icons.PanelLeftOpen className="w-3 h-3 text-rix-text-secondary" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1" role="navigation">
        {enhancedNavigationItems.map((item) => {
          const IconComponent = iconMap[item.icon] || Icons.LayoutGrid;
          const isActive = activeNavItem === item.id;
          const isExpandable = item.expandable;

          return (
            <div key={item.id}>
              {/* Main Navigation Item */}
              {isExpandable ? (
                <button
                  onClick={() => handleNavItemClick(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                    'hover:bg-rix-bg-secondary',
                    isActive && 'bg-rix-accent-primary text-white shadow-md',
                    isProjectsExpanded && item.id === 'projects' && 'bg-rix-bg-secondary',
                    isCollapsed && 'justify-center px-2'
                  )}
                  aria-expanded={isProjectsExpanded}
                  aria-controls={item.id === 'projects' ? 'projects-submenu' : undefined}
                  title={isCollapsed ? item.description : ''}
                >
                  <IconComponent className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-rix-text-secondary'
                  )} />
                  {!isCollapsed && (
                    <>
                      <span className={cn(
                        'flex-1 text-left font-medium',
                        isActive ? 'text-white' : 'text-rix-text-primary'
                      )}>
                        {item.name}
                      </span>
                      <Icons.ChevronRight className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        isActive ? 'text-white' : 'text-rix-text-tertiary',
                        isProjectsExpanded && 'rotate-90'
                      )} />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => handleNavItemClick(item)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                    'hover:bg-rix-bg-secondary',
                    isActive && 'bg-rix-accent-primary text-white shadow-md',
                    isCollapsed && 'justify-center px-2'
                  )}
                  title={isCollapsed ? item.description : ''}
                >
                  <IconComponent className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-rix-text-secondary'
                  )} />
                  {!isCollapsed && (
                    <span className={cn(
                      'flex-1 text-left font-medium',
                      isActive ? 'text-white' : 'text-rix-text-primary'
                    )}>
                      {item.name}
                    </span>
                  )}
                </Link>
              )}

              {/* Projects Submenu */}
              {item.id === 'projects' && isProjectsExpanded && !isCollapsed && (
                <div 
                  id="projects-submenu"
                  className="ml-8 mt-2 space-y-1"
                  role="list"
                  aria-label="Projekte"
                >
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                        'hover:bg-rix-bg-secondary',
                        activeProject === project.id && 'bg-rix-bg-secondary border-l-2 border-rix-accent-primary'
                      )}
                      title={project.description}
                    >
                      <Icons.Folder className="w-4 h-4 text-rix-text-tertiary flex-shrink-0" />
                      <span className="flex-1 text-left text-sm text-rix-text-primary truncate">
                        {project.name}
                      </span>
                      {project.isActive && (
                        <div 
                          className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" 
                          title="Aktives Projekt"
                        />
                      )}
                    </button>
                  ))}
                  
                  {/* Add Project Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement add project functionality
                      console.log('Neues Projekt hinzufügen');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-rix-accent-primary hover:bg-rix-bg-secondary transition-colors"
                    title="Neues Projekt hinzufügen"
                  >
                    <Icons.PlusCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left text-sm">Projekt hinzufügen</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="px-3 py-4 border-t border-rix-border-primary">
        {/* Theme Toggle */}
        <div className={cn(
          'mb-4',
          isCollapsed ? 'flex justify-center' : ''
        )}>
          <ThemeToggle 
            size="sm" 
            showLabel={!isCollapsed}
            className={cn(
              isCollapsed ? 'w-10 h-10 p-0' : 'w-full justify-start px-3 py-2'
            )}
          />
        </div>

        {/* Connection Status */}
        <div className={cn(
          'mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-rix-bg-secondary',
          isCollapsed && 'justify-center px-2'
        )}>
          {isAuthenticated ? (
            <>
              <Icons.Wifi className="w-4 h-4 text-green-500" />
              {!isCollapsed && (
                <span className="text-xs text-rix-text-secondary">Verbunden</span>
              )}
            </>
          ) : (
            <>
              <Icons.WifiOff className="w-4 h-4 text-red-500" />
              {!isCollapsed && (
                <span className="text-xs text-rix-text-secondary">Getrennt</span>
              )}
            </>
          )}
        </div>

        {/* User Profile - SINGLE INSTANCE ONLY */}
        {user && isAuthenticated && (
          <div className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-lg bg-rix-bg-secondary',
            isCollapsed && 'justify-center px-2'
          )}>
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-rix-accent-primary flex items-center justify-center flex-shrink-0">
              {user.firstName ? (
                <span className="text-sm font-medium text-white">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <Icons.User className="w-4 h-4 text-white" />
              )}
            </div>
            
            {/* User Info - Only show when not collapsed */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-rix-text-primary truncate">
                  {user.firstName || 'Benutzer'}
                </div>
                <div className="text-xs text-rix-text-tertiary truncate">
                  {user.email}
                </div>
              </div>
            )}

            {/* Logout Button */}
            {!isCollapsed && (
              <button
                onClick={forceLogout}
                className="p-1 rounded hover:bg-rix-bg-primary transition-colors"
                title="Abmelden"
                aria-label="Abmelden"
              >
                <Icons.LogOut className="w-4 h-4 text-rix-text-tertiary" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FixedSidebar;