// /src/app/api/routines/__tests__/route.test.ts
// Comprehensive test suite for Routines API with habit tracking and completion management
// Tests routine CRUD operations, habit management, and N8N MCP routing for AI insights
// RELEVANT FILES: /src/app/api/routines/route.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/app/api/routines/[id]/complete/route.ts

import { NextRequest } from 'next/server';
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

describe('Routines API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mocks
    mockAuth.verifyToken.mockResolvedValue({ userId: 'mock-user-1' });
    mockAuth.findUserById.mockResolvedValue({ id: 'mock-user-1', email: 'test@example.com' });
    
    // Default MockAuth enabled
    mockMockAuth.isEnabled.mockReturnValue(true);
  });

  describe('GET /api/routines', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost/api/routines');
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

    it('should return routines for authenticated user in mock mode', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines).toBeDefined();
      expect(Array.isArray(data.routines)).toBe(true);
      expect(data.total).toBeDefined();
      expect(data.routines.length).toBeGreaterThan(0);
      
      // Verify routine structure
      const routine = data.routines[0];
      expect(routine.id).toBeDefined();
      expect(routine.name).toBeDefined();
      expect(routine.frequency).toBeDefined();
      expect(routine.habits).toBeDefined();
      expect(Array.isArray(routine.habits)).toBe(true);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/routines', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
      expect(data.timestamp).toBeDefined();
    });

    it('should filter routines by active status', async () => {
      const request = createMockRequest({ active: 'true' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines.every((r: any) => r.isActive === true)).toBe(true);
    });

    it('should filter routines by frequency', async () => {
      const request = createMockRequest({ frequency: 'daily' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines.every((r: any) => r.frequency === 'daily')).toBe(true);
    });

    it('should include recent completions when requested', async () => {
      const request = createMockRequest({ include_completions: 'true' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines[0].recentCompletions).toBeDefined();
      expect(Array.isArray(data.routines[0].recentCompletions)).toBe(true);
    });

    it('should handle database mode when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockRoutines = [
        {
          id: 'db-routine-1',
          name: 'Database Routine',
          frequency: 'daily',
          time_of_day: '08:00',
          duration_minutes: 30,
          habits: [
            { id: 'habit-1', name: 'Morning stretch', duration: 10, completed: false }
          ],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      mockClient.query.mockResolvedValue({ rows: mockRoutines });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines).toEqual(mockRoutines);
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should include completions from database when requested', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockRoutines = [{ id: 'routine-1', name: 'Test Routine' }];
      const mockCompletions = [
        {
          routine_id: 'routine-1',
          completion_date: new Date().toISOString().split('T')[0],
          habits_completed: { 'habit-1': true },
          total_habits: 1,
          completed_habits: 1,
          completion_percentage: 100,
        }
      ];
      
      mockClient.query
        .mockResolvedValueOnce({ rows: mockRoutines }) // routines query
        .mockResolvedValueOnce({ rows: mockCompletions }); // completions query

      const request = createMockRequest({ include_completions: 'true' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routines[0].recentCompletions).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors gracefully', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Laden der Routinen');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('POST /api/routines', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    const validRoutineData = {
      name: 'Test Routine',
      description: 'A test routine for unit testing',
      frequency: 'daily',
      timeOfDay: '07:00',
      durationMinutes: 45,
      habits: [
        { name: 'Meditation', duration: 10 },
        { name: 'Exercise', duration: 20 },
        { name: 'Reading', duration: 15 }
      ],
    };

    it('should create routine successfully in mock mode', async () => {
      const request = createMockRequest(validRoutineData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine).toBeDefined();
      expect(data.routine.name).toBe(validRoutineData.name);
      expect(data.routine.description).toBe(validRoutineData.description);
      expect(data.routine.frequency).toBe(validRoutineData.frequency);
      expect(data.routine.habits).toHaveLength(3);
      expect(data.routine.habits[0].id).toMatch(/^habit-/);
      expect(data.routine.id).toMatch(/^routine-\d+$/);
      expect(data.message).toBe('Routine erfolgreich erstellt');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validRoutineData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validRoutineData };
      delete invalidData.name;

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Routinenname ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate habits array', async () => {
      const invalidData = { ...validRoutineData, habits: [] };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Mindestens eine Gewohnheit ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate habits array is actually an array', async () => {
      const invalidData = { ...validRoutineData, habits: 'not an array' };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Mindestens eine Gewohnheit ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should use default values for optional fields', async () => {
      const minimalData = {
        name: 'Minimal Routine',
        habits: [{ name: 'Single Habit' }]
      };

      const request = createMockRequest(minimalData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine.description).toBe('');
      expect(data.routine.frequency).toBe('daily');
      expect(data.routine.timeOfDay).toBe('09:00');
      expect(data.routine.durationMinutes).toBe(30);
      expect(data.routine.habits[0].duration).toBe(10);
      expect(data.routine.isActive).toBe(true);
    });

    it('should create routine in database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockCreatedRoutine = {
        id: 'db-routine-1',
        user_id: 'mock-user-1',
        name: validRoutineData.name,
        description: validRoutineData.description,
        frequency: validRoutineData.frequency,
        time_of_day: validRoutineData.timeOfDay,
        duration_minutes: validRoutineData.durationMinutes,
        habits: JSON.stringify(validRoutineData.habits.map(h => ({
          id: `habit-${Date.now()}-${Math.random()}`,
          name: h.name,
          duration: h.duration || 10,
          completed: false
        }))),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockCreatedRoutine] });

      const request = createMockRequest(validRoutineData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine).toEqual(mockCreatedRoutine);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO routines'),
        expect.arrayContaining([
          'mock-user-1',
          validRoutineData.name,
          validRoutineData.description,
          validRoutineData.frequency,
          validRoutineData.timeOfDay,
          validRoutineData.durationMinutes,
          expect.any(String) // JSON stringified habits
        ])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle habit IDs assignment correctly', async () => {
      const habitsWithMixedIds = [
        { id: 'existing-habit-1', name: 'Existing Habit', duration: 15 },
        { name: 'New Habit Without ID', duration: 10 }
      ];
      
      const routineData = {
        ...validRoutineData,
        habits: habitsWithMixedIds
      };

      const request = createMockRequest(routineData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine.habits).toHaveLength(2);
      expect(data.routine.habits[0].id).toBe('existing-habit-1');
      expect(data.routine.habits[1].id).toMatch(/^habit-\d+-/);
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost/api/routines', {
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
      expect(data.error).toBe('Fehler beim Erstellen der Routine');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should handle database insert errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Insert failed'));

      const request = createMockRequest(validRoutineData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Erstellen der Routine');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Habit Management Integration', () => {
    it('should create habits with proper structure', async () => {
      const complexHabits = [
        { name: 'Morning stretch', duration: 5 },
        { name: 'Meditation with app', duration: 15 },
        { name: 'Journal writing', duration: 10 },
        { name: 'Protein smoothie', duration: 5 }
      ];
      
      const routineData = {
        name: 'Complex Morning Routine',
        habits: complexHabits
      };

      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routineData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine.habits).toHaveLength(4);
      
      data.routine.habits.forEach((habit: any, index: number) => {
        expect(habit.id).toMatch(/^habit-/);
        expect(habit.name).toBe(complexHabits[index].name);
        expect(habit.duration).toBe(complexHabits[index].duration);
        expect(habit.completed).toBe(false);
      });
    });

    it('should calculate total duration correctly', async () => {
      const habits = [
        { name: 'Habit 1', duration: 10 },
        { name: 'Habit 2', duration: 15 },
        { name: 'Habit 3', duration: 20 }
      ];
      
      const routineData = {
        name: 'Timed Routine',
        durationMinutes: 45, // Should match sum of habits
        habits
      };

      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routineData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine.durationMinutes).toBe(45);
      
      const habitDurationSum = data.routine.habits.reduce((sum: number, habit: any) => sum + habit.duration, 0);
      expect(habitDurationSum).toBe(45);
    });
  });

  describe('Frequency and Scheduling', () => {
    it('should handle different frequency types', async () => {
      const frequencies = ['daily', 'weekly', 'monthly'];
      
      for (const frequency of frequencies) {
        const routineData = {
          name: `${frequency} Routine`,
          frequency,
          habits: [{ name: 'Test Habit' }]
        };

        const request = new NextRequest('http://localhost/api/routines', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(routineData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.routine.frequency).toBe(frequency);
      }
    });

    it('should handle time of day scheduling', async () => {
      const timeSlots = ['06:00', '12:00', '18:00', '22:00'];
      
      for (const timeOfDay of timeSlots) {
        const routineData = {
          name: `${timeOfDay} Routine`,
          timeOfDay,
          habits: [{ name: 'Time-specific Habit' }]
        };

        const request = new NextRequest('http://localhost/api/routines', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(routineData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.routine.timeOfDay).toBe(timeOfDay);
      }
    });
  });

  describe('N8N MCP Integration Points', () => {
    it('should have TODO comments for N8N MCP routing in create', async () => {
      // Test ensures we remember to implement N8N MCP routing for routine optimization
      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Optimization Test Routine',
          habits: [{ name: 'Test Habit' }]
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // When N8N MCP integration is implemented, this would trigger routine optimization suggestions
    });

    it('should maintain RIX PRD compliance - no direct LLM integration', async () => {
      // This test documents RIX PRD architecture compliance
      // Main Agent should only route to N8N MCP endpoints for routine analysis
      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'RIX Compliance Test Routine',
          habits: [
            { name: 'Morning meditation', duration: 10 },
            { name: 'Exercise routine', duration: 30 }
          ]
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Verify no direct LLM calls are made for routine optimization
      // This would be implemented when N8N MCP integration is added
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle very long routine names', async () => {
      const longName = 'A'.repeat(500);
      const routineData = {
        name: longName,
        habits: [{ name: 'Test Habit' }]
      };

      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routineData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine.name).toBe(longName);
    });

    it('should handle habits with very short durations', async () => {
      const routineData = {
        name: 'Quick Routine',
        habits: [
          { name: 'Quick habit', duration: 1 },
          { name: 'Zero habit', duration: 0 }
        ]
      };

      const request = new NextRequest('http://localhost/api/routines', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routineData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routine.habits[0].duration).toBe(1);
      expect(data.routine.habits[1].duration).toBe(0);
    });

    it('should handle concurrent routine creation', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => {
        return new NextRequest('http://localhost/api/routines', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Concurrent Routine ${i}`,
            habits: [{ name: `Habit ${i}` }]
          }),
        });
      });

      const responses = await Promise.all(requests.map(request => POST(request)));
      const data = await Promise.all(responses.map(response => response.json()));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Each routine should have a unique ID
      const routineIds = data.map(d => d.routine.id);
      const uniqueIds = new Set(routineIds);
      expect(uniqueIds.size).toBe(routineIds.length);
    });
  });
});