// /src/store/navigation-store.ts
// Navigation state management store for sidebar collapse/expand and mobile drawer
// Manages sidebar navigation state with persistence and responsive behavior
// RELEVANT FILES: components/navigation/enhanced-sidebar.tsx, preferences-store.ts, dashboard-layout.tsx

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NavigationProject {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  lastAccessed: Date;
  color?: string;
}

interface NavigationState {
  // Sidebar state
  isCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  
  // Project navigation
  expandedSections: string[];
  activeNavItem: string;
  projects: NavigationProject[];
  activeProject: string | null;
  
  // Responsive state
  isMobile: boolean;
  isTablet: boolean;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions - Sidebar Management
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
  
  // Actions - Section Management  
  toggleSection: (sectionId: string) => void;
  setActiveNavItem: (itemId: string) => void;
  expandSection: (sectionId: string) => void;
  collapseSection: (sectionId: string) => void;
  
  // Actions - Project Management
  addProject: (project: Omit<NavigationProject, 'id' | 'lastAccessed'>) => void;
  removeProject: (projectId: string) => void;
  setActiveProject: (projectId: string | null) => void;
  updateProject: (projectId: string, updates: Partial<NavigationProject>) => void;
  reorderProjects: (projectIds: string[]) => void;
  
  // Actions - Responsive Management
  setIsMobile: (isMobile: boolean) => void;
  setIsTablet: (isTablet: boolean) => void;
  
  // Actions - Utility
  resetNavigation: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultProjects: NavigationProject[] = [
  {
    id: 'project-1',
    name: 'Personal Productivity',
    description: 'Daily task management and habits',
    isActive: true,
    lastAccessed: new Date(),
    color: '#60A5FA'
  },
  {
    id: 'project-2', 
    name: 'Learning Goals',
    description: 'Skill development and knowledge tracking',
    isActive: false,
    lastAccessed: new Date(Date.now() - 86400000), // Yesterday
    color: '#34D399'
  }
];

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      isCollapsed: false,
      isMobileDrawerOpen: false,
      expandedSections: ['projects'], // Projects section expanded by default
      activeNavItem: 'dashboard',
      projects: defaultProjects,
      activeProject: null,
      isMobile: false,
      isTablet: false,
      isLoading: false,
      error: null,

