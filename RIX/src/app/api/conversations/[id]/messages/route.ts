import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { MockAuth } from '@/lib/mock-auth';

// Mock messages data
const mockMessages = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    userId: 'mock-user-1',
    content: 'Willkommen bei RIX! Wie kann ich Ihnen helfen?',
    messageType: 'text',
    isFromAi: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    userId: 'mock-user-1',
    content: 'Ich möchte mehr über N8N Workflows erfahren.',
    messageType: 'text',
    isFromAi: false,
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    userId: 'mock-user-1',
    content: 'N8N ist ein mächtiges Workflow-Automatisierungstool. Es ermöglicht Ihnen, verschiedene Apps und Services zu verbinden und komplexe Automatisierungen zu erstellen.',
    messageType: 'text',
    isFromAi: true,
    createdAt: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    userId: 'mock-user-1',
    content: 'Lassen Sie uns über Workflow-Optimierung sprechen.',
    messageType: 'text',
    isFromAi: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 'msg-5',
    conversationId: 'conv-2',
    userId: 'mock-user-1',
    content: 'Workflow-Optimierung ist entscheidend für die Effizienz. Hier sind einige Best Practices...',
    messageType: 'text',
    isFromAi: true,
    createdAt: new Date(Date.now() - 86340000).toISOString(), // 1 day ago + 10 minutes
  }
];

// GET /api/conversations/[id]/messages - Get messages for conversation
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

    await verifyToken(accessToken);
    const conversationId = id;

    // In mock mode, return mock messages
    if (MockAuth.isEnabled()) {
      const conversationMessages = mockMessages.filter(
        msg => msg.conversationId === conversationId
      );

      return NextResponse.json({
        messages: conversationMessages,
        total: conversationMessages.length,
      });
    }

    // In real mode, fetch from database
    return NextResponse.json({
      messages: [],
      total: 0,
    });
  } catch (error) {
    console.error('Get messages error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/conversations/[id]/messages',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Nachrichten',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Create new message
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
    const conversationId = id;
    const { content, messageType = 'text', isFromAi = false } = await request.json();

    if (MockAuth.isEnabled()) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        conversationId,
        userId: payload.userId,
        content,
        messageType,
        isFromAi,
        createdAt: new Date().toISOString(),
      };

      mockMessages.push(newMessage);

      // Mock AI response for chat functionality
      if (!isFromAi) {
        setTimeout(() => {
          const aiResponse = {
            id: `msg-ai-${Date.now()}`,
            conversationId,
            userId: payload.userId,
            content: `Das ist eine Mock-AI-Antwort auf: "${content}". In der echten Version würde hier der Main Agent antworten.`,
            messageType: 'text',
            isFromAi: true,
            createdAt: new Date().toISOString(),
          };
          mockMessages.push(aiResponse);
        }, 1000);
      }

      return NextResponse.json({
        message: newMessage,
        status: 'Nachricht erfolgreich erstellt',
      });
    }

    // In real mode, create in database and route to Main Agent
    return NextResponse.json(
      { 
        error: 'Database not available',
        code: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Create message error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/conversations/[id]/messages',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Nachricht',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}