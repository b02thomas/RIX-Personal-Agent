// /src/app/api/main-agent/n8n/__tests__/integration.test.ts
// Integration test suite for end-to-end N8N workflow management flow
// Tests complete workflow from frontend through API routes to Main Agent and back
// RELEVANT FILES: All N8N components and API routes, Main Agent services

import { POST as DiscoverPOST } from '../../discover/route';
import { POST as ActivatePOST } from '../../activate/route';
import { GET as AnalyticsGET } from '../../analytics/route';
import { NextRequest } from 'next/server';

// Mock the Main Agent fetch
const mockMainAgentFetch = jest.fn();
global.fetch = mockMainAgentFetch;

// Mock auth verification
const mockVerifyAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  verifyAuth: () => mockVerifyAuth()
}));

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env.MAIN_AGENT_URL = 'http://localhost:8001';
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock user
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User'
};

// Mock data for comprehensive testing
const mockWorkflowsData = [
  {
    id: 'wf-morning-brief',
    name: 'Morning Intelligence Brief',
    active: true,
    tags: ['morning', 'intelligence', 'daily'],
    category: 'intelligence',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-21T07:30:00Z',
    version: '2.1.0',
    execution_count: 180,
    success_rate: 0.96,
    last_execution: '2024-01-21T08:00:00Z'
  },
  {
    id: 'wf-task-mgmt',
    name: 'Task Management Automation',
    active: false,
    tags: ['tasks', 'productivity', 'automation'],
    category: 'productivity',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T14:15:00Z',
    version: '1.5.2',
    execution_count: 95,
    success_rate: 0.88,
    last_execution: '2024-01-20T11:30:00Z'
  },
  {
    id: 'wf-calendar-opt',
    name: 'Calendar Optimization',
    active: true,
    tags: ['calendar', 'scheduling', 'optimization'],
    category: 'productivity',
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-21T09:45:00Z',
    version: '1.2.1',
    execution_count: 220,
    success_rate: 0.92,
    last_execution: '2024-01-21T09:45:00Z'
  }
];

const mockDiscoveryResponse = {
  workflows: mockWorkflowsData,
  categories: {
    intelligence: [mockWorkflowsData[0]],
    productivity: [mockWorkflowsData[1], mockWorkflowsData[2]]
  },
  total_count: 3,
  active_count: 2,
  stored_count: 3
};

const mockAnalyticsData = {
  summary: {
    total_executions: 495,
    total_ai_triggered: 125,
    avg_success_rate: 0.92,
    avg_execution_time: 2.8,
    period_start: '2024-01-14T00:00:00Z',
    period_end: '2024-01-21T23:59:59Z'
  },
  categories: [
    {
      category: 'intelligence',
      workflow_count: 1,
      active_count: 1,
      total_executions: 180,
      avg_success_rate: 0.96
    },
    {
      category: 'productivity',
      workflow_count: 2,
      active_count: 1,
      total_executions: 315,
      avg_success_rate: 0.90
    }
  ],
  top_performers: [
    {
      workflow_id: 'wf-calendar-opt',
      name: 'Calendar Optimization',
      execution_count: 220,
      success_rate: 0.92,
      avg_execution_time: 2.1,
      ai_triggered_count: 65
    },
    {
      workflow_id: 'wf-morning-brief',
      name: 'Morning Intelligence Brief',
      execution_count: 180,
      success_rate: 0.96,
      avg_execution_time: 1.8,
      ai_triggered_count: 45
    }
  ],
  recent_executions: [
    {
      id: 'exec-001',
      workflow_id: 'wf-morning-brief',
      workflow_name: 'Morning Intelligence Brief',
      status: 'completed',
      started_at: '2024-01-21T08:00:00Z',
      finished_at: '2024-01-21T08:01:48Z',
      execution_time: 1.8,
      ai_triggered: true
    },
    {
      id: 'exec-002',
      workflow_id: 'wf-calendar-opt',
      workflow_name: 'Calendar Optimization',
      status: 'completed',
      started_at: '2024-01-21T09:45:00Z',
      finished_at: '2024-01-21T09:47:06Z',
      execution_time: 2.1,
      ai_triggered: false
    }
  ],
  ai_triggered_stats: {
    total_ai_triggered: 125,
    ai_triggered_percentage: 25.25,
    avg_confidence: 0.84
  },
  period_days: 7
};

