// /src/components/navigation/__tests__/enhanced-sidebar.test.tsx
// Comprehensive test suite for enhanced sidebar navigation component
// Tests sidebar collapse/expand, project navigation, responsive behavior, and accessibility
// RELEVANT FILES: enhanced-sidebar.tsx, navigation-store.ts, theme-toggle.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedSidebar } from '../enhanced-sidebar';

// Mock the stores
const mockNavigationStore = {
  isCollapsed: false,
  expandedSections: ['projects'],
  projects: [
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
      description: 'Skill development tracking',
      isActive: false,
      lastAccessed: new Date(Date.now() - 86400000),
      color: '#34D399'
    }
  ],
  activeProject: null,
  toggleSidebar: jest.fn(),
  toggleSection: jest.fn(),
  setActiveProject: jest.fn(),
  setActiveNavItem: jest.fn(),
};

const mockNavigationItems = {
  navigationItems: [
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
      id: 'settings',
      name: 'Settings',
      href: '/dashboard/settings',
      icon: 'Settings',
      description: 'Einstellungen'
    }
  ],
  activeNavItem: 'dashboard',
  setActiveNavItem: jest.fn()
};

const mockResponsiveNavigation = {
  isMobile: false,
  updateBreakpoint: jest.fn()
};

const mockAuthStore = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  }
};

