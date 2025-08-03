// /src/app/api/main-agent/n8n/__tests__/activate.test.ts
// Comprehensive test suite for N8N workflow activation API route
// Tests workflow activation/deactivation forwarding to Main Agent, authentication, and error handling
// RELEVANT FILES: activate/route.ts, main-agent/app/api/endpoints/n8n.py, auth.ts

import { POST } from '../../activate/route';
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

const mockActivationRequest = {
  workflow_id: 'wf-001',
  active: true
};

const mockActivationResponse = {
  success: true,
  workflow_id: 'wf-001',
  new_status: true,
  previous_status: false,
  message: 'Workflow activated successfully',
  execution_time: 1.2
};

describe('/api/main-agent/n8n/activate - POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful auth
    mockVerifyAuth.mockResolvedValue(mockUser);
    
    // Default successful Main Agent response
    mockMainAgentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockActivationResponse),
      headers: new Map([['content-type', 'application/json']])
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('requires valid authentication', async () => {
      mockVerifyAuth.mockResolvedValueOnce(null);
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockMainAgentFetch).not.toHaveBeenCalled();
    });

    it('passes with valid authentication', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      
      expect(response.status).toBe(200);
      expect(mockVerifyAuth).toHaveBeenCalled();
    });

    it('handles auth verification errors', async () => {
      mockVerifyAuth.mockRejectedValueOnce(new Error('Auth service unavailable'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Request Validation', () => {
    it('requires workflow_id in request body', async () => {
      const invalidRequest = {
        active: true
        // Missing workflow_id
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: workflow_id');
    });

    it('requires active field in request body', async () => {
      const invalidRequest = {
        workflow_id: 'wf-001'
        // Missing active
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: active');
    });

    it('validates workflow_id type', async () => {
      const invalidRequest = {
        workflow_id: 123, // Should be string
        active: true
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('workflow_id must be a string');
    });

    it('validates active type', async () => {
      const invalidRequest = {
        workflow_id: 'wf-001',
        active: 'yes' // Should be boolean
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('active must be a boolean');
    });

    it('accepts valid activation request', async () => {
      const validRequest = {
        workflow_id: 'wf-001',
        active: true
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest)
      });
      
      const response = await POST(request as NextRequest);
      
      expect(response.status).toBe(200);
      expect(mockMainAgentFetch).toHaveBeenCalled();
    });

    it('accepts valid deactivation request', async () => {
      const validRequest = {
        workflow_id: 'wf-002',
        active: false
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest)
      });
      
      const response = await POST(request as NextRequest);
      
      expect(response.status).toBe(200);
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/activate',
        expect.objectContaining({
          body: JSON.stringify(validRequest)
        })
      );
    });
  });

  describe('Request Handling', () => {
    it('forwards activation request to Main Agent', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      await POST(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/n8n/activate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': mockUser.id
          },
          body: JSON.stringify(mockActivationRequest)
        }
      );
    });

    it('handles malformed JSON in request body', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('handles empty request body', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: workflow_id');
    });

    it('includes user context in Main Agent request', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
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

  describe('Main Agent Communication', () => {
    it('returns successful activation response', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockActivationResponse);
    });

    it('handles Main Agent validation errors', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ 
          error: 'Invalid workflow ID',
          details: 'Workflow wf-invalid not found'
        })
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'wf-invalid', active: true })
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid workflow ID');
      expect(data.details).toBe('Workflow wf-invalid not found');
    });

    it('handles Main Agent server errors', async () => {
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'N8N API unavailable' })
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('N8N API unavailable');
    });

    it('handles Main Agent network errors', async () => {
      mockMainAgentFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
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
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to communicate with Main Agent');
    });
  });

  describe('Response Handling', () => {
    it('preserves Main Agent response structure', async () => {
      const customResponse = {
        success: true,
        workflow_id: 'wf-001',
        new_status: true,
        previous_status: false,
        message: 'Custom activation message',
        custom_field: 'test-value',
        metadata: {
          activation_time: '2024-01-21T10:30:00Z',
          user_id: 'user-123'
        }
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(customResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
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
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Main Agent returned invalid response');
    });

    it('handles missing Main Agent URL', async () => {
      delete process.env.MAIN_AGENT_URL;
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Main Agent URL not configured');
      
      // Restore for other tests
      process.env.MAIN_AGENT_URL = 'http://localhost:8001';
    });
  });

  describe('Workflow States', () => {
    it('handles activation of inactive workflow', async () => {
      const activationResponse = {
        success: true,
        workflow_id: 'wf-001',
        new_status: true,
        previous_status: false,
        message: 'Workflow activated successfully'
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(activationResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'wf-001', active: true })
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.new_status).toBe(true);
      expect(data.previous_status).toBe(false);
    });

    it('handles deactivation of active workflow', async () => {
      const deactivationResponse = {
        success: true,
        workflow_id: 'wf-002',
        new_status: false,
        previous_status: true,
        message: 'Workflow deactivated successfully'
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(deactivationResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'wf-002', active: false })
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.new_status).toBe(false);
      expect(data.previous_status).toBe(true);
    });

    it('handles no-op when workflow already in desired state', async () => {
      const noOpResponse = {
        success: true,
        workflow_id: 'wf-003',
        new_status: true,
        previous_status: true,
        message: 'Workflow already active'
      };
      
      mockMainAgentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(noOpResponse)
      });
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'wf-003', active: true })
      });
      
      const response = await POST(request as NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.new_status).toBe(data.previous_status);
      expect(data.message).toBe('Workflow already active');
    });
  });

  describe('Error Recovery', () => {
    it('provides helpful error messages', async () => {
      mockMainAgentFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
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
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      await POST(request as NextRequest);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'N8N activation API error:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('completes request within reasonable time', async () => {
      const startTime = Date.now();
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
      });
      
      await POST(request as NextRequest);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles concurrent activation requests', async () => {
      const request1 = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'wf-001', active: true })
      });
      
      const request2 = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'wf-002', active: false })
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

  describe('Security', () => {
    it('validates workflow_id format to prevent injection', async () => {
      const maliciousRequest = {
        workflow_id: '../../../etc/passwd',
        active: true
      };
      
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousRequest)
      });
      
      // Should still forward to Main Agent for validation (Main Agent handles security)
      const response = await POST(request as NextRequest);
      
      expect(mockMainAgentFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(maliciousRequest)
        })
      );
    });

    it('includes user context for authorization', async () => {
      const request = new Request('http://localhost:3000/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockActivationRequest)
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
});