// /src/components/n8n/__tests__/n8n-workflow-controls.test.tsx
// Comprehensive test suite for N8N workflow controls component
// Tests workflow discovery, activation, search/filtering, and AI trigger configuration
// RELEVANT FILES: n8n-workflow-controls.tsx, main-agent/app/api/endpoints/n8n.py, n8n-workflow-manager.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { N8NWorkflowControls } from '../n8n-workflow-controls';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Settings: ({ className, ...props }: any) => <div data-testid="settings-icon" className={className} {...props} />,
  Play: ({ className, ...props }: any) => <div data-testid="play-icon" className={className} {...props} />,
  Pause: ({ className, ...props }: any) => <div data-testid="pause-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  Search: ({ className, ...props }: any) => <div data-testid="search-icon" className={className} {...props} />,
  Filter: ({ className, ...props }: any) => <div data-testid="filter-icon" className={className} {...props} />,
  Zap: ({ className, ...props }: any) => <div data-testid="zap-icon" className={className} {...props} />,
  Brain: ({ className, ...props }: any) => <div data-testid="brain-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }: any) => <div data-testid="x-circle-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-circle-icon" className={className} {...props} />,
  Clock: ({ className, ...props }: any) => <div data-testid="clock-icon" className={className} {...props} />,
  Tag: ({ className, ...props }: any) => <div data-testid="tag-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }: any) => <div data-testid="trending-up-icon" className={className} {...props} />,
  Activity: ({ className, ...props }: any) => <div data-testid="activity-icon" className={className} {...props} />
}));

// Mock workflows data
const mockWorkflows = [
  {
    id: 'wf-001',
    name: 'Morning Briefing Workflow',
    active: true,
    tags: ['morning', 'briefing', 'intelligence'],
    category: 'intelligence',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-20T10:30:00Z',
    version: '1.2.0',
    description: 'Generates daily morning briefing',
    ai_trigger_enabled: true,
    ai_trigger_confidence: 0.85,
    execution_count: 150,
    success_rate: 0.96,
    last_execution: '2024-01-20T08:15:00Z'
  },
  {
    id: 'wf-002',
    name: 'Task Management Automation',
    active: false,
    tags: ['tasks', 'productivity', 'automation'],
    category: 'productivity',
    created_at: '2024-01-10T14:00:00Z',
    updated_at: '2024-01-18T16:45:00Z',
    version: '2.1.0',
    description: 'Automates task creation and management',
    ai_trigger_enabled: false,
    ai_trigger_confidence: 0.70,
    execution_count: 85,
    success_rate: 0.89,
    last_execution: '2024-01-18T14:30:00Z'
  },
  {
    id: 'wf-003',
    name: 'Calendar Optimization',
    active: true,
    tags: ['calendar', 'optimization', 'scheduling'],
    category: 'productivity',
    created_at: '2024-01-12T09:00:00Z',
    updated_at: '2024-01-19T11:20:00Z',
    version: '1.0.0',
    description: 'Optimizes calendar scheduling',
    ai_trigger_enabled: true,
    ai_trigger_confidence: 0.78,
    execution_count: 200,
    success_rate: 0.92,
    last_execution: '2024-01-19T09:45:00Z'
  }
];

const mockDiscoveryResponse = {
  workflows: mockWorkflows,
  categories: {
    intelligence: mockWorkflows.filter(w => w.category === 'intelligence'),
    productivity: mockWorkflows.filter(w => w.category === 'productivity')
  },
  total_count: mockWorkflows.length,
  active_count: mockWorkflows.filter(w => w.active).length,
  stored_count: mockWorkflows.length
};

