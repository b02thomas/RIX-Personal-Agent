import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { MockAuth } from '@/lib/mock-auth';

// Mock conversations data
const mockConversations = [
  {
    id: 'conv-1',
    userId: 'mock-user-1',
    title: 'Willkommen bei RIX',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv-2',
    userId: 'mock-user-1',
    title: 'N8N Workflow Diskussion',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv-3',
    userId: 'mock-user-1',
    title: 'Projektplanung',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date().toISOString(),
  }
];

// GET /api/conversations - Get all conversations for user
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

    // In mock mode, return mock conversations
    if (MockAuth.isEnabled()) {
      const userConversations = mockConversations.filter(
        conv => conv.userId === payload.userId
      );

      return NextResponse.json({
        conversations: userConversations,
        total: userConversations.length,
      });
    }

    // In real mode, fetch from database
    // This would be implemented with actual database queries
    return NextResponse.json({
      conversations: [],
      total: 0,
    });
  } catch (error) {
    console.error('Get conversations error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/conversations',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Konversationen',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
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
    const { title } = await request.json();

    if (MockAuth.isEnabled()) {
      const newConversation = {
        id: `conv-${Date.now()}`,
        userId: payload.userId,
        title: title || 'Neue Konversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockConversations.push(newConversation);

      return NextResponse.json({
        conversation: newConversation,
        message: 'Konversation erfolgreich erstellt',
      });
    }

    // In real mode, create in database
    return NextResponse.json(
      { 
        error: 'Database not available',
        code: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Create conversation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/conversations',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Konversation',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 