jest.mock('@/store/navigation-store', () => ({
  useNavigationStore: () => mockNavigationStore,
  useNavigationItems: () => mockNavigationItems,
  useResponsiveNavigation: () => mockResponsiveNavigation,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock theme toggle component
jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: ({ size, showLabel, className }: any) => (
    <div data-testid="theme-toggle" className={className}>
      Theme Toggle ({size}) {showLabel && '- with label'}
    </div>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  LayoutGrid: (props: any) => <div data-testid="layout-grid-icon" {...props} />,
  FolderOpen: (props: any) => <div data-testid="folder-open-icon" {...props} />,
  CheckSquare: (props: any) => <div data-testid="check-square-icon" {...props} />,
  Settings: (props: any) => <div data-testid="settings-icon" {...props} />,
  Folder: (props: any) => <div data-testid="folder-icon" {...props} />,
  PlusCircle: (props: any) => <div data-testid="plus-circle-icon" {...props} />,
  ChevronRight: (props: any) => <div data-testid="chevron-right-icon" {...props} />,
  PanelLeftClose: (props: any) => <div data-testid="panel-left-close-icon" {...props} />,
  PanelLeftOpen: (props: any) => <div data-testid="panel-left-open-icon" {...props} />,
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  Zap: (props: any) => <div data-testid="zap-icon" {...props} />,
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(dynamicFunction: any) {
    const DynamicComponent = dynamicFunction();
    DynamicComponent.preload = jest.fn();
    return DynamicComponent;
  };
});

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('EnhancedSidebar Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset store state
    mockNavigationStore.isCollapsed = false;
    mockNavigationStore.expandedSections = ['projects'];
    mockNavigationStore.activeProject = null;
    mockNavigationItems.activeNavItem = 'dashboard';
    mockResponsiveNavigation.isMobile = false;
  });

  describe('Basic Rendering', () => {
    it('renders sidebar with proper structure', () => {
      render(<EnhancedSidebar />);
      
      // Check main structure
      expect(screen.getByRole('complementary', { name: 'Main navigation' })).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check brand
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByText('RIX')).toBeInTheDocument();
      
      // Check toggle button
      expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
    });

    it('renders all navigation items', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projekte')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders navigation icons correctly', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByTestId('layout-grid-icon')).toBeInTheDocument();
      expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-square-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<EnhancedSidebar className="custom-sidebar" />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('custom-sidebar');
    });

    it('shows user information when user is present', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of firstName
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows theme toggle', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Sidebar Collapse/Expand', () => {
    it('renders expanded sidebar by default', () => {
      render(<EnhancedSidebar />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('rix-sidebar');
      expect(sidebar).not.toHaveClass('rix-sidebar--collapsed');
    });

    it('renders collapsed sidebar when isCollapsed is true', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('rix-sidebar--collapsed');
    });

    it('toggles sidebar when toggle button is clicked', async () => {
      render(<EnhancedSidebar />);
      
      const toggleButton = screen.getByRole('button', { name: 'Collapse sidebar' });
      await user.click(toggleButton);
      
      expect(mockNavigationStore.toggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('shows correct toggle icon for expanded state', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByTestId('panel-left-close-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('panel-left-open-icon')).not.toBeInTheDocument();
    });

    it('shows correct toggle icon for collapsed state', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      expect(screen.getByTestId('panel-left-open-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('panel-left-close-icon')).not.toBeInTheDocument();
    });

    it('hides brand text when collapsed', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      const brandText = screen.getByText('RIX');
      expect(brandText).toHaveClass('rix-sidebar-brand__text');
    });

    it('shows theme toggle without label when collapsed', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).not.toHaveTextContent('with label');
    });

    it('shows theme toggle with label when expanded', () => {
      render(<EnhancedSidebar />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toHaveTextContent('with label');
    });
  });

  describe('Navigation Item Interactions', () => {
    it('sets active nav item when navigation link is clicked', async () => {
      render(<EnhancedSidebar />);
      
      const tasksLink = screen.getByText('Tasks').closest('a');
      await user.click(tasksLink!);
      
      expect(mockNavigationItems.setActiveNavItem).toHaveBeenCalledWith('tasks');
    });

    it('highlights active navigation item', () => {
      mockNavigationItems.activeNavItem = 'tasks';
      render(<EnhancedSidebar />);
      
      const tasksItem = screen.getByText('Tasks').closest('a');
      expect(tasksItem).toHaveClass('rix-nav-item--active');
    });

    it('handles expandable items (projects) correctly', async () => {
      render(<EnhancedSidebar />);
      
      const projectsButton = screen.getByText('Projekte').closest('button');
      await user.click(projectsButton!);
      
      expect(mockNavigationStore.setActiveNavItem).toHaveBeenCalledWith('projects');
      expect(mockNavigationStore.toggleSection).toHaveBeenCalledWith('projects');
    });

    it('shows chevron icon for expandable items', () => {
      render(<EnhancedSidebar />);
      
      // Projects is expandable, should have chevron
      const projectsItem = screen.getByText('Projekte').closest('button');
      expect(projectsItem).toContainElement(screen.getByTestId('chevron-right-icon'));
    });

    it('applies expanded class to expanded items', () => {
      mockNavigationItems.activeNavItem = 'projects';
      render(<EnhancedSidebar />);
      
      const projectsButton = screen.getByText('Projekte').closest('button');
      expect(projectsButton).toHaveClass('rix-nav-item--expanded');
    });
  });

  describe('Projects Submenu', () => {
    it('shows projects when projects section is expanded', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('Personal Productivity')).toBeInTheDocument();
      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
    });

    it('hides projects when projects section is collapsed', () => {
      mockNavigationStore.expandedSections = [];
      render(<EnhancedSidebar />);
      
      expect(screen.queryByText('Personal Productivity')).not.toBeInTheDocument();
      expect(screen.queryByText('Learning Goals')).not.toBeInTheDocument();
    });

    it('hides projects when sidebar is collapsed', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      expect(screen.queryByText('Personal Productivity')).not.toBeInTheDocument();
      expect(screen.queryByText('Learning Goals')).not.toBeInTheDocument();
    });

    it('handles project selection', async () => {
      render(<EnhancedSidebar />);
      
      const firstProject = screen.getByText('Personal Productivity');
      await user.click(firstProject);
      
      expect(mockNavigationStore.setActiveProject).toHaveBeenCalledWith('project-1');
    });

    it('highlights active project', () => {
      mockNavigationStore.activeProject = 'project-1';
      render(<EnhancedSidebar />);
      
      const activeProject = screen.getByText('Personal Productivity').closest('button');
      expect(activeProject).toHaveClass('rix-nav-submenu-item--active');
    });

    it('shows active indicator for active projects', () => {
      render(<EnhancedSidebar />);
      
      // Personal Productivity has isActive: true
      const activeProjectButton = screen.getByText('Personal Productivity').closest('button');
      const activeIndicator = activeProjectButton?.querySelector('div[title="Active project"]');
      expect(activeIndicator).toBeInTheDocument();
    });

    it('shows add project button', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('Projekt hinzufügen')).toBeInTheDocument();
      expect(screen.getByTestId('plus-circle-icon')).toBeInTheDocument();
    });

    it('handles add project button click', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<EnhancedSidebar />);
      
      const addButton = screen.getByText('Projekt hinzufügen');
      await user.click(addButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Add new project');
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Behavior', () => {
    it('does not render on mobile devices', () => {
      mockResponsiveNavigation.isMobile = true;
      const { container } = render(<EnhancedSidebar />);
      
      expect(container.firstChild).toBeNull();
    });

    it('calls updateBreakpoint on window resize', () => {
      render(<EnhancedSidebar />);
      
      // Simulate window resize
      act(() => {
        global.innerWidth = 800;
        global.dispatchEvent(new Event('resize'));
      });
      
      expect(mockResponsiveNavigation.updateBreakpoint).toHaveBeenCalledWith(800);
    });

    it('updates active nav item based on pathname', () => {
      // Mock usePathname to return tasks path
      const mockUsePathname = jest.fn(() => '/dashboard/tasks');
      jest.doMock('next/navigation', () => ({
        usePathname: mockUsePathname,
      }));
      
      render(<EnhancedSidebar />);
      
      // Should set active nav item to tasks based on pathname
      expect(mockNavigationItems.setActiveNavItem).toHaveBeenCalledWith('tasks');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByRole('complementary', { name: 'Main navigation' })).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has proper button accessibility for toggle', () => {
      render(<EnhancedSidebar />);
      
      const toggleButton = screen.getByRole('button', { name: 'Collapse sidebar' });
      expect(toggleButton).toHaveAttribute('title', 'Collapse sidebar');
    });

    it('has proper button accessibility for expanded toggle', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      const toggleButton = screen.getByRole('button', { name: 'Expand sidebar' });
      expect(toggleButton).toHaveAttribute('title', 'Expand sidebar');
    });

    it('has proper ARIA attributes for expandable items', () => {
      render(<EnhancedSidebar />);
      
      const projectsButton = screen.getByText('Projekte').closest('button');
      expect(projectsButton).toHaveAttribute('aria-expanded', 'true');
      expect(projectsButton).toHaveAttribute('aria-controls', 'projects-submenu');
    });

    it('has proper ARIA attributes for collapsed expandable items', () => {
      mockNavigationStore.expandedSections = [];
      render(<EnhancedSidebar />);
      
      const projectsButton = screen.getByText('Projekte').closest('button');
      expect(projectsButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('has proper role and aria-label for projects submenu', () => {
      render(<EnhancedSidebar />);
      
      const submenu = screen.getByRole('list', { name: 'Projects' });
      expect(submenu).toHaveAttribute('id', 'projects-submenu');
    });

    it('provides descriptive titles for project items', () => {
      render(<EnhancedSidebar />);
      
      const firstProject = screen.getByText('Personal Productivity').closest('button');
      expect(firstProject).toHaveAttribute('title', 'Daily task management and habits');
    });
  });

  describe('User Profile Section', () => {
    it('shows user avatar with first letter', () => {
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of 'Test'
    });

    it('shows user icon when no firstName', () => {
      mockAuthStore.user.firstName = '';
      render(<EnhancedSidebar />);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('shows fallback name when no firstName', () => {
      mockAuthStore.user.firstName = '';
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('handles user without email gracefully', () => {
      mockAuthStore.user = { id: 'user-1', email: '', firstName: '', lastName: '' };
      render(<EnhancedSidebar />);
      
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('hides user info when sidebar is collapsed', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      // User info should not be visible when collapsed
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('passes correct props to theme toggle when expanded', () => {
      render(<EnhancedSidebar />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toHaveTextContent('Theme Toggle (sm) - with label');
    });

    it('passes correct props to theme toggle when collapsed', () => {
      mockNavigationStore.isCollapsed = true;
      render(<EnhancedSidebar />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toHaveTextContent('Theme Toggle (sm)');
      expect(themeToggle).not.toHaveTextContent('with label');
    });
  });

  describe('Performance and Memory', () => {
    it('cleans up resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<EnhancedSidebar />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('prevents unnecessary re-renders when pathname changes to same route', () => {
      const setActiveNavItemSpy = jest.spyOn(mockNavigationItems, 'setActiveNavItem');
      
      // Current active is 'dashboard', pathname is '/dashboard'
      mockNavigationItems.activeNavItem = 'dashboard';
      render(<EnhancedSidebar />);
      
      // Should not call setActiveNavItem again if already active
      expect(setActiveNavItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user gracefully', () => {
      mockAuthStore.user = null;
      
      const { container } = render(<EnhancedSidebar />);
      
      // Should render without crashing
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryByText('T')).not.toBeInTheDocument();
    });

    it('handles empty navigation items', () => {
      mockNavigationItems.navigationItems = [];
      
      render(<EnhancedSidebar />);
      
      // Should render structure without navigation items
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('handles empty projects list', () => {
      mockNavigationStore.projects = [];
      
      render(<EnhancedSidebar />);
      
      // Should show add project button even with empty projects
      expect(screen.getByText('Projekt hinzufügen')).toBeInTheDocument();
      expect(screen.queryByText('Personal Productivity')).not.toBeInTheDocument();
    });
  });
});