      // Sidebar Management Actions
      toggleSidebar: () => {
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          // Auto-close mobile drawer when toggling desktop sidebar
          isMobileDrawerOpen: false
        }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set(() => ({
          isCollapsed: collapsed,
          // Collapse all sections when sidebar is collapsed
          expandedSections: collapsed ? [] : ['projects']
        }));
      },

      openMobileDrawer: () => {
        set(() => ({
          isMobileDrawerOpen: true
        }));
      },

      closeMobileDrawer: () => {
        set(() => ({
          isMobileDrawerOpen: false
        }));
      },

      toggleMobileDrawer: () => {
        set((state) => ({
          isMobileDrawerOpen: !state.isMobileDrawerOpen
        }));
      },

      // Section Management Actions
      toggleSection: (sectionId: string) => {
        set((state) => {
          const isExpanded = state.expandedSections.includes(sectionId);
          if (isExpanded) {
            return {
              expandedSections: state.expandedSections.filter(id => id !== sectionId)
            };
          } else {
            return {
              expandedSections: [...state.expandedSections, sectionId]
            };
          }
        });
      },

      setActiveNavItem: (itemId: string) => {
        set(() => ({
          activeNavItem: itemId,
          // Close mobile drawer when selecting navigation item
          isMobileDrawerOpen: false
        }));
      },

      expandSection: (sectionId: string) => {
        set((state) => {
          if (!state.expandedSections.includes(sectionId)) {
            return {
              expandedSections: [...state.expandedSections, sectionId]
            };
          }
          return state;
        });
      },

      collapseSection: (sectionId: string) => {
        set((state) => ({
          expandedSections: state.expandedSections.filter(id => id !== sectionId)
        }));
      },

      // Project Management Actions
      addProject: (projectData) => {
        set((state) => {
          const newProject: NavigationProject = {
            ...projectData,
            id: `project-${Date.now()}`,
            lastAccessed: new Date()
          };
          
          return {
            projects: [...state.projects, newProject],
            // Auto-expand projects section when adding new project
            expandedSections: state.expandedSections.includes('projects') 
              ? state.expandedSections 
              : [...state.expandedSections, 'projects']
          };
        });
      },

      removeProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter(p => p.id !== projectId),
          // Clear active project if it's being removed
          activeProject: state.activeProject === projectId ? null : state.activeProject
        }));
      },

      setActiveProject: (projectId: string | null) => {
        set((state) => {
          // Update last accessed date when setting active project
          if (projectId) {
            const updatedProjects = state.projects.map(project =>
              project.id === projectId
                ? { ...project, lastAccessed: new Date() }
                : project
            );
            
            return {
              activeProject: projectId,
              projects: updatedProjects
            };
          }
          
          return {
            activeProject: null
          };
        });
      },

      updateProject: (projectId: string, updates: Partial<NavigationProject>) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, ...updates, lastAccessed: new Date() }
              : project
          )
        }));
      },

      reorderProjects: (projectIds: string[]) => {
        set((state) => {
          const reorderedProjects = projectIds
            .map(id => state.projects.find(p => p.id === id))
            .filter(Boolean) as NavigationProject[];
          
          return {
            projects: reorderedProjects
          };
        });
      },

      // Responsive Management Actions
      setIsMobile: (isMobile: boolean) => {
        set(() => ({
          isMobile,
          // Auto-close mobile drawer when switching to desktop
          isMobileDrawerOpen: isMobile ? get().isMobileDrawerOpen : false
        }));
      },

      setIsTablet: (isTablet: boolean) => {
        set(() => ({
          isTablet,
          // Auto-collapse sidebar on tablet
          isCollapsed: isTablet ? true : get().isCollapsed
        }));
      },

      // Utility Actions
      resetNavigation: () => {
        set(() => ({
          isCollapsed: false,
          isMobileDrawerOpen: false,
          expandedSections: ['projects'],
          activeNavItem: 'dashboard',
          projects: defaultProjects,
          activeProject: null,
          error: null
        }));
      },

      setLoading: (loading: boolean) => {
        set(() => ({
          isLoading: loading
        }));
      },

      setError: (error: string | null) => {
        set(() => ({
          error
        }));
      }
    }),
    {
      name: 'rix-navigation',
      partialize: (state) => ({
        // Persist only essential navigation state
        isCollapsed: state.isCollapsed,
        expandedSections: state.expandedSections,
        activeNavItem: state.activeNavItem,
        projects: state.projects,
        activeProject: state.activeProject
      }),
      version: 1,
      migrate: (persistedState, version) => {
        // Handle future migrations if navigation state structure changes
        if (version === 0) {
          return {
            ...(persistedState || {}),
            projects: defaultProjects
          } as NavigationState;
        }
        return persistedState as NavigationState;
      }
    }
  )
);

// Helper hooks for common navigation patterns
export const useActiveProject = () => {
  const { projects, activeProject } = useNavigationStore();
  return projects.find(p => p.id === activeProject) || null;
};

export const useNavigationItems = () => {
  const { activeNavItem, setActiveNavItem } = useNavigationStore();
  
  const navigationItems = [
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
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: 'CheckSquare',
      description: 'Aufgabenverwaltung'
    },
    {
      id: 'routines',
      name: 'Routines',
      href: '/dashboard/routines',
      icon: 'RotateCcw',
      description: 'Gewohnheiten & Routinen'
    },
    {
      id: 'calendar',
      name: 'Kalender',
      href: '/dashboard/calendar',
      icon: 'Calendar',
      description: 'Tägliches Management'
    },
    {
      id: 'intelligence',
      name: 'Intelligence',
      href: '/dashboard/intelligence',
      icon: 'BarChart3',
      description: 'AI Insights Dashboard'
    },
    {
      id: 'settings',
      name: 'Settings',
      href: '/dashboard/settings',
      icon: 'Settings',
      description: 'Einstellungen'
    }
  ];
  
  return {
    navigationItems,
    activeNavItem,
    setActiveNavItem
  };
};

// Responsive hook for navigation behavior
export const useResponsiveNavigation = () => {
  const { isMobile, isTablet, setIsMobile, setIsTablet, isCollapsed, setSidebarCollapsed } = useNavigationStore();
  
  const updateBreakpoint = (width: number) => {
    const newIsMobile = width < 768;
    const newIsTablet = width >= 768 && width < 1024;
    
    if (newIsMobile !== isMobile) {
      setIsMobile(newIsMobile);
    }
    
    if (newIsTablet !== isTablet) {
      setIsTablet(newIsTablet);
      // Auto-collapse on tablet, auto-expand on desktop
      if (newIsTablet && !isCollapsed) {
        setSidebarCollapsed(true);
      } else if (!newIsTablet && !newIsMobile && isCollapsed) {
        setSidebarCollapsed(false);
      }
    }
  };
  
  return {
    isMobile,
    isTablet,
    updateBreakpoint
  };
};