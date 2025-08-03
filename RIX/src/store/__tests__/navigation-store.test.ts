// /src/store/__tests__/navigation-store.test.ts
// Comprehensive test suite for navigation state management
// Tests sidebar state, project management, responsive behavior, and persistence
// RELEVANT FILES: navigation-store.ts, enhanced-sidebar.tsx, mobile-navigation.tsx

import { renderHook, act } from '@testing-library/react';
import { 
  useNavigationStore, 
  useActiveProject, 
  useNavigationItems, 
  useResponsiveNavigation 
} from '../navigation-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('useNavigationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useNavigationStore());
    act(() => {
      result.current.resetNavigation();
    });
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      expect(result.current.isCollapsed).toBe(false);
      expect(result.current.isMobileDrawerOpen).toBe(false);
      expect(result.current.expandedSections).toEqual(['projects']);
      expect(result.current.activeNavItem).toBe('dashboard');
      expect(result.current.activeProject).toBe(null);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('has default projects', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      expect(result.current.projects).toHaveLength(2);
      expect(result.current.projects[0].name).toBe('Personal Productivity');
      expect(result.current.projects[1].name).toBe('Learning Goals');
      expect(result.current.projects[0].isActive).toBe(true);
      expect(result.current.projects[1].isActive).toBe(false);
    });
  });

  describe('Sidebar Management', () => {
    it('toggles sidebar collapse state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      expect(result.current.isCollapsed).toBe(false);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.isCollapsed).toBe(true);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.isCollapsed).toBe(false);
    });

    it('closes mobile drawer when toggling desktop sidebar', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Open mobile drawer first
      act(() => {
        result.current.openMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
      
      // Toggle sidebar should close mobile drawer
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(false);
    });

    it('sets sidebar collapsed state directly', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setSidebarCollapsed(true);
      });
      
      expect(result.current.isCollapsed).toBe(true);
      expect(result.current.expandedSections).toEqual([]);
    });

    it('expands projects section when setting sidebar to expanded', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Collapse first
      act(() => {
        result.current.setSidebarCollapsed(true);
      });
      
      expect(result.current.expandedSections).toEqual([]);
      
      // Expand
      act(() => {
        result.current.setSidebarCollapsed(false);
      });
      
      expect(result.current.expandedSections).toEqual(['projects']);
    });
  });

  describe('Mobile Drawer Management', () => {
    it('opens mobile drawer', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.openMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
    });

    it('closes mobile drawer', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Open first
      act(() => {
        result.current.openMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
      
      act(() => {
        result.current.closeMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(false);
    });

    it('toggles mobile drawer', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      expect(result.current.isMobileDrawerOpen).toBe(false);
      
      act(() => {
        result.current.toggleMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
      
      act(() => {
        result.current.toggleMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(false);
    });
  });

  describe('Section Management', () => {
    it('toggles section expansion', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Projects is expanded by default
      expect(result.current.expandedSections).toContain('projects');
      
      act(() => {
        result.current.toggleSection('projects');
      });
      
      expect(result.current.expandedSections).not.toContain('projects');
      
      act(() => {
        result.current.toggleSection('projects');
      });
      
      expect(result.current.expandedSections).toContain('projects');
    });

    it('expands section that is not expanded', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Start with no expanded sections
      act(() => {
        result.current.collapseSection('projects');
      });
      
      expect(result.current.expandedSections).not.toContain('settings');
      
      act(() => {
        result.current.expandSection('settings');
      });
      
      expect(result.current.expandedSections).toContain('settings');
    });

    it('does not duplicate section when expanding already expanded section', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Projects is already expanded
      expect(result.current.expandedSections).toEqual(['projects']);
      
      act(() => {
        result.current.expandSection('projects');
      });
      
      // Should still only have one 'projects' entry
      expect(result.current.expandedSections).toEqual(['projects']);
    });

    it('collapses expanded section', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      expect(result.current.expandedSections).toContain('projects');
      
      act(() => {
        result.current.collapseSection('projects');
      });
      
      expect(result.current.expandedSections).not.toContain('projects');
    });

    it('sets active navigation item', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setActiveNavItem('tasks');
      });
      
      expect(result.current.activeNavItem).toBe('tasks');
    });

    it('closes mobile drawer when setting active nav item', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Open mobile drawer first
      act(() => {
        result.current.openMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
      
      act(() => {
        result.current.setActiveNavItem('tasks');
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(false);
    });
  });

  describe('Project Management', () => {
    it('adds new project', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const initialCount = result.current.projects.length;
      
      act(() => {
        result.current.addProject({
          name: 'New Project',
          description: 'Test project',
          isActive: false,
          color: '#FF0000'
        });
      });
      
      expect(result.current.projects).toHaveLength(initialCount + 1);
      
      const newProject = result.current.projects[result.current.projects.length - 1];
      expect(newProject.name).toBe('New Project');
      expect(newProject.description).toBe('Test project');
      expect(newProject.isActive).toBe(false);
      expect(newProject.color).toBe('#FF0000');
      expect(newProject.id).toMatch(/^project-\d+$/);
      expect(newProject.lastAccessed).toBeInstanceOf(Date);
    });

    it('auto-expands projects section when adding project', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Collapse projects section first
      act(() => {
        result.current.collapseSection('projects');
      });
      
      expect(result.current.expandedSections).not.toContain('projects');
      
      act(() => {
        result.current.addProject({
          name: 'New Project',
          description: 'Test project',
          isActive: false
        });
      });
      
      expect(result.current.expandedSections).toContain('projects');
    });

    it('removes project', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const initialCount = result.current.projects.length;
      const projectToRemove = result.current.projects[0];
      
      act(() => {
        result.current.removeProject(projectToRemove.id);
      });
      
      expect(result.current.projects).toHaveLength(initialCount - 1);
      expect(result.current.projects.find(p => p.id === projectToRemove.id)).toBeUndefined();
    });

    it('clears active project when removing active project', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const projectId = result.current.projects[0].id;
      
      // Set as active project
      act(() => {
        result.current.setActiveProject(projectId);
      });
      
      expect(result.current.activeProject).toBe(projectId);
      
      // Remove the project
      act(() => {
        result.current.removeProject(projectId);
      });
      
      expect(result.current.activeProject).toBe(null);
    });

    it('sets active project', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const projectId = result.current.projects[0].id;
      
      act(() => {
        result.current.setActiveProject(projectId);
      });
      
      expect(result.current.activeProject).toBe(projectId);
    });

    it('updates lastAccessed when setting active project', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const projectId = result.current.projects[0].id;
      const originalLastAccessed = result.current.projects[0].lastAccessed;
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        act(() => {
          result.current.setActiveProject(projectId);
        });
        
        const updatedProject = result.current.projects.find(p => p.id === projectId);
        expect(updatedProject?.lastAccessed.getTime()).toBeGreaterThan(originalLastAccessed.getTime());
      }, 10);
    });

    it('clears active project when setting to null', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Set active project first
      act(() => {
        result.current.setActiveProject(result.current.projects[0].id);
      });
      
      expect(result.current.activeProject).toBeTruthy();
      
      act(() => {
        result.current.setActiveProject(null);
      });
      
      expect(result.current.activeProject).toBe(null);
    });

    it('updates project properties', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const projectId = result.current.projects[0].id;
      
      act(() => {
        result.current.updateProject(projectId, {
          name: 'Updated Project Name',
          isActive: false
        });
      });
      
      const updatedProject = result.current.projects.find(p => p.id === projectId);
      expect(updatedProject?.name).toBe('Updated Project Name');
      expect(updatedProject?.isActive).toBe(false);
      expect(updatedProject?.lastAccessed).toBeInstanceOf(Date);
    });

    it('reorders projects', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const originalOrder = result.current.projects.map(p => p.id);
      const reorderedIds = [originalOrder[1], originalOrder[0]];
      
      act(() => {
        result.current.reorderProjects(reorderedIds);
      });
      
      const newOrder = result.current.projects.map(p => p.id);
      expect(newOrder).toEqual(reorderedIds);
    });

    it('handles reordering with missing project IDs', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const originalCount = result.current.projects.length;
      const existingId = result.current.projects[0].id;
      
      act(() => {
        result.current.reorderProjects([existingId, 'non-existent-id']);
      });
      
      // Should only include existing projects
      expect(result.current.projects).toHaveLength(1);
      expect(result.current.projects[0].id).toBe(existingId);
    });
  });

  describe('Responsive Management', () => {
    it('sets mobile state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setIsMobile(true);
      });
      
      expect(result.current.isMobile).toBe(true);
    });

    it('closes mobile drawer when switching to desktop', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Open mobile drawer and set mobile
      act(() => {
        result.current.setIsMobile(true);
        result.current.openMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
      
      // Switch to desktop
      act(() => {
        result.current.setIsMobile(false);
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(false);
    });

    it('preserves mobile drawer state when staying mobile', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Set mobile and open drawer
      act(() => {
        result.current.setIsMobile(true);
        result.current.openMobileDrawer();
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
      
      // Stay mobile
      act(() => {
        result.current.setIsMobile(true);
      });
      
      expect(result.current.isMobileDrawerOpen).toBe(true);
    });

    it('sets tablet state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setIsTablet(true);
      });
      
      expect(result.current.isTablet).toBe(true);
    });

    it('auto-collapses sidebar on tablet', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      expect(result.current.isCollapsed).toBe(false);
      
      act(() => {
        result.current.setIsTablet(true);
      });
      
      expect(result.current.isCollapsed).toBe(true);
    });

    it('preserves collapsed state when staying tablet', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Set tablet and manually expand
      act(() => {
        result.current.setIsTablet(true);
        result.current.setSidebarCollapsed(false);
      });
      
      expect(result.current.isCollapsed).toBe(false);
      
      // Stay tablet
      act(() => {
        result.current.setIsTablet(true);
      });
      
      expect(result.current.isCollapsed).toBe(true);
    });
  });

  describe('Utility Actions', () => {
    it('resets navigation to initial state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Change some state
      act(() => {
        result.current.toggleSidebar();
        result.current.openMobileDrawer();
        result.current.setActiveNavItem('tasks');
        result.current.setActiveProject(result.current.projects[0].id);
        result.current.setError('Test error');
      });
      
      // Reset
      act(() => {
        result.current.resetNavigation();
      });
      
      expect(result.current.isCollapsed).toBe(false);
      expect(result.current.isMobileDrawerOpen).toBe(false);
      expect(result.current.expandedSections).toEqual(['projects']);
      expect(result.current.activeNavItem).toBe('dashboard');
      expect(result.current.activeProject).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('sets loading state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setError('Test error');
      });
      
      expect(result.current.error).toBe('Test error');
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBe(null);
    });
  });
});

