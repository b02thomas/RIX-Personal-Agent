import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

// POST /api/n8n/webhook/voice-processing - Receive voice processing results
export async function POST(request: NextRequest) {
  try {
    const {
      conversationId,
      userId,
      transcription,
      confidence,
      audioUrl,
      processingTime,
      metadata
    } = await request.json();

    if (!conversationId || !userId || !transcription) {
      return NextResponse.json(
        { 
          error: 'Fehlende erforderliche Felder',
          code: 'VALIDATION_MISSING_FIELDS',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Insert voice transcription message
      const voiceMessageResult = await client.query(
        `INSERT INTO messages (conversation_id, user_id, content, message_type, is_from_ai)
         VALUES ($1, $2, $3, 'voice', FALSE)
         RETURNING *`,
        [conversationId, userId, transcription]
      );

      // Update conversation timestamp
      await client.query(
        'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
        [conversationId]
      );

      const voiceMessage = voiceMessageResult.rows[0];

      // TODO: Emit WebSocket event for real-time updates
      // socket.emit('voice-transcription', { conversationId, message: voiceMessage });

      return NextResponse.json({
        success: true,
        message: voiceMessage,
        metadata: {
          confidence,
          audioUrl,
          processingTime,
          ...metadata
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Voice processing webhook error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/n8n/webhook/voice-processing',
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