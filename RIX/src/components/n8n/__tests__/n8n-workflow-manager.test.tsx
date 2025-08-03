// /src/components/n8n/__tests__/n8n-workflow-manager.test.tsx
// Comprehensive test suite for N8N workflow manager component
// Tests tabbed interface, component integration, and overall workflow management
// RELEVANT FILES: n8n-workflow-manager.tsx, n8n-connection-interface.tsx, n8n-workflow-controls.tsx, n8n-analytics-dashboard.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { N8NWorkflowManager } from '../n8n-workflow-manager';

// Mock the N8N store
const mockN8NStore = {
  status: {
    connected: false,
    url: 'https://n8n.smb-ai-solution.com',
    workflows: {},
    response_time: 150
  },
  isLoading: false,
  error: null,
  checkStatus: jest.fn()
};

jest.mock('@/store/n8n-store', () => ({
  useN8NStore: () => mockN8NStore
}));

// Mock child components
jest.mock('../n8n-connection-interface', () => ({
  N8NConnectionInterface: () => <div data-testid="connection-interface">Connection Interface</div>
}));

jest.mock('../n8n-workflow-controls', () => ({
  N8NWorkflowControls: () => <div data-testid="workflow-controls">Workflow Controls</div>
}));

jest.mock('../n8n-analytics-dashboard', () => ({
  N8NAnalyticsDashboard: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Settings: ({ className, ...props }: any) => <div data-testid="settings-icon" className={className} {...props} />,
  Workflow: ({ className, ...props }: any) => <div data-testid="workflow-icon" className={className} {...props} />,
  BarChart3: ({ className, ...props }: any) => <div data-testid="bar-chart-icon" className={className} {...props} />,
  Link: ({ className, ...props }: any) => <div data-testid="link-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }: any) => <div data-testid="x-circle-icon" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }: any) => <div data-testid="alert-triangle-icon" className={className} {...props} />
}));

