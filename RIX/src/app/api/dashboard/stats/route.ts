// /Users/benediktthomas/RIX Personal Agent/RIX/src/app/api/dashboard/stats/route.ts
// API endpoint for dashboard statistics and metrics
// Provides real-time data for dashboard overview cards
// RELEVANT FILES: dashboard/page.tsx, projects/route.ts, tasks/route.ts, routines/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock dashboard statistics for development
    const stats = {
      tasks: {
        total: 12,
        completed: 7,
        overdue: 2,
        today: 5
      },
      calendar: {
        today: 3,
        week: 8,
        upcoming: 15
      },
      goals: {
        active: 4,
        progress: 67,
        completed: 12
      },
      routines: {
        completed: 3,
        total: 5,
        streak: 7
      },
      projects: {
        active: 6,
        paused: 2,
        completed: 24
      },
      productivity: {
        score: 85,
        trend: '+12%',
        weeklyAverage: 78
      }
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load dashboard statistics',
        stats: {
          tasks: { total: 0, completed: 0, overdue: 0 },
          calendar: { today: 0, week: 0 },
          goals: { active: 0, progress: 0 },
          routines: { completed: 0, total: 0 }
        }
      },
      { status: 500 }
    );
  }
}