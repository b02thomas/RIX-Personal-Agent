import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';

// GET /api/conversations/[id] - Get conversation with messages
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

    const conversationId = id;

    const client = await pool.connect();
    
    try {
      // Get conversation details
      const conversationResult = await client.query(
        'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, user.id]
      );

      if (conversationResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Konversation nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Get messages for this conversation
      const messagesResult = await client.query(
        `SELECT 
          m.id,
          m.content,
          m.message_type,
          m.is_from_ai,
          m.created_at,
          u.first_name,
          u.last_name
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC`,
        [conversationId]
      );

      return NextResponse.json({
        conversation: conversationResult.rows[0],
        messages: messagesResult.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get conversation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/conversations/[id]',
      method: 'GET',
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

// DELETE /api/conversations/[id] - Delete conversation
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

    const conversationId = id;

    const client = await pool.connect();
    
    try {
      // Check if conversation belongs to user
      const conversationResult = await client.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, user.id]
      );

      if (conversationResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Konversation nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete conversation (messages will be deleted due to CASCADE)
      await client.query(
        'DELETE FROM conversations WHERE id = $1',
        [conversationId]
      );

      return NextResponse.json({
        message: 'Konversation erfolgreich gelöscht',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete conversation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/conversations/[id]',
      method: 'DELETE',
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