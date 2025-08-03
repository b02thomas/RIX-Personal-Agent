// /src/components/navigation/enhanced-sidebar.tsx
// Enhanced sidebar navigation component implementing Phase 2 design specifications
// Features collapsible sidebar, project hierarchy, responsive behavior, and theme integration
// RELEVANT FILES: navigation-store.ts, design-system.css, theme-toggle.tsx

'use client';

import React, { useEffect, useState } from 'react';
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
  LayoutGrid: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LayoutGrid })), { ssr: false }),
  FolderOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen })), { ssr: false }),
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  
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
  
  // Brand icon
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false })
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
  Folder: Icons.Folder,
  PlusCircle: Icons.PlusCircle
};

interface EnhancedSidebarProps {
  className?: string;
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
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
  
  const { navigationItems, activeNavItem } = useNavigationItems();
  const [mounted, setMounted] = useState(false);

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
    const currentItem = navigationItems.find(item => pathname.startsWith(item.href));
    if (currentItem && currentItem.id !== activeNavItem) {
      setActiveNavItem(currentItem.id);
    }
  }, [pathname, navigationItems, activeNavItem, setActiveNavItem]);

  // Don't render on mobile (will be handled by mobile navigation)
  if (!mounted || isMobile) {
    return null;
  }

  const handleNavItemClick = (item: any) => {
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
        'rix-sidebar',
        isCollapsed && 'rix-sidebar--collapsed',
        className
      )}
      aria-label="Main navigation"
    >
      {/* Sidebar Header */}
      <div className="rix-sidebar-header">
        <div className="rix-sidebar-brand">
          <Icons.Zap className="rix-sidebar-brand__icon" />
          <span className="rix-sidebar-brand__text">RIX</span>
        </div>
        
        <button
          onClick={toggleSidebar}
          className="rix-sidebar-toggle rix-interactive"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <Icons.PanelLeftOpen className="w-4 h-4" />
          ) : (
            <Icons.PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 space-y-1" role="navigation">
        {navigationItems.map((item) => {
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
                    'rix-nav-item w-full',
                    isActive && 'rix-nav-item--active',
                    isProjectsExpanded && item.id === 'projects' && 'rix-nav-item--expanded'
                  )}
                  aria-expanded={isProjectsExpanded}
                  aria-controls={item.id === 'projects' ? 'projects-submenu' : undefined}
                >
                  <IconComponent className="rix-nav-item__icon" />
                  <span className="rix-nav-item__label">{item.name}</span>
                  {!isCollapsed && (
                    <Icons.ChevronRight className="rix-nav-item__expand-icon" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => handleNavItemClick(item)}
                  className={cn(
                    'rix-nav-item',
                    isActive && 'rix-nav-item--active'
                  )}
                >
                  <IconComponent className="rix-nav-item__icon" />
                  <span className="rix-nav-item__label">{item.name}</span>
                </Link>
              )}

              {/* Projects Submenu */}
              {item.id === 'projects' && isProjectsExpanded && !isCollapsed && (
                <div 
                  id="projects-submenu"
                  className="rix-nav-submenu"
                  role="list"
                  aria-label="Projects"
                >
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className={cn(
                        'rix-nav-submenu-item w-full',
                        activeProject === project.id && 'rix-nav-submenu-item--active'
                      )}
                      title={project.description}
                    >
                      <Icons.Folder className="rix-nav-submenu-item__icon" />
                      <span className="flex-1 text-left truncate">{project.name}</span>
                      {project.isActive && (
                        <div 
                          className="w-2 h-2 rounded-full bg-green-500" 
                          title="Active project"
                        />
                      )}
                    </button>
                  ))}
                  
                  {/* Add Project Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement add project functionality
                      console.log('Add new project');
                    }}
                    className="rix-nav-submenu-item w-full text-blue-400 hover:text-blue-300"
                    title="Add new project"
                  >
                    <Icons.PlusCircle className="rix-nav-submenu-item__icon" />
                    <span className="flex-1 text-left">Projekt hinzufügen</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="rix-sidebar-footer">
        {/* Theme Toggle */}
        <div className="mb-4 px-2">
          <ThemeToggle 
            size="sm" 
            showLabel={!isCollapsed}
            className={cn(
              'justify-center',
              isCollapsed ? 'w-full' : 'justify-start'
            )}
          />
        </div>

        {/* User Profile */}
        {user && (
          <div className="rix-sidebar-user">
            <div className="rix-sidebar-user__avatar">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : <Icons.User className="w-4 h-4" />}
            </div>
            
            {!isCollapsed && (
              <div className="rix-sidebar-user__info">
                <div className="rix-sidebar-user__name">
                  {user.firstName || user.email || 'User'}
                </div>
                <div className="rix-sidebar-user__email">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

// Tooltip component for collapsed state
const NavTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  side?: 'right' | 'left';
}> = ({ children, content, side = 'right' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg',
            'whitespace-nowrap pointer-events-none',
            side === 'right' ? 'left-full ml-2' : 'right-full mr-2',
            'top-1/2 -translate-y-1/2'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// Compact navigation item for collapsed state
const CompactNavItem: React.FC<{
  item: any;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const IconComponent = iconMap[item.icon] || Icons.LayoutGrid;

  return (
    <NavTooltip content={`${item.name} - ${item.description}`}>
      <button
        onClick={onClick}
        className={cn(
          'rix-nav-item w-full justify-center',
          isActive && 'rix-nav-item--active'
        )}
        aria-label={item.name}
      >
        <IconComponent className="rix-nav-item__icon" />
      </button>
    </NavTooltip>
  );
};