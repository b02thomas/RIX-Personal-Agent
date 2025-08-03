// /src/app/api/calendar/time-blocks/route.ts
// API routes for intelligent time-blocking and schedule optimization
// Provides AI-powered time management with N8N MCP routing for scheduling intelligence
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/calendar/route.ts, /src/app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock time blocks for development
const mockTimeBlocks = [
  {
    id: 'block-1',
    userId: 'mock-user-1',
    title: 'Deep Work - Project Alpha',
    projectId: 'project-1',
    duration: 120, // minutes
    preferredTime: '09:00',
    priority: 'high',
    taskType: 'focused_work',
    energyLevel: 'high',
    scheduledDate: null,
    isScheduled: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'block-2',
    userId: 'mock-user-1',
    title: 'Email Processing',
    projectId: null,
    duration: 30,
    preferredTime: '14:00',
    priority: 'medium',
    taskType: 'administrative',
    energyLevel: 'low',
    scheduledDate: null,
    isScheduled: false,
    createdAt: new Date().toISOString(),
  }
];

// POST /api/calendar/time-blocks - Create time block for intelligent scheduling
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
    const blockData = await request.json();

    // Validate required fields
    const { 
      title, 
      duration, 
      projectId, 
      preferredTime, 
      priority, 
      taskType, 
      energyLevel,
      deadlineDate 
    } = blockData;

    if (!title || !duration) {
      return NextResponse.json(
        { 
          error: 'Titel und Dauer sind erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (duration < 15 || duration > 480) { // 15 minutes to 8 hours
      return NextResponse.json(
        { 
          error: 'Dauer muss zwischen 15 Minuten und 8 Stunden liegen',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      const newTimeBlock = {
        id: `block-${Date.now()}`,
        userId: payload.userId,
        title,
        projectId: projectId || null,
        duration,
        preferredTime: preferredTime || '09:00',
        priority: priority || 'medium',
        taskType: taskType || 'general',
        energyLevel: energyLevel || 'medium',
        deadlineDate: deadlineDate || null,
        scheduledDate: null,
        isScheduled: false,
        createdAt: new Date().toISOString(),
      };

      mockTimeBlocks.push(newTimeBlock);

      // TODO: Route to N8N MCP endpoint for intelligent scheduling
      // POST to /mcp/time-block-scheduler with time block data
      // This follows RIX PRD - no direct LLM integration, only routing

      return NextResponse.json({
        timeBlock: newTimeBlock,
        message: 'Zeit-Block erfolgreich erstellt',
        suggestion: 'Zeit-Block wird automatisch in den optimalen Zeitslot eingeplant',
      });
    }

    // In real mode, this would integrate with enhanced calendar_events table
    // For now, we create a basic calendar event
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
      // For now, we'll create a placeholder event
      // In a full implementation, this would be stored in a time_blocks table
      const startTime = new Date();
      startTime.setHours(parseInt(preferredTime?.split(':')[0] || '9'), 
                         parseInt(preferredTime?.split(':')[1] || '0'), 0, 0);
      
      const endTime = new Date(startTime.getTime() + (duration * 60000));

      const result = await client.query(
        `INSERT INTO calendar_events (
          user_id, title, description, start_time, end_time, location, is_all_day
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          user.id,
          `[Zeit-Block] ${title}`,
          `Dauer: ${duration}min, Priorität: ${priority}, Typ: ${taskType}`,
          startTime.toISOString(),
          endTime.toISOString(),
          'Geplante Zeit',
          false
        ]
      );

      const newEvent = result.rows[0];

      // TODO: Route to N8N MCP endpoint for schedule optimization
      // POST to /mcp/calendar-intelligence with time block data
      // This maintains RIX PRD compliance

      return NextResponse.json({
        timeBlock: {
          id: newEvent.id,
          title,
          duration,
          priority,
          taskType,
          energyLevel,
          scheduledDate: startTime.toISOString().split('T')[0],
          isScheduled: true,
        },
        calendarEvent: newEvent,
        message: 'Zeit-Block erfolgreich erstellt und eingeplant',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create time block error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar/time-blocks',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Zeit-Blocks',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET /api/calendar/time-blocks - Get unscheduled time blocks
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
    const includeScheduled = url.searchParams.get('include_scheduled') === 'true';
    const priority = url.searchParams.get('priority');

    if (MockAuth.isEnabled()) {
      let filteredBlocks = mockTimeBlocks.filter(
        block => block.userId === payload.userId
      );

      // Apply filters
      if (!includeScheduled) {
        filteredBlocks = filteredBlocks.filter(block => !block.isScheduled);
      }
      if (priority) {
        filteredBlocks = filteredBlocks.filter(block => block.priority === priority);
      }

      // Sort by priority and creation date
      const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
      filteredBlocks.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      return NextResponse.json({
        timeBlocks: filteredBlocks,
        total: filteredBlocks.length,
        unscheduled: filteredBlocks.filter(b => !b.isScheduled).length,
      });
    }

    // In real mode, this would query a dedicated time_blocks table
    // For now, return empty array
    return NextResponse.json({
      timeBlocks: [],
      total: 0,
      unscheduled: 0,
      message: 'Zeit-Block Feature erfordert erweiterte Datenbankstruktur',
    });
  } catch (error) {
    console.error('Get time blocks error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar/time-blocks',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Zeit-Blöcke',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/time-blocks/optimize - Optimize schedule with AI
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
    const { timeRange, preferences } = await request.json();

    // Validate input
    if (!timeRange || !timeRange.startDate || !timeRange.endDate) {
      return NextResponse.json(
        { 
          error: 'Zeitbereich (startDate, endDate) ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      // Mock optimization logic
      const unscheduledBlocks = mockTimeBlocks.filter(
        block => block.userId === payload.userId && !block.isScheduled
      );

      // Simulate intelligent scheduling
      const optimizedSchedule = unscheduledBlocks.map((block, index) => {
        const scheduleDate = new Date(timeRange.startDate);
        scheduleDate.setDate(scheduleDate.getDate() + Math.floor(index / 3));
        
        const preferredHour = parseInt(block.preferredTime.split(':')[0]);
        const optimizedHour = block.energyLevel === 'high' ? 
          Math.max(8, preferredHour) : 
          Math.max(14, preferredHour);
        
        scheduleDate.setHours(optimizedHour, 0, 0, 0);
        
        return {
          ...block,
          scheduledDate: scheduleDate.toISOString().split('T')[0],
          scheduledTime: `${optimizedHour.toString().padStart(2, '0')}:00`,
          optimizationReason: `Optimal für ${block.energyLevel} Energie-Level`,
          isScheduled: true,
        };
      });

      // Update mock data
      optimizedSchedule.forEach(optimized => {
        const index = mockTimeBlocks.findIndex(b => b.id === optimized.id);
        if (index >= 0) {
          (mockTimeBlocks[index] as any) = { ...mockTimeBlocks[index], ...optimized };
        }
      });

      // TODO: Route to N8N MCP endpoint for AI-powered schedule optimization
      // POST to /mcp/schedule-optimizer with time blocks and preferences
      // This follows RIX PRD - no direct LLM integration, only routing

      return NextResponse.json({
        optimizedBlocks: optimizedSchedule,
        scheduled: optimizedSchedule.length,
        message: 'Zeitplan erfolgreich optimiert',
        insights: [
          'High-energy tasks scheduled for morning hours',
          'Administrative tasks moved to afternoon',
          'Buffer time added between focused work sessions'
        ],
      });
    }

    // In real mode, this would trigger comprehensive schedule optimization
    return NextResponse.json({
      optimizedBlocks: [],
      scheduled: 0,
      message: 'Zeitplan-Optimierung erfordert N8N MCP Integration',
    });
  } catch (error) {
    console.error('Optimize schedule error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/calendar/time-blocks/optimize',
      method: 'PUT',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler bei der Zeitplan-Optimierung',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}