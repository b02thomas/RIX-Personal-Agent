import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { N8NWebhookMiddleware } from '@/lib/n8n/middleware';
import { N8NResponse } from '@/lib/n8n/client';

// POST /api/n8n/webhook/master-brain - Receive Master Brain responses
export async function POST(request: NextRequest) {
  try {
    // Validate webhook request
    const validation = N8NWebhookMiddleware.validateWebhookRequest(request);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: validation.error,
          code: 'VALIDATION_INVALID_DATA',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimit = await N8NWebhookMiddleware.checkRateLimit(request);
    if (!rateLimit.isValid) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          code: 'VALIDATION_RATE_LIMIT',
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      );
    }

    const responseData = await request.json();

    // Validate N8N response format
    const responseValidation = N8NWebhookMiddleware.validateN8NResponse(responseData);
    if (!responseValidation.isValid) {
      N8NWebhookMiddleware.logWebhookActivity(
        'master-brain',
        responseData.userId || 'unknown',
        responseData.conversationId || 'unknown',
        false,
        responseValidation.error
      );

      return NextResponse.json(
        { 
          error: responseValidation.error,
          code: 'VALIDATION_INVALID_FORMAT',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const n8nResponse = responseValidation.data as N8NResponse;
    const { conversationId, userId, response, messageType, workflowType, metadata } = n8nResponse;

    const client = await pool.connect();
    
    try {
      // Insert AI response message
      const aiMessageResult = await client.query(
        `INSERT INTO messages (conversation_id, user_id, content, message_type, is_from_ai)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING *`,
        [conversationId, userId, response, messageType]
      );

      // Update conversation timestamp
      await client.query(
        'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
        [conversationId]
      );

      const aiMessage = aiMessageResult.rows[0];

      // Log successful webhook activity
      N8NWebhookMiddleware.logWebhookActivity(
        workflowType,
        userId,
        conversationId,
        true
      );

      // TODO: Emit WebSocket event for real-time updates
      // socket.emit('ai-response', { conversationId, message: aiMessage, metadata });

      return NextResponse.json({
        success: true,
        message: aiMessage,
        metadata: {
          confidence: metadata?.confidence,
          processingTime: metadata?.processingTime,
          tokensUsed: metadata?.tokensUsed,
          sources: metadata?.sources,
          actions: metadata?.actions,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Master brain webhook error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/n8n/webhook/master-brain',
      timestamp: new Date().toISOString()
    });
    
    N8NWebhookMiddleware.logWebhookActivity(
      'master-brain',
      'unknown',
      'unknown',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

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