describe('N8N Workflow Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Workflow Discovery Flow', () => {
    it('should handle complete workflow discovery and categorization', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDiscoveryResponse)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: 'productivity',
          active_only: false,
          include_metrics: true
        })
      });

      const response = await DiscoverPOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows).toHaveLength(3);
      expect(data.categories.productivity).toHaveLength(2);
      expect(data.categories.intelligence).toHaveLength(1);
      expect(data.total_count).toBe(3);
      expect(data.active_count).toBe(2);

      // Verify all workflows have required metadata
      data.workflows.forEach((workflow: any) => {
        expect(workflow).toHaveProperty('id');
        expect(workflow).toHaveProperty('name');
        expect(workflow).toHaveProperty('active');
        expect(workflow).toHaveProperty('category');
        expect(workflow).toHaveProperty('tags');
        expect(workflow).toHaveProperty('execution_count');
        expect(workflow).toHaveProperty('success_rate');
      });
    });

    it('should handle discovery with category filtering', async () => {
      const productivityOnlyResponse = {
        ...mockDiscoveryResponse,
        workflows: mockWorkflowsData.filter(w => w.category === 'productivity'),
        categories: {
          productivity: mockWorkflowsData.filter(w => w.category === 'productivity')
        },
        total_count: 2,
        active_count: 1
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(productivityOnlyResponse)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: 'productivity',
          active_only: false,
          include_metrics: true
        })
      });

      const response = await DiscoverPOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows.every((w: any) => w.category === 'productivity')).toBe(true);
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/discover',
        expect.objectContaining({
          body: JSON.stringify({
            category: 'productivity',
            active_only: false,
            include_metrics: true
          })
        })
      );
    });

    it('should handle discovery with active-only filtering', async () => {
      const activeOnlyResponse = {
        ...mockDiscoveryResponse,
        workflows: mockWorkflowsData.filter(w => w.active),
        total_count: 2,
        active_count: 2
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(activeOnlyResponse)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          active_only: true,
          include_metrics: true
        })
      });

      const response = await DiscoverPOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workflows.every((w: any) => w.active === true)).toBe(true);
    });
  });

  describe('Workflow Activation Flow', () => {
    it('should handle workflow activation successfully', async () => {
      const activationResponse = {
        success: true,
        workflow_id: 'wf-task-mgmt',
        new_status: true,
        previous_status: false,
        message: 'Workflow activated successfully',
        execution_time: 0.8
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(activationResponse)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wf-task-mgmt',
          active: true
        })
      });

      const response = await ActivatePOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workflow_id).toBe('wf-task-mgmt');
      expect(data.new_status).toBe(true);
      expect(data.previous_status).toBe(false);

      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/activate',
        expect.objectContaining({
          body: JSON.stringify({
            workflow_id: 'wf-task-mgmt',
            active: true
          })
        })
      );
    });

    it('should handle workflow deactivation successfully', async () => {
      const deactivationResponse = {
        success: true,
        workflow_id: 'wf-morning-brief',
        new_status: false,
        previous_status: true,
        message: 'Workflow deactivated successfully',
        execution_time: 0.6
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(deactivationResponse)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wf-morning-brief',
          active: false
        })
      });

      const response = await ActivatePOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.new_status).toBe(false);
      expect(data.previous_status).toBe(true);
    });

    it('should handle activation of already active workflow', async () => {
      const noOpResponse = {
        success: true,
        workflow_id: 'wf-calendar-opt',
        new_status: true,
        previous_status: true,
        message: 'Workflow already active',
        execution_time: 0.1
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(noOpResponse)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wf-calendar-opt',
          active: true
        })
      });

      const response = await ActivatePOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.new_status).toBe(data.previous_status);
      expect(data.message).toBe('Workflow already active');
    });

    it('should handle activation failure due to invalid workflow', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          error: 'Workflow not found',
          details: 'Workflow wf-invalid does not exist'
        })
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wf-invalid',
          active: true
        })
      });

      const response = await ActivatePOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Workflow not found');
    });
  });

  describe('Analytics Flow', () => {
    it('should retrieve comprehensive analytics data', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAnalyticsData)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');

      const response = await AnalyticsGET(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAnalyticsData);

      // Verify summary data
      expect(data.summary.total_executions).toBe(495);
      expect(data.summary.avg_success_rate).toBe(0.92);

      // Verify category breakdown
      expect(data.categories).toHaveLength(2);
      expect(data.categories.find((c: any) => c.category === 'intelligence')).toBeDefined();
      expect(data.categories.find((c: any) => c.category === 'productivity')).toBeDefined();

      // Verify top performers
      expect(data.top_performers).toHaveLength(2);
      expect(data.top_performers[0].name).toBe('Calendar Optimization');

      // Verify recent executions
      expect(data.recent_executions).toHaveLength(2);
      expect(data.recent_executions[0].ai_triggered).toBe(true);

      // Verify AI trigger stats
      expect(data.ai_triggered_stats.total_ai_triggered).toBe(125);
      expect(data.ai_triggered_stats.ai_triggered_percentage).toBeCloseTo(25.25);
    });

    it('should handle different time periods', async () => {
      const monthlyAnalytics = {
        ...mockAnalyticsData,
        summary: {
          ...mockAnalyticsData.summary,
          total_executions: 2100,
          period_start: '2024-01-01T00:00:00Z',
          period_end: '2024-01-31T23:59:59Z'
        },
        period_days: 30
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(monthlyAnalytics)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=30');

      const response = await AnalyticsGET(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period_days).toBe(30);
      expect(data.summary.total_executions).toBe(2100);

      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/analytics?days=30',
        expect.any(Object)
      );
    });

    it('should handle empty analytics data', async () => {
      const emptyAnalytics = {
        summary: {
          total_executions: 0,
          total_ai_triggered: 0,
          avg_success_rate: 0,
          avg_execution_time: 0,
          period_start: '2024-01-21T00:00:00Z',
          period_end: '2024-01-21T23:59:59Z'
        },
        categories: [],
        top_performers: [],
        recent_executions: [],
        ai_triggered_stats: {
          total_ai_triggered: 0,
          ai_triggered_percentage: 0,
          avg_confidence: 0
        },
        period_days: 1
      };

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyAnalytics)
      });

      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=1');

      const response = await AnalyticsGET(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.total_executions).toBe(0);
      expect(data.categories).toHaveLength(0);
      expect(data.top_performers).toHaveLength(0);
      expect(data.recent_executions).toHaveLength(0);
    });
  });

  describe('End-to-End Workflow Management Scenarios', () => {
    it('should handle complete workflow management lifecycle', async () => {
      // 1. Discover workflows
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDiscoveryResponse)
      });

      const discoverRequest = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_metrics: true })
      });

      const discoverResponse = await DiscoverPOST(discoverRequest as NextRequest);
      const discoverData = await discoverResponse.json();

      expect(discoverResponse.status).toBe(200);
      expect(discoverData.workflows).toHaveLength(3);

      // 2. Activate an inactive workflow
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          workflow_id: 'wf-task-mgmt',
          new_status: true,
          previous_status: false,
          message: 'Workflow activated successfully'
        })
      });

      const activateRequest = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wf-task-mgmt',
          active: true
        })
      });

      const activateResponse = await ActivatePOST(activateRequest as NextRequest);
      const activateData = await activateResponse.json();

      expect(activateResponse.status).toBe(200);
      expect(activateData.success).toBe(true);

      // 3. Get analytics data
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAnalyticsData)
      });

      const analyticsRequest = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');

      const analyticsResponse = await AnalyticsGET(analyticsRequest as NextRequest);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsData.summary.total_executions).toBeGreaterThan(0);

      // Verify all API calls were made correctly
      expect(mockMainAgentFetch).toHaveBeenCalledTimes(3);
      expect(mockMainAgentFetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:8001/api/n8n/discover',
        expect.any(Object)
      );
      expect(mockMainAgentFetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:8001/api/n8n/activate',
        expect.any(Object)
      );
      expect(mockMainAgentFetch).toHaveBeenNthCalledWith(
        3,
        'http://localhost:8001/api/n8n/analytics?days=7',
        expect.any(Object)
      );
    });

    it('should handle workflow management with error recovery', async () => {
      // 1. Successful discovery
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDiscoveryResponse)
      });

      const discoverRequest = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const discoverResponse = await DiscoverPOST(discoverRequest as NextRequest);
      expect(discoverResponse.status).toBe(200);

      // 2. Failed activation
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'N8N service temporarily unavailable'
        })
      });

      const activateRequest = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'wf-task-mgmt',
          active: true
        })
      });

      const activateResponse = await ActivatePOST(activateRequest as NextRequest);
      expect(activateResponse.status).toBe(500);

      // 3. Successful analytics despite previous failure
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAnalyticsData)
      });

      const analyticsRequest = new Request('http://localhost:3000/api/main-agent/n8n/analytics');

      const analyticsResponse = await AnalyticsGET(analyticsRequest as NextRequest);
      expect(analyticsResponse.status).toBe(200);
    });

    it('should maintain data consistency across operations', async () => {
      // Simulate discovering workflows, then checking analytics for the same workflows
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDiscoveryResponse)
      });

      const discoverRequest = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const discoverResponse = await DiscoverPOST(discoverRequest as NextRequest);
      const discoverData = await discoverResponse.json();

      // Get workflow IDs from discovery
      const discoveredWorkflowIds = discoverData.workflows.map((w: any) => w.id);

      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAnalyticsData)
      });

      const analyticsRequest = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      const analyticsResponse = await AnalyticsGET(analyticsRequest as NextRequest);
      const analyticsData = await analyticsResponse.json();

      // Verify that analytics references workflows found in discovery
      const analyticsWorkflowIds = [
        ...analyticsData.top_performers.map((p: any) => p.workflow_id),
        ...analyticsData.recent_executions.map((e: any) => e.workflow_id)
      ];

      analyticsWorkflowIds.forEach(id => {
        expect(discoveredWorkflowIds).toContain(id);
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Main Agent service unavailable', async () => {
      mockMainAgentFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await DiscoverPOST(request as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
    });

    it('should handle partial Main Agent failures gracefully', async () => {
      // Discovery succeeds
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockDiscoveryResponse)
      });

      // Activation fails
      mockMainAgentFetch.mockRejectedValueOnce(new Error('Network timeout'));

      // Analytics succeeds
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAnalyticsData)
      });

      const discoverResponse = await DiscoverPOST(
        new Request('http://localhost:3000/api/main-agent/n8n/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }) as NextRequest
      );

      const activateResponse = await ActivatePOST(
        new Request('http://localhost:3000/api/main-agent/n8n/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_id: 'wf-test', active: true })
        }) as NextRequest
      );

      const analyticsResponse = await AnalyticsGET(
        new Request('http://localhost:3000/api/main-agent/n8n/analytics') as NextRequest
      );

      expect(discoverResponse.status).toBe(200);
      expect(activateResponse.status).toBe(500);
      expect(analyticsResponse.status).toBe(200);
    });

    it('should handle authentication failures consistently', async () => {
      mockVerifyAuth.mockResolvedValue(null); // Authentication fails

      const requests = [
        () => DiscoverPOST(new Request('http://localhost:3000/api/main-agent/n8n/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }) as NextRequest),
        () => ActivatePOST(new Request('http://localhost:3000/api/main-agent/n8n/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_id: 'wf-test', active: true })
        }) as NextRequest),
        () => AnalyticsGET(new Request('http://localhost:3000/api/main-agent/n8n/analytics') as NextRequest)
      ];

      for (const requestFn of requests) {
        const response = await requestFn();
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      }

      // Main Agent should never be called
      expect(mockMainAgentFetch).not.toHaveBeenCalled();
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Set up responses for concurrent requests
      mockMainAgentFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockDiscoveryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            workflow_id: 'wf-test-1',
            new_status: true,
            previous_status: false,
            message: 'Success'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAnalyticsData)
        });

      const startTime = Date.now();

      // Execute requests concurrently
      const [discoverResponse, activateResponse, analyticsResponse] = await Promise.all([
        DiscoverPOST(new Request('http://localhost:3000/api/main-agent/n8n/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }) as NextRequest),
        ActivatePOST(new Request('http://localhost:3000/api/main-agent/n8n/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_id: 'wf-test-1', active: true })
        }) as NextRequest),
        AnalyticsGET(new Request('http://localhost:3000/api/main-agent/n8n/analytics') as NextRequest)
      ]);

      const duration = Date.now() - startTime;

      expect(discoverResponse.status).toBe(200);
      expect(activateResponse.status).toBe(200);
      expect(analyticsResponse.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockMainAgentFetch).toHaveBeenCalledTimes(3);
    });

    it('should maintain request isolation during concurrent operations', async () => {
      // Different users making concurrent requests
      const user1 = { id: 'user-1', email: 'user1@test.com', name: 'User 1' };
      const user2 = { id: 'user-2', email: 'user2@test.com', name: 'User 2' };

      mockVerifyAuth
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      mockMainAgentFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockDiscoveryResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAnalyticsData)
        });

      const [user1Response, user2Response] = await Promise.all([
        DiscoverPOST(new Request('http://localhost:3000/api/main-agent/n8n/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }) as NextRequest),
        AnalyticsGET(new Request('http://localhost:3000/api/main-agent/n8n/analytics') as NextRequest)
      ]);

      expect(user1Response.status).toBe(200);
      expect(user2Response.status).toBe(200);

      // Verify that each request included the correct user ID
      expect(mockMainAgentFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-ID': 'user-1'
          })
        })
      );

      expect(mockMainAgentFetch).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-ID': 'user-2'
          })
        })
      );
    });
  });
});