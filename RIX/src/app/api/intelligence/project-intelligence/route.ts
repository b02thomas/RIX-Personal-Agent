// /src/app/api/intelligence/project-intelligence/route.ts
// Frontend proxy for Main Agent project intelligence endpoint
// Routes AI project analysis requests to Main Agent which then processes via N8N MCP endpoints
// RELEVANT FILES: /main-agent/app/api/endpoints/intelligence.py, /src/lib/auth.ts, /src/lib/main-agent-client.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/access_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestData = await request.json();
    
    // Validate required fields
    if (!requestData.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Forward request to Main Agent
    const mainAgentUrl = process.env.MAIN_AGENT_URL || 'http://localhost:8001';
    const mainAgentResponse = await fetch(`${mainAgentUrl}/intelligence/project-intelligence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        message: requestData.message,
        context: requestData.context || {},
        conversation_id: requestData.conversation_id || `project-intelligence-${Date.now()}`
      }),
    });

    if (!mainAgentResponse.ok) {
      const errorText = await mainAgentResponse.text();
      console.error('Main Agent project intelligence failed:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Project intelligence analysis failed',
          details: errorText
        },
        { status: mainAgentResponse.status }
      );
    }

    const data = await mainAgentResponse.json();
    
    // Return Main Agent response
    return NextResponse.json(data);

  } catch (error) {
    console.error('Project intelligence proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}