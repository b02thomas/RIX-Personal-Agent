// /src/app/api/main-agent/n8n/analytics/route.ts
// N8N workflow analytics API proxy to main agent
// Forwards analytics requests to main agent for workflow performance data
// RELEVANT FILES: main-agent/app/api/endpoints/n8n.py, src/components/n8n/n8n-analytics-dashboard.tsx, src/lib/auth.ts, src/app/dashboard/settings/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';

// GET /api/main-agent/n8n/analytics - Get workflow analytics and performance metrics
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7';

    // Validate days parameter
    const daysNumber = parseInt(days);
    if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
      return NextResponse.json(
        { 
          error: 'days Parameter muss zwischen 1 und 365 liegen',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Forward request to main agent
    const mainAgentUrl = process.env.MAIN_AGENT_URL || 'http://localhost:8001';
    const response = await fetch(`${mainAgentUrl}/api/n8n/analytics?days=${daysNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-User-ID': user.id
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Main agent request failed' }));
      return NextResponse.json(
        {
          error: errorData.detail || 'Main agent request failed',
          code: 'MAIN_AGENT_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('N8N analytics error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/main-agent/n8n/analytics',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Interner Serverfehler',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}