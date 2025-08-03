// /src/app/api/calendar/[id]/route.ts
// API routes for individual calendar event operations (GET, PUT, DELETE)
// Handles calendar event management with N8N MCP integration for scheduling intelligence
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/calendar/route.ts, /src/app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock calendar events data (shared with main route)
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
  }
];

// GET /api/calendar/[id] - Get single calendar event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Extract query parameters
    const url = new URL(request.url);
    const includeProject = url.searchParams.get('include_project') === 'true';

    if (MockAuth.isEnabled()) {
      const event = mockEvents.find(
        e => e.id === id && e.userId === payload.userId
      );

      if (!event) {
        return NextResponse.json(
          { 
            error: 'Kalenderereignis nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      let responseData: any = { event };

      // Include project details if requested
      if (includeProject && event.projectId) {
        const mockProjects = [
          { id: 'project-1', name: 'Personal Productivity', color: '#60A5FA', status: 'active' }
        ];
        const project = mockProjects.find(p => p.id === event.projectId);
        responseData = { 
          event: { ...event },
          project
        };
      }

      return NextResponse.json(responseData);
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
      const query = `
        SELECT 
          id,
          title,
          description,
          start_time,
          end_time,
          location,
          is_all_day,
          created_at,
          updated_at
        FROM calendar_events 
        WHERE id = $1 AND user_id = $2
      `;

      const result = await client.query(query, [id, user.id]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Kalenderereignis nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ event: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get calendar event error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar/[id]',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden des Kalenderereignisses',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/[id] - Update calendar event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const updateData = await request.json();

    // Validate input data
    const { title, description, startTime, endTime, location, isAllDay, eventType, projectId, priority, tags } = updateData;

    if (title && !title.trim()) {
      return NextResponse.json(
        { 
          error: 'Titel darf nicht leer sein',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate time logic if both times are provided
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
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
      const eventIndex = mockEvents.findIndex(
        e => e.id === id && e.userId === payload.userId
      );

      if (eventIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Kalenderereignis nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Update event with provided fields
      const updatedEvent = {
        ...mockEvents[eventIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      mockEvents[eventIndex] = updatedEvent;

      // TODO: Route to N8N MCP endpoint for updated schedule optimization
      // This follows RIX PRD - pattern-based routing, no direct LLM calls

      return NextResponse.json({
        event: updatedEvent,
        message: 'Kalenderereignis erfolgreich aktualisiert',
      });
    }

    // In real mode, update in database
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
      // Check if event exists and belongs to user
      const existsResult = await client.query(
        'SELECT id FROM calendar_events WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Kalenderereignis nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Check for time conflicts if times are being updated
      if (startTime && endTime) {
        const conflictQuery = `
          SELECT id, title, start_time, end_time
          FROM calendar_events
          WHERE user_id = $1 AND id != $2
          AND (
            (start_time <= $3 AND end_time > $3) OR
            (start_time < $4 AND end_time >= $4) OR
            (start_time >= $3 AND end_time <= $4)
          )
        `;

        const conflictResult = await client.query(conflictQuery, [user.id, id, startTime, endTime]);

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
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (title !== undefined) {
        paramCount++;
        updates.push(`title = $${paramCount}`);
        values.push(title);
      }
      if (description !== undefined) {
        paramCount++;
        updates.push(`description = $${paramCount}`);
        values.push(description);
      }
      if (startTime !== undefined) {
        paramCount++;
        updates.push(`start_time = $${paramCount}`);
        values.push(startTime);
      }
      if (endTime !== undefined) {
        paramCount++;
        updates.push(`end_time = $${paramCount}`);
        values.push(endTime);
      }
      if (location !== undefined) {
        paramCount++;
        updates.push(`location = $${paramCount}`);
        values.push(location);
      }
      if (isAllDay !== undefined) {
        paramCount++;
        updates.push(`is_all_day = $${paramCount}`);
        values.push(isAllDay);
      }

      // Always update the updated_at timestamp
      paramCount++;
      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) { // Only updated_at was added
        return NextResponse.json(
          { 
            error: 'Keine Änderungen vorgenommen',
            code: 'NO_CHANGES',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Add WHERE clause parameters
      paramCount++;
      values.push(id);
      paramCount++;
      values.push(user.id);

      const query = `
        UPDATE calendar_events 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // TODO: Route to N8N MCP endpoint for schedule optimization
      // POST to /mcp/calendar-intelligence with updated event data
      // This maintains RIX PRD compliance

      return NextResponse.json({
        event: result.rows[0],
        message: 'Kalenderereignis erfolgreich aktualisiert',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update calendar event error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar/[id]',
      method: 'PUT',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren des Kalenderereignisses',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[id] - Delete calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (MockAuth.isEnabled()) {
      const eventIndex = mockEvents.findIndex(
        e => e.id === id && e.userId === payload.userId
      );

      if (eventIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Kalenderereignis nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      mockEvents.splice(eventIndex, 1);

      return NextResponse.json({
        message: 'Kalenderereignis erfolgreich gelöscht',
      });
    }

    // In real mode, delete from database
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
      // Check if event exists and belongs to user
      const existsResult = await client.query(
        'SELECT id FROM calendar_events WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Kalenderereignis nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete event
      await client.query(
        'DELETE FROM calendar_events WHERE id = $1',
        [id]
      );

      return NextResponse.json({
        message: 'Kalenderereignis erfolgreich gelöscht',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete calendar event error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar/[id]',
      method: 'DELETE',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen des Kalenderereignisses',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}