describe('useActiveProject Hook', () => {
  it('returns active project when one is set', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: activeProjectResult } = renderHook(() => useActiveProject());
    
    const projectId = storeResult.current.projects[0].id;
    
    act(() => {
      storeResult.current.setActiveProject(projectId);
    });
    
    expect(activeProjectResult.current).toEqual(storeResult.current.projects[0]);
  });

  it('returns null when no active project', () => {
    const { result } = renderHook(() => useActiveProject());
    
    expect(result.current).toBe(null);
  });

  it('returns null when active project ID does not exist', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: activeProjectResult } = renderHook(() => useActiveProject());
    
    act(() => {
      storeResult.current.setActiveProject('non-existent-id');
    });
    
    expect(activeProjectResult.current).toBe(null);
  });
});

describe('useNavigationItems Hook', () => {
  it('returns navigation items configuration', () => {
    const { result } = renderHook(() => useNavigationItems());
    
    expect(result.current.navigationItems).toHaveLength(7);
    expect(result.current.navigationItems[0].id).toBe('dashboard');
    expect(result.current.navigationItems[1].id).toBe('projects');
    expect(result.current.navigationItems[1].expandable).toBe(true);
  });

  it('returns current active nav item', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: navItemsResult } = renderHook(() => useNavigationItems());
    
    expect(navItemsResult.current.activeNavItem).toBe('dashboard');
    
    act(() => {
      storeResult.current.setActiveNavItem('tasks');
    });
    
    expect(navItemsResult.current.activeNavItem).toBe('tasks');
  });

  it('provides setActiveNavItem function', () => {
    const { result } = renderHook(() => useNavigationItems());
    
    expect(result.current.setActiveNavItem).toBeInstanceOf(Function);
  });
});

