// /src/app/api/main-agent/n8n/__tests__/discover.test.ts
// Comprehensive test suite for N8N workflow discovery API route
// Tests workflow discovery forwarding to Main Agent, authentication, and error handling
// RELEVANT FILES: discover/route.ts, main-agent/app/api/endpoints/n8n.py, auth.ts

import { POST } from '../../discover/route';
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

const mockDiscoveryRequest = {
  category: 'productivity',
  active_only: true,
  include_metrics: true
};

const mockDiscoveryResponse = {
  workflows: [
    {
      id: 'wf-001',
      name: 'Task Management Workflow',
      active: true,
      tags: ['tasks', 'productivity'],
      category: 'productivity',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
      version: '1.0.0',
      execution_count: 150,
      success_rate: 0.95,
      last_execution: '2024-01-20T14:00:00Z'
    },
    {
      id: 'wf-002',
      name: 'Calendar Optimization',
      active: true,
      tags: ['calendar', 'scheduling'],
      category: 'productivity',
      created_at: '2024-01-12T08:00:00Z',
      updated_at: '2024-01-19T12:15:00Z',
      version: '2.1.0',
      execution_count: 200,
      success_rate: 0.92,
      last_execution: '2024-01-19T16:45:00Z'
    }
  ],
  categories: {
    productivity: [
      { id: 'wf-001', name: 'Task Management Workflow' },
      { id: 'wf-002', name: 'Calendar Optimization' }
    ]
  },
  total_count: 2,
  active_count: 2,
  stored_count: 2
};

describe('/api/main-agent/n8n/discover - POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful auth
    mockVerifyAuth.mockResolvedValue(mockUser);
    
    // Default successful Main Agent response
    mockMainAgentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockDiscoveryResponse),
      headers: new Map([['content-type', 'application/json']])
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('requires valid authentication', async () => {
      mockVerifyAuth.mockResolvedValueOnce(null);
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMainAgentFetch).not.toHaveBeenCalled();
    });

    it('passes with valid authentication', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      
      expect(response.status).toBe(200);
      expect(mockVerifyAuth).toHaveBeenCalled();
    });

    it('handles auth verification errors', async () => {
      mockVerifyAuth.mockRejectedValueOnce(new Error('Auth service unavailable'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Request Handling', () => {
    it('forwards discovery request to Main Agent', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      await POST(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/discover',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': mockUser.id
          },
          body: JSON.stringify(mockDiscoveryRequest)
        }
      );
    });

    it('handles request without body', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      await POST(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/discover',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': mockUser.id
          },
          body: JSON.stringify({})
        }
      );
    });

    it('handles malformed JSON in request body', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('validates request parameters', async () => {
      const invalidRequest = {
        category: 123, // Should be string
        active_only: 'yes', // Should be boolean
        include_metrics: 'true' // Should be boolean
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });
      
      // Should still forward to Main Agent for validation
      await POST(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalled();
    });
  });

  describe('Main Agent Communication', () => {
    it('returns successful discovery response', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockDiscoveryResponse);
    });

    it('handles Main Agent server errors', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'N8N discovery failed' })
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('N8N discovery failed');
    });

    it('handles Main Agent network errors', async () => {
      mockMainAgentFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
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
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
    });

    it('includes user context in Main Agent request', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      await POST(request as NextRequest);
      
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

  describe('Response Handling', () => {
    it('preserves Main Agent response structure', async () => {
      const customResponse = {
        workflows: [],
        categories: {},
        total_count: 0,
        active_count: 0,
        stored_count: 0,
        custom_field: 'test-value'
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(customResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
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
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Main Agent returned invalid response');
    });

    it('handles missing Main Agent URL', async () => {
      delete process.env.MAIN_AGENT_URL;
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
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
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      await POST(request as NextRequest);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles concurrent requests', async () => {
      const request1 = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'productivity' })
      });
      
      const request2 = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'intelligence' })
      });
      
      const [response1, response2] = await Promise.all([
        POST(request1 as NextRequest),
        POST(request2 as NextRequest)
      ]);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockMainAgentFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('provides helpful error messages', async () => {
      mockMainAgentFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
      expect(data.details).toBeDefined();
    });

    it('logs errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMainAgentFetch.mockRejectedValueOnce(new Error('Test error'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockDiscoveryRequest)
      });
      
      await POST(request as NextRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'N8N discovery API error:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Request Validation', () => {
    it('accepts valid discovery parameters', async () => {
      const validRequests = [
        { category: 'productivity', active_only: true, include_metrics: true },
        { category: 'intelligence', active_only: false },
        { active_only: true },
        { include_metrics: false },
        {}
      ];
      
      for (const requestBody of validRequests) {
        const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        const response = await POST(request as NextRequest);
        expect(response.status).toBe(200);
      }
    });

    it('forwards unknown parameters to Main Agent', async () => {
      const requestWithUnknownParams = {
        category: 'productivity',
        unknown_param: 'test-value',
        another_param: 123
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithUnknownParams)
      });
      
      await POST(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(requestWithUnknownParams)
        })
      );
    });
  });
});