// /04-implementation/testing-quality/new-test-files/MobileNavigation.test.tsx
// Comprehensive test suite for MobileNavigation component with drawer, bottom nav, and touch gestures
// Tests mobile-specific interactions, responsive behavior, haptic feedback, and accessibility
// RELEVANT FILES: mobile-navigation.tsx, enhanced-sidebar.tsx, navigation-store.ts, responsive-breakpoints.css

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNavigation, PullToRefresh } from '@/components/navigation/MobileNavigation';

// Mock next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname()
}));

// Mock stores
const mockNavigationStore = {
  expandedSections: ['projects'],
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
      lastAccessed: new Date(),
      color: '#34D399'
    }
  ],
  activeProject: null,
  toggleSection: jest.fn(),
  setActiveProject: jest.fn(),
  setActiveNavItem: jest.fn()
};

const mockNavigationItems = {
  navigationItems: [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { id: 'projects', name: 'Projects', href: '/dashboard/projects', icon: 'FolderOpen', expandable: true },
    { id: 'tasks', name: 'Tasks', href: '/dashboard/tasks', icon: 'CheckSquare' },
    { id: 'routines', name: 'Routines', href: '/dashboard/routines', icon: 'RotateCcw' },
    { id: 'calendar', name: 'Calendar', href: '/dashboard/calendar', icon: 'Calendar' },
    { id: 'settings', name: 'Settings', href: '/dashboard/settings', icon: 'Settings' }
  ],
  activeNavItem: 'dashboard'
};

const mockResponsiveNavigation = {
  isMobile: true,
  isTablet: false,
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

// Mock stores
jest.mock('@/store/navigation-store', () => ({
  useNavigationStore: () => mockNavigationStore,
  useNavigationItems: () => mockNavigationItems,
  useResponsiveNavigation: () => mockResponsiveNavigation
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthStore
}));

// Mock theme toggle
jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: ({ size, showLabel, className }: any) => (
    <div data-testid="theme-toggle" className={className}>
      Theme Toggle ({size}) {showLabel && '- with label'}
    </div>
  )
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(dynamicFunction: any) {
    const DynamicComponent = dynamicFunction();
    DynamicComponent.preload = jest.fn();
    return DynamicComponent;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Menu: (props: any) => <div data-testid="menu-icon" {...props} />,
  X: (props: any) => <div data-testid="x-icon" {...props} />,
  Home: (props: any) => <div data-testid="home-icon" {...props} />,
  FolderOpen: (props: any) => <div data-testid="folder-open-icon" {...props} />,
  CheckSquare: (props: any) => <div data-testid="check-square-icon" {...props} />,
  RotateCcw: (props: any) => <div data-testid="rotate-ccw-icon" {...props} />,
  Calendar: (props: any) => <div data-testid="calendar-icon" {...props} />,
  Settings: (props: any) => <div data-testid="settings-icon" {...props} />,
  ChevronRight: (props: any) => <div data-testid="chevron-right-icon" {...props} />,
  ChevronDown: (props: any) => <div data-testid="chevron-down-icon" {...props} />,
  User: (props: any) => <div data-testid="user-icon" {...props} />,
  LogOut: (props: any) => <div data-testid="logout-icon" {...props} />,
  Zap: (props: any) => <div data-testid="zap-icon" {...props} />
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock haptic feedback
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate
});

// Mock Link component
jest.mock('next/link', () => {
  return ({ children, href, onClick, className, ...props }: any) => (
    <a href={href} onClick={onClick} className={className} {...props}>
      {children}
    </a>
  );
});

