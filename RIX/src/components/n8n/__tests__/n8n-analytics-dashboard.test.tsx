// /src/components/n8n/__tests__/n8n-analytics-dashboard.test.tsx
// Comprehensive test suite for N8N analytics dashboard component
// Tests performance metrics, category breakdown, AI trigger statistics, and time period filtering
// RELEVANT FILES: n8n-analytics-dashboard.tsx, main-agent/app/api/endpoints/n8n.py, n8n-workflow-manager.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { N8NAnalyticsDashboard } from '../n8n-analytics-dashboard';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  BarChart3: ({ className, ...props }: any) => <div data-testid="bar-chart-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }: any) => <div data-testid="trending-up-icon" className={className} {...props} />,
  TrendingDown: ({ className, ...props }: any) => <div data-testid="trending-down-icon" className={className} {...props} />,
  Activity: ({ className, ...props }: any) => <div data-testid="activity-icon" className={className} {...props} />,
  Brain: ({ className, ...props }: any) => <div data-testid="brain-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }: any) => <div data-testid="x-circle-icon" className={className} {...props} />,
  Clock: ({ className, ...props }: any) => <div data-testid="clock-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  Calendar: ({ className, ...props }: any) => <div data-testid="calendar-icon" className={className} {...props} />,
  Zap: ({ className, ...props }: any) => <div data-testid="zap-icon" className={className} {...props} />,
  Settings: ({ className, ...props }: any) => <div data-testid="settings-icon" className={className} {...props} />,
  Target: ({ className, ...props }: any) => <div data-testid="target-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-circle-icon" className={className} {...props} />
}));

// Mock analytics data
const mockAnalyticsData = {
  summary: {
    total_executions: 1250,
    total_ai_triggered: 320,
    avg_success_rate: 0.94,
    avg_execution_time: 2.8,
    period_start: '2024-01-14T00:00:00Z',
    period_end: '2024-01-21T23:59:59Z'
  },
  categories: [
    {
      category: 'intelligence',
      workflow_count: 5,
      active_count: 4,
      total_executions: 450,
      avg_success_rate: 0.96
    },
    {
      category: 'productivity',
      workflow_count: 8,
      active_count: 6,
      total_executions: 600,
      avg_success_rate: 0.92
    },
    {
      category: 'automation',
      workflow_count: 3,
      active_count: 2,
      total_executions: 200,
      avg_success_rate: 0.98
    }
  ],
  top_performers: [
    {
      workflow_id: 'wf-001',
      name: 'Morning Briefing Workflow',
      execution_count: 150,
      success_rate: 0.98,
      avg_execution_time: 1.2,
      ai_triggered_count: 45
    },
    {
      workflow_id: 'wf-002',
      name: 'Calendar Optimization',
      execution_count: 120,
      success_rate: 0.95,
      avg_execution_time: 2.1,
      ai_triggered_count: 38
    },
    {
      workflow_id: 'wf-003',
      name: 'Task Management',
      execution_count: 100,
      success_rate: 0.93,
      avg_execution_time: 3.5,
      ai_triggered_count: 25
    }
  ],
  recent_executions: [
    {
      id: 'exec-001',
      workflow_id: 'wf-001',
      workflow_name: 'Morning Briefing Workflow',
      status: 'completed',
      started_at: '2024-01-21T08:15:00Z',
      finished_at: '2024-01-21T08:16:30Z',
      execution_time: 1.5,
      ai_triggered: true
    },
    {
      id: 'exec-002',
      workflow_id: 'wf-002',
      workflow_name: 'Calendar Optimization',
      status: 'completed',
      started_at: '2024-01-21T09:30:00Z',
      finished_at: '2024-01-21T09:32:15Z',
      execution_time: 2.25,
      ai_triggered: false
    },
    {
      id: 'exec-003',
      workflow_id: 'wf-003',
      workflow_name: 'Task Management',
      status: 'failed',
      started_at: '2024-01-21T10:45:00Z',
      finished_at: '2024-01-21T10:47:00Z',
      execution_time: 2.0,
      ai_triggered: true
    },
    {
      id: 'exec-004',
      workflow_id: 'wf-001',
      workflow_name: 'Morning Briefing Workflow',
      status: 'running',
      started_at: '2024-01-21T11:00:00Z',
      ai_triggered: false
    }
  ],
  ai_triggered_stats: {
    total_ai_triggered: 320,
    ai_triggered_percentage: 25.6,
    avg_confidence: 0.82
  },
  period_days: 7
};

