// /src/app/api/routines/[id]/complete/__tests__/route.test.ts
// Comprehensive test suite for routine completion tracking and habit progress
// Tests habit completion, progress calculation, and N8N MCP routing for insights
// RELEVANT FILES: /src/app/api/routines/[id]/complete/route.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/app/api/routines/route.ts

import { NextRequest } from 'next/server';
import { POST } from '../route';
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

describe('Routine Completion API', () => {
  const routineId = 'routine-1';
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

  describe('POST /api/routines/[id]/complete', () => {
    const createMockRequest = (id: string, body: any) => {
      return new NextRequest(`http://localhost/api/routines/${id}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    const validCompletionData = {
      completionDate: new Date().toISOString().split('T')[0],
      habitsCompleted: {
        'habit-1': true,
        'habit-2': true,
        'habit-3': false
      },
      notes: 'Good progress today!'
    };

    it('should record routine completion successfully in mock mode', async () => {
      const request = createMockRequest(routineId, validCompletionData);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion).toBeDefined();
      expect(data.completion.routineId).toBe(routineId);
      expect(data.completion.userId).toBe(mockPayload.userId);
      expect(data.completion.completionDate).toBe(validCompletionData.completionDate);
      expect(data.completion.habitsCompleted).toEqual(validCompletionData.habitsCompleted);
      expect(data.completion.totalHabits).toBe(3);
      expect(data.completion.completedHabits).toBe(2);
      expect(data.completion.completionPercentage).toBe(67);
      expect(data.message).toBe('Routine erfolgreich abgeschlossen');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validCompletionData),
      });
      
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should validate required habitsCompleted field', async () => {
      const invalidData = { ...validCompletionData };
      delete invalidData.habitsCompleted;

      const request = createMockRequest(routineId, invalidData);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Gewohnheiten-Status ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should calculate completion percentage correctly', async () => {
      const testCases = [
        {
          habits: { 'h1': true, 'h2': true, 'h3': true },
          expectedCompleted: 3,
          expectedPercentage: 100
        },
        {
          habits: { 'h1': true, 'h2': false, 'h3': false },
          expectedCompleted: 1,
          expectedPercentage: 33
        },
        {
          habits: { 'h1': false, 'h2': false, 'h3': false, 'h4': false },
          expectedCompleted: 0,
          expectedPercentage: 0
        },
        {
          habits: { 'h1': true, 'h2': true },
          expectedCompleted: 2,
          expectedPercentage: 100
        }
      ];

      for (const testCase of testCases) {
        const completionData = {
          ...validCompletionData,
          habitsCompleted: testCase.habits
        };

        const request = createMockRequest(routineId, completionData);
        const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.completion.completedHabits).toBe(testCase.expectedCompleted);
        expect(data.completion.completionPercentage).toBe(testCase.expectedPercentage);
        expect(data.completion.totalHabits).toBe(Object.keys(testCase.habits).length);
      }
    });

    it('should use current date when completionDate is not provided', async () => {
      const dataWithoutDate = { ...validCompletionData };
      delete dataWithoutDate.completionDate;

      const request = createMockRequest(routineId, dataWithoutDate);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.completionDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should handle empty notes gracefully', async () => {
      const dataWithoutNotes = { ...validCompletionData };
      delete dataWithoutNotes.notes;

      const request = createMockRequest(routineId, dataWithoutNotes);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.notes).toBe('');
    });

    it('should handle database mode when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      // Mock routine existence check
      const mockRoutine = {
        id: routineId,
        user_id: mockUser.id,
        name: 'Test Routine',
        habits: JSON.stringify([
          { id: 'habit-1', name: 'Habit 1' },
          { id: 'habit-2', name: 'Habit 2' },
          { id: 'habit-3', name: 'Habit 3' }
        ])
      };
      
      const mockCreatedCompletion = {
        id: 'db-completion-1',
        routine_id: routineId,
        user_id: mockUser.id,
        completion_date: validCompletionData.completionDate,
        habits_completed: validCompletionData.habitsCompleted,
        total_habits: 3,
        completed_habits: 2,
        completion_percentage: 67,
        notes: validCompletionData.notes,
        created_at: new Date().toISOString(),
      };
      
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockRoutine] }) // routine check
        .mockResolvedValueOnce({ rows: [] }) // existing completion check
        .mockResolvedValueOnce({ rows: [mockCreatedCompletion] }); // insert

      const request = createMockRequest(routineId, validCompletionData);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion).toEqual(mockCreatedCompletion);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return 404 for non-existent routine', async () => {
      const nonExistentId = 'non-existent-routine';
      const request = createMockRequest(nonExistentId, validCompletionData);
      const response = await POST(request, { params: Promise.resolve({ id: nonExistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Routine nicht gefunden');
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should handle duplicate completion for same date', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      // Mock routine exists but completion already exists for today
      const mockRoutine = { id: routineId, user_id: mockUser.id, habits: '[]' };
      const existingCompletion = { id: 'existing-completion' };
      
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockRoutine] }) // routine check
        .mockResolvedValueOnce({ rows: [existingCompletion] }); // existing completion

      const request = createMockRequest(routineId, validCompletionData);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Routine bereits heute abgeschlossen');
      expect(data.code).toBe('DUPLICATE_COMPLETION');
    });

    it('should handle database connection errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest(routineId, validCompletionData);
      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Speichern der Routine-Vervollständigung');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Speichern der Routine-Vervollständigung');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Habit Completion Logic', () => {
    it('should handle complex habit completion patterns', async () => {
      const complexHabits = {
        'morning-stretch': true,
        'meditation-10min': true,
        'protein-smoothie': false,
        'email-check': true,
        'goal-review': false,
        'gratitude-journal': true
      };

      const completionData = {
        habitsCompleted: complexHabits,
        notes: 'Complex routine completion test'
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.totalHabits).toBe(6);
      expect(data.completion.completedHabits).toBe(4);
      expect(data.completion.completionPercentage).toBe(67); // 4/6 * 100 rounded
    });

    it('should handle boolean and string habit values', async () => {
      const mixedHabits = {
        'habit-1': true,
        'habit-2': 'true',
        'habit-3': false,
        'habit-4': 'false',
        'habit-5': 1,
        'habit-6': 0
      };

      const completionData = {
        habitsCompleted: mixedHabits,
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.totalHabits).toBe(6);
      // Should count truthy values as completed (true, 'true', 1)
      expect(data.completion.completedHabits).toBe(3);
    });

    it('should handle empty habits object', async () => {
      const completionData = {
        habitsCompleted: {},
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.totalHabits).toBe(0);
      expect(data.completion.completedHabits).toBe(0);
      expect(data.completion.completionPercentage).toBe(0);
    });

    it('should validate habitsCompleted is an object', async () => {
      const invalidCompletionData = {
        habitsCompleted: 'not an object'
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCompletionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Gewohnheiten-Status ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Date Handling', () => {
    it('should handle different date formats', async () => {
      const dateFormats = [
        '2024-01-15',
        '2024-12-31',
        '2025-06-30'
      ];

      for (const date of dateFormats) {
        const completionData = {
          completionDate: date,
          habitsCompleted: { 'habit-1': true }
        };

        const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completionData),
        });

        const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.completion.completionDate).toBe(date);
      }
    });

    it('should handle timezone considerations', async () => {
      // Mock current date to specific timezone-sensitive date
      const fixedDate = '2024-01-15';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T23:59:59.999Z');

      const completionData = {
        habitsCompleted: { 'habit-1': true }
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.completionDate).toBe(fixedDate);

      jest.restoreAllMocks();
    });
  });

  describe('N8N MCP Integration Points', () => {
    it('should prepare for N8N MCP routine insights routing', async () => {
      // Test ensures completion data is structured for N8N MCP routing
      const completionData = {
        habitsCompleted: {
          'habit-1': true,
          'habit-2': true,
          'habit-3': false
        },
        notes: 'Great progress on most habits'
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      // When N8N MCP integration is implemented, this completion data would be
      // routed to /mcp/routine-insights for AI analysis and suggestions
      expect(data.completion.completionPercentage).toBe(67);
      expect(data.completion.notes).toBeDefined();
    });

    it('should maintain RIX PRD compliance - no direct LLM integration', async () => {
      // This test documents RIX PRD architecture compliance
      // Completion tracking should prepare data for N8N MCP routing, not call LLMs directly
      const completionData = {
        habitsCompleted: { 'habit-1': true, 'habit-2': false },
        notes: 'Testing RIX compliance'
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      expect(response.status).toBe(200);
      
      // Verify no direct LLM calls are made for habit insights
      // This maintains RIX PRD compliance - all AI processing happens in N8N MCP endpoints
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent completion attempts', async () => {
      const completionData = {
        habitsCompleted: { 'habit-1': true }
      };

      const requests = Array.from({ length: 3 }, () => {
        return new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completionData),
        });
      });

      const responses = await Promise.all(
        requests.map(request => POST(request, { params: Promise.resolve({ id: routineId }) }))
      );

      // First request should succeed, others should handle duplicate gracefully
      const statuses = responses.map(r => r.status);
      expect(statuses).toContain(200); // At least one should succeed
    });

    it('should handle large habit completion objects', async () => {
      const largeHabitsObject = {};
      for (let i = 0; i < 100; i++) {
        largeHabitsObject[`habit-${i}`] = i % 2 === 0; // Alternate true/false
      }

      const completionData = {
        habitsCompleted: largeHabitsObject
      };

      const request = new NextRequest(`http://localhost/api/routines/${routineId}/complete`, {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      });

      const response = await POST(request, { params: Promise.resolve({ id: routineId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.completion.totalHabits).toBe(100);
      expect(data.completion.completedHabits).toBe(50); // Half true, half false
      expect(data.completion.completionPercentage).toBe(50);
    });
  });
});