/**
 * @jest-environment node
 */
// /src/app/api/projects/__tests__/route.test.ts
// Comprehensive test suite for Projects API CRUD operations
// Tests authentication, validation, filtering, pagination, and N8N MCP routing
// RELEVANT FILES: /src/app/api/projects/route.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/lib/mock-auth.ts

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';
import { MockAuth } from '@/lib/mock-auth';
import * as auth from '@/lib/auth';

// Mock external dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/database');
jest.mock('@/lib/mock-auth');

const mockAuth = auth as jest.Mocked<typeof auth>;
const mockMockAuth = MockAuth as jest.Mocked<typeof MockAuth>;

// Mock pool connection
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn(() => Promise.resolve(mockClient)),
};

jest.mock('@/lib/database', () => mockPool);

describe('Projects API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mocks
    mockAuth.verifyToken.mockResolvedValue({ userId: 'mock-user-1' });
    mockAuth.findUserById.mockResolvedValue({ id: 'mock-user-1', email: 'test@example.com' });
    
    // Default MockAuth enabled
    mockMockAuth.isEnabled.mockReturnValue(true);
  });

  describe('GET /api/projects', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost/api/projects');
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      
      return new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': 'accessToken=valid-token',
        },
      });
    };

    it('should return projects for authenticated user in mock mode', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toBeDefined();
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.total).toBeDefined();
      expect(data.limit).toBe(20);
      expect(data.offset).toBe(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
      expect(data.timestamp).toBeDefined();
    });

    it('should filter projects by status', async () => {
      const request = createMockRequest({ status: 'active' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects.every((p: any) => p.status === 'active')).toBe(true);
    });

    it('should filter projects by priority', async () => {
      const request = createMockRequest({ priority: 'high' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects.every((p: any) => p.priority === 'high')).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const request = createMockRequest({ limit: '5', offset: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(5);
      expect(data.offset).toBe(10);
    });

    it('should handle database mode when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockProjects = [
        {
          id: 'db-project-1',
          name: 'Database Project',
          status: 'active',
          priority: 'medium',
          ai_health_score: 75,
        }
      ];
      
      mockClient.query
        .mockResolvedValueOnce({ rows: mockProjects }) // Main query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Count query

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toEqual(mockProjects);
      expect(data.total).toBe(1);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockAuth.findUserById.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Benutzer nicht gefunden');
      expect(data.code).toBe('AUTH_USER_NOT_FOUND');
    });

    it('should handle database errors gracefully', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Laden der Projekte');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle invalid token errors', async () => {
      mockAuth.verifyToken.mockRejectedValue(new Error('Invalid token'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Laden der Projekte');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/projects', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    const validProjectData = {
      name: 'Test Project',
      description: 'A test project for unit testing',
      status: 'active',
      priority: 'medium',
      color: '#60A5FA',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      tags: ['test', 'automation'],
    };

    it('should create project successfully in mock mode', async () => {
      const request = createMockRequest(validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
      expect(data.project.name).toBe(validProjectData.name);
      expect(data.project.description).toBe(validProjectData.description);
      expect(data.project.aiHealthScore).toBe(0); // Initially 0, calculated by N8N MCP
      expect(data.project.id).toMatch(/^project-\d+$/);
      expect(data.message).toBe('Projekt erfolgreich erstellt');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validProjectData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validProjectData };
      delete invalidData.name;

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Projektname ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should use default values for optional fields', async () => {
      const minimalData = { name: 'Minimal Project' };

      const request = createMockRequest(minimalData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.description).toBe('');
      expect(data.project.status).toBe('active');
      expect(data.project.priority).toBe('medium');
      expect(data.project.color).toBe('#60A5FA');
      expect(data.project.tags).toEqual([]);
    });

    it('should create project in database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockCreatedProject = {
        id: 'db-project-1',
        user_id: 'mock-user-1',
        name: validProjectData.name,
        description: validProjectData.description,
        status: validProjectData.status,
        priority: validProjectData.priority,
        color: validProjectData.color,
        ai_health_score: 0,
        start_date: validProjectData.startDate,
        end_date: validProjectData.endDate,
        tags: validProjectData.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockCreatedProject] });

      const request = createMockRequest(validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toEqual(mockCreatedProject);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        expect.arrayContaining([
          'mock-user-1',
          validProjectData.name,
          validProjectData.description,
          validProjectData.status,
          validProjectData.priority,
          validProjectData.color,
          validProjectData.startDate,
          validProjectData.endDate,
          validProjectData.tags
        ])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Erstellen des Projekts');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle database insert errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Insert failed'));

      const request = createMockRequest(validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Erstellen des Projekts');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle user not found error in database mode', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockAuth.findUserById.mockResolvedValue(null);

      const request = createMockRequest(validProjectData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Benutzer nicht gefunden');
      expect(data.code).toBe('AUTH_USER_NOT_FOUND');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request URLs gracefully', async () => {
      const request = new NextRequest('invalid-url', {
        method: 'GET',
        headers: { 'Cookie': 'accessToken=valid-token' },
      });

      const response = await GET(request);
      expect(response.status).toBe(500);
    });

    it('should handle very large pagination values', async () => {
      const request = new NextRequest('http://localhost/api/projects?limit=999999&offset=999999', {
        method: 'GET',
        headers: { 'Cookie': 'accessToken=valid-token' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(999999);
      expect(data.offset).toBe(999999);
    });

    it('should handle special characters in filter parameters', async () => {
      const request = new NextRequest('http://localhost/api/projects?status=<script>alert(1)</script>', {
        method: 'GET',
        headers: { 'Cookie': 'accessToken=valid-token' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.projects).toEqual([]); // No projects should match malicious status
    });

    it('should handle concurrent project creation', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => {
        return new NextRequest('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Concurrent Project ${i}`,
            description: 'Test concurrent creation',
          }),
        });
      });

      const responses = await Promise.all(requests.map(request => POST(request)));
      const data = await Promise.all(responses.map(response => response.json()));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Each project should have a unique ID
      const projectIds = data.map(d => d.project.id);
      const uniqueIds = new Set(projectIds);
      expect(uniqueIds.size).toBe(projectIds.length);
    });
  });

  describe('N8N MCP Integration Points', () => {
    it('should have TODO comments for N8N MCP routing in create', async () => {
      // This test ensures we remember to implement N8N MCP routing
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test Project' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.aiHealthScore).toBe(0); // Should be calculated by N8N MCP endpoint
    });

    it('should maintain RIX PRD compliance - no direct LLM integration', async () => {
      // This test documents RIX PRD architecture compliance
      // Main Agent should only route to N8N MCP endpoints, not call LLMs directly
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'RIX Compliance Test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Verify no direct LLM calls are made (this would be implemented when N8N integration is added)
      // For now, we just ensure the endpoint works and returns AI health score as 0
    });
  });
});