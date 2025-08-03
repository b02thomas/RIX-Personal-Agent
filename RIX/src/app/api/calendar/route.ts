// /src/app/api/calendar/route.ts
// API routes for calendar time-blocking and event management
// Provides smart scheduling with N8N MCP routing for AI optimization
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/projects/route.ts, /src/app/api/calendar/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock calendar events data for development
const mockEvents = [
  {
    id: 'event-1',
    userId: 'mock-user-1',
    title: 'Morning Deep Work Block',
    description: 'Focused work on high-priority tasks',
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(), // +2 hours
    location: 'Home Office',
    isAllDay: false,
    eventType: 'time_block',
    projectId: 'project-1',
    priority: 'high',
    tags: ['deep-work', 'productivity'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    userId: 'mock-user-1',
    title: 'Team Meeting',
    description: 'Weekly team sync and project updates',
    startTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    endTime: new Date(Date.now() + 172800000 + 3600000).toISOString(), // +1 hour
    location: 'Conference Room A',
    isAllDay: false,
    eventType: 'meeting',
    projectId: null,
    priority: 'medium',
    tags: ['meeting', 'team'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// GET /api/calendar - Get calendar events for user
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Nicht authentifiziert',
          code: 'AUTH_TOKEN_INVALID',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(accessToken);

    // Extract query parameters for filtering
    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const eventType = url.searchParams.get('type');
    const projectId = url.searchParams.get('project_id');
    const includeProjects = url.searchParams.get('include_projects') === 'true';

    // In mock mode, return filtered mock events
    if (MockAuth.isEnabled()) {
      let filteredEvents = mockEvents.filter(
        event => event.userId === payload.userId
      );

      // Apply filters
      if (startDate) {
        filteredEvents = filteredEvents.filter(event => event.startTime >= startDate);
      }
      if (endDate) {
        filteredEvents = filteredEvents.filter(event => event.startTime <= endDate);
      }
      if (eventType) {
        filteredEvents = filteredEvents.filter(event => event.eventType === eventType);
      }
      if (projectId) {
        filteredEvents = filteredEvents.filter(event => event.projectId === projectId);
      }

      // Sort by start time
      filteredEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // Include project details if requested
      if (includeProjects) {
        const mockProjects = [
          { id: 'project-1', name: 'Personal Productivity', color: '#60A5FA' }
        ];
        
        filteredEvents = filteredEvents.map(event => ({
          ...event,
          project: event.projectId ? mockProjects.find(p => p.id === event.projectId) : null
        }));
      }

      return NextResponse.json({
        events: filteredEvents,
        total: filteredEvents.length,
      });
    }

    // In real mode, fetch from database
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Benutzer nicht gefunden',
          code: 'AUTH_USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Build dynamic query with filters
      let query = `
        SELECT 
          ce.id,
          ce.title,
          ce.description,
          ce.start_time,
          ce.end_time,
          ce.location,
          ce.is_all_day,
          ce.created_at,
          ce.updated_at
        FROM calendar_events ce
        WHERE ce.user_id = $1
      `;
      const params = [user.id];
      let paramCount = 1;

      if (startDate) {
        paramCount++;
        query += ` AND ce.start_time >= $${paramCount}`;
        params.push(startDate);
      }
      
      if (endDate) {
        paramCount++;
        query += ` AND ce.start_time <= $${paramCount}`;
        params.push(endDate);
      }

      // Note: For enhanced calendar features (event_type, project_id, etc.),
      // these columns would need to be added to the calendar_events table
      // in a future migration. For now, we use the base schema.

      query += ` ORDER BY ce.start_time ASC`;

      const result = await client.query(query, params);

      return NextResponse.json({
        events: result.rows,
        total: result.rows.length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get calendar events error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Kalender-Ereignisse',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/calendar - Create new calendar event/time block
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Nicht authentifiziert',
          code: 'AUTH_TOKEN_INVALID',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(accessToken);
    const eventData = await request.json();

    // Validate required fields
    const { title, startTime, endTime, description, location, isAllDay, eventType, projectId, priority, tags } = eventData;

    if (!title) {
      return NextResponse.json(
        { 
          error: 'Titel ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { 
          error: 'Start- und Endzeit sind erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate time logic
    if (new Date(startTime) >= new Date(endTime)) {
      return NextResponse.json(
        { 
          error: 'Startzeit muss vor der Endzeit liegen',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      const newEvent = {
        id: `event-${Date.now()}`,
        userId: payload.userId,
        title,
        description: description || '',
        startTime,
        endTime,
        location: location || '',
        isAllDay: isAllDay || false,
        eventType: eventType || 'event',
        projectId: projectId || null,
        priority: priority || 'medium',
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockEvents.push(newEvent);

      // TODO: Route to N8N MCP endpoint for intelligent scheduling optimization
      // This follows RIX PRD - no direct LLM integration, only routing

      return NextResponse.json({
        event: newEvent,
        message: 'Kalenderereignis erfolgreich erstellt',
      });
    }

    // In real mode, create in database
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Benutzer nicht gefunden',
          code: 'AUTH_USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Check for time conflicts (optional - can be enhanced)
      const conflictQuery = `
        SELECT id, title, start_time, end_time
        FROM calendar_events
        WHERE user_id = $1
        AND (
          (start_time <= $2 AND end_time > $2) OR
          (start_time < $3 AND end_time >= $3) OR
          (start_time >= $2 AND end_time <= $3)
        )
      `;

      const conflictResult = await client.query(conflictQuery, [user.id, startTime, endTime]);

      if (conflictResult.rows.length > 0) {
        return NextResponse.json(
          { 
            error: 'Zeitkonflikt mit vorhandenem Ereignis',
            code: 'TIME_CONFLICT',
            conflictingEvents: conflictResult.rows,
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      const result = await client.query(
        `INSERT INTO calendar_events (
          user_id, title, description, start_time, end_time, location, is_all_day
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          user.id,
          title,
          description || '',
          startTime,
          endTime,
          location || '',
          isAllDay || false
        ]
      );

      const newEvent = result.rows[0];

      // TODO: Route to N8N MCP endpoint for calendar intelligence
      // POST to /mcp/calendar-optimization with event data
      // This maintains RIX PRD compliance

      return NextResponse.json({
        event: newEvent,
        message: 'Kalenderereignis erfolgreich erstellt',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create calendar event error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Kalenderereignisses',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/batch - Batch update for time-blocking optimization
export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Nicht authentifiziert',
          code: 'AUTH_TOKEN_INVALID',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(accessToken);
    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { 
          error: 'Events-Array ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      // Update multiple events in mock data
      const updatedEvents = [];
      
      for (const eventUpdate of events) {
        const eventIndex = mockEvents.findIndex(
          e => e.id === eventUpdate.id && e.userId === payload.userId
        );
        
        if (eventIndex >= 0) {
          const updatedEvent = {
            ...mockEvents[eventIndex],
            ...eventUpdate,
            updatedAt: new Date().toISOString(),
          };
          mockEvents[eventIndex] = updatedEvent;
          updatedEvents.push(updatedEvent);
        }
      }

      // TODO: Route to N8N MCP endpoint for optimized schedule analysis
      // This follows RIX PRD - pattern-based routing only

      return NextResponse.json({
        events: updatedEvents,
        updated: updatedEvents.length,
        message: 'Kalender-Ereignisse erfolgreich aktualisiert',
      });
    }

    // In real mode, batch update in database
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Benutzer nicht gefunden',
          code: 'AUTH_USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updatedEvents = [];

      for (const eventUpdate of events) {
        const { id, title, description, startTime, endTime, location, isAllDay } = eventUpdate;

        // Verify ownership and update
        const result = await client.query(
          `UPDATE calendar_events 
           SET title = COALESCE($3, title),
               description = COALESCE($4, description),
               start_time = COALESCE($5, start_time),
               end_time = COALESCE($6, end_time),
               location = COALESCE($7, location),
               is_all_day = COALESCE($8, is_all_day),
               updated_at = NOW()
           WHERE id = $1 AND user_id = $2
           RETURNING *`,
          [id, user.id, title, description, startTime, endTime, location, isAllDay]
        );

        if (result.rows.length > 0) {
          updatedEvents.push(result.rows[0]);
        }
      }

      await client.query('COMMIT');

      // TODO: Route to N8N MCP endpoint for schedule optimization analysis
      // POST to /mcp/calendar-intelligence with updated schedule data

      return NextResponse.json({
        events: updatedEvents,
        updated: updatedEvents.length,
        message: 'Kalender-Ereignisse erfolgreich aktualisiert',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Batch update calendar events error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar',
      method: 'PUT',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren der Kalender-Ereignisse',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}