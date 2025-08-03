// /src/app/dashboard/__tests__/dashboard-integration.test.tsx
// Integration test suite for dashboard pages with mobile optimization and API integration
// Tests complete user workflows across Projects, Routines, and Calendar with mobile features
// RELEVANT FILES: /src/app/dashboard/projects/page.tsx, /src/app/dashboard/routines/page.tsx, /src/app/dashboard/calendar/page.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard/projects',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(dynamicFunction: any) {
    const DynamicComponent = dynamicFunction();
    DynamicComponent.preload = jest.fn();
    return DynamicComponent;
  };
});

// Mock stores
const mockUseAuthStore = {
  user: { id: 'test-user', email: 'test@example.com' },
  isAuthenticated: true,
  accessToken: 'mock-token',
};

const mockUseNavigationStore = {
  isMobileMenuOpen: false,
  setMobileMenuOpen: jest.fn(),
  activeSection: 'projects',
  setActiveSection: jest.fn(),
};

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockUseAuthStore,
}));

jest.mock('@/store/navigation-store', () => ({
  useNavigationStore: () => mockUseNavigationStore,
}));

// Mock mobile hooks
jest.mock('@/hooks/use-haptic-feedback', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: jest.fn(),
    isSupported: true,
  }),
}));

jest.mock('@/hooks/use-mobile-gestures', () => ({
  useMobileGestures: () => ({
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onSwipeUp: jest.fn(),
    onSwipeDown: jest.fn(),
    gestureHandlers: {},
  }),
}));

