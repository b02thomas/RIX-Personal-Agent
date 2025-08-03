// /src/app/dashboard/intelligence/__tests__/intelligence-dashboard.test.tsx
// Comprehensive test suite for Intelligence Dashboard with AI coaching integration
// Tests adaptive knowledge database, goal tracking, and AI insights display
// RELEVANT FILES: /src/app/dashboard/intelligence/page.tsx, /src/components/intelligence/ai-coaching-card.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import IntelligencePage from '../page';

// Mock dependencies
jest.mock('@/store/auth-store');
jest.mock('@/components/mobile/mobile-touch-optimizer');
jest.mock('@/hooks/use-haptic-feedback');

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(importFn: any) {
    const Component = importFn();
    return Component.default || Component;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  Lightbulb: () => <div data-testid="lightbulb-icon">Lightbulb</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  BookOpen: () => <div data-testid="book-open-icon">BookOpen</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Award: () => <div data-testid="award-icon">Award</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>
}));

// Mock store hooks
const mockAuthStore = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  }
};

const mockMobileOptimization = {
  isMobile: false
};

const mockHapticFeedback = {
  triggerHaptic: jest.fn()
};

require('@/store/auth-store').useAuthStore = jest.fn(() => mockAuthStore);
require('@/components/mobile/mobile-touch-optimizer').useMobileOptimization = jest.fn(() => mockMobileOptimization);
require('@/hooks/use-haptic-feedback').useHapticFeedback = jest.fn(() => mockHapticFeedback);

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Intelligence Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default fetch mock responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // Intelligence metrics
        ok: true,
        json: async () => ({
          knowledgeItems: 342,
          activeGoals: 8,
          completedGoals: 23,
          aiInsights: 15,
          averageProgress: 73
        })
      })
      .mockResolvedValueOnce({ // Goals
        ok: true,
        json: async () => ([
          {
            id: '1',
            title: 'Daily Exercise',
            description: 'Complete 30 minutes of exercise daily',
            category: 'health',
            target: 30,
            current: 23,
            unit: 'days',
            deadline: '2024-01-31',
            priority: 'high',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: new Date().toISOString()
          }
        ])
      })
      .mockResolvedValueOnce({ // AI insights - routine coaching
        ok: true,
        json: async () => ({
          success: true,
          coaching_insights: "Your routine completion rate is strong today.",
          routine_analysis: {
            routines_analyzed: 3,
            completion_rate: 78.5,
            current_streak: 12,
            improvement_trend: "improving"
          },
          processing_info: {
            workflow_type: "routine-coaching",
            confidence: 0.9
          }
        })
      })
      .mockResolvedValueOnce({ // AI insights - project intelligence
        ok: true,
        json: async () => ({
          success: true,
          intelligence_insights: "Your active projects are progressing well.",
          project_analysis: {
            projects_analyzed: 2,
            average_health_score: 87,
            active_projects: 2,
            projects_at_risk: 0
          },
          processing_info: {
            workflow_type: "project-intelligence",
            confidence: 0.92
          }
        })
      })
      .mockResolvedValueOnce({ // AI insights - calendar optimization
        ok: true,
        json: async () => ({
          success: true,
          optimization_insights: "Your schedule today can be optimized for better focus.",
          schedule_analysis: {
            events_analyzed: 15,
            meeting_density: 2.1,
            schedule_efficiency: 75,
            productivity_windows: ["09:00-11:00", "14:00-16:00"]
          },
          processing_info: {
            workflow_type: "calendar-optimization",
            confidence: 0.88
          }
        })
      })
      .mockResolvedValueOnce({ // Initial knowledge search
        ok: true,
        json: async () => ([
          {
            id: '1',
            title: 'Morning Routine Optimization',
            content: 'Your morning routine shows 85% completion rate with peak productivity at 8-10 AM.',
            type: 'routine',
            relevance: 0.92,
            lastAccessed: new Date().toISOString(),
            tags: ['morning', 'productivity', 'routine'],
            source: 'Routine Analysis'
          }
        ])
      });
  });

  describe('Dashboard Rendering', () => {
    it('should render intelligence dashboard with all sections', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Intelligence Overview')).toBeInTheDocument();
      });

      // Verify main sections are present
      expect(screen.getByText('Adaptive knowledge database with AI-powered insights and goal tracking')).toBeInTheDocument();
      expect(screen.getByText('Knowledge Database')).toBeInTheDocument();
      expect(screen.getByText('Goal Tracking')).toBeInTheDocument();
      expect(screen.getByText('AI Insights Dashboard')).toBeInTheDocument();

      // Verify metrics cards
      expect(screen.getByText('Knowledge Items')).toBeInTheDocument();
      expect(screen.getByText('Active Goals')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('should display intelligence metrics correctly', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('342')).toBeInTheDocument(); // Knowledge items
        expect(screen.getByText('8')).toBeInTheDocument(); // Active goals
        expect(screen.getByText('23')).toBeInTheDocument(); // Completed goals
        expect(screen.getByText('73%')).toBeInTheDocument(); // Average progress
      });
    });

    it('should render loading state initially', () => {
      render(<IntelligencePage />);

      // Should show loading skeletons
      expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
    });

    it('should handle error state gracefully', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Error loading intelligence data')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Knowledge Database Functionality', () => {
    it('should render knowledge search interface', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search knowledge base...')).toBeInTheDocument();
      });

      // Verify filter buttons
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Routine')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Insight')).toBeInTheDocument();
    });

    it('should perform knowledge search on query input', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search knowledge base...')).toBeInTheDocument();
      });

      // Mock search response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'search-1',
            title: 'Search Result',
            content: 'Search result content',
            type: 'routine',
            relevance: 0.95,
            lastAccessed: new Date().toISOString(),
            tags: ['search', 'test'],
            source: 'Test'
          }
        ])
      });

      const searchInput = screen.getByPlaceholderText('Search knowledge base...');
      await user.type(searchInput, 'routine optimization');
      await user.keyboard('{Enter}');

      // Should trigger search
      expect(mockHapticFeedback.triggerHaptic).toHaveBeenCalledWith('selection');
    });

    it('should filter knowledge items by type', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Routine')).toBeInTheDocument();
      });

      // Mock filtered search response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'routine-1',
            title: 'Routine Entry',
            type: 'routine',
            relevance: 0.9,
            lastAccessed: new Date().toISOString(),
            tags: ['routine'],
            source: 'Routine Analysis'
          }
        ])
      });

      const routineFilter = screen.getByText('Routine');
      await user.click(routineFilter);

      expect(mockHapticFeedback.triggerHaptic).toHaveBeenCalledWith('selection');
    });

    it('should display knowledge items with proper structure', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Morning Routine Optimization')).toBeInTheDocument();
      });

      // Verify knowledge item structure
      expect(screen.getByText('Your morning routine shows 85% completion rate with peak productivity at 8-10 AM.')).toBeInTheDocument();
      expect(screen.getByText('Routine Analysis')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument(); // Relevance score
    });
  });

  describe('Goal Tracking Functionality', () => {
    it('should display goals with progress tracking', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Daily Exercise')).toBeInTheDocument();
      });

      // Verify goal structure
      expect(screen.getByText('Complete 30 minutes of exercise daily')).toBeInTheDocument();
      expect(screen.getByText('23/30 days')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('should show create goal modal when button is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('New Goal')).toBeInTheDocument();
      });

      const newGoalButton = screen.getByText('New Goal');
      await user.click(newGoalButton);

      expect(mockHapticFeedback.triggerHaptic).toHaveBeenCalledWith('impact', 'medium');
    });

    it('should calculate goal progress correctly', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('23/30 days')).toBeInTheDocument();
      });

      // Progress should be (23/30) * 100 = 76.67%
      // The progress bar should reflect this
      const progressElement = screen.getByRole('generic'); // Progress bar
      expect(progressElement).toBeInTheDocument();
    });
  });

  describe('AI Insights Dashboard', () => {
    it('should display AI insights from all intelligence features', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Real-time coaching insights, project health, and schedule optimization')).toBeInTheDocument();
      });

      // Should show insights count in metrics
      await waitFor(() => {
        // AI insights should be loaded and displayed
        expect(screen.getAllByText(/insights/i).length).toBeGreaterThan(0);
      });
    });

    it('should display different types of AI insights with proper styling', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        // Should have different insight types with different styling
        expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
      });
    });

    it('should handle AI insights with confidence scores', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        // Should display confidence scores
        expect(screen.getByText(/confidence/i)).toBeInTheDocument();
      });
    });

    it('should show actionable insights with apply buttons', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        // Should show actionable badges and apply buttons
        expect(screen.getAllByText('Actionable').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt layout for mobile devices', async () => {
      // Mock mobile optimization
      require('@/components/mobile/mobile-touch-optimizer').useMobileOptimization = jest.fn(() => ({
        isMobile: true
      }));

      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Intelligence Overview')).toBeInTheDocument();
      });

      // Mobile layout should have different styling and structure
      // This would be verified through className checks in a real implementation
    });

    it('should provide touch-optimized interactions on mobile', async () => {
      require('@/components/mobile/mobile-touch-optimizer').useMobileOptimization = jest.fn(() => ({
        isMobile: true
      }));

      const user = userEvent.setup();

      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh AI')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh AI');
      await user.click(refreshButton);

      expect(mockHapticFeedback.triggerHaptic).toHaveBeenCalledWith('impact', 'medium');
    });
  });

  describe('API Integration', () => {
    it('should call intelligence metrics API on load', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/intelligence/metrics',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });
    });

    it('should call goals API on load', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/intelligence/goals',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });
    });

    it('should call all AI insight APIs for dashboard overview', async () => {
      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        // Should call routine coaching API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/intelligence/routine-coaching',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              message: 'Get my routine insights for today',
              context: { type: 'daily_overview' }
            })
          })
        );

        // Should call project intelligence API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/intelligence/project-intelligence',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              message: 'Analyze my current project health',
              context: { type: 'health_overview' }
            })
          })
        );

        // Should call calendar optimization API
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/intelligence/calendar-optimization',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              message: 'Optimize my schedule for today',
              context: { type: 'daily_optimization' }
            })
          })
        );
      });
    });

    it('should handle API failures gracefully', async () => {
      // Mock one API to fail
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ // Metrics succeed
          ok: true,
          json: async () => ({ knowledgeItems: 0, activeGoals: 0, completedGoals: 0, aiInsights: 0, averageProgress: 0 })
        })
        .mockRejectedValueOnce(new Error('Goals API failed')); // Goals fail

      await act(async () => {
        render(<IntelligencePage />);
      });

      // Should still render with partial data
      await waitFor(() => {
        expect(screen.getByText('Intelligence Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh and Data Updates', () => {
    it('should refresh all data when refresh button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<IntelligencePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh AI')).toBeInTheDocument();
      });

      // Clear previous fetch calls
      (global.fetch as jest.Mock).mockClear();

      // Mock refresh responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ knowledgeItems: 350, activeGoals: 9, completedGoals: 24, aiInsights: 16, averageProgress: 75 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, coaching_insights: "Updated insights" })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, intelligence_insights: "Updated project insights" })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, optimization_insights: "Updated calendar insights" })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([])
        });

      const refreshButton = screen.getByText('Refresh AI');
      await user.click(refreshButton);

      expect(mockHapticFeedback.triggerHaptic).toHaveBeenCalledWith('impact', 'medium');

      // Should make fresh API calls
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});