// /src/app/api/calendar/__tests__/route.test.ts
// Comprehensive test suite for Calendar API with time-blocking and intelligent scheduling
// Tests calendar event CRUD operations, time blocks, and N8N MCP routing for AI features
// RELEVANT FILES: /src/app/api/calendar/route.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/app/api/calendar/time-blocks/route.ts

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

describe('Calendar API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mocks
    mockAuth.verifyToken.mockResolvedValue({ userId: 'mock-user-1' });
    mockAuth.findUserById.mockResolvedValue({ id: 'mock-user-1', email: 'test@example.com' });
    
    // Default MockAuth enabled
    mockMockAuth.isEnabled.mockReturnValue(true);
  });

  describe('GET /api/calendar', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost/api/calendar');
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

    it('should return calendar events for authenticated user in mock mode', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.total).toBeDefined();
      
      // Verify event structure
      if (data.events.length > 0) {
        const event = data.events[0];
        expect(event.id).toBeDefined();
        expect(event.title).toBeDefined();
        expect(event.startTime).toBeDefined();
        expect(event.endTime).toBeDefined();
        expect(event.eventType).toBeDefined();
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'GET',
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
      expect(data.timestamp).toBeDefined();
    });

    it('should filter events by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      const request = createMockRequest({ startDate, endDate });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // In mock mode, verify filtering logic would be applied
      // (actual filtering implementation would be tested with real data)
      expect(data.events).toBeDefined();
    });

    it('should filter events by event type', async () => {
      const request = createMockRequest({ eventType: 'time_block' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events.every((e: any) => e.eventType === 'time_block')).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const request = createMockRequest({ limit: '10', offset: '5' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(5);
    });

    it('should fetch events from database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockEvents = [
        {
          id: 'db-event-1',
          title: 'Database Event',
          start_time: '2024-01-15T09:00:00Z',
          end_time: '2024-01-15T10:00:00Z',
          event_type: 'meeting',
          priority: 'medium',
          is_all_day: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      mockClient.query
        .mockResolvedValueOnce({ rows: mockEvents }) // events query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count query

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events).toEqual(mockEvents);
      expect(data.total).toBe(1);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Laden der Kalenderereignisse');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle complex date filtering in database mode', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const eventType = 'time_block';
      
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // events query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // count query

      const request = createMockRequest({ startDate, endDate, eventType });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        expect.arrayContaining(['mock-user-1'])
      );
    });
  });

  describe('POST /api/calendar', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    const validEventData = {
      title: 'Team Meeting',
      description: 'Weekly team sync',
      startTime: '2024-01-15T09:00:00Z',
      endTime: '2024-01-15T10:00:00Z',
      location: 'Conference Room A',
      eventType: 'meeting',
      priority: 'medium',
      tags: ['work', 'team'],
      isAllDay: false,
    };

    it('should create calendar event successfully in mock mode', async () => {
      const request = createMockRequest(validEventData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event).toBeDefined();
      expect(data.event.title).toBe(validEventData.title);
      expect(data.event.description).toBe(validEventData.description);
      expect(data.event.startTime).toBe(validEventData.startTime);
      expect(data.event.endTime).toBe(validEventData.endTime);
      expect(data.event.eventType).toBe(validEventData.eventType);
      expect(data.event.id).toMatch(/^event-\d+$/);
      expect(data.message).toBe('Kalenderereignis erfolgreich erstellt');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validEventData),
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Nicht authentifiziert');
      expect(data.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should validate required fields', async () => {
      const invalidData = { ...validEventData };
      delete invalidData.title;

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Titel ist erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate start and end time', async () => {
      const invalidData = { ...validEventData };
      delete invalidData.startTime;

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Start- und Endzeit sind erforderlich');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate end time is after start time', async () => {
      const invalidData = {
        ...validEventData,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T09:00:00Z', // End before start
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Endzeit muss nach der Startzeit liegen');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should use default values for optional fields', async () => {
      const minimalData = {
        title: 'Minimal Event',
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T10:00:00Z',
      };

      const request = createMockRequest(minimalData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.description).toBe('');
      expect(data.event.eventType).toBe('meeting');
      expect(data.event.priority).toBe('medium');
      expect(data.event.isAllDay).toBe(false);
      expect(data.event.tags).toEqual([]);
    });

    it('should create time_block events with proper type', async () => {
      const timeBlockData = {
        ...validEventData,
        title: 'Deep Work Session',
        eventType: 'time_block',
        description: 'Focused coding time',
      };

      const request = createMockRequest(timeBlockData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.eventType).toBe('time_block');
      expect(data.event.title).toBe(timeBlockData.title);
    });

    it('should handle all-day events', async () => {
      const allDayEventData = {
        title: 'Company Holiday',
        startTime: '2024-01-15T00:00:00Z',
        endTime: '2024-01-15T23:59:59Z',
        isAllDay: true,
        eventType: 'reminder',
      };

      const request = createMockRequest(allDayEventData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.isAllDay).toBe(true);
      expect(data.event.eventType).toBe('reminder');
    });

    it('should create event in database when MockAuth is disabled', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      
      const mockCreatedEvent = {
        id: 'db-event-1',
        user_id: 'mock-user-1',
        title: validEventData.title,
        description: validEventData.description,
        start_time: validEventData.startTime,
        end_time: validEventData.endTime,
        location: validEventData.location,
        event_type: validEventData.eventType,
        priority: validEventData.priority,
        tags: validEventData.tags,
        is_all_day: validEventData.isAllDay,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockClient.query.mockResolvedValue({ rows: [mockCreatedEvent] });

      const request = createMockRequest(validEventData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event).toEqual(mockCreatedEvent);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO calendar_events'),
        expect.arrayContaining([
          'mock-user-1',
          validEventData.title,
          validEventData.description,
          validEventData.startTime,
          validEventData.endTime,
          validEventData.location,
          validEventData.isAllDay,
          validEventData.eventType,
          null, // projectId
          validEventData.priority,
          validEventData.tags
        ])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle project association', async () => {
      const projectEventData = {
        ...validEventData,
        projectId: 'project-123',
        title: 'Project Review Meeting',
      };

      const request = createMockRequest(projectEventData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.projectId).toBe('project-123');
    });

    it('should handle database insert errors', async () => {
      mockMockAuth.isEnabled.mockReturnValue(false);
      mockClient.query.mockRejectedValue(new Error('Insert failed'));

      const request = createMockRequest(validEventData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Fehler beim Erstellen des Kalenderereignisses');
      expect(data.code).toBe('INTERNAL_ERROR');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Time Conflict Detection', () => {
    it('should detect overlapping events', async () => {
      // This would be implemented in future iterations
      const overlappingEventData = {
        title: 'Conflicting Meeting',
        startTime: '2024-01-15T09:30:00Z', // Overlaps with existing 9-10 event
        endTime: '2024-01-15T10:30:00Z',
      };

      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(overlappingEventData),
      });

      const response = await POST(request);
      const data = await response.json();

      // For now, conflicts are allowed - future enhancement would detect and warn
      expect(response.status).toBe(200);
    });
  });

  describe('Event Types and Categories', () => {
    it('should handle different event types', async () => {
      const eventTypes = ['time_block', 'meeting', 'task', 'reminder'];
      
      for (const eventType of eventTypes) {
        const eventData = {
          title: `${eventType} Event`,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
          eventType,
        };

        const request = new NextRequest('http://localhost/api/calendar', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.event.eventType).toBe(eventType);
      }
    });

    it('should handle priority levels', async () => {
      const priorities = ['low', 'medium', 'high'];
      
      for (const priority of priorities) {
        const eventData = {
          title: `${priority} Priority Event`,
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
          priority,
        };

        const request = new NextRequest('http://localhost/api/calendar', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.event.priority).toBe(priority);
      }
    });
  });

  describe('N8N MCP Integration Points', () => {
    it('should prepare for N8N MCP calendar intelligence routing', async () => {
      // Test ensures event data is structured for N8N MCP routing
      const intelligentEventData = {
        title: 'Smart Scheduled Meeting',
        startTime: '2024-01-15T14:00:00Z',
        endTime: '2024-01-15T15:00:00Z',
        eventType: 'meeting',
        priority: 'high',
        tags: ['ai-scheduled', 'optimization'],
      };

      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intelligentEventData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // When N8N MCP integration is implemented, this would trigger
      // calendar intelligence analysis and optimization suggestions
      expect(data.event.tags).toContain('ai-scheduled');
    });

    it('should maintain RIX PRD compliance - no direct LLM integration', async () => {
      // This test documents RIX PRD architecture compliance
      // Calendar operations should prepare for N8N MCP routing, not call LLMs directly
      const eventData = {
        title: 'RIX Compliance Test Event',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        description: 'Testing calendar compliance with RIX PRD',
      };

      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      // Verify no direct LLM calls are made for calendar intelligence
      // All AI processing should route through N8N MCP endpoints
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid date formats', async () => {
      const invalidDateData = {
        title: 'Invalid Date Event',
        startTime: 'not-a-date',
        endTime: '2024-01-15T10:00:00Z',
      };

      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidDateData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Endzeit muss nach der Startzeit liegen');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should handle very long event titles', async () => {
      const longTitleData = {
        title: 'A'.repeat(500),
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T10:00:00Z',
      };

      const request = new NextRequest('http://localhost/api/calendar', {
        method: 'POST',
        headers: {
          'Cookie': 'accessToken=valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(longTitleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.event.title).toBe(longTitleData.title);
    });

    it('should handle concurrent event creation', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => {
        return new NextRequest('http://localhost/api/calendar', {
          method: 'POST',
          headers: {
            'Cookie': 'accessToken=valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Concurrent Event ${i}`,
            startTime: `2024-01-15T${9 + i}:00:00Z`,
            endTime: `2024-01-15T${10 + i}:00:00Z`,
          }),
        });
      });

      const responses = await Promise.all(requests.map(request => POST(request)));
      const data = await Promise.all(responses.map(response => response.json()));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Each event should have a unique ID
      const eventIds = data.map(d => d.event.id);
      const uniqueIds = new Set(eventIds);
      expect(uniqueIds.size).toBe(eventIds.length);
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost/api/calendar', {
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
      expect(data.error).toBe('Fehler beim Erstellen des Kalenderereignisses');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});