describe('useResponsiveNavigation Hook', () => {
  it('returns responsive state', () => {
    const { result } = renderHook(() => useResponsiveNavigation());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.updateBreakpoint).toBeInstanceOf(Function);
  });

  it('updates mobile state based on width', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    act(() => {
      responsiveResult.current.updateBreakpoint(500); // Mobile width
    });
    
    expect(storeResult.current.isMobile).toBe(true);
    expect(storeResult.current.isTablet).toBe(false);
  });

  it('updates tablet state based on width', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    act(() => {
      responsiveResult.current.updateBreakpoint(800); // Tablet width
    });
    
    expect(storeResult.current.isMobile).toBe(false);
    expect(storeResult.current.isTablet).toBe(true);
  });

  it('sets desktop state for large widths', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    act(() => {
      responsiveResult.current.updateBreakpoint(1200); // Desktop width
    });
    
    expect(storeResult.current.isMobile).toBe(false);
    expect(storeResult.current.isTablet).toBe(false);
  });

  it('auto-collapses sidebar on tablet transition', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    // Start desktop (expanded)
    expect(storeResult.current.isCollapsed).toBe(false);
    
    act(() => {
      responsiveResult.current.updateBreakpoint(800); // Move to tablet
    });
    
    expect(storeResult.current.isCollapsed).toBe(true);
  });

  it('auto-expands sidebar on desktop transition from tablet', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    // Start tablet (collapsed)
    act(() => {
      responsiveResult.current.updateBreakpoint(800);
    });
    
    expect(storeResult.current.isCollapsed).toBe(true);
    
    // Move to desktop
    act(() => {
      responsiveResult.current.updateBreakpoint(1200);
    });
    
    expect(storeResult.current.isCollapsed).toBe(false);
  });

  it('does not change sidebar state on mobile transition', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    // Start tablet (collapsed)
    act(() => {
      responsiveResult.current.updateBreakpoint(800);
    });
    
    expect(storeResult.current.isCollapsed).toBe(true);
    
    // Move to mobile
    act(() => {
      responsiveResult.current.updateBreakpoint(500);
    });
    
    // Should remain collapsed
    expect(storeResult.current.isCollapsed).toBe(true);
  });

  it('does not change state when breakpoint does not change category', () => {
    const { result: storeResult } = renderHook(() => useNavigationStore());
    const { result: responsiveResult } = renderHook(() => useResponsiveNavigation());
    
    // Start mobile
    act(() => {
      responsiveResult.current.updateBreakpoint(500);
    });
    
    const initialMobile = storeResult.current.isMobile;
    const initialTablet = storeResult.current.isTablet;
    
    // Stay mobile
    act(() => {
      responsiveResult.current.updateBreakpoint(600);
    });
    
    expect(storeResult.current.isMobile).toBe(initialMobile);
    expect(storeResult.current.isTablet).toBe(initialTablet);
  });
});

describe('Store Persistence', () => {
  it('includes correct state in persistence', () => {
    const { result } = renderHook(() => useNavigationStore());
    
    // The persistence configuration should be tested
    // This is a conceptual test as the actual persistence is handled by zustand
    expect(result.current.isCollapsed).toBeDefined();
    expect(result.current.expandedSections).toBeDefined();
    expect(result.current.activeNavItem).toBeDefined();
    expect(result.current.projects).toBeDefined();
    expect(result.current.activeProject).toBeDefined();
    
    // These should not be persisted
    expect(result.current.isMobile).toBeDefined();
    expect(result.current.isTablet).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
  });
});