// /src/app/api/main-agent/n8n/__tests__/analytics.test.ts
// Comprehensive test suite for N8N analytics API route
// Tests analytics data forwarding to Main Agent, query parameters, and error handling
// RELEVANT FILES: analytics/route.ts, main-agent/app/api/endpoints/n8n.py, auth.ts

import { GET } from '../../analytics/route';
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

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User'
};

const mockAnalyticsResponse = {
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
    }
  ],
  ai_triggered_stats: {
    total_ai_triggered: 320,
    ai_triggered_percentage: 25.6,
    avg_confidence: 0.82
  },
  period_days: 7
};

describe('/api/main-agent/n8n/analytics - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful auth
    mockVerifyAuth.mockResolvedValue(mockUser);
    
    // Default successful Main Agent response
    mockMainAgentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockAnalyticsResponse),
      headers: new Map([['content-type', 'application/json']])
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('requires valid authentication', async () => {
      mockVerifyAuth.mockResolvedValueOnce(null);
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMainAgentFetch).not.toHaveBeenCalled();
    });

    it('passes with valid authentication', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      
      expect(response.status).toBe(200);
      expect(mockVerifyAuth).toHaveBeenCalled();
    });

    it('handles auth verification errors', async () => {
      mockVerifyAuth.mockRejectedValueOnce(new Error('Auth service unavailable'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Query Parameters', () => {
    it('forwards days parameter to Main Agent', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=30');
      
      await GET(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/analytics?days=30',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': mockUser.id
          }
        }
      );
    });

    it('uses default days when not specified', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      await GET(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/analytics',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': mockUser.id
          }
        }
      );
    });

    it('validates days parameter type', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=invalid');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('days parameter must be a valid number');
    });

    it('validates days parameter range', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=-5');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('days parameter must be between 1 and 365');
    });

    it('validates maximum days parameter', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=500');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('days parameter must be between 1 and 365');
    });

    it('accepts valid days parameter', async () => {
      const validDays = [1, 7, 30, 90, 365];
      
      for (const days of validDays) {
        const request = new Request(`http://localhost:3000/api/main-agent/n8n/analytics?days=${days}`);
        
        const response = await GET(request as NextRequest);
        expect(response.status).toBe(200);
      }
    });

    it('forwards additional query parameters', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=30&category=productivity&include_details=true');
      
      await GET(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/analytics?days=30&category=productivity&include_details=true',
        expect.any(Object)
      );
    });

    it('handles URL encoding in parameters', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7&filter=workflow%20name');
      
      await GET(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/analytics?days=7&filter=workflow%20name',
        expect.any(Object)
      );
    });
  });

  describe('Request Handling', () => {
    it('forwards analytics request to Main Agent', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');
      
      await GET(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/analytics?days=7',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': mockUser.id
          }
        }
      );
    });

    it('includes user context in Main Agent request', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      await GET(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-ID': mockUser.id
          })
        })
      );
    });
  });

  describe('Main Agent Communication', () => {
    it('returns successful analytics response', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockAnalyticsResponse);
    });

    it('handles Main Agent server errors', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Analytics service unavailable' })
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Analytics service unavailable');
    });

    it('handles Main Agent not found errors', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Analytics endpoint not found' })
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Analytics endpoint not found');
    });

    it('handles Main Agent network errors', async () => {
      mockMainAgentFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
    });

    it('handles Main Agent timeout', async () => {
      mockMainAgentFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
    });
  });

  describe('Response Handling', () => {
    it('preserves Main Agent response structure', async () => {
      const customResponse = {
        summary: {
          total_executions: 500,
          total_ai_triggered: 125,
          avg_success_rate: 0.88,
          avg_execution_time: 3.2,
          period_start: '2024-01-01T00:00:00Z',
          period_end: '2024-01-31T23:59:59Z'
        },
        categories: [],
        top_performers: [],
        recent_executions: [],
        ai_triggered_stats: {
          total_ai_triggered: 125,
          ai_triggered_percentage: 25.0,
          avg_confidence: 0.75
        },
        period_days: 30,
        custom_field: 'test-value'
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(customResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=30');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(data).toEqual(customResponse);
    });

    it('handles non-JSON responses from Main Agent', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Not JSON'))
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Main Agent returned invalid response');
    });

    it('handles empty analytics data', async () => {
      const emptyResponse = {
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
        json: () => Promise.resolve(emptyResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=1');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(emptyResponse);
    });

    it('handles missing Main Agent URL', async () => {
      delete process.env.MAIN_AGENT_URL;
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Main Agent URL not configured');
      
      // Restore for other tests
      process.env.MAIN_AGENT_URL = 'http://localhost:8001';
    });
  });

  describe('Performance', () => {
    it('completes request within reasonable time', async () => {
      const startTime = Date.now();
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');
      
      await GET(request as NextRequest);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Analytics might take a bit longer
    });

    it('handles concurrent analytics requests', async () => {
      const request1 = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');
      const request2 = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=30');
      
      const [response1, response2] = await Promise.all([
        GET(request1 as NextRequest),
        GET(request2 as NextRequest)
      ]);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockMainAgentFetch).toHaveBeenCalledTimes(2);
    });

    it('caches analytics data appropriately', async () => {
      // First request
      const request1 = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');
      await GET(request1 as NextRequest);
      
      // Second identical request
      const request2 = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7');
      await GET(request2 as NextRequest);
      
      // Both should reach Main Agent (no caching at API layer)
      expect(mockMainAgentFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('provides helpful error messages', async () => {
      mockMainAgentFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
      expect(data.details).toBeDefined();
    });

    it('logs errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMainAgentFetch.mockRejectedValueOnce(new Error('Test error'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      await GET(request as NextRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'N8N analytics API error:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Analytics Data Validation', () => {
    it('handles malformed analytics data gracefully', async () => {
      const malformedResponse = {
        summary: 'invalid', // Should be object
        categories: 'invalid', // Should be array
        // Missing required fields
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(malformedResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      // Should still return the data (validation happens on frontend)
      expect(response.status).toBe(200);
      expect(data).toEqual(malformedResponse);
    });

    it('handles partial analytics data', async () => {
      const partialResponse = {
        summary: {
          total_executions: 100,
          // Missing other summary fields
        },
        // Missing other top-level fields
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(partialResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      const response = await GET(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(partialResponse);
    });
  });

  describe('Security', () => {
    it('validates user permissions through auth', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics');
      
      await GET(request as NextRequest);
      
      expect(mockVerifyAuth).toHaveBeenCalled();
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-ID': mockUser.id
          })
        })
      );
    });

    it('prevents SQL injection in parameters', async () => {
      const maliciousRequest = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7;DROP TABLE workflows;--');
      
      const response = await GET(maliciousRequest as NextRequest);
      const data = await response.json();
      
      // Should be caught by validation
      expect(response.status).toBe(400);
      expect(data.error).toBe('days parameter must be a valid number');
    });

    it('sanitizes query parameters', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/analytics?days=7&category=<script>alert("xss")</script>');
      
      await GET(request as NextRequest);
      
      // Should forward the parameter as-is (Main Agent handles sanitization)
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=%3Cscript%3Ealert(%22xss%22)%3C/script%3E'),
        expect.any(Object)
      );
    });
  });
});