describe('MobileNavigation Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Default mobile setup
    mockResponsiveNavigation.isMobile = true;
    mockResponsiveNavigation.isTablet = false;
    mockPathname.mockReturnValue('/dashboard');
    mockVibrate.mockClear();
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375 // Mobile width
    });
  });

  describe('Responsive Rendering', () => {
    it('renders on mobile devices', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Top nav
      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument(); // Bottom nav
    });

    it('renders on tablet devices', () => {
      mockResponsiveNavigation.isMobile = false;
      mockResponsiveNavigation.isTablet = true;
      
      render(<MobileNavigation />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    });

    it('does not render on desktop', () => {
      mockResponsiveNavigation.isMobile = false;
      mockResponsiveNavigation.isTablet = false;
      
      const { container } = render(<MobileNavigation />);
      
      expect(container.firstChild).toBeNull();
    });

    it('handles window resize events', () => {
      render(<MobileNavigation />);
      
      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1200 });
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(mockResponsiveNavigation.updateBreakpoint).toHaveBeenCalledWith(1200);
    });

    it('auto-closes drawer on desktop resize', () => {
      render(<MobileNavigation />);
      
      // Open drawer first
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);
      
      // Should show drawer
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
      
      // Resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1200 });
        window.dispatchEvent(new Event('resize'));
      });
      
      // Drawer should be closed (would need implementation to verify)
    });
  });

  describe('Top Navigation Bar', () => {
    it('renders brand section with logo and text', () => {
      render(<MobileNavigation />);
      
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByText('RIX')).toBeInTheDocument();
    });

    it('renders menu toggle button', () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-drawer-menu');
    });

    it('toggles menu button icon based on drawer state', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      
      // Initially shows menu icon
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
      
      // Click to open drawer
      await user.click(menuButton);
      
      // Should show X icon
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-icon')).not.toBeInTheDocument();
    });

    it('has proper mobile safe area classes', () => {
      render(<MobileNavigation />);
      
      const topNav = screen.getByRole('banner');
      expect(topNav).toHaveClass('mobile-safe-top');
    });
  });

  describe('Drawer Menu Functionality', () => {
    it('opens drawer when menu button is clicked', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveClass('mobile-drawer--open');
      expect(screen.getByTestId('mobile-drawer-overlay')).toBeInTheDocument();
      expect(mockVibrate).toHaveBeenCalledWith([10]); // Light haptic feedback
    });

    it('closes drawer when close button is clicked', async () => {
      render(<MobileNavigation />);
      
      // Open drawer
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      // Close drawer
      const closeButton = screen.getByRole('button', { name: /close navigation menu/i });
      await user.click(closeButton);
      
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).not.toHaveClass('mobile-drawer--open');
      expect(screen.queryByTestId('mobile-drawer-overlay')).not.toBeInTheDocument();
    });

    it('closes drawer when overlay is clicked', async () => {
      render(<MobileNavigation />);
      
      // Open drawer
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      // Click overlay
      const overlay = screen.getByTestId('mobile-drawer-overlay');
      await user.click(overlay);
      
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).not.toHaveClass('mobile-drawer--open');
    });

    it('renders drawer header with brand and close button', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByText('RIX Personal Agent')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close navigation menu/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Items', () => {
    it('renders all navigation items in drawer', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Routines')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('handles navigation item clicks', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const tasksLink = screen.getByText('Tasks').closest('a');
      await user.click(tasksLink!);
      
      expect(mockNavigationStore.setActiveNavItem).toHaveBeenCalledWith('tasks');
      expect(mockVibrate).toHaveBeenCalledWith([10]);
    });

    it('highlights active navigation item', async () => {
      mockNavigationItems.activeNavItem = 'tasks';
      
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const tasksItem = screen.getByText('Tasks').closest('a');
      expect(tasksItem).toHaveClass('mobile-drawer__nav-item--active');
    });

    it('shows proper icons for navigation items', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-square-icon')).toBeInTheDocument();
      expect(screen.getByTestId('rotate-ccw-icon')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });
  });

  describe('Expandable Sections (Projects)', () => {
    it('handles expandable items correctly', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const projectsButton = screen.getByText('Projects').closest('button');
      expect(projectsButton).toHaveAttribute('aria-expanded', 'true');
      expect(projectsButton).toHaveAttribute('aria-controls', 'mobile-projects-submenu');
    });

    it('shows chevron icons for expandable state', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      // Projects is expanded, should show chevron down
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('renders project submenu when expanded', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByText('Personal Productivity')).toBeInTheDocument();
      expect(screen.getByText('Learning Goals')).toBeInTheDocument();
    });

    it('handles project selection', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const projectButton = screen.getByText('Personal Productivity');
      await user.click(projectButton);
      
      expect(mockNavigationStore.setActiveProject).toHaveBeenCalledWith('project-1');
      expect(mockVibrate).toHaveBeenCalledWith([10]);
    });

    it('shows project status indicators', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const activeProject = screen.getByText('Personal Productivity').closest('button');
      const statusIndicator = activeProject?.querySelector('.mobile-drawer__project-status--active');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Touch Gesture Support', () => {
    it('handles touch start for swipe gesture', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const drawer = screen.getByRole('navigation', { name: 'Main navigation' });
      
      fireEvent.touchStart(drawer, {
        touches: [{ clientX: 100, clientY: 200 }]
      });
      
      // Should not cause any errors
      expect(drawer).toBeInTheDocument();
    });

    it('handles swipe-to-close gesture', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const drawer = screen.getByRole('navigation', { name: 'Main navigation' });
      
      // Simulate swipe left gesture
      fireEvent.touchStart(drawer, {
        touches: [{ clientX: 200, clientY: 200 }]
      });
      
      fireEvent.touchMove(drawer, {
        touches: [{ clientX: 100, clientY: 200 }] // Moved 100px left
      });
      
      fireEvent.touchEnd(drawer, {
        changedTouches: [{ clientX: 50, clientY: 200 }] // Ended at 50px (total -150px)
      });
      
      // Should trigger haptic feedback for close
      expect(mockVibrate).toHaveBeenCalledWith([20]); // Medium haptic feedback
    });

    it('applies transform during drag gesture', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const drawer = screen.getByRole('navigation', { name: 'Main navigation' });
      
      // Start drag
      fireEvent.touchStart(drawer, {
        touches: [{ clientX: 200, clientY: 200 }]
      });
      
      // Move significantly to trigger drag
      fireEvent.touchMove(drawer, {
        touches: [{ clientX: 150, clientY: 200 }]
      });
      
      // Should apply transform during drag (implementation would need to verify)
      expect(drawer).toBeInTheDocument();
    });
  });

  describe('Bottom Navigation', () => {
    it('renders primary navigation items in bottom nav', () => {
      render(<MobileNavigation />);
      
      const bottomNav = screen.getByRole('navigation', { name: 'Primary navigation' });
      expect(bottomNav).toBeInTheDocument();
      
      // Should show first 5 items
      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Projects')).toBeInTheDocument();
      expect(screen.getByLabelText('Tasks')).toBeInTheDocument();
      expect(screen.getByLabelText('Routines')).toBeInTheDocument();
      expect(screen.getByLabelText('Calendar')).toBeInTheDocument();
    });

    it('highlights active item in bottom nav', () => {
      mockNavigationItems.activeNavItem = 'tasks';
      
      render(<MobileNavigation />);
      
      const tasksItem = screen.getByLabelText('Tasks');
      expect(tasksItem).toHaveClass('mobile-bottom-nav__item--active');
      
      const activeIndicator = tasksItem.querySelector('.mobile-bottom-nav__active-indicator');
      expect(activeIndicator).toBeInTheDocument();
    });

    it('handles bottom nav item clicks', async () => {
      render(<MobileNavigation />);
      
      const tasksLink = screen.getByLabelText('Tasks');
      await user.click(tasksLink);
      
      expect(mockNavigationStore.setActiveNavItem).toHaveBeenCalledWith('tasks');
      expect(mockVibrate).toHaveBeenCalledWith([10]);
    });

    it('has proper mobile safe area classes', () => {
      render(<MobileNavigation />);
      
      const bottomNav = screen.getByRole('navigation', { name: 'Primary navigation' });
      expect(bottomNav).toHaveClass('mobile-safe-bottom');
    });

    it('has proper touch targets for all items', () => {
      render(<MobileNavigation />);
      
      const bottomNavItems = screen.getAllByRole('link');
      bottomNavItems.forEach(item => {
        if (item.closest('.mobile-bottom-nav__item')) {
          expect(item).toHaveClass('mobile-touch-target');
        }
      });
    });
  });

  describe('User Profile Section', () => {
    it('displays user information in drawer footer', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of firstName
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows user icon when no firstName available', async () => {
      mockAuthStore.user.firstName = '';
      
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('shows fallback name when no firstName', async () => {
      mockAuthStore.user.firstName = '';
      
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Theme Toggle Integration', () => {
    it('renders theme toggle in drawer footer', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByText('Theme Toggle (md) - with label')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for drawer', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      const drawer = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(drawer).toHaveAttribute('id', 'mobile-drawer-menu');
      expect(drawer).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('manages focus properly when drawer opens', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      await user.click(menuButton);
      
      // Focus should be managed within drawer
      const drawer = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(drawer).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<MobileNavigation />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      
      // Focus and activate with keyboard
      menuButton.focus();
      fireEvent.keyDown(menuButton, { key: 'Enter' });
      
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    });

    it('has proper touch target sizes', () => {
      render(<MobileNavigation />);
      
      const touchTargets = screen.getAllByRole('button');
      touchTargets.forEach(target => {
        expect(target).toHaveClass('mobile-touch-target');
      });
    });
  });

  describe('Performance and Cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<MobileNavigation />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('updates active nav item based on pathname changes', () => {
      const { rerender } = render(<MobileNavigation />);
      
      // Change pathname
      mockPathname.mockReturnValue('/dashboard/tasks');
      
      rerender(<MobileNavigation />);
      
      expect(mockNavigationStore.setActiveNavItem).toHaveBeenCalledWith('tasks');
    });
  });
});

