// /src/app/api/knowledge/route.ts
// Knowledge entries CRUD API for adaptive knowledge database
// Handles creation, retrieval, and management of user knowledge entries with vector embeddings
// RELEVANT FILES: /src/lib/vector-search.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';
import { generateEmbedding } from '@/lib/vector-search';

interface CreateKnowledgeRequest {
  title: string;
  content: string;
  type?: 'routine' | 'project' | 'calendar' | 'insight';
  tags?: string[];
  source?: string;
  relevance?: number;
  metadata?: Record<string, any>;
}

interface UpdateKnowledgeRequest extends Partial<CreateKnowledgeRequest> {
  id: string;
}

// GET - Retrieve user's knowledge entries with pagination
export async function GET(request: NextRequest) {
  try {
    // Extract token from cookie or Authorization header
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type');
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    
    try {
      // Build query with filters
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [payload.userId];
      let paramIndex = 2;
      
      if (type && ['routine', 'project', 'calendar', 'insight'].includes(type)) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM knowledge_entries ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      
      // Get knowledge entries
      const query = `
        SELECT 
          id,
          title,
          content,
          type,
          relevance,
          last_accessed,
          tags,
          source,
          metadata,
          created_at,
          updated_at
        FROM knowledge_entries
        ${whereClause}
        ORDER BY updated_at DESC, relevance DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      const result = await client.query(query, params);
      
      const knowledgeEntries = result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        relevance: parseFloat(row.relevance),
        lastAccessed: row.last_accessed.toISOString(),
        tags: row.tags || [],
        source: row.source,
        metadata: row.metadata || {},
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }));
      
      return NextResponse.json({
        data: knowledgeEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Knowledge entries GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new knowledge entry
export async function POST(request: NextRequest) {
  try {
    // Extract token from cookie or Authorization header
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
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
    const requestData: CreateKnowledgeRequest = await request.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Validate type if provided
    if (requestData.type && !['routine', 'project', 'calendar', 'insight'].includes(requestData.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: routine, project, calendar, insight' },
        { status: 400 }
      );
    }
    
    // Generate embedding from title and content
    const textContent = `${requestData.title} ${requestData.content}`;
    const embedding = generateEmbedding(textContent);
    const embeddingArray = `[${embedding.join(',')}]`;

    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO knowledge_entries (
          user_id,
          title,
          content,
          type,
          relevance,
          tags,
          source,
          embedding,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING 
          id,
          title,
          content,
          type,
          relevance,
          last_accessed,
          tags,
          source,
          metadata,
          created_at,
          updated_at
      `;
      
      const values = [
        payload.userId,
        requestData.title,
        requestData.content,
        requestData.type || 'insight',
        requestData.relevance || 0.5,
        requestData.tags || [],
        requestData.source || 'Manual Entry',
        embeddingArray,
        requestData.metadata || {}
      ];
      
      const result = await client.query(query, values);
      const createdEntry = result.rows[0];
      
      return NextResponse.json({
        id: createdEntry.id,
        title: createdEntry.title,
        content: createdEntry.content,
        type: createdEntry.type,
        relevance: parseFloat(createdEntry.relevance),
        lastAccessed: createdEntry.last_accessed.toISOString(),
        tags: createdEntry.tags || [],
        source: createdEntry.source,
        metadata: createdEntry.metadata || {},
        createdAt: createdEntry.created_at.toISOString(),
        updatedAt: createdEntry.updated_at.toISOString()
      }, { status: 201 });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Knowledge entry POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing knowledge entry
export async function PUT(request: NextRequest) {
  try {
    // Extract token from cookie or Authorization header
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
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
    const requestData: UpdateKnowledgeRequest = await request.json();
    
    // Validate required fields
    if (!requestData.id) {
      return NextResponse.json(
        { error: 'Knowledge entry ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Check if entry exists and belongs to user
      const checkQuery = 'SELECT id FROM knowledge_entries WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [requestData.id, payload.userId]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Knowledge entry not found or access denied' },
          { status: 404 }
        );
      }
      
      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [requestData.id, payload.userId];
      let paramIndex = 3;
      
      if (requestData.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(requestData.title);
        paramIndex++;
      }
      
      if (requestData.content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        updateValues.push(requestData.content);
        paramIndex++;
      }
      
      if (requestData.type !== undefined) {
        if (!['routine', 'project', 'calendar', 'insight'].includes(requestData.type)) {
          return NextResponse.json(
            { error: 'Invalid type. Must be one of: routine, project, calendar, insight' },
            { status: 400 }
          );
        }
        updateFields.push(`type = $${paramIndex}`);
        updateValues.push(requestData.type);
        paramIndex++;
      }
      
      if (requestData.relevance !== undefined) {
        updateFields.push(`relevance = $${paramIndex}`);
        updateValues.push(requestData.relevance);
        paramIndex++;
      }
      
      if (requestData.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`);
        updateValues.push(requestData.tags);
        paramIndex++;
      }
      
      if (requestData.source !== undefined) {
        updateFields.push(`source = $${paramIndex}`);
        updateValues.push(requestData.source);
        paramIndex++;
      }
      
      if (requestData.metadata !== undefined) {
        updateFields.push(`metadata = $${paramIndex}`);
        updateValues.push(requestData.metadata);
        paramIndex++;
      }
      
      // Update embedding if title or content changed
      if (requestData.title !== undefined || requestData.content !== undefined) {
        // Get current entry to build new embedding
        const currentQuery = 'SELECT title, content FROM knowledge_entries WHERE id = $1';
        const currentResult = await client.query(currentQuery, [requestData.id]);
        const current = currentResult.rows[0];
        
        const newTitle = requestData.title !== undefined ? requestData.title : current.title;
        const newContent = requestData.content !== undefined ? requestData.content : current.content;
        
        const textContent = `${newTitle} ${newContent}`;
        const embedding = generateEmbedding(textContent);
        const embeddingArray = `[${embedding.join(',')}]`;
        
        updateFields.push(`embedding = $${paramIndex}`);
        updateValues.push(embeddingArray);
        paramIndex++;
      }
      
      // Always update the updated_at timestamp
      updateFields.push('updated_at = NOW()');
      
      if (updateFields.length === 1) { // Only updated_at was added
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }
      
      const query = `
        UPDATE knowledge_entries 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING 
          id,
          title,
          content,
          type,
          relevance,
          last_accessed,
          tags,
          source,
          metadata,
          created_at,
          updated_at
      `;
      
      const result = await client.query(query, updateValues);
      const updatedEntry = result.rows[0];
      
      return NextResponse.json({
        id: updatedEntry.id,
        title: updatedEntry.title,
        content: updatedEntry.content,
        type: updatedEntry.type,
        relevance: parseFloat(updatedEntry.relevance),
        lastAccessed: updatedEntry.last_accessed.toISOString(),
        tags: updatedEntry.tags || [],
        source: updatedEntry.source,
        metadata: updatedEntry.metadata || {},
        createdAt: updatedEntry.created_at.toISOString(),
        updatedAt: updatedEntry.updated_at.toISOString()
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Knowledge entry PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}