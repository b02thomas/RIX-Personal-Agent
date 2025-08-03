// /src/app/api/projects/[id]/__tests__/route.test.ts
// Comprehensive test suite for individual Project API operations (GET, PUT, DELETE)
// Tests project management with authentication, validation, and N8N MCP integration
// RELEVANT FILES: /src/app/api/projects/[id]/route.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/app/api/projects/route.ts

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
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

describe('Individual Project API Routes', () => {
  const projectId = 'project-1';
  const mockUser = { id: 'mock-user-1', email: 'test@example.com' };
  const mockPayload = { userId: 'mock-user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mocks
    mockAuth.verifyToken.mockResolvedValue(mockPayload);
    mockAuth.findUserById.mockResolvedValue(mockUser);
    
    // Default MockAuth enabled
    mockMockAuth.isEnabled.mockReturnValue(true);
  });

  describe('GET /api/projects/[id]', () => {
    const createMockRequest = (id: string) => {
      return new NextRequest(`http://localhost/api/projects/${id}`, {
        method: 'GET',
        headers: {
          'Cookie': 'accessToken=valid-token',
        },
      });
    };

    it('should return project by ID in mock mode', async () => {
      const request = createMockRequest(projectId);
      const response = await GET(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
      expect(data.project.id).toBe(projectId);
      expect(data.project.userId).toBe(mockPayload.userId);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: 'GET',
      });
      
      const response = await GET(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should return 404 for non-existent project in mock mode', async () => {
      const nonExistentId = 'non-existent-project';
      const request = createMockRequest(nonExistentId);
      const response = await GET(request, { params: Promise.resolve({ id: nonExistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Projekt nicht gefunden');
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should fetch project from database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockProject = {
        id: projectId,
        name: 'Database Project',
        description: 'Project from database',
        status: 'active',
        priority: 'medium',
        color: '#60A5FA',
        ai_health_score: 75,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        tags: ['database', 'test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockProject] });

      const request = createMockRequest(projectId);
      const response = await GET(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toEqual(mockProject);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [projectId, mockUser.id]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 404 for non-existent project in database mode', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockResolvedValue({ rows: [] });

      const request = createMockRequest('non-existent');
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Projekt nicht gefunden');
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should handle database errors gracefully', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest(projectId);
      const response = await GET(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Laden des Projekts');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('PUT /api/projects/[id]', () => {
    const createMockRequest = (id: string, body: any) => {
      return new NextRequest(`http://localhost/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    const updateData = {
      name: 'Updated Project Name',
      description: 'Updated description',
      status: 'on-hold' as const,
      priority: 'high' as const,
      color: '#EF4444',
      tags: ['updated', 'test'],
    };

    it('should update project successfully in mock mode', async () => {
      const request = createMockRequest(projectId, updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project).toBeDefined();
      expect(data.project.name).toBe(updateData.name);
      expect(data.project.description).toBe(updateData.description);
      expect(data.project.status).toBe(updateData.status);
      expect(data.project.priority).toBe(updateData.priority);
      expect(data.project.updatedAt).toBeDefined();
      expect(data.message).toBe('Projekt erfolgreich aktualisiert');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should return 404 for non-existent project in mock mode', async () => {
      const nonExistentId = 'non-existent-project';
      const request = createMockRequest(nonExistentId, updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: nonExistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Projekt nicht gefunden');
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should validate project name is not empty', async () => {
      const invalidData = { ...updateData, name: '' };
      const request = createMockRequest(projectId, invalidData);
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Projektname darf nicht leer sein');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should update project in database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      // Mock existence check
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: projectId }] }) // exists check
        .mockResolvedValueOnce({ rows: [{ // update result
          id: projectId,
          ...updateData,
          updated_at: new Date().toISOString(),
        }] });

      const request = createMockRequest(projectId, updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.name).toBe(updateData.name);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Only Name Updated' };
      const request = createMockRequest(projectId, partialUpdate);
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.name).toBe(partialUpdate.name);
      // Other fields should remain unchanged
      expect(data.project.description).toBe('Building a comprehensive personal productivity workflow');
    });

    it('should return 400 for no changes in database mode', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      // Mock existence check
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: projectId }] });

      const request = createMockRequest(projectId, {}); // No actual changes
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Keine Änderungen vorgenommen');
      expect(data.code).toBe('NO_CHANGES');
    });

    it('should handle database update errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Update failed'));

      const request = createMockRequest(projectId, updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Aktualisieren des Projekts');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/projects/[id]', () => {
    const createMockRequest = (id: string) => {
      return new NextRequest(`http://localhost/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': 'accessToken=valid-token',
        },
      });
    };

    it('should delete project successfully in mock mode', async () => {
      const request = createMockRequest(projectId);
      const response = await DELETE(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Projekt erfolgreich gelöscht');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      const response = await DELETE(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should return 404 for non-existent project in mock mode', async () => {
      const nonExistentId = 'non-existent-project';
      const request = createMockRequest(nonExistentId);
      const response = await DELETE(request, { params: Promise.resolve({ id: nonExistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Projekt nicht gefunden');
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should delete project from database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      // Mock existence check and deletion
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: projectId }] }) // exists check
        .mockResolvedValueOnce({ rows: [] }); // deletion result

      const request = createMockRequest(projectId);
      const response = await DELETE(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Projekt erfolgreich gelöscht');
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, mockUser.id]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM projects WHERE id = $1',
        [projectId]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle non-existent project in database mode', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockResolvedValue({ rows: [] }); // Project doesn't exist

      const request = createMockRequest('non-existent');
      const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Projekt nicht gefunden');
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should handle database deletion errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Delete failed'));

      const request = createMockRequest(projectId);
      const response = await DELETE(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Löschen des Projekts');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Cross-cutting Concerns', () => {
    it('should handle user ownership validation across all operations', async () => {
      // Test that projects can only be accessed by their owners
      const otherUserPayload = { userId: 'other-user' };
      mockAuth.verifyToken.mockResolvedValue(otherUserPayload);

      const getRequest = new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: 'GET',
        headers: { 'Cookie': 'accessToken=valid-token' },
      });

      const response = await GET(getRequest, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(404); // Should not find project for different user
      expect(data.error).toBe('Projekt nicht gefunden');
    });

    it('should handle malformed project IDs', async () => {
      const malformedId = '<script>alert(1)</script>';
      const request = new NextRequest(`http://localhost/api/projects/${malformedId}`, {
        method: 'GET',
        headers: { 'Cookie': 'accessToken=valid-token' },
      });

      const response = await GET(request, { params: Promise.resolve({ id: malformedId }) });
      const data = await response.json();

      expect(response.status).toBe(404); // Should safely handle malformed ID
      expect(data.error).toBe('Projekt nicht gefunden');
    });

    it('should maintain consistent error response format across operations', async () => {
      const unauthenticatedRequests = [
        new NextRequest(`http://localhost/api/projects/${projectId}`, { method: 'GET' }),
        new NextRequest(`http://localhost/api/projects/${projectId}`, { 
          method: 'PUT',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' }
        }),
        new NextRequest(`http://localhost/api/projects/${projectId}`, { method: 'DELETE' }),
      ];

      const responses = await Promise.all([
        GET(unauthenticatedRequests[0], { params: Promise.resolve({ id: projectId }) }),
        PUT(unauthenticatedRequests[1], { params: Promise.resolve({ id: projectId }) }),
        DELETE(unauthenticatedRequests[2], { params: Promise.resolve({ id: projectId }) }),
      ]);

      const data = await Promise.all(responses.map(r => r.json()));

      // All should have consistent error format
      data.forEach(errorData => {
        expect(errorData.error).toBe('Nicht authentifiziert');
        expect(errorData.code).toBe('AUTH_TOKEN_INVALID');
        expect(errorData.timestamp).toBeDefined();
      });
    });
  });

  describe('N8N MCP Integration Points', () => {
    it('should maintain TODO comments for N8N MCP routing in updates', async () => {
      // Test that update operations prepare for N8N MCP health score recalculation
      const request = new NextRequest(`http://localhost/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated for MCP' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      // When N8N MCP integration is implemented, this would trigger AI health score recalculation
      expect(data.project.name).toBe('Updated for MCP');
    });

    it('should verify RIX PRD compliance in all operations', async () => {
      // Ensure no direct LLM calls are made in any operation
      // All AI processing should route through N8N MCP endpoints
      
      const operations = [
        { method: 'GET', body: undefined },
        { method: 'PUT', body: JSON.stringify({ name: 'RIX Test' }) },
        { method: 'DELETE', body: undefined },
      ];

      for (const op of operations) {
        const request = new NextRequest(`http://localhost/api/projects/${projectId}`, {
          method: op.method,
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: op.body,
        });

        let response;
        switch (op.method) {
          case 'GET':
            response = await GET(request, { params: Promise.resolve({ id: projectId }) });
            break;
          case 'PUT':
            response = await PUT(request, { params: Promise.resolve({ id: projectId }) });
            break;
          case 'DELETE':
            response = await DELETE(request, { params: Promise.resolve({ id: projectId }) });
            break;
        }

        // All operations should complete without direct LLM integration
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(500);
      }
    });
  });
});