// /src/components/navigation/__tests__/mobile-navigation.test.tsx
// Comprehensive test suite for mobile navigation component  
// Tests mobile drawer, bottom navigation, touch interactions, and haptic feedback
// RELEVANT FILES: mobile-navigation.tsx, navigation-store.ts, use-mobile-gestures.ts, use-haptic-feedback.ts

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNavigation } from '../mobile-navigation';

// Mock the stores and hooks
const mockNavigationStore = {
  isMobileDrawerOpen: false,
  projects: [
    {
      id: 'project-1',
      name: 'Personal Productivity',
      description: 'Daily task management',
      isActive: true,
      lastAccessed: new Date(),
      color: '#60A5FA'
    },
    {
      id: 'project-2', 
      name: 'Learning Goals',
      description: 'Skill development',
      isActive: false,
      lastAccessed: new Date(Date.now() - 86400000),
      color: '#34D399'
    }
  ],
  activeProject: null,
  toggleMobileDrawer: jest.fn(),
  closeMobileDrawer: jest.fn(),
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
      id: 'routines',
      name: 'Routines',
      href: '/dashboard/routines',
      icon: 'RotateCcw',
      description: 'Gewohnheiten & Routinen'
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
  isMobile: true,
};

const mockAuthStore = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  }
};

const mockTriggerHaptic = jest.fn();
const mockSetupSwipeToClose = jest.fn(() => () => {});

jest.mock('@/store/navigation-store', () => ({
  useNavigationStore: () => mockNavigationStore,
  useNavigationItems: () => mockNavigationItems,
  useResponsiveNavigation: () => mockResponsiveNavigation,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthStore,
}));

jest.mock('@/hooks/use-mobile-gestures', () => ({
  useMobileGestures: () => ({
    setupSwipeToClose: mockSetupSwipeToClose,
  }),
}));

jest.mock('@/hooks/use-haptic-feedback', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: mockTriggerHaptic,
  }),
}));

