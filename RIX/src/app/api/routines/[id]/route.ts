// /src/app/api/routines/[id]/route.ts
// API routes for individual routine operations (GET, PUT, DELETE)
// Handles routine management with N8N MCP integration for AI insights
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/routines/route.ts, /src/app/api/routines/[id]/complete/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock routines data (shared with main route)
const mockRoutines = [
  {
    id: 'routine-1',
    userId: 'mock-user-1',
    name: 'Morning Routine',
    description: 'Start the day with energy and focus',
    frequency: 'daily',
    timeOfDay: '07:00',
    durationMinutes: 45,
    habits: [
      { id: 'habit-1', name: 'Meditation', duration: 10, completed: false },
      { id: 'habit-2', name: 'Exercise', duration: 20, completed: false },
      { id: 'habit-3', name: 'Reading', duration: 15, completed: false }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// GET /api/routines/[id] - Get single routine by ID
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
    const includeStats = url.searchParams.get('include_stats') === 'true';

    if (MockAuth.isEnabled()) {
      const routine = mockRoutines.find(
        r => r.id === id && r.userId === payload.userId
      );

      if (!routine) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      let responseData: any = { routine };

      // Include statistics if requested
      if (includeStats) {
        // Mock statistics calculation
        const mockStats = {
          totalCompletions: 15,
          currentStreak: 3,
          longestStreak: 7,
          averageCompletion: 85,
          lastSevenDays: [
            { date: '2024-08-02', completed: true, percentage: 100 },
            { date: '2024-08-01', completed: true, percentage: 67 },
            { date: '2024-07-31', completed: true, percentage: 100 },
            { date: '2024-07-30', completed: false, percentage: 0 },
            { date: '2024-07-29', completed: true, percentage: 100 },
            { date: '2024-07-28', completed: true, percentage: 33 },
            { date: '2024-07-27', completed: true, percentage: 100 }
          ]
        };
        responseData = { routine, stats: mockStats };
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
      const result = await client.query(
        `SELECT 
          id,
          name,
          description,
          frequency,
          time_of_day,
          duration_minutes,
          habits,
          is_active,
          created_at,
          updated_at
        FROM routines 
        WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const routine = result.rows[0];
      let responseData: any = { routine };

      // Include statistics if requested
      if (includeStats) {
        const statsQuery = `
          WITH completion_stats AS (
            SELECT 
              COUNT(*) as total_completions,
              AVG(completion_percentage) as avg_completion,
              MAX(completion_date) as last_completion
            FROM daily_routine_completions
            WHERE routine_id = $1
          ),
          recent_completions AS (
            SELECT 
              completion_date,
              completion_percentage > 0 as completed,
              completion_percentage
            FROM daily_routine_completions
            WHERE routine_id = $1 
            AND completion_date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY completion_date DESC
          )
          SELECT 
            cs.total_completions,
            cs.avg_completion,
            cs.last_completion,
            array_agg(
              json_build_object(
                'date', rc.completion_date,
                'completed', rc.completed,
                'percentage', rc.completion_percentage
              )
            ) as last_seven_days
          FROM completion_stats cs
          CROSS JOIN recent_completions rc
          GROUP BY cs.total_completions, cs.avg_completion, cs.last_completion
        `;

        const statsResult = await client.query(statsQuery, [id]);
        
        // Calculate streaks
        const streakQuery = `
          WITH daily_sequence AS (
            SELECT 
              completion_date,
              completion_percentage > 0 as completed,
              LAG(completion_percentage > 0) OVER (ORDER BY completion_date) as prev_completed
            FROM daily_routine_completions
            WHERE routine_id = $1
            ORDER BY completion_date DESC
          )
          SELECT 
            COUNT(*) as current_streak
          FROM daily_sequence
          WHERE completed = true
          AND (prev_completed IS NULL OR prev_completed = true)
        `;

        const streakResult = await client.query(streakQuery, [id]);

        const stats = {
          totalCompletions: parseInt(statsResult.rows[0]?.total_completions || 0),
          currentStreak: parseInt(streakResult.rows[0]?.current_streak || 0),
          averageCompletion: Math.round(statsResult.rows[0]?.avg_completion || 0),
          lastSevenDays: statsResult.rows[0]?.last_seven_days || []
        };

        responseData = { routine, stats };
      }

      return NextResponse.json(responseData);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get routine error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines/[id]',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Routine',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT /api/routines/[id] - Update routine
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
    const { name, description, frequency, timeOfDay, durationMinutes, habits, isActive } = updateData;

    if (name && !name.trim()) {
      return NextResponse.json(
        { 
          error: 'Routinenname darf nicht leer sein',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (habits && (!Array.isArray(habits) || habits.length === 0)) {
      return NextResponse.json(
        { 
          error: 'Mindestens eine Gewohnheit ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      const routineIndex = mockRoutines.findIndex(
        r => r.id === id && r.userId === payload.userId
      );

      if (routineIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Update routine with provided fields
      const updatedRoutine = {
        ...mockRoutines[routineIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      // Process habits if provided
      if (habits) {
        updatedRoutine.habits = habits.map((habit: any) => ({
          id: habit.id || `habit-${Date.now()}-${Math.random()}`,
          name: habit.name,
          duration: habit.duration || 10,
          completed: habit.completed || false
        }));
      }

      mockRoutines[routineIndex] = updatedRoutine;

      // TODO: Route to N8N MCP endpoint for routine optimization update
      // This follows RIX PRD - pattern-based routing, no direct LLM calls

      return NextResponse.json({
        routine: updatedRoutine,
        message: 'Routine erfolgreich aktualisiert',
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
      // Check if routine exists and belongs to user
      const existsResult = await client.query(
        'SELECT id FROM routines WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (name !== undefined) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        values.push(name);
      }
      if (description !== undefined) {
        paramCount++;
        updates.push(`description = $${paramCount}`);
        values.push(description);
      }
      if (frequency !== undefined) {
        paramCount++;
        updates.push(`frequency = $${paramCount}`);
        values.push(frequency);
      }
      if (timeOfDay !== undefined) {
        paramCount++;
        updates.push(`time_of_day = $${paramCount}`);
        values.push(timeOfDay);
      }
      if (durationMinutes !== undefined) {
        paramCount++;
        updates.push(`duration_minutes = $${paramCount}`);
        values.push(durationMinutes);
      }
      if (habits !== undefined) {
        // Process habits to ensure they have IDs
        const processedHabits = habits.map((habit: any) => ({
          id: habit.id || `habit-${Date.now()}-${Math.random()}`,
          name: habit.name,
          duration: habit.duration || 10,
          completed: habit.completed || false
        }));
        
        paramCount++;
        updates.push(`habits = $${paramCount}`);
        values.push(JSON.stringify(processedHabits));
      }
      if (isActive !== undefined) {
        paramCount++;
        updates.push(`is_active = $${paramCount}`);
        values.push(isActive);
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
        UPDATE routines 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // TODO: Route to N8N MCP endpoint for routine optimization analysis
      // POST to /mcp/routine-optimization with updated routine data

      return NextResponse.json({
        routine: result.rows[0],
        message: 'Routine erfolgreich aktualisiert',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update routine error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines/[id]',
      method: 'PUT',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren der Routine',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE /api/routines/[id] - Delete routine
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
      const routineIndex = mockRoutines.findIndex(
        r => r.id === id && r.userId === payload.userId
      );

      if (routineIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      mockRoutines.splice(routineIndex, 1);

      return NextResponse.json({
        message: 'Routine erfolgreich gelöscht',
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
      // Check if routine exists and belongs to user
      const existsResult = await client.query(
        'SELECT id FROM routines WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete routine (completions will be deleted due to CASCADE)
      await client.query(
        'DELETE FROM routines WHERE id = $1',
        [id]
      );

      return NextResponse.json({
        message: 'Routine erfolgreich gelöscht',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete routine error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines/[id]',
      method: 'DELETE',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen der Routine',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}