// Mock API responses
const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    priority: 'high',
    color: '#60A5FA',
    aiHealthScore: 85,
    startDate: '2024-01-01',
    tags: ['test', 'development'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockRoutines = [
  {
    id: 'routine-1',
    name: 'Morning Routine',
    description: 'Daily morning habits',
    frequency: 'daily',
    timeOfDay: '07:00',
    durationMinutes: 30,
    habits: [
      { id: 'habit-1', name: 'Meditation', duration: 10, completed: false },
      { id: 'habit-2', name: 'Exercise', duration: 20, completed: false },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockCalendarEvents = [
  {
    id: 'event-1',
    title: 'Team Meeting',
    description: 'Weekly sync',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T10:00:00Z',
    eventType: 'meeting',
    priority: 'medium',
    isAllDay: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock fetch API
global.fetch = jest.fn();

const mockFetchResponse = (data: any, ok = true) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  });
};

// Import components after mocks are set up
import ProjectsPage from '@/app/dashboard/projects/page';
import RoutinesPage from '@/app/dashboard/routines/page';
import CalendarPage from '@/app/dashboard/calendar/page';

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Projects Page Integration', () => {
    it('should load and display projects with mobile optimization', async () => {
      mockFetchResponse({ projects: mockProjects, total: 1 });

      render(<ProjectsPage />);

      // Should show loading state initially
      expect(screen.getByTestId('projects-loading')).toBeInTheDocument();

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should display project details
      expect(screen.getByText('A test project')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // AI health score
      expect(screen.getByText('High')).toBeInTheDocument(); // Priority

      // Should have mobile-optimized touch targets
      const projectCard = screen.getByTestId('project-card-project-1');
      expect(projectCard).toHaveClass('touch-target');
    });

    it('should handle project creation with haptic feedback', async () => {
      mockFetchResponse({ projects: [], total: 0 });
      const user = userEvent.setup();

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
      });

      // Click create project button
      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      // Should open creation modal
      expect(screen.getByTestId('project-creation-modal')).toBeInTheDocument();

      // Fill form
      await user.type(screen.getByLabelText('Project Name'), 'New Mobile Project');
      await user.type(screen.getByLabelText('Description'), 'Created on mobile');

      // Mock successful creation
      const newProject = {
        id: 'project-new',
        name: 'New Mobile Project',
        description: 'Created on mobile',
        status: 'active',
        priority: 'medium',
        aiHealthScore: 0,
      };
      mockFetchResponse({ project: newProject, message: 'Success' });

      // Submit form
      const submitButton = screen.getByTestId('submit-project-button');
      await user.click(submitButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Project created successfully')).toBeInTheDocument();
      });

      // Should close modal
      expect(screen.queryByTestId('project-creation-modal')).not.toBeInTheDocument();
    });

    it('should handle project card expansion with touch gestures', async () => {
      mockFetchResponse({ projects: mockProjects, total: 1 });
      const user = userEvent.setup();

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const projectCard = screen.getByTestId('project-card-project-1');
      
      // Should be collapsed initially
      expect(screen.queryByTestId('project-details-expanded')).not.toBeInTheDocument();

      // Tap to expand
      await user.click(projectCard);

      // Should expand to show more details
      await waitFor(() => {
        expect(screen.getByTestId('project-details-expanded')).toBeInTheDocument();
      });

      // Should show AI health score details
      expect(screen.getByText('Health Score: 85%')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should handle search and filtering on mobile', async () => {
      mockFetchResponse({ projects: mockProjects, total: 1 });
      const user = userEvent.setup();

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByTestId('project-search-input');
      await user.type(searchInput, 'Test');

      // Should filter projects as user types
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=Test'),
          expect.any(Object)
        );
      });

      // Test priority filter
      const priorityFilter = screen.getByTestId('priority-filter');
      await user.selectOptions(priorityFilter, 'high');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('priority=high'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Routines Page Integration', () => {
    it('should load and display routines with habit tracking', async () => {
      mockFetchResponse({ routines: mockRoutines, total: 1 });

      render(<RoutinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Morning Routine')).toBeInTheDocument();
      });

      // Should display routine details
      expect(screen.getByText('Daily morning habits')).toBeInTheDocument();
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('07:00')).toBeInTheDocument();

      // Should show individual habits
      expect(screen.getByText('Meditation')).toBeInTheDocument();
      expect(screen.getByText('Exercise')).toBeInTheDocument();

      // Should have habit checkboxes
      const habitCheckboxes = screen.getAllByTestId(/habit-checkbox-/);
      expect(habitCheckboxes).toHaveLength(2);
    });

    it('should handle habit completion with mobile interactions', async () => {
      mockFetchResponse({ routines: mockRoutines, total: 1 });
      const user = userEvent.setup();

      render(<RoutinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Morning Routine')).toBeInTheDocument();
      });

      // Complete a habit
      const meditationCheckbox = screen.getByTestId('habit-checkbox-habit-1');
      
      // Mock successful completion
      mockFetchResponse({
        completion: {
          id: 'completion-1',
          routineId: 'routine-1',
          habitsCompleted: { 'habit-1': true, 'habit-2': false },
          completionPercentage: 50,
        },
      });

      await user.click(meditationCheckbox);

      // Should update UI optimistically
      expect(meditationCheckbox).toBeChecked();

      // Should call completion API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/routines/routine-1/complete',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('habit-1'),
          })
        );
      });
    });

    it('should display routine progress visualization', async () => {
      const routineWithCompletions = {
        ...mockRoutines[0],
        recentCompletions: [
          {
            completionDate: '2024-01-15',
            completionPercentage: 100,
            habitsCompleted: { 'habit-1': true, 'habit-2': true },
          },
          {
            completionDate: '2024-01-14',
            completionPercentage: 50,
            habitsCompleted: { 'habit-1': true, 'habit-2': false },
          },
        ],
      };

      mockFetchResponse({ routines: [routineWithCompletions], total: 1 });

      render(<RoutinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Morning Routine')).toBeInTheDocument();
      });

      // Should show progress indicators
      expect(screen.getByTestId('routine-progress-bar')).toBeInTheDocument();
      expect(screen.getByText('2 day streak')).toBeInTheDocument();

      // Should show completion history
      const completionHistory = screen.getByTestId('completion-history');
      expect(within(completionHistory).getByText('100%')).toBeInTheDocument();
      expect(within(completionHistory).getByText('50%')).toBeInTheDocument();
    });

    it('should handle routine creation with habit management', async () => {
      mockFetchResponse({ routines: [], total: 0 });
      const user = userEvent.setup();

      render(<RoutinesPage />);

      await waitFor(() => {
        expect(screen.getByText('No routines found')).toBeInTheDocument();
      });

      // Open routine creation modal
      const createButton = screen.getByTestId('create-routine-button');
      await user.click(createButton);

      expect(screen.getByTestId('routine-creation-modal')).toBeInTheDocument();

      // Fill routine details
      await user.type(screen.getByLabelText('Routine Name'), 'Evening Routine');
      await user.selectOptions(screen.getByLabelText('Frequency'), 'daily');
      await user.type(screen.getByLabelText('Time of Day'), '21:00');

      // Add habits
      const addHabitButton = screen.getByTestId('add-habit-button');
      await user.click(addHabitButton);

      const habitNameInput = screen.getByTestId('habit-name-input-0');
      await user.type(habitNameInput, 'Read book');

      const habitDurationInput = screen.getByTestId('habit-duration-input-0');
      await user.clear(habitDurationInput);
      await user.type(habitDurationInput, '20');

      // Mock successful creation
      mockFetchResponse({
        routine: {
          id: 'routine-new',
          name: 'Evening Routine',
          frequency: 'daily',
          timeOfDay: '21:00',
          habits: [{ id: 'habit-new', name: 'Read book', duration: 20 }],
        },
      });

      // Submit form
      const submitButton = screen.getByTestId('submit-routine-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Routine created successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Page Integration', () => {
    it('should load and display calendar events with time-blocking', async () => {
      mockFetchResponse({ events: mockCalendarEvents, total: 1 });

      render(<CalendarPage />);

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      });

      // Should display event details
      expect(screen.getByText('Weekly sync')).toBeInTheDocument();
      expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
      expect(screen.getByText('Meeting')).toBeInTheDocument();

      // Should show calendar grid
      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();

      // Should have time blocks
      const timeBlocks = screen.getAllByTestId(/time-block-/);
      expect(timeBlocks.length).toBeGreaterThan(0);
    });

    it('should handle event creation with mobile touch interface', async () => {
      mockFetchResponse({ events: [], total: 0 });
      const user = userEvent.setup();

      render(<CalendarPage />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
      });

      // Tap on a time slot to create event
      const timeSlot = screen.getByTestId('time-slot-09-00');
      await user.click(timeSlot);

      // Should open event creation modal
      expect(screen.getByTestId('event-creation-modal')).toBeInTheDocument();

      // Fill event details
      await user.type(screen.getByLabelText('Event Title'), 'Mobile Meeting');
      await user.type(screen.getByLabelText('Description'), 'Meeting created on mobile');
      await user.selectOptions(screen.getByLabelText('Event Type'), 'meeting');

      // Mock successful creation
      mockFetchResponse({
        event: {
          id: 'event-new',
          title: 'Mobile Meeting',
          description: 'Meeting created on mobile',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
          eventType: 'meeting',
        },
      });

      // Submit form
      const submitButton = screen.getByTestId('submit-event-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Event created successfully')).toBeInTheDocument();
      });
    });

    it('should handle time-block optimization with AI suggestions', async () => {
      const eventsWithTimeBlocks = [
        ...mockCalendarEvents,
        {
          id: 'time-block-1',
          title: 'Deep Work',
          description: 'Focused coding session',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T12:00:00Z',
          eventType: 'time_block',
          priority: 'high',
        },
      ];

      mockFetchResponse({ events: eventsWithTimeBlocks, total: 2 });

      render(<CalendarPage />);

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument();
        expect(screen.getByText('Deep Work')).toBeInTheDocument();
      });

      // Should show AI suggestions panel
      expect(screen.getByTestId('ai-suggestions-panel')).toBeInTheDocument();

      // Should show optimization suggestions
      expect(screen.getByText('Optimize Schedule')).toBeInTheDocument();

      // Should highlight time blocks differently
      const timeBlockElement = screen.getByTestId('event-time-block-1');
      expect(timeBlockElement).toHaveClass('time-block');
      expect(timeBlockElement).toHaveClass('priority-high');
    });

    it('should handle calendar navigation and view switching', async () => {
      mockFetchResponse({ events: mockCalendarEvents, total: 1 });
      const user = userEvent.setup();

      render(<CalendarPage />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
      });

      // Test view switching
      const weekViewButton = screen.getByTestId('week-view-button');
      const dayViewButton = screen.getByTestId('day-view-button');

      await user.click(weekViewButton);
      expect(screen.getByTestId('week-view')).toBeInTheDocument();

      await user.click(dayViewButton);
      expect(screen.getByTestId('day-view')).toBeInTheDocument();

      // Test date navigation
      const nextDateButton = screen.getByTestId('next-date-button');
      const prevDateButton = screen.getByTestId('prev-date-button');

      await user.click(nextDateButton);
      // Should fetch events for next date
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate=2024-01-16'),
          expect.any(Object)
        );
      });

      await user.click(prevDateButton);
      // Should fetch events for previous date
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate=2024-01-14'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Cross-Page Mobile Navigation', () => {
    it('should handle swipe navigation between dashboard pages', async () => {
      const { rerender } = render(<ProjectsPage />);
      
      // Mock swipe gesture
      const swipeEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });

      const container = screen.getByTestId('dashboard-container');
      fireEvent(container, swipeEvent);

      // Should trigger navigation store update
      expect(mockUseNavigationStore.setActiveSection).toHaveBeenCalled();
    });

    it('should maintain state when switching between pages', async () => {
      // Start with projects page
      mockFetchResponse({ projects: mockProjects, total: 1 });
      const { rerender } = render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Switch to routines page
      mockFetchResponse({ routines: mockRoutines, total: 1 });
      rerender(<RoutinesPage />);

      await waitFor(() => {
        expect(screen.getByText('Morning Routine')).toBeInTheDocument();
      });

      // Switch back to projects page
      mockFetchResponse({ projects: mockProjects, total: 1 });
      rerender(<ProjectsPage />);

      // Should reload data but maintain UI state
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      mockFetchResponse({ error: 'Server error' }, false);

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();

      // Test retry functionality
      const user = userEvent.setup();
      mockFetchResponse({ projects: mockProjects, total: 1 });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });

    it('should handle offline scenarios', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<ProjectsPage />);

      // Should show offline indicator
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      expect(screen.getByText('You are offline')).toBeInTheDocument();

      // Should show cached data if available
      expect(screen.getByTestId('cached-data-notice')).toBeInTheDocument();
    });

    it('should handle touch interaction conflicts', async () => {
      mockFetchResponse({ projects: mockProjects, total: 1 });
      const user = userEvent.setup();

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      const projectCard = screen.getByTestId('project-card-project-1');

      // Simulate conflicting touch events
      fireEvent.touchStart(projectCard, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(projectCard, {
        touches: [{ clientX: 150, clientY: 100 }],
      });

      fireEvent.touchEnd(projectCard);

      // Should handle gracefully without errors
      expect(projectCard).toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should optimize for mobile performance', async () => {
      mockFetchResponse({ projects: mockProjects, total: 1 });

      const { container } = render(<ProjectsPage />);

      // Should use proper mobile optimization classes
      expect(container.firstChild).toHaveClass('mobile-optimized');

      // Should implement virtual scrolling for large lists
      const projectList = screen.getByTestId('projects-list');
      expect(projectList).toHaveAttribute('data-virtualized');

      // Should use efficient re-rendering
      expect(projectList).toHaveAttribute('data-optimized');
    });

    it('should maintain accessibility standards on mobile', async () => {
      mockFetchResponse({ projects: mockProjects, total: 1 });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should have proper ARIA labels
      const createButton = screen.getByTestId('create-project-button');
      expect(createButton).toHaveAttribute('aria-label');

      // Should have proper touch target sizes
      expect(createButton).toHaveClass('touch-target-44');

      // Should support keyboard navigation
      expect(createButton).toHaveAttribute('tabIndex');

      // Should have proper focus management
      const projectCard = screen.getByTestId('project-card-project-1');
      expect(projectCard).toHaveAttribute('tabIndex');
      expect(projectCard).toHaveAttribute('role');
    });
  });
});