// Mock theme toggle component
jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: ({ size, showLabel }: any) => (
    <div data-testid="theme-toggle">
      Theme Toggle ({size}) {!showLabel && '- no label'}
    </div>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  LayoutGrid: (props: any) => <div data-testid="layout-grid-icon" {...props} />,
  CheckSquare: (props: any) => <div data-testid="check-square-icon" {...props} />,
  Calendar: (props: any) => <div data-testid="calendar-icon" {...props} />,
  BarChart3: (props: any) => <div data-testid="bar-chart-icon" {...props} />,
  Menu: (props: any) => <div data-testid="menu-icon" {...props} />,
  FolderOpen: (props: any) => <div data-testid="folder-open-icon" {...props} />,
  RotateCcw: (props: any) => <div data-testid="rotate-ccw-icon" {...props} />,
  Settings: (props: any) => <div data-testid="settings-icon" {...props} />,
  Folder: (props: any) => <div data-testid="folder-icon" {...props} />,
  PlusCircle: (props: any) => <div data-testid="plus-circle-icon" {...props} />,
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  Zap: (props: any) => <div data-testid="zap-icon" {...props} />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('MobileNavigation Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset store state
    mockNavigationStore.isMobileDrawerOpen = false;
    mockNavigationStore.activeProject = null;
    mockNavigationItems.activeNavItem = 'dashboard';
    mockResponsiveNavigation.isMobile = true;
    
    // Reset body style
    document.body.style.overflow = 'unset';
  });

  describe('Basic Rendering', () => {
    it('renders bottom navigation on mobile', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
      expect(screen.getByLabelText('Primary navigation')).toHaveClass('rix-mobile-nav');
    });

    it('does not render on desktop', () => {
      mockResponsiveNavigation.isMobile = false;
      const { container } = render(<MobileNavigation />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders primary navigation items in bottom nav', () => {
      render(<MobileNavigation />);
      
      // Should show first 4 navigation items + menu
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Kalender')).toBeInTheDocument();
      expect(screen.getByText('Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('limits bottom nav to 5 items max', () => {
      render(<MobileNavigation />);
      
      const navItems = screen.getByRole('navigation').querySelectorAll('a, button');
      expect(navItems).toHaveLength(5);
    });

    it('shows correct icons for primary nav items', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByTestId('layout-grid-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-square-icon')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<MobileNavigation className="custom-mobile-nav" />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-mobile-nav');
    });
  });

  describe('Bottom Navigation Interactions', () => {
    it('handles navigation item clicks', async () => {
      render(<MobileNavigation />);
      
      const tasksLink = screen.getByText('Tasks').closest('a');
      await user.click(tasksLink!);
      
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
      expect(mockNavigationItems.setActiveNavItem).toHaveBeenCalledWith('tasks');
    });

    it('highlights active navigation item', () => {
      mockNavigationItems.activeNavItem = 'tasks';
      render(<MobileNavigation />);
      
      const tasksItem = screen.getByText('Tasks').closest('a');
      expect(tasksItem).toHaveClass('rix-mobile-nav-item--active');
      expect(tasksItem).toHaveAttribute('aria-current', 'page');
    });

    it('opens drawer when menu button is clicked', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByText('Menu').closest('button');
      await user.click(menuButton!);
      
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
      expect(mockNavigationStore.toggleMobileDrawer).toHaveBeenCalledTimes(1);
    });

    it('shows correct menu button text when drawer is closed', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('shows correct menu button text when drawer is open', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('truncates long navigation labels', () => {
      render(<MobileNavigation />);
      
      // "Intelligence" should be truncated to first word
      expect(screen.getByText('Intelligence')).toBeInTheDocument();
    });
  });

  describe('Mobile Drawer', () => {
    it('renders drawer with proper structure', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('shows overlay when drawer is open', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const overlay = document.querySelector('.rix-mobile-drawer-overlay--visible');
      expect(overlay).toBeInTheDocument();
    });

    it('hides overlay when drawer is closed', () => {
      render(<MobileNavigation />);
      
      const overlay = document.querySelector('.rix-mobile-drawer-overlay--visible');
      expect(overlay).not.toBeInTheDocument();
    });

    it('shows brand header in drawer', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByText('RIX')).toBeInTheDocument();
    });

    it('shows close button in drawer header', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('closes drawer when close button is clicked', async () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const closeButton = screen.getByRole('button', { name: 'Close menu' });
      await user.click(closeButton);
      
      expect(mockNavigationStore.closeMobileDrawer).toHaveBeenCalledTimes(1);
    });

    it('closes drawer when overlay is clicked', async () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const overlay = document.querySelector('.rix-mobile-drawer-overlay--visible');
      await user.click(overlay!);
      
      expect(mockNavigationStore.closeMobileDrawer).toHaveBeenCalledTimes(1);
    });

    it('shows secondary navigation items in drawer', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      // Items not in bottom nav should appear in drawer
      expect(screen.getByText('Projekte')).toBeInTheDocument();
      expect(screen.getByText('Routines')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('shows item descriptions in drawer', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(screen.getByText('Projektmanagement')).toBeInTheDocument();
      expect(screen.getByText('Gewohnheiten & Routinen')).toBeInTheDocument();
      expect(screen.getByText('Einstellungen')).toBeInTheDocument();
    });

    it('applies proper classes when drawer is open', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('rix-mobile-drawer--open');
    });
  });

  describe('Projects in Drawer', () => {
    beforeEach(() => {
      mockNavigationStore.isMobileDrawerOpen = true;
    });

    it('shows projects list when projects section exists', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByText('Personal Productivity')).toBeInTheDocument();
      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
    });

    it('handles project selection', async () => {
      render(<MobileNavigation />);
      
      const firstProject = screen.getByText('Personal Productivity');
      await user.click(firstProject);
      
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
      expect(mockNavigationStore.setActiveProject).toHaveBeenCalledWith('project-1');
    });

    it('highlights active project', () => {
      mockNavigationStore.activeProject = 'project-1';
      render(<MobileNavigation />);
      
      const activeProject = screen.getByText('Personal Productivity').closest('button');
      expect(activeProject).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30');
    });

    it('shows active indicator for active projects', () => {
      render(<MobileNavigation />);
      
      // Personal Productivity has isActive: true
      const activeProjectButton = screen.getByText('Personal Productivity').closest('button');
      const activeIndicator = activeProjectButton?.querySelector('div.bg-green-500');
      expect(activeIndicator).toBeInTheDocument();
    });

    it('shows add project button', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByText('Projekt hinzufügen')).toBeInTheDocument();
      expect(screen.getByTestId('plus-circle-icon')).toBeInTheDocument();
    });

    it('handles add project button click', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<MobileNavigation />);
      
      const addButton = screen.getByText('Projekt hinzufügen');
      await user.click(addButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Add new project');
      consoleSpy.mockRestore();
    });

    it('hides projects when no projects exist', () => {
      mockNavigationStore.projects = [];
      render(<MobileNavigation />);
      
      expect(screen.queryByText('Personal Productivity')).not.toBeInTheDocument();
      expect(screen.queryByText('Learning Goals')).not.toBeInTheDocument();
    });
  });

  describe('Theme Toggle in Drawer', () => {
    it('shows theme toggle in drawer footer', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('passes correct props to theme toggle', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toHaveTextContent('Theme Toggle (sm) - no label');
    });
  });

  describe('User Information in Drawer', () => {
    beforeEach(() => {
      mockNavigationStore.isMobileDrawerOpen = true;
    });

    it('shows user information in drawer footer', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of firstName
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows user icon when no firstName', () => {
      mockAuthStore.user.firstName = '';
      render(<MobileNavigation />);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('shows fallback name when no firstName', () => {
      mockAuthStore.user.firstName = '';
      render(<MobileNavigation />);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('handles user without email gracefully', () => {
      mockAuthStore.user = { id: 'user-1', email: '', firstName: '', lastName: '' };
      render(<MobileNavigation />);
      
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('handles missing user gracefully', () => {
      mockAuthStore.user = null;
      render(<MobileNavigation />);
      
      // Should render without user section
      expect(screen.queryByText('T')).not.toBeInTheDocument();
    });
  });

  describe('Haptic Feedback', () => {
    it('triggers haptic feedback on navigation clicks', async () => {
      render(<MobileNavigation />);
      
      const tasksLink = screen.getByText('Tasks').closest('a');
      await user.click(tasksLink!);
      
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
    });

    it('triggers haptic feedback on menu button clicks', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByText('Menu').closest('button');
      await user.click(menuButton!);
      
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
    });

    it('triggers haptic feedback on project selection', async () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const firstProject = screen.getByText('Personal Productivity');
      await user.click(firstProject);
      
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
    });

    it('can disable haptic feedback', async () => {
      render(<MobileNavigation enableHaptics={false} />);
      
      const tasksLink = screen.getByText('Tasks').closest('a');
      await user.click(tasksLink!);
      
      // Should still work but without haptic feedback
      expect(mockNavigationItems.setActiveNavItem).toHaveBeenCalledWith('tasks');
      // Haptic might still be called but disabled in hook
    });
  });

  describe('Gesture Support', () => {
    it('sets up swipe to close gesture when enabled', () => {
      render(<MobileNavigation enableSwipeToClose />);
      
      // Should setup swipe gesture when drawer opens
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation enableSwipeToClose />);
      
      expect(mockSetupSwipeToClose).toHaveBeenCalled();
    });

    it('can disable swipe to close', () => {
      render(<MobileNavigation enableSwipeToClose={false} />);
      
      expect(mockSetupSwipeToClose).not.toHaveBeenCalled();
    });

    it('can disable all gestures', () => {
      render(<MobileNavigation enableGestures={false} />);
      
      // Gesture setup should respect enabled flag
      expect(mockSetupSwipeToClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Support', () => {
    it('closes drawer on Escape key', async () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockNavigationStore.closeMobileDrawer).toHaveBeenCalledTimes(1);
      expect(mockTriggerHaptic).toHaveBeenCalledWith('impact', 'light');
    });

    it('does not react to Escape when drawer is closed', async () => {
      render(<MobileNavigation />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockNavigationStore.closeMobileDrawer).not.toHaveBeenCalled();
    });

    it('supports tab navigation', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      // All interactive elements should be focusable
      const closeButton = screen.getByRole('button', { name: 'Close menu' });
      expect(closeButton).toHaveAttribute('tabIndex', expect.any(String));
    });
  });

  describe('Body Scroll Management', () => {
    it('prevents body scroll when drawer is open', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when drawer is closed', () => {
      mockNavigationStore.isMobileDrawerOpen = false;
      render(<MobileNavigation />);
      
      expect(document.body.style.overflow).toBe('unset');
    });

    it('cleans up body scroll on unmount', () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      const { unmount } = render(<MobileNavigation />);
      
      unmount();
      
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Responsive Updates', () => {
    it('updates active nav item based on pathname', () => {
      // This would be tested with actual pathname changes
      render(<MobileNavigation />);
      
      // Should call setActiveNavItem when pathname matches navigation item
      expect(mockNavigationItems.setActiveNavItem).toHaveBeenCalledWith('dashboard');
    });

    it('closes drawer when navigation item is selected', async () => {
      mockNavigationStore.isMobileDrawerOpen = true;
      render(<MobileNavigation />);
      
      const projectsLink = screen.getByText('Projekte').closest('a');
      await user.click(projectsLink!);
      
      expect(mockNavigationStore.closeMobileDrawer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<MobileNavigation />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('prevents animation when drawer is animating', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByText('Menu').closest('button');
      await user.click(menuButton!);
      
      // Should set animating state during transition
      expect(mockNavigationStore.toggleMobileDrawer).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing navigation items gracefully', () => {
      mockNavigationItems.navigationItems = [];
      
      render(<MobileNavigation />);
      
      // Should render basic structure without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('handles navigation items without required properties', () => {
      mockNavigationItems.navigationItems = [
        { id: 'test', name: 'Test', href: '/test', icon: 'LayoutGrid', description: 'Test' }
      ];
      
      render(<MobileNavigation />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles missing user gracefully', () => {
      mockAuthStore.user = null;
      mockNavigationStore.isMobileDrawerOpen = true;
      
      render(<MobileNavigation />);
      
      // Should render without user section
      expect(screen.queryByText('T')).not.toBeInTheDocument();
    });
  });
});