describe('N8NAnalyticsDashboard Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Default successful analytics response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData)
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Loading and Rendering', () => {
    it('shows loading state initially', () => {
      render(<N8NAnalyticsDashboard />);
      
      expect(screen.getByText('Laden...')).toBeInTheDocument();
      expect(screen.getAllByRole('generic').some(el => el.classList.contains('animate-pulse'))).toBe(true);
    });

    it('renders analytics header after loading', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Workflow Analytics')).toBeInTheDocument();
        expect(screen.getByText('Performance-Metriken für die letzten 7 Tage')).toBeInTheDocument();
      });
    });

    it('renders period selector', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('7')).toBeInTheDocument();
        expect(screen.getByText('Aktualisieren')).toBeInTheDocument();
      });
    });

    it('calls analytics API on component mount', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/main-agent/n8n/analytics?days=7');
      });
    });
  });

  describe('Summary Statistics', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Workflow Analytics')).toBeInTheDocument();
      });
    });

    it('displays total executions', () => {
      expect(screen.getByText('Gesamt Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('1250')).toBeInTheDocument();
    });

    it('displays success rate', () => {
      expect(screen.getByText('Erfolgsrate')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    it('displays AI-triggered count', () => {
      expect(screen.getByText('KI-getriggert')).toBeInTheDocument();
      expect(screen.getByText('320')).toBeInTheDocument();
      expect(screen.getByText('26% aller Ausführungen')).toBeInTheDocument();
    });

    it('displays average execution time', () => {
      expect(screen.getByText('Ø Ausführungszeit')).toBeInTheDocument();
      expect(screen.getByText('2.8s')).toBeInTheDocument();
    });

    it('formats execution time correctly for minutes', async () => {
      const longTimeData = {
        ...mockAnalyticsData,
        summary: {
          ...mockAnalyticsData.summary,
          avg_execution_time: 125.5 // > 60 seconds
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(longTimeData)
      });
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('2m 5s')).toBeInTheDocument();
      });
    });
  });

  describe('Categories Performance', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Kategorien Performance')).toBeInTheDocument();
      });
    });

    it('displays category performance section', () => {
      expect(screen.getByText('Kategorien Performance')).toBeInTheDocument();
      expect(screen.getByText('Workflow-Performance nach Kategorien')).toBeInTheDocument();
    });

    it('shows category statistics', () => {
      expect(screen.getByText('Intelligence')).toBeInTheDocument();
      expect(screen.getByText('5 Workflows (4 aktiv)')).toBeInTheDocument();
      expect(screen.getByText('450 Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('96%')).toBeInTheDocument();
      
      expect(screen.getByText('Productivity')).toBeInTheDocument();
      expect(screen.getByText('8 Workflows (6 aktiv)')).toBeInTheDocument();
      expect(screen.getByText('600 Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('applies correct category colors', () => {
      const intelligenceBadge = screen.getByText('Intelligence').closest('.border-blue-200');
      const productivityBadge = screen.getByText('Productivity').closest('.border-green-200');
      
      expect(intelligenceBadge).toBeTruthy();
      expect(productivityBadge).toBeTruthy();
    });

    it('shows empty state when no categories available', async () => {
      const noCategoriesData = {
        ...mockAnalyticsData,
        categories: []
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(noCategoriesData)
      });
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Keine Kategorie-Daten verfügbar')).toBeInTheDocument();
      });
    });
  });

  describe('Top Performers', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Top Performance Workflows')).toBeInTheDocument();
      });
    });

    it('displays top performers section', () => {
      expect(screen.getByText('Top Performance Workflows')).toBeInTheDocument();
      expect(screen.getByText('Die erfolgreichsten Workflows in diesem Zeitraum')).toBeInTheDocument();
    });

    it('shows top performing workflows', () => {
      expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      expect(screen.getByText('Calendar Optimization')).toBeInTheDocument();
      expect(screen.getByText('Task Management')).toBeInTheDocument();
    });

    it('displays ranking numbers', () => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('shows performance metrics for each workflow', () => {
      expect(screen.getByText('150 Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('98% Erfolg')).toBeInTheDocument();
      expect(screen.getByText('1.2s Ø Zeit')).toBeInTheDocument();
    });

    it('shows AI-triggered counts', () => {
      expect(screen.getByText('45 KI-getriggert')).toBeInTheDocument();
      expect(screen.getByText('38 KI-getriggert')).toBeInTheDocument();
      expect(screen.getByText('25 KI-getriggert')).toBeInTheDocument();
    });

    it('applies different badge styles based on success rate', () => {
      const highSuccessRate = screen.getByText('98%');
      const lowerSuccessRate = screen.getByText('93%');
      
      expect(highSuccessRate.closest('.bg-rix-surface, .bg-primary')).toBeTruthy();
      expect(lowerSuccessRate.closest('.bg-secondary')).toBeTruthy();
    });

    it('hides section when no top performers available', async () => {
      const noPerformersData = {
        ...mockAnalyticsData,
        top_performers: []
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(noPerformersData)
      });
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Top Performance Workflows')).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Executions', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Aktuelle Ausführungen')).toBeInTheDocument();
      });
    });

    it('displays recent executions section', () => {
      expect(screen.getByText('Aktuelle Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('Die letzten Workflow-Ausführungen')).toBeInTheDocument();
    });

    it('shows execution details', () => {
      expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      expect(screen.getByText('Calendar Optimization')).toBeInTheDocument();
      expect(screen.getByText('Task Management')).toBeInTheDocument();
    });

    it('displays status icons correctly', () => {
      expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(2); // 2 completed
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument(); // 1 failed
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument(); // 1 running
    });

    it('shows execution times', () => {
      expect(screen.getByText('• 1.5s')).toBeInTheDocument();
      expect(screen.getByText('• 2.3s')).toBeInTheDocument();
      expect(screen.getByText('• 2.0s')).toBeInTheDocument();
    });

    it('shows AI-triggered badges', () => {
      const aiTriggeredBadges = screen.getAllByText('KI-getriggert');
      expect(aiTriggeredBadges).toHaveLength(2); // 2 AI-triggered executions
    });

    it('displays formatted execution dates', () => {
      expect(screen.getByText(/21. Jan/)).toBeInTheDocument();
    });

    it('applies correct status badge colors', () => {
      const completedBadges = screen.getAllByText('completed');
      const failedBadge = screen.getByText('failed');
      const runningBadge = screen.getByText('running');
      
      expect(completedBadges.length).toBeGreaterThan(0);
      expect(failedBadge.closest('.bg-destructive, .text-destructive')).toBeTruthy();
      expect(runningBadge.closest('.bg-secondary')).toBeTruthy();
    });

    it('shows empty state when no recent executions', async () => {
      const noExecutionsData = {
        ...mockAnalyticsData,
        recent_executions: []
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(noExecutionsData)
      });
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Keine aktuellen Ausführungen verfügbar')).toBeInTheDocument();
      });
    });
  });

  describe('AI Trigger Statistics', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('KI-getriggerte Ausführungen')).toBeInTheDocument();
      });
    });

    it('displays AI trigger statistics section', () => {
      expect(screen.getByText('KI-getriggerte Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('Statistiken über automatische KI-gesteuerte Workflow-Ausführungen')).toBeInTheDocument();
    });

    it('shows AI trigger metrics', () => {
      expect(screen.getByText('KI-getriggerte Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('Anteil aller Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('Ø KI-Konfidenz')).toBeInTheDocument();
    });

    it('displays AI trigger counts and percentages', () => {
      expect(screen.getByText('320')).toBeInTheDocument(); // Total AI triggered
      expect(screen.getByText('26%')).toBeInTheDocument(); // Percentage
      expect(screen.getByText('82%')).toBeInTheDocument(); // Average confidence
    });

    it('shows appropriate icons for AI statistics', () => {
      expect(screen.getAllByTestId('zap-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('target-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('trending-up-icon')).toHaveLength(1);
    });
  });

  describe('Period Selection', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Workflow Analytics')).toBeInTheDocument();
      });
    });

    it('has all period options available', () => {
      const periodSelect = screen.getByDisplayValue('7');
      const options = Array.from(periodSelect.querySelectorAll('option')).map(option => option.value);
      
      expect(options).toEqual(['1', '7', '30', '90']);
    });

    it('changes period and refetches data', async () => {
      const periodSelect = screen.getByDisplayValue('7');
      await user.selectOptions(periodSelect, '30');
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/main-agent/n8n/analytics?days=30');
      });
    });

    it('updates description based on selected period', async () => {
      const periodSelect = screen.getByDisplayValue('7');
      await user.selectOptions(periodSelect, '1');
      
      await waitFor(() => {
        expect(screen.getByText('Performance-Metriken für die letzten 1 Tage')).toBeInTheDocument();
      });
    });

    it('maintains period selection across refreshes', async () => {
      const periodSelect = screen.getByDisplayValue('7');
      await user.selectOptions(periodSelect, '30');
      
      const refreshButton = screen.getByText('Aktualisieren');
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(periodSelect).toHaveValue('30');
      });
    });
  });

  describe('Data Refresh', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Aktualisieren')).toBeInTheDocument();
      });
    });

    it('refreshes data when refresh button clicked', async () => {
      const refreshButton = screen.getByText('Aktualisieren');
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('shows loading state during refresh', async () => {
      let resolveRefresh: (value: any) => void;
      const refreshPromise = new Promise(resolve => {
        resolveRefresh = resolve;
      });
      
      mockFetch.mockReturnValueOnce(refreshPromise);
      
      const refreshButton = screen.getByText('Aktualisieren');
      await user.click(refreshButton);
      
      expect(refreshButton).toBeDisabled();
      expect(screen.getByTestId('refresh-icon')).toHaveClass('animate-spin');
      
      resolveRefresh!({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      });
      
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });

    it('prevents multiple simultaneous refreshes', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });
      
      mockFetch.mockReturnValueOnce(firstPromise);
      
      const refreshButton = screen.getByText('Aktualisieren');
      
      // Start first refresh
      await user.click(refreshButton);
      expect(refreshButton).toBeDisabled();
      
      // Try to start second refresh
      await user.click(refreshButton);
      
      // Should still be disabled
      expect(refreshButton).toBeDisabled();
      
      // Resolve first refresh
      resolveFirst!({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      });
      
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error state when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics nicht verfügbar')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics nicht verfügbar')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load analytics: Network error/)).toBeInTheDocument();
      });
    });

    it('shows error state with alert icon', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('recovers from errors on retry', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics nicht verfügbar')).toBeInTheDocument();
      });
      
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      });
      
      const refreshButton = screen.getByText('Aktualisieren');
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText('Workflow Analytics')).toBeInTheDocument();
        expect(screen.queryByText('Analytics nicht verfügbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('formats percentages correctly', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('94%')).toBeInTheDocument(); // 0.94 -> 94%
        expect(screen.getByText('96%')).toBeInTheDocument(); // 0.96 -> 96%
      });
    });

    it('formats execution times correctly', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('2.8s')).toBeInTheDocument();
        expect(screen.getByText('1.2s')).toBeInTheDocument();
      });
    });

    it('formats dates in German locale', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/21. Jan/)).toBeInTheDocument();
      });
    });

    it('handles missing execution times gracefully', async () => {
      const missingTimeData = {
        ...mockAnalyticsData,
        recent_executions: [
          {
            ...mockAnalyticsData.recent_executions[0],
            execution_time: undefined
          }
        ]
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(missingTimeData)
      });
      
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('• undefined')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<N8NAnalyticsDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Workflow Analytics')).toBeInTheDocument();
      });
    });

    it('has proper heading hierarchy', () => {
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has descriptive section headers', () => {
      expect(screen.getByText('Kategorien Performance')).toBeInTheDocument();
      expect(screen.getByText('Top Performance Workflows')).toBeInTheDocument();
      expect(screen.getByText('Aktuelle Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('KI-getriggerte Ausführungen')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const periodSelect = screen.getByDisplayValue('7');
      periodSelect.focus();
      
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(periodSelect);
    });

    it('has adequate color contrast for status indicators', () => {
      const statusElements = screen.getAllByText(/completed|failed|running/);
      statusElements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('prevents multiple simultaneous API calls', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });
      
      mockFetch.mockReturnValueOnce(firstPromise);
      
      render(<N8NAnalyticsDashboard />);
      
      // Component mounts, starting first call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Try to trigger refresh while first call is pending
      const refreshButton = await screen.findByText('Workflow Analytics');
      
      // Should not make additional calls while loading
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Resolve first call
      resolveFirst!({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      });
      
      await waitFor(() => {
        expect(screen.getByText('1250')).toBeInTheDocument();
      });
    });

    it('debounces period changes', async () => {
      render(<N8NAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('7')).toBeInTheDocument();
      });
      
      const periodSelect = screen.getByDisplayValue('7');
      
      // Rapid changes
      await user.selectOptions(periodSelect, '30');
      await user.selectOptions(periodSelect, '90');
      
      // Should only make the final API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith('/api/main-agent/n8n/analytics?days=90');
      });
    });
  });
});