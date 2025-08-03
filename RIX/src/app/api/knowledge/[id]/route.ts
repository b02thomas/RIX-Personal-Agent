// /src/app/api/knowledge/[id]/route.ts
// Individual knowledge entry API for detailed operations (get, update, delete)
// Handles single knowledge entry operations with access tracking and validation
// RELEVANT FILES: /src/lib/vector-search.ts, /src/lib/auth.ts, /src/lib/database.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';
import { generateEmbedding, updateKnowledgeAccess } from '@/lib/vector-search';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Retrieve specific knowledge entry by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
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

    const client = await pool.connect();
    
    try {
      // Get knowledge entry with access check
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
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await client.query(query, [id, payload.userId]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Knowledge entry not found or access denied' },
          { status: 404 }
        );
      }
      
      const entry = result.rows[0];
      
      // Update access timestamp
      await updateKnowledgeAccess(id, payload.userId);
      
      return NextResponse.json({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        type: entry.type,
        relevance: parseFloat(entry.relevance),
        lastAccessed: new Date().toISOString(), // Updated access time
        tags: entry.tags || [],
        source: entry.source,
        metadata: entry.metadata || {},
        createdAt: entry.created_at.toISOString(),
        updatedAt: entry.updated_at.toISOString()
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Knowledge entry GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH - Update specific knowledge entry
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
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
    const requestData = await request.json();

    const client = await pool.connect();
    
    try {
      // Check if entry exists and belongs to user
      const checkQuery = 'SELECT title, content FROM knowledge_entries WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [id, payload.userId]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Knowledge entry not found or access denied' },
          { status: 404 }
        );
      }
      
      const currentEntry = checkResult.rows[0];
      
      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [id, payload.userId];
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
        if (typeof requestData.relevance !== 'number' || requestData.relevance < 0 || requestData.relevance > 1) {
          return NextResponse.json(
            { error: 'Relevance must be a number between 0 and 1' },
            { status: 400 }
          );
        }
        updateFields.push(`relevance = $${paramIndex}`);
        updateValues.push(requestData.relevance);
        paramIndex++;
      }
      
      if (requestData.tags !== undefined) {
        if (!Array.isArray(requestData.tags)) {
          return NextResponse.json(
            { error: 'Tags must be an array of strings' },
            { status: 400 }
          );
        }
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
        if (typeof requestData.metadata !== 'object' || requestData.metadata === null) {
          return NextResponse.json(
            { error: 'Metadata must be a valid JSON object' },
            { status: 400 }
          );
        }
        updateFields.push(`metadata = $${paramIndex}`);
        updateValues.push(requestData.metadata);
        paramIndex++;
      }
      
      // Update embedding if title or content changed
      if (requestData.title !== undefined || requestData.content !== undefined) {
        const newTitle = requestData.title !== undefined ? requestData.title : currentEntry.title;
        const newContent = requestData.content !== undefined ? requestData.content : currentEntry.content;
        
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
    console.error('Knowledge entry PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific knowledge entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
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

    const client = await pool.connect();
    
    try {
      // Check if entry exists and belongs to user before deletion
      const checkQuery = 'SELECT id, title FROM knowledge_entries WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [id, payload.userId]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Knowledge entry not found or access denied' },
          { status: 404 }
        );
      }
      
      const entryToDelete = checkResult.rows[0];
      
      // Delete the entry
      const deleteQuery = 'DELETE FROM knowledge_entries WHERE id = $1 AND user_id = $2 RETURNING id';
      const deleteResult = await client.query(deleteQuery, [id, payload.userId]);
      
      if (deleteResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to delete knowledge entry' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Knowledge entry deleted successfully',
        deletedEntry: {
          id: entryToDelete.id,
          title: entryToDelete.title
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Knowledge entry DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}