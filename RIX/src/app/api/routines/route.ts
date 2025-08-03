// /src/app/api/routines/route.ts
// API routes for routine and habit management in RIX Personal Agent
// Provides complete routine tracking with N8N MCP routing for AI insights
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/projects/route.ts, /src/app/api/routines/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock routines data for development
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
  },
  {
    id: 'routine-2',
    userId: 'mock-user-1',
    name: 'Evening Wind-down',
    description: 'Prepare for restful sleep',
    frequency: 'daily',
    timeOfDay: '21:30',
    durationMinutes: 30,
    habits: [
      { id: 'habit-4', name: 'Journal', duration: 10, completed: false },
      { id: 'habit-5', name: 'Prep tomorrow', duration: 10, completed: false },
      { id: 'habit-6', name: 'Digital detox', duration: 10, completed: false }
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Mock routine completions for tracking
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
    notes: 'Good start to the day',
    createdAt: new Date().toISOString(),
  }
];

// GET /api/routines - Get all routines for user
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

    // Extract query parameters
    const url = new URL(request.url);
    const isActive = url.searchParams.get('active');
    const frequency = url.searchParams.get('frequency');
    const includeCompletions = url.searchParams.get('include_completions') === 'true';

    // In mock mode, return filtered mock routines
    if (MockAuth.isEnabled()) {
      let filteredRoutines = mockRoutines.filter(
        routine => routine.userId === payload.userId
      );

      // Apply filters
      if (isActive !== null) {
        const activeFilter = isActive === 'true';
        filteredRoutines = filteredRoutines.filter(routine => routine.isActive === activeFilter);
      }
      if (frequency) {
        filteredRoutines = filteredRoutines.filter(routine => routine.frequency === frequency);
      }

      // Include recent completions if requested
      if (includeCompletions) {
        const routinesWithCompletions = filteredRoutines.map(routine => {
          const recentCompletions = mockCompletions
            .filter(completion => completion.routineId === routine.id)
            .slice(0, 7); // Last 7 days
          
          return {
            ...routine,
            recentCompletions
          };
        });
        
        return NextResponse.json({
          routines: routinesWithCompletions,
          total: routinesWithCompletions.length,
        });
      }

      return NextResponse.json({
        routines: filteredRoutines,
        total: filteredRoutines.length,
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
        WHERE user_id = $1
      `;
      const params: any[] = [user.id];
      let paramCount = 1;

      if (isActive !== null) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        params.push(isActive === 'true');
      }
      
      if (frequency) {
        paramCount++;
        query += ` AND frequency = $${paramCount}`;
        params.push(frequency);
      }

      query += ` ORDER BY time_of_day ASC, updated_at DESC`;

      const result = await client.query(query, params);
      let routines = result.rows;

      // Include recent completions if requested
      if (includeCompletions && routines.length > 0) {
        const routineIds = routines.map(r => r.id);
        const completionsQuery = `
          SELECT 
            routine_id,
            completion_date,
            habits_completed,
            total_habits,
            completed_habits,
            completion_percentage,
            notes
          FROM daily_routine_completions
          WHERE routine_id = ANY($1) 
          AND completion_date >= CURRENT_DATE - INTERVAL '7 days'
          ORDER BY completion_date DESC
        `;
        
        const completionsResult = await client.query(completionsQuery, [routineIds]);
        
        // Group completions by routine
        const completionsByRoutine = completionsResult.rows.reduce((acc, completion) => {
          if (!acc[completion.routine_id]) {
            acc[completion.routine_id] = [];
          }
          acc[completion.routine_id].push(completion);
          return acc;
        }, {});

        routines = routines.map(routine => ({
          ...routine,
          recentCompletions: completionsByRoutine[routine.id] || []
        }));
      }

      return NextResponse.json({
        routines,
        total: routines.length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get routines error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Routinen',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/routines - Create new routine
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
    const routineData = await request.json();

    // Validate required fields
    const { name, description, frequency, timeOfDay, durationMinutes, habits } = routineData;

    if (!name) {
      return NextResponse.json(
        { 
          error: 'Routinenname ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (!habits || !Array.isArray(habits) || habits.length === 0) {
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
      const newRoutine = {
        id: `routine-${Date.now()}`,
        userId: payload.userId,
        name,
        description: description || '',
        frequency: frequency || 'daily',
        timeOfDay: timeOfDay || '09:00',
        durationMinutes: durationMinutes || 30,
        habits: habits.map(habit => ({
          id: `habit-${Date.now()}-${Math.random()}`,
          name: habit.name,
          duration: habit.duration || 10,
          completed: false
        })),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRoutines.push(newRoutine);

      // TODO: Route to N8N MCP endpoint for routine optimization suggestions
      // This follows RIX PRD - no direct LLM integration, only routing

      return NextResponse.json({
        routine: newRoutine,
        message: 'Routine erfolgreich erstellt',
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
      // Add unique IDs to habits if not provided
      const processedHabits = habits.map((habit: any) => ({
        id: habit.id || `habit-${Date.now()}-${Math.random()}`,
        name: habit.name,
        duration: habit.duration || 10,
        completed: false
      }));

      const result = await client.query(
        `INSERT INTO routines (
          user_id, name, description, frequency, time_of_day, 
          duration_minutes, habits
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          user.id,
          name,
          description || '',
          frequency || 'daily',
          timeOfDay || '09:00',
          durationMinutes || 30,
          JSON.stringify(processedHabits)
        ]
      );

      const newRoutine = result.rows[0];

      // TODO: Route to N8N MCP endpoint for routine analysis and optimization
      // POST to /mcp/routine-optimization with routine data
      // This maintains RIX PRD compliance

      return NextResponse.json({
        routine: newRoutine,
        message: 'Routine erfolgreich erstellt',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create routine error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/routines',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Routine',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}