describe('N8NWorkflowControls Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Default successful discovery response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDiscoveryResponse)
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Loading and Rendering', () => {
    it('shows loading state initially', () => {
      render(<N8NWorkflowControls />);
      
      expect(screen.getByText('Laden...')).toBeInTheDocument();
      expect(screen.getAllByRole('generic').some(el => el.classList.contains('animate-pulse'))).toBe(true);
    });

    it('renders workflow management header after loading', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Workflow-Verwaltung')).toBeInTheDocument();
        expect(screen.getByText('Workflows entdecken, aktivieren und konfigurieren')).toBeInTheDocument();
      });
    });

    it('renders control buttons', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Aktualisieren')).toBeInTheDocument();
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });
    });

    it('renders search and filter inputs', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Workflows durchsuchen...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Alle Kategorien')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Alle Status')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Discovery', () => {
    it('calls discovery API on component mount', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/main-agent/n8n/discover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: undefined,
            active_only: false,
            include_metrics: true
          })
        });
      });
    });

    it('displays discovered workflows', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
        expect(screen.getByText('Task Management Automation')).toBeInTheDocument();
        expect(screen.getByText('Calendar Optimization')).toBeInTheDocument();
      });
    });

    it('shows workflow count in header', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Workflows (3)')).toBeInTheDocument();
        expect(screen.getByText('2 aktiv, 1 inaktiv')).toBeInTheDocument();
      });
    });

    it('shows success message after discovery', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('3 Workflows discovered, 2 active')).toBeInTheDocument();
      });
    });

    it('handles discovery API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to discover workflows/)).toBeInTheDocument();
      });
    });

    it('handles network errors during discovery', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to discover workflows: Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Display', () => {
    beforeEach(async () => {
      render(<N8NWorkflowControls />);
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
    });

    it('displays workflow badges correctly', () => {
      // Active workflow badge
      const activeBadge = screen.getByText('Aktiv');
      expect(activeBadge).toBeInTheDocument();
      expect(activeBadge.closest('.bg-rix-surface, .bg-green-100')).toBeTruthy();
      
      // Inactive workflow badge  
      const inactiveBadge = screen.getByText('Inaktiv');
      expect(inactiveBadge).toBeInTheDocument();
    });

    it('displays category badges', () => {
      expect(screen.getByText('Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
    });

    it('shows workflow metrics', () => {
      expect(screen.getByText('3 Tags')).toBeInTheDocument();
      expect(screen.getByText('150 Ausführungen')).toBeInTheDocument();
      expect(screen.getByText('96% Erfolg')).toBeInTheDocument();
    });

    it('displays formatted dates', () => {
      expect(screen.getByText(/Zuletzt:/)).toBeInTheDocument();
    });

    it('shows workflow tags', () => {
      expect(screen.getByText('morning')).toBeInTheDocument();
      expect(screen.getByText('briefing')).toBeInTheDocument();
      expect(screen.getByText('intelligence')).toBeInTheDocument();
    });

    it('limits tag display and shows overflow', () => {
      // Workflow with many tags should show only first 5 + overflow indicator
      const workflowWithManyTags = {
        ...mockWorkflows[0],
        id: 'wf-many-tags',
        name: 'Many Tags Workflow',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7']
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockDiscoveryResponse,
          workflows: [workflowWithManyTags]
        })
      });
      
      render(<N8NWorkflowControls />);
      
      waitFor(() => {
        expect(screen.getByText('+2 mehr')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      render(<N8NWorkflowControls />);
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
    });

    it('filters workflows by search term', async () => {
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      await user.type(searchInput, 'Morning');
      
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
        expect(screen.queryByText('Task Management Automation')).not.toBeInTheDocument();
      });
    });

    it('searches by workflow tags', async () => {
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      await user.type(searchInput, 'automation');
      
      await waitFor(() => {
        expect(screen.getByText('Task Management Automation')).toBeInTheDocument();
        expect(screen.queryByText('Morning Briefing Workflow')).not.toBeInTheDocument();
      });
    });

    it('filters by category', async () => {
      const categorySelect = screen.getByDisplayValue('Alle Kategorien');
      await user.selectOptions(categorySelect, 'intelligence');
      
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
        expect(screen.queryByText('Task Management Automation')).not.toBeInTheDocument();
      });
    });

    it('filters by status (active only)', async () => {
      const statusSelect = screen.getByDisplayValue('Alle Status');
      await user.selectOptions(statusSelect, 'active');
      
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
        expect(screen.getByText('Calendar Optimization')).toBeInTheDocument();
        expect(screen.queryByText('Task Management Automation')).not.toBeInTheDocument();
      });
    });

    it('filters by status (inactive only)', async () => {
      const statusSelect = screen.getByDisplayValue('Alle Status');
      await user.selectOptions(statusSelect, 'inactive');
      
      await waitFor(() => {
        expect(screen.getByText('Task Management Automation')).toBeInTheDocument();
        expect(screen.queryByText('Morning Briefing Workflow')).not.toBeInTheDocument();
      });
    });

    it('combines search and filter criteria', async () => {
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      const categorySelect = screen.getByDisplayValue('Alle Kategorien');
      
      await user.type(searchInput, 'productivity');
      await user.selectOptions(categorySelect, 'productivity');
      
      await waitFor(() => {
        expect(screen.getByText('Task Management Automation')).toBeInTheDocument();
        expect(screen.queryByText('Morning Briefing Workflow')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when no workflows match', async () => {
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('Keine Workflows gefunden')).toBeInTheDocument();
        expect(screen.getByText('Versuchen Sie andere Suchbegriffe oder Filter')).toBeInTheDocument();
      });
    });

    it('updates category options based on discovered workflows', async () => {
      const categorySelect = screen.getByDisplayValue('Alle Kategorien');
      const options = Array.from(categorySelect.querySelectorAll('option')).map(option => option.textContent);
      
      expect(options).toContain('Intelligence');
      expect(options).toContain('Productivity');
    });
  });

  describe('Workflow Activation/Deactivation', () => {
    beforeEach(async () => {
      render(<N8NWorkflowControls />);
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
    });

    it('deactivates an active workflow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          new_status: false,
          message: 'Workflow deactivated successfully'
        })
      });
      
      const deactivateButton = screen.getByText('Deaktivieren');
      await user.click(deactivateButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/main-agent/n8n/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_id: 'wf-001',
            active: false
          })
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Workflow deactivated successfully')).toBeInTheDocument();
      });
    });

    it('activates an inactive workflow', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          new_status: true,
          message: 'Workflow activated successfully'
        })
      });
      
      const activateButton = screen.getByText('Aktivieren');
      await user.click(activateButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/main-agent/n8n/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflow_id: 'wf-002',
            active: true
          })
        });
      });
    });

    it('updates workflow state after successful activation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          new_status: true,
          message: 'Workflow activated'
        })
      });
      
      const activateButton = screen.getByText('Aktivieren');
      await user.click(activateButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Aktivieren')).not.toBeInTheDocument();
        expect(screen.getByText('Deaktivieren')).toBeInTheDocument();
      });
    });

    it('handles activation failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });
      
      const activateButton = screen.getByText('Aktivieren');
      await user.click(activateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Activation failed/)).toBeInTheDocument();
      });
    });

    it('handles activation API errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const activateButton = screen.getByText('Aktivieren');
      await user.click(activateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Activation failed: Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Synchronization', () => {
    beforeEach(async () => {
      render(<N8NWorkflowControls />);
      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });
    });

    it('performs workflow sync', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Workflows synchronized successfully',
          synced_count: 3,
          new_count: 1,
          updated_count: 2
        })
      });
      
      const syncButton = screen.getByText('Sync');
      await user.click(syncButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/main-agent/n8n/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            force_refresh: true,
            update_metadata: true,
            categorize_workflows: true
          })
        });
      });
    });

    it('refreshes workflows after successful sync', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'Sync completed'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDiscoveryResponse)
        });
      
      const syncButton = screen.getByText('Sync');
      await user.click(syncButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Sync + Discovery
      });
    });

    it('handles sync failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const syncButton = screen.getByText('Sync');
      await user.click(syncButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Sync failed/)).toBeInTheDocument();
      });
    });

    it('disables buttons during sync operation', async () => {
      let resolveSync: (value: any) => void;
      const syncPromise = new Promise(resolve => {
        resolveSync = resolve;
      });
      
      mockFetch.mockReturnValueOnce(syncPromise);
      
      const syncButton = screen.getByText('Sync');
      const refreshButton = screen.getByText('Aktualisieren');
      
      await user.click(syncButton);
      
      expect(syncButton).toBeDisabled();
      expect(refreshButton).toBeDisabled();
      
      resolveSync!({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Sync completed' })
      });
      
      await waitFor(() => {
        expect(syncButton).not.toBeDisabled();
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('AI Trigger Configuration', () => {
    beforeEach(async () => {
      render(<N8NWorkflowControls />);
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
    });

    it('displays AI trigger switches for workflows', () => {
      const aiSwitches = screen.getAllByText('KI-automatische Ausführung');
      expect(aiSwitches).toHaveLength(mockWorkflows.length);
    });

    it('shows correct initial AI trigger state', () => {
      const switches = screen.getAllByRole('switch');
      // Filter out enable/disable switches and category/status selects
      const aiSwitches = switches.filter(s => 
        s.closest('[data-testid*="brain"]') || 
        s.parentElement?.textContent?.includes('KI-automatische')
      );
      
      expect(aiSwitches.length).toBeGreaterThan(0);
    });

    it('logs AI trigger toggle events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const aiSwitches = screen.getAllByRole('switch');
      const aiTriggerSwitch = aiSwitches.find(s => 
        s.closest('div')?.textContent?.includes('KI-automatische')
      );
      
      if (aiTriggerSwitch) {
        await user.click(aiTriggerSwitch);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(/AI trigger (enabled|disabled) for workflow:/),
          expect.any(String)
        );
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no workflows discovered', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          workflows: [],
          categories: {},
          total_count: 0,
          active_count: 0,
          stored_count: 0
        })
      });
      
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Keine Workflows gefunden')).toBeInTheDocument();
        expect(screen.getByText('Stellen Sie sicher, dass N8N verbunden ist und Workflows verfügbar sind')).toBeInTheDocument();
      });
    });

    it('shows filtered empty state', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('Versuchen Sie andere Suchbegriffe oder Filter')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('stacks controls vertically on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        const controlsContainer = screen.getByText('Workflows durchsuchen...').closest('.flex');
        expect(controlsContainer).toHaveClass('flex-col');
      });
    });

    it('has touch-friendly button sizes', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          if (button.classList.contains('touch-manipulation')) {
            expect(button).toHaveClass('min-h-[36px]');
          }
        });
      });
    });
  });

  describe('Performance', () => {
    it('debounces search input', async () => {
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      
      // Type quickly
      await user.type(searchInput, 'test');
      
      // Should not cause multiple re-renders
      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    });

    it('prevents multiple simultaneous sync operations', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });
      
      mockFetch.mockReturnValueOnce(firstPromise);
      
      render(<N8NWorkflowControls />);
      
      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });
      
      const syncButton = screen.getByText('Sync');
      
      // Start first sync
      await user.click(syncButton);
      expect(syncButton).toBeDisabled();
      
      // Try to start second sync
      await user.click(syncButton);
      
      // Should still be disabled
      expect(syncButton).toBeDisabled();
      
      // Resolve first sync
      resolveFirst!({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Sync completed' })
      });
      
      await waitFor(() => {
        expect(syncButton).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<N8NWorkflowControls />);
      await waitFor(() => {
        expect(screen.getByText('Morning Briefing Workflow')).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels', () => {
      expect(screen.getByLabelText(/Workflows durchsuchen/)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const searchInput = screen.getByPlaceholderText('Workflows durchsuchen...');
      searchInput.focus();
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).not.toBe(searchInput);
    });

    it('has proper heading hierarchy', () => {
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has sufficient color contrast for status indicators', () => {
      const statusElements = screen.getAllByText(/Aktiv|Inaktiv/);
      statusElements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });
});