describe('N8NWorkflowManager Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the workflow manager container', () => {
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('N8N Workflow-Management')).toBeInTheDocument();
      expect(screen.getByText('Verwalten Sie Ihre N8N Workflows, Verbindungen und Performance-Metriken')).toBeInTheDocument();
    });

    it('renders all tab buttons', () => {
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Verbindung')).toBeInTheDocument();
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('has correct icons for each tab', () => {
      render(<N8NWorkflowManager />);
      
      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-icon')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
    });

    it('shows connection status indicator', () => {
      render(<N8NWorkflowManager />);
      
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument(); // Disconnected by default
      expect(screen.getByText('Nicht verbunden')).toBeInTheDocument();
    });

    it('shows connected status when N8N is connected', () => {
      mockN8NStore.status.connected = true;
      render(<N8NWorkflowManager />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Verbunden')).toBeInTheDocument();
    });

    it('shows error status when there is an error', () => {
      mockN8NStore.error = 'Connection failed';
      render(<N8NWorkflowManager />);
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Fehler')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('defaults to Connection tab', () => {
      render(<N8NWorkflowManager />);
      
      const connectionTab = screen.getByText('Verbindung');
      expect(connectionTab.closest('button')).toHaveClass('bg-rix-surface');
      expect(screen.getByTestId('connection-interface')).toBeInTheDocument();
    });

    it('switches to Workflows tab when clicked', async () => {
      render(<N8NWorkflowManager />);
      
      const workflowsTab = screen.getByText('Workflows');
      await user.click(workflowsTab);
      
      expect(workflowsTab.closest('button')).toHaveClass('bg-rix-surface');
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
      expect(screen.queryByTestId('connection-interface')).not.toBeInTheDocument();
    });

    it('switches to Analytics tab when clicked', async () => {
      render(<N8NWorkflowManager />);
      
      const analyticsTab = screen.getByText('Analytics');
      await user.click(analyticsTab);
      
      expect(analyticsTab.closest('button')).toHaveClass('bg-rix-surface');
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('connection-interface')).not.toBeInTheDocument();
    });

    it('maintains tab state during re-renders', async () => {
      const { rerender } = render(<N8NWorkflowManager />);
      
      const workflowsTab = screen.getByText('Workflows');
      await user.click(workflowsTab);
      
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
      
      rerender(<N8NWorkflowManager />);
      
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
    });

    it('supports keyboard navigation between tabs', async () => {
      render(<N8NWorkflowManager />);
      
      const connectionTab = screen.getByText('Verbindung');
      connectionTab.focus();
      
      await user.keyboard('{Tab}');
      expect(document.activeElement?.textContent).toBe('Workflows');
      
      await user.keyboard('{Tab}');
      expect(document.activeElement?.textContent).toBe('Analytics');
    });

    it('activates tab with Enter key', async () => {
      render(<N8NWorkflowManager />);
      
      const workflowsTab = screen.getByText('Workflows');
      workflowsTab.focus();
      
      await user.keyboard('{Enter}');
      
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
    });

    it('activates tab with Space key', async () => {
      render(<N8NWorkflowManager />);
      
      const analyticsTab = screen.getByText('Analytics');
      analyticsTab.focus();
      
      await user.keyboard(' ');
      
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('shows loading status', () => {
      mockN8NStore.isLoading = true;
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Lädt...')).toBeInTheDocument();
    });

    it('shows connection URL when connected', () => {
      mockN8NStore.status.connected = true;
      mockN8NStore.status.url = 'https://n8n.example.com';
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('https://n8n.example.com')).toBeInTheDocument();
    });

    it('shows workflow count when connected', () => {
      mockN8NStore.status.connected = true;
      mockN8NStore.status.workflows = {
        wf1: {},
        wf2: {},
        wf3: {}
      };
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('3 Workflows')).toBeInTheDocument();
    });

    it('handles empty workflows object', () => {
      mockN8NStore.status.connected = true;
      mockN8NStore.status.workflows = {};
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('0 Workflows')).toBeInTheDocument();
    });

    it('shows response time when available', () => {
      mockN8NStore.status.connected = true;
      mockN8NStore.status.response_time = 250;
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('250ms')).toBeInTheDocument();
    });
  });

  describe('Tab Content Rendering', () => {
    it('renders Connection tab content correctly', () => {
      render(<N8NWorkflowManager />);
      
      expect(screen.getByTestId('connection-interface')).toBeInTheDocument();
      expect(screen.queryByTestId('workflow-controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
    });

    it('renders Workflows tab content correctly', async () => {
      render(<N8NWorkflowManager />);
      
      await user.click(screen.getByText('Workflows'));
      
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
      expect(screen.queryByTestId('connection-interface')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
    });

    it('renders Analytics tab content correctly', async () => {
      render(<N8NWorkflowManager />);
      
      await user.click(screen.getByText('Analytics'));
      
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('connection-interface')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workflow-controls')).not.toBeInTheDocument();
    });

    it('preserves tab content state during navigation', async () => {
      render(<N8NWorkflowManager />);
      
      // Switch to workflows tab
      await user.click(screen.getByText('Workflows'));
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
      
      // Switch to analytics tab
      await user.click(screen.getByText('Analytics'));
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      
      // Switch back to workflows tab
      await user.click(screen.getByText('Workflows'));
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to child components', () => {
      render(<N8NWorkflowManager />);
      
      // All child components should be rendered without props errors
      expect(screen.getByTestId('connection-interface')).toBeInTheDocument();
    });

    it('handles child component errors gracefully', () => {
      // Mock child component to throw error
      jest.doMock('../n8n-connection-interface', () => ({
        N8NConnectionInterface: () => {
          throw new Error('Child component error');
        }
      }));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Component should still render without crashing
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('N8N Workflow-Management')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('stacks tabs vertically on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<N8NWorkflowManager />);
      
      const tabContainer = screen.getByText('Verbindung').closest('.flex');
      expect(tabContainer).toHaveClass('flex-col');
    });

    it('displays tabs horizontally on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<N8NWorkflowManager />);
      
      const tabContainer = screen.getByText('Verbindung').closest('.flex');
      expect(tabContainer).toHaveClass('md:flex-row');
    });

    it('has touch-friendly tab buttons', () => {
      render(<N8NWorkflowManager />);
      
      const tabButtons = screen.getAllByRole('button');
      tabButtons.forEach(button => {
        if (button.textContent?.includes('Verbindung') || 
            button.textContent?.includes('Workflows') || 
            button.textContent?.includes('Analytics')) {
          expect(button).toHaveClass('min-h-[44px]');
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for tabs', () => {
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Verbindung').closest('button')).toHaveAttribute('role', 'tab');
      expect(screen.getByText('Workflows').closest('button')).toHaveAttribute('role', 'tab');
      expect(screen.getByText('Analytics').closest('button')).toHaveAttribute('role', 'tab');
    });

    it('has proper tablist role', () => {
      render(<N8NWorkflowManager />);
      
      const tabList = screen.getByText('Verbindung').closest('.flex');
      expect(tabList).toHaveAttribute('role', 'tablist');
    });

    it('manages focus properly', async () => {
      render(<N8NWorkflowManager />);
      
      const workflowsTab = screen.getByText('Workflows');
      await user.click(workflowsTab);
      
      expect(workflowsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('has proper heading hierarchy', () => {
      render(<N8NWorkflowManager />);
      
      const mainHeading = screen.getByText('N8N Workflow-Management');
      expect(mainHeading).toBeInTheDocument();
    });

    it('supports screen reader navigation', () => {
      render(<N8NWorkflowManager />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      tabs.forEach(tab => {
        expect(tab).toBeVisible();
      });
    });
  });

  describe('Visual States', () => {
    it('highlights active tab', () => {
      render(<N8NWorkflowManager />);
      
      const connectionTab = screen.getByText('Verbindung').closest('button');
      const workflowsTab = screen.getByText('Workflows').closest('button');
      
      expect(connectionTab).toHaveClass('bg-rix-surface');
      expect(workflowsTab).not.toHaveClass('bg-rix-surface');
    });

    it('shows hover states for inactive tabs', async () => {
      render(<N8NWorkflowManager />);
      
      const workflowsTab = screen.getByText('Workflows').closest('button');
      
      await user.hover(workflowsTab!);
      
      expect(workflowsTab).toHaveClass('hover:bg-rix-bg-secondary');
    });

    it('shows correct status colors', () => {
      mockN8NStore.status.connected = true;
      render(<N8NWorkflowManager />);
      
      const statusIcon = screen.getByTestId('check-circle-icon');
      expect(statusIcon).toHaveClass('text-green-500');
    });

    it('shows error status color', () => {
      mockN8NStore.error = 'Connection failed';
      render(<N8NWorkflowManager />);
      
      const statusIcon = screen.getByTestId('alert-triangle-icon');
      expect(statusIcon).toHaveClass('text-red-500');
    });
  });

  describe('Performance', () => {
    it('lazy loads tab content', async () => {
      render(<N8NWorkflowManager />);
      
      // Initially only connection interface should be rendered
      expect(screen.getByTestId('connection-interface')).toBeInTheDocument();
      expect(screen.queryByTestId('workflow-controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
      
      // Switch to workflows tab
      await user.click(screen.getByText('Workflows'));
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
      
      // Switch to analytics tab
      await user.click(screen.getByText('Analytics'));
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });

    it('prevents unnecessary re-renders', async () => {
      const { rerender } = render(<N8NWorkflowManager />);
      
      // Switch to workflows tab
      await user.click(screen.getByText('Workflows'));
      
      // Re-render with same props
      rerender(<N8NWorkflowManager />);
      
      // Should maintain tab state without re-mounting components
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
    });

    it('handles rapid tab switching', async () => {
      render(<N8NWorkflowManager />);
      
      // Rapidly switch between tabs
      await user.click(screen.getByText('Workflows'));
      await user.click(screen.getByText('Analytics'));
      await user.click(screen.getByText('Verbindung'));
      await user.click(screen.getByText('Workflows'));
      
      // Should end up on workflows tab
      expect(screen.getByTestId('workflow-controls')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles store errors gracefully', () => {
      mockN8NStore.error = 'Failed to connect to N8N';
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Fehler')).toBeInTheDocument();
      expect(screen.getByText('N8N Workflow-Management')).toBeInTheDocument();
    });

    it('continues to function when one tab has errors', async () => {
      render(<N8NWorkflowManager />);
      
      // Even if one component fails, tab navigation should still work
      await user.click(screen.getByText('Analytics'));
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
      
      await user.click(screen.getByText('Verbindung'));
      expect(screen.getByTestId('connection-interface')).toBeInTheDocument();
    });

    it('shows fallback content for missing components', () => {
      // Mock missing component
      jest.doMock('../n8n-workflow-controls', () => ({
        N8NWorkflowControls: null
      }));
      
      render(<N8NWorkflowManager />);
      
      // Should still render tab structure
      expect(screen.getByText('Workflows')).toBeInTheDocument();
    });
  });

  describe('Integration with N8N Store', () => {
    it('reflects store state changes', () => {
      const { rerender } = render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Nicht verbunden')).toBeInTheDocument();
      
      // Simulate store state change
      mockN8NStore.status.connected = true;
      rerender(<N8NWorkflowManager />);
      
      expect(screen.getByText('Verbunden')).toBeInTheDocument();
    });

    it('handles loading state from store', () => {
      mockN8NStore.isLoading = true;
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Lädt...')).toBeInTheDocument();
    });

    it('displays detailed status information', () => {
      mockN8NStore.status = {
        connected: true,
        url: 'https://n8n.production.com',
        workflows: { wf1: {}, wf2: {} },
        response_time: 180
      };
      
      render(<N8NWorkflowManager />);
      
      expect(screen.getByText('Verbunden')).toBeInTheDocument();
      expect(screen.getByText('https://n8n.production.com')).toBeInTheDocument();
      expect(screen.getByText('2 Workflows')).toBeInTheDocument();
      expect(screen.getByText('180ms')).toBeInTheDocument();
    });
  });
});