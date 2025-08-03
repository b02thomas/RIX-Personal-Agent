// /src/app/api/knowledge/__tests__/knowledge-api.test.ts
// Comprehensive test suite for Knowledge API endpoints with vector embeddings
// Tests CRUD operations, vector search integration, and knowledge management features
// RELEVANT FILES: /src/app/api/knowledge/route.ts, /src/app/api/knowledge/[id]/route.ts, /src/app/api/knowledge/search/route.ts

import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../route';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/database');
jest.mock('@/lib/vector-search');

const mockAuth = require('@/lib/auth');
const mockVectorSearch = require('@/lib/vector-search');

// Mock database client
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

const mockPool = {
  connect: jest.fn(() => Promise.resolve(mockClient))
};

jest.mock('@/lib/database', () => mockPool);

describe('Knowledge API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mocks
    mockAuth.verifyToken.mockResolvedValue({ userId: 'test-user-123' });
    
    // Default vector search mock
    mockVectorSearch.generateEmbedding.mockReturnValue(new Array(1536).fill(0.1));
  });

  describe('GET /api/knowledge', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost/api/knowledge');
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      
      return new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': 'accessToken=valid-token'
        }
      });
    };

    it('should retrieve knowledge entries with pagination', async () => {
      // Mock database responses
      const mockKnowledgeEntries = [
        {
          id: 'entry-1',
          title: 'Morning Routine Optimization',
          content: 'Your morning routine shows excellent consistency with an 85% completion rate.',
          type: 'routine',
          relevance: 0.92,
          last_accessed: new Date('2024-08-01'),
          tags: ['morning', 'routine', 'optimization'],
          source: 'Routine Analysis',
          metadata: { analysis_type: 'performance' },
          created_at: new Date('2024-07-01'),
          updated_at: new Date('2024-08-01')
        },
        {
          id: 'entry-2',
          title: 'Project Health Analysis',
          content: 'RIX Development project maintains a strong health score of 87/100.',
          type: 'project',
          relevance: 0.89,
          last_accessed: new Date('2024-08-01'),
          tags: ['project', 'health', 'analysis'],
          source: 'Project Intelligence',
          metadata: { health_score: 87 },
          created_at: new Date('2024-07-15'),
          updated_at: new Date('2024-08-01')
        }
      ];

      // Mock count query
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '25' }] }) // Count query
        .mockResolvedValueOnce({ rows: mockKnowledgeEntries }); // Data query

      const request = createMockRequest({ page: '1', limit: '20' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2,
        hasNext: true,
        hasPrev: false
      });

      // Verify knowledge entry structure
      const entry = data.data[0];
      expect(entry.id).toBe('entry-1');
      expect(entry.title).toBe('Morning Routine Optimization');
      expect(entry.type).toBe('routine');
      expect(entry.relevance).toBe(0.92);
      expect(entry.tags).toEqual(['morning', 'routine', 'optimization']);
      expect(entry.source).toBe('Routine Analysis');
      expect(entry.metadata).toEqual({ analysis_type: 'performance' });
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
    });

    it('should filter by knowledge entry type', async () => {
      const mockRoutineEntries = [
        {
          id: 'routine-1',
          title: 'Routine Entry',
          type: 'routine',
          relevance: 0.9,
          last_accessed: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] })
        .mockResolvedValueOnce({ rows: mockRoutineEntries });

      const request = createMockRequest({ type: 'routine' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].type).toBe('routine');

      // Verify type filter was applied in SQL query
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('AND type = $'),
        expect.arrayContaining(['test-user-123', 'routine'])
      );
    });

    it('should validate pagination parameters', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })
        .mockResolvedValueOnce({ rows: [] });

      // Test with limit exceeding maximum
      const request = createMockRequest({ page: '1', limit: '150' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(100); // Should be capped at 100
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/knowledge', {
        method: 'GET'
        // No auth token
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - No token provided');
    });

    it('should handle invalid auth tokens', async () => {
      mockAuth.verifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized - Invalid token');
    });

    it('should handle database errors gracefully', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Database connection failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('POST /api/knowledge', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=valid-token'
        },
        body: JSON.stringify(body)
      });
    };

    const validKnowledgeData = {
      title: 'Morning Routine Analysis',
      content: 'Detailed analysis of morning routine performance and optimization opportunities.',
      type: 'routine',
      tags: ['morning', 'routine', 'analysis'],
      source: 'Routine Coaching',
      relevance: 0.9,
      metadata: {
        analysis_date: '2024-08-02',
        completion_rate: 85.5,
        streak_days: 12
      }
    };

    it('should create new knowledge entry successfully', async () => {
      const mockCreatedEntry = {
        id: 'entry-new-123',
        title: validKnowledgeData.title,
        content: validKnowledgeData.content,
        type: validKnowledgeData.type,
        relevance: validKnowledgeData.relevance,
        last_accessed: new Date(),
        tags: validKnowledgeData.tags,
        source: validKnowledgeData.source,
        metadata: validKnowledgeData.metadata,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockCreatedEntry] });

      const request = createMockRequest(validKnowledgeData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('entry-new-123');
      expect(data.title).toBe(validKnowledgeData.title);
      expect(data.type).toBe(validKnowledgeData.type);
      expect(data.tags).toEqual(validKnowledgeData.tags);
      expect(data.metadata).toEqual(validKnowledgeData.metadata);

      // Verify embedding was generated and stored
      expect(mockVectorSearch.generateEmbedding).toHaveBeenCalledWith(
        `${validKnowledgeData.title} ${validKnowledgeData.content}`
      );

      // Verify database insert was called
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO knowledge_entries'),
        expect.arrayContaining([
          'test-user-123',
          validKnowledgeData.title,
          validKnowledgeData.content,
          validKnowledgeData.type,
          validKnowledgeData.relevance,
          validKnowledgeData.tags,
          validKnowledgeData.source,
          expect.any(String), // Embedding array
          validKnowledgeData.metadata
        ])
      );
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validKnowledgeData };
      delete invalidData.title;

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title and content are required');
    });

    it('should validate knowledge entry type', async () => {
      const invalidData = { ...validKnowledgeData, type: 'invalid_type' };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid type. Must be one of: routine, project, calendar, insight');
    });

    it('should use default values for optional fields', async () => {
      const minimalData = {
        title: 'Minimal Entry',
        content: 'Basic content'
      };

      const mockCreatedEntry = {
        id: 'entry-minimal',
        title: minimalData.title,
        content: minimalData.content,
        type: 'insight', // Default type
        relevance: 0.5, // Default relevance
        tags: [], // Default empty tags
        source: 'Manual Entry', // Default source
        metadata: {}, // Default empty metadata
        last_accessed: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockCreatedEntry] });

      const request = createMockRequest(minimalData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.type).toBe('insight');
      expect(data.relevance).toBe(0.5);
      expect(data.tags).toEqual([]);
      expect(data.source).toBe('Manual Entry');
      expect(data.metadata).toEqual({});
    });

    it('should handle embedding generation errors', async () => {
      mockVectorSearch.generateEmbedding.mockImplementationOnce(() => {
        throw new Error('Embedding generation failed');
      });

      const request = createMockRequest(validKnowledgeData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toContain('Embedding generation failed');
    });

    it('should handle database insert errors', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Insert failed'));

      const request = createMockRequest(validKnowledgeData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Insert failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('PUT /api/knowledge', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost/api/knowledge', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=valid-token'
        },
        body: JSON.stringify(body)
      });
    };

    it('should update existing knowledge entry successfully', async () => {
      const updateData = {
        id: 'entry-123',
        title: 'Updated Morning Routine Analysis',
        content: 'Updated analysis with new insights.',
        relevance: 0.95,
        tags: ['morning', 'routine', 'updated'],
        metadata: { updated_analysis: true }
      };

      // Mock existence check
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'entry-123' }] }) // Existence check
        .mockResolvedValueOnce({ // Get current entry for embedding
          rows: [{ title: 'Old Title', content: 'Old Content' }]
        })
        .mockResolvedValueOnce({ // Update query
          rows: [{
            id: updateData.id,
            title: updateData.title,
            content: updateData.content,
            type: 'routine',
            relevance: updateData.relevance,
            last_accessed: new Date(),
            tags: updateData.tags,
            source: 'Routine Analysis',
            metadata: updateData.metadata,
            created_at: new Date('2024-07-01'),
            updated_at: new Date()
          }]
        });

      const request = createMockRequest(updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(updateData.id);
      expect(data.title).toBe(updateData.title);
      expect(data.content).toBe(updateData.content);
      expect(data.relevance).toBe(updateData.relevance);
      expect(data.tags).toEqual(updateData.tags);
      expect(data.metadata).toEqual(updateData.metadata);

      // Verify existence check was performed
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT id FROM knowledge_entries WHERE id = $1 AND user_id = $2',
        ['entry-123', 'test-user-123']
      );

      // Verify embedding was regenerated for title/content changes
      expect(mockVectorSearch.generateEmbedding).toHaveBeenCalledWith(
        `${updateData.title} ${updateData.content}`
      );
    });

    it('should return 404 for non-existent entry', async () => {
      // Mock no results for existence check
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const updateData = {
        id: 'non-existent-entry',
        title: 'Updated Title'
      };

      const request = createMockRequest(updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Knowledge entry not found or access denied');
    });

    it('should validate required ID field', async () => {
      const updateData = {
        title: 'Updated Title'
        // Missing id field
      };

      const request = createMockRequest(updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Knowledge entry ID is required');
    });

    it('should handle partial updates correctly', async () => {
      const updateData = {
        id: 'entry-123',
        relevance: 0.88 // Only updating relevance
      };

      // Mock existence check and update
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'entry-123' }] })
        .mockResolvedValueOnce({
          rows: [{
            id: updateData.id,
            title: 'Original Title',
            content: 'Original Content',
            type: 'routine',
            relevance: updateData.relevance,
            last_accessed: new Date(),
            tags: ['original'],
            source: 'Original Source',
            metadata: {},
            created_at: new Date(),
            updated_at: new Date()
          }]
        });

      const request = createMockRequest(updateData);
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.relevance).toBe(0.88);

      // Verify only relevance was updated (no embedding regeneration)
      expect(mockVectorSearch.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should regenerate embedding when title or content changes', async () => {
      const updateData = {
        id: 'entry-123',
        title: 'New Title'
      };

      // Mock existence check, current entry fetch, and update
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'entry-123' }] })
        .mockResolvedValueOnce({
          rows: [{ title: 'Old Title', content: 'Old Content' }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: updateData.id,
            title: updateData.title,
            content: 'Old Content',
            type: 'routine',
            relevance: 0.9,
            last_accessed: new Date(),
            tags: [],
            source: 'Test',
            metadata: {},
            created_at: new Date(),
            updated_at: new Date()
          }]
        });

      const request = createMockRequest(updateData);
      const response = await PUT(request);

      expect(response.status).toBe(200);

      // Verify embedding was regenerated with new title and old content
      expect(mockVectorSearch.generateEmbedding).toHaveBeenCalledWith(
        'New Title Old Content'
      );
    });
  });

  describe('Knowledge API Integration Tests', () => {
    it('should maintain data consistency across CRUD operations', async () => {
      // Test complete CRUD flow
      const knowledgeData = {
        title: 'Integration Test Entry',
        content: 'Test content for integration testing',
        type: 'insight',
        tags: ['test', 'integration']
      };

      // 1. Create entry
      const mockCreatedEntry = {
        id: 'integration-test-1',
        ...knowledgeData,
        relevance: 0.5,
        source: 'Manual Entry',
        metadata: {},
        last_accessed: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockCreatedEntry] });

      const createRequest = new NextRequest('http://localhost/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=valid-token'
        },
        body: JSON.stringify(knowledgeData)
      });

      const createResponse = await POST(createRequest);
      const createdData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createdData.id).toBe('integration-test-1');

      // 2. Read entry (verify it exists)
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] })
        .mockResolvedValueOnce({ rows: [mockCreatedEntry] });

      const readRequest = new NextRequest('http://localhost/api/knowledge', {
        method: 'GET',
        headers: {
          'Cookie': 'accessToken=valid-token'
        }
      });

      const readResponse = await GET(readRequest);
      const readData = await readResponse.json();

      expect(readResponse.status).toBe(200);
      expect(readData.data).toHaveLength(1);
      expect(readData.data[0].id).toBe('integration-test-1');

      // 3. Update entry
      const updateData = {
        id: 'integration-test-1',
        title: 'Updated Integration Test Entry',
        relevance: 0.95
      };

      const mockUpdatedEntry = {
        ...mockCreatedEntry,
        title: updateData.title,
        relevance: updateData.relevance,
        updated_at: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'integration-test-1' }] })
        .mockResolvedValueOnce({
          rows: [{ title: 'Integration Test Entry', content: 'Test content for integration testing' }]
        })
        .mockResolvedValueOnce({ rows: [mockUpdatedEntry] });

      const updateRequest = new NextRequest('http://localhost/api/knowledge', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'accessToken=valid-token'
        },
        body: JSON.stringify(updateData)
      });

      const updateResponse = await PUT(updateRequest);
      const updatedData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updatedData.title).toBe('Updated Integration Test Entry');
      expect(updatedData.relevance).toBe(0.95);
    });

    it('should handle concurrent operations safely', async () => {
      // Mock responses for concurrent creates
      const mockEntries = [
        { id: 'concurrent-1', title: 'Entry 1', created_at: new Date() },
        { id: 'concurrent-2', title: 'Entry 2', created_at: new Date() },
        { id: 'concurrent-3', title: 'Entry 3', created_at: new Date() }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockEntries[0]] })
        .mockResolvedValueOnce({ rows: [mockEntries[1]] })
        .mockResolvedValueOnce({ rows: [mockEntries[2]] });

      // Create multiple entries concurrently
      const createRequests = mockEntries.map((entry, index) =>
        POST(new NextRequest('http://localhost/api/knowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'accessToken=valid-token'
          },
          body: JSON.stringify({
            title: `Concurrent Entry ${index + 1}`,
            content: `Content for entry ${index + 1}`
          })
        }))
      );

      const responses = await Promise.all(createRequests);
      const responseData = await Promise.all(responses.map(r => r.json()));

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Each should have unique IDs
      const ids = responseData.map(data => data.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});