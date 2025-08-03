// /src/app/api/main-agent/n8n/activate/route.ts
// N8N workflow activation API proxy to main agent
// Forwards workflow activation/deactivation requests to main agent
// RELEVANT FILES: main-agent/app/api/endpoints/n8n.py, src/components/n8n/n8n-workflow-controls.tsx, src/lib/auth.ts, src/app/dashboard/settings/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';

// POST /api/main-agent/n8n/activate - Activate or deactivate N8N workflow
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

    // Get request body
    const body = await request.json();

    // Validate required fields
    if (!body.workflow_id || typeof body.active !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'workflow_id und active sind erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Forward request to main agent
    const mainAgentUrl = process.env.MAIN_AGENT_URL || 'http://localhost:8001';
    const response = await fetch(`${mainAgentUrl}/api/n8n/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-User-ID': user.id
      },
      body: JSON.stringify(body)
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
    console.error('N8N workflow activation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/main-agent/n8n/activate',
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