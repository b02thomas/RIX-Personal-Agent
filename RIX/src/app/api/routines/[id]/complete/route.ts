// /src/app/api/routines/[id]/complete/route.ts
// API route for tracking routine completion and habit progress
// Handles daily routine completion with N8N MCP routing for insights
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/routines/[id]/route.ts, /src/app/api/routines/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock completions data for development
const mockCompletions = [
  {
    id: 'completion-1',
    routineId: 'routine-1',
    userId: 'mock-user-1',
    completionDate: new Date().toISOString().split('T')[0],
    habitsCompleted: {
      'habit-1': true,
      'habit-2': true,
      'habit-3': false
    },
    totalHabits: 3,
    completedHabits: 2,
    completionPercentage: 67,
    notes: 'Good morning routine',
    createdAt: new Date().toISOString(),
  }
];

// POST /api/routines/[id]/complete - Record routine completion
export async function POST(
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
    const completionData = await request.json();

    // Validate completion data
    const { habitsCompleted, completionDate, notes } = completionData;

    if (!habitsCompleted || typeof habitsCompleted !== 'object') {
      return NextResponse.json(
        { 
          error: 'Gewohnheiten-Status ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const targetDate = completionDate || new Date().toISOString().split('T')[0];

    if (MockAuth.isEnabled()) {
      // Check if routine exists and belongs to user
      const mockRoutines = [
        {
          id: 'routine-1',
          userId: 'mock-user-1',
          habits: [
            { id: 'habit-1', name: 'Meditation', duration: 10 },
            { id: 'habit-2', name: 'Exercise', duration: 20 },
            { id: 'habit-3', name: 'Reading', duration: 15 }
          ]
        }
      ];

      const routine = mockRoutines.find(r => r.id === id && r.userId === payload.userId);
      
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

      // Calculate completion statistics
      const totalHabits = routine.habits.length;
      const completedHabits = Object.values(habitsCompleted).filter(Boolean).length;
      const completionPercentage = Math.round((completedHabits / totalHabits) * 100);

      // Check if completion already exists for this date
      const existingIndex = mockCompletions.findIndex(
        c => c.routineId === id && c.completionDate === targetDate
      );

      const completion = {
        id: existingIndex >= 0 ? mockCompletions[existingIndex].id : `completion-${Date.now()}`,
        routineId: id,
        userId: payload.userId,
        completionDate: targetDate,
        habitsCompleted,
        totalHabits,
        completedHabits,
        completionPercentage,
        notes: notes || '',
        createdAt: existingIndex >= 0 ? mockCompletions[existingIndex].createdAt : new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        mockCompletions[existingIndex] = completion;
      } else {
        mockCompletions.push(completion);
      }

      // TODO: Route to N8N MCP endpoint for habit analysis and insights
      // This follows RIX PRD - no direct LLM integration, only routing

      return NextResponse.json({
        completion,
        message: existingIndex >= 0 ? 'Routine-Abschluss aktualisiert' : 'Routine-Abschluss erfasst',
        isUpdate: existingIndex >= 0,
      });
    }

    // In real mode, store in database
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
      // First, get the routine to validate ownership and get habit count
      const routineResult = await client.query(
        'SELECT habits FROM routines WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (routineResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const routine = routineResult.rows[0];
      const habits = routine.habits || [];
      
      // Calculate completion statistics
      const totalHabits = habits.length;
      const completedHabits = Object.values(habitsCompleted).filter(Boolean).length;
      const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

      // Use UPSERT to handle duplicate dates
      const result = await client.query(
        `INSERT INTO daily_routine_completions (
          routine_id, user_id, completion_date, habits_completed, 
          total_habits, completed_habits, completion_percentage, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (routine_id, completion_date)
        DO UPDATE SET
          habits_completed = EXCLUDED.habits_completed,
          total_habits = EXCLUDED.total_habits,
          completed_habits = EXCLUDED.completed_habits,
          completion_percentage = EXCLUDED.completion_percentage,
          notes = EXCLUDED.notes,
          created_at = NOW()
        RETURNING *, 
        CASE WHEN xmax = 0 THEN false ELSE true END as was_updated`,
        [
          id,
          user.id,
          targetDate,
          JSON.stringify(habitsCompleted),
          totalHabits,
          completedHabits,
          completionPercentage,
          notes || ''
        ]
      );

      const completion = result.rows[0];
      const isUpdate = completion.was_updated;

      // TODO: Route to N8N MCP endpoint for habit pattern analysis
      // POST to /mcp/habit-insights with completion data
      // This maintains RIX PRD compliance

      return NextResponse.json({
        completion: {
          id: completion.id,
          routineId: completion.routine_id,
          completionDate: completion.completion_date,
          habitsCompleted: completion.habits_completed,
          totalHabits: completion.total_habits,
          completedHabits: completion.completed_habits,
          completionPercentage: completion.completion_percentage,
          notes: completion.notes,
          createdAt: completion.created_at,
        },
        message: isUpdate ? 'Routine-Abschluss aktualisiert' : 'Routine-Abschluss erfasst',
        isUpdate,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Complete routine error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines/[id]/complete',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erfassen des Routine-Abschlusses',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET /api/routines/[id]/complete - Get completion history
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
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    if (MockAuth.isEnabled()) {
      // Filter mock completions for this routine and user
      let filteredCompletions = mockCompletions.filter(
        c => c.routineId === id && c.userId === payload.userId
      );

      // Apply date filters
      if (startDate && endDate) {
        filteredCompletions = filteredCompletions.filter(
          c => c.completionDate >= startDate && c.completionDate <= endDate
        );
      } else if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffString = cutoffDate.toISOString().split('T')[0];
        
        filteredCompletions = filteredCompletions.filter(
          c => c.completionDate >= cutoffString
        );
      }

      // Sort by date descending
      filteredCompletions.sort((a, b) => b.completionDate.localeCompare(a.completionDate));

      return NextResponse.json({
        completions: filteredCompletions,
        total: filteredCompletions.length,
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
      // Verify routine ownership
      const routineCheck = await client.query(
        'SELECT id FROM routines WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (routineCheck.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Routine nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Build query with date filters
      let query = `
        SELECT 
          id,
          completion_date,
          habits_completed,
          total_habits,
          completed_habits,
          completion_percentage,
          notes,
          created_at
        FROM daily_routine_completions
        WHERE routine_id = $1
      `;
      const params = [id];
      let paramCount = 1;

      if (startDate && endDate) {
        paramCount++;
        query += ` AND completion_date >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
        query += ` AND completion_date <= $${paramCount}`;
        params.push(endDate);
      } else if (days) {
        paramCount++;
        query += ` AND completion_date >= CURRENT_DATE - INTERVAL '${days} days'`;
      }

      query += ` ORDER BY completion_date DESC`;

      const result = await client.query(query, params);

      const completions = result.rows.map(row => ({
        id: row.id,
        routineId: id,
        completionDate: row.completion_date,
        habitsCompleted: row.habits_completed,
        totalHabits: row.total_habits,
        completedHabits: row.completed_habits,
        completionPercentage: row.completion_percentage,
        notes: row.notes,
        createdAt: row.created_at,
      }));

      return NextResponse.json({
        completions,
        total: completions.length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get routine completions error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines/[id]/complete',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Routine-Abschlüsse',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}