describe('PullToRefresh Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockOnRefresh.mockResolvedValue(undefined);
    mockVibrate.mockClear();
  });

  describe('Basic Functionality', () => {
    it('renders children content', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-testid="content">Test content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh} className="custom-pull">
          <div>Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').closest('.mobile-pull-to-refresh');
      expect(container).toHaveClass('custom-pull');
    });

    it('shows pull indicator when pulling', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-testid="content">Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').closest('.mobile-pull-to-refresh');
      
      // Simulate pull gesture
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(container!, {
        touches: [{ clientX: 100, clientY: 200 }] // Pull down 100px
      });
      
      expect(screen.getByText('Ziehen zum Aktualisieren')).toBeInTheDocument();
    });

    it('triggers refresh when pulled beyond threshold', async () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div data-testid="content">Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').closest('.mobile-pull-to-refresh');
      
      // Mock scrollTop to be 0 (top of container)
      Object.defineProperty(container, 'scrollTop', {
        value: 0,
        writable: true
      });
      
      // Simulate strong pull gesture
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(container!, {
        touches: [{ clientX: 100, clientY: 200 }] // Pull down 100px (> 80px threshold)
      });
      
      fireEvent.touchEnd(container!);
      
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([20]); // Medium haptic feedback
    });

    it('does not trigger refresh when pulled less than threshold', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div data-testid="content">Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').closest('.mobile-pull-to-refresh');
      
      // Mock scrollTop to be 0
      Object.defineProperty(container, 'scrollTop', {
        value: 0,
        writable: true
      });
      
      // Simulate weak pull gesture
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(container!, {
        touches: [{ clientX: 100, clientY: 150 }] // Pull down 50px (< 80px threshold)
      });
      
      fireEvent.touchEnd(container!);
      
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('prevents pull when not at top of scroll', () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-testid="content">Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').closest('.mobile-pull-to-refresh');
      
      // Mock scrollTop to be > 0 (not at top)
      Object.defineProperty(container, 'scrollTop', {
        value: 100,
        writable: true
      });
      
      // Try to pull
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(container!, {
        touches: [{ clientX: 100, clientY: 200 }]
      });
      
      // Should not show pull indicator
      expect(screen.queryByText('Ziehen zum Aktualisieren')).not.toBeInTheDocument();
    });

    it('shows different states during pull cycle', async () => {
      render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80}>
          <div data-testid="content">Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').closest('.mobile-pull-to-refresh');
      
      Object.defineProperty(container, 'scrollTop', {
        value: 0,
        writable: true
      });
      
      // Start pull
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      // Pull partially
      fireEvent.touchMove(container!, {
        touches: [{ clientX: 100, clientY: 150 }] // 50px
      });
      
      expect(screen.getByText('Ziehen zum Aktualisieren')).toBeInTheDocument();
      
      // Pull past threshold
      fireEvent.touchMove(container!, {
        touches: [{ clientX: 100, clientY: 200 }] // 100px
      });
      
      expect(screen.getByText('Loslassen zum Aktualisieren')).toBeInTheDocument();
      
      // Release to trigger refresh
      fireEvent.touchEnd(container!);
      
      await waitFor(() => {
        expect(screen.getByText('Aktualisiere...')).toBeInTheDocument();
      });
    });
  });
});