import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { N8NWebhookMiddleware } from '@/lib/n8n/middleware';
import { N8NResponse } from '@/lib/n8n/client';

// POST /api/n8n/webhook/news-intelligence - Receive news intelligence updates
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
        'news-intelligence',
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
      // Insert news intelligence message
      const newsMessageResult = await client.query(
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

      const newsMessage = newsMessageResult.rows[0];

      // Log successful webhook activity
      N8NWebhookMiddleware.logWebhookActivity(
        workflowType,
        userId,
        conversationId,
        true
      );

      // TODO: Emit WebSocket event for real-time updates
      // socket.emit('news-intelligence', { conversationId, message: newsMessage, metadata });

      return NextResponse.json({
        success: true,
        message: newsMessage,
        metadata: {
          confidence: metadata?.confidence,
          processingTime: metadata?.processingTime,
          sources: metadata?.sources,
          categories: metadata?.categories,
          sentiment: metadata?.sentiment,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('News intelligence webhook error:', error);
    
    N8NWebhookMiddleware.logWebhookActivity(
      'news-intelligence',
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