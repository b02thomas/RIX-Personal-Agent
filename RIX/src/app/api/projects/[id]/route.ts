// /src/app/api/projects/[id]/route.ts
// API routes for individual project operations (GET, PUT, DELETE)
// Handles project management with N8N MCP integration for AI features
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/projects/route.ts, /src/app/api/routines/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock projects data (shared with main route)
const mockProjects = [
  {
    id: 'project-1',
    userId: 'mock-user-1',
    name: 'Personal Productivity System',
    description: 'Building a comprehensive personal productivity workflow',
    status: 'active',
    priority: 'high',
    color: '#60A5FA',
    aiHealthScore: 85,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    tags: ['productivity', 'automation', 'AI'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// GET /api/projects/[id] - Get single project by ID
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

    if (MockAuth.isEnabled()) {
      const project = mockProjects.find(
        p => p.id === id && p.userId === payload.userId
      );

      if (!project) {
        return NextResponse.json(
          { 
            error: 'Projekt nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ project });
    }

    // In real mode, fetch from database
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

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
          id,
          name,
          description,
          status,
          priority,
          color,
          ai_health_score,
          start_date,
          end_date,
          tags,
          created_at,
          updated_at
        FROM projects 
        WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Projekt nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ project: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get project error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/projects/[id]',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden des Projekts',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
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
    const updateData = await request.json();

    // Validate input data
    const { name, description, status, priority, color, startDate, endDate, tags } = updateData;

    if (name && !name.trim()) {
      return NextResponse.json(
        { 
          error: 'Projektname darf nicht leer sein',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      const projectIndex = mockProjects.findIndex(
        p => p.id === id && p.userId === payload.userId
      );

      if (projectIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Projekt nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Update project with provided fields
      const updatedProject = {
        ...mockProjects[projectIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      mockProjects[projectIndex] = updatedProject;

      // TODO: Route to N8N MCP endpoint for updated AI health score calculation
      // This follows RIX PRD - pattern-based routing, no direct LLM calls

      return NextResponse.json({
        project: updatedProject,
        message: 'Projekt erfolgreich aktualisiert',
      });
    }

    // In real mode, update in database
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

    const client = await pool.connect();
    
    try {
      // Check if project exists and belongs to user
      const existsResult = await client.query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Projekt nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (name !== undefined) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        values.push(name);
      }
      if (description !== undefined) {
        paramCount++;
        updates.push(`description = $${paramCount}`);
        values.push(description);
      }
      if (status !== undefined) {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        values.push(status);
      }
      if (priority !== undefined) {
        paramCount++;
        updates.push(`priority = $${paramCount}`);
        values.push(priority);
      }
      if (color !== undefined) {
        paramCount++;
        updates.push(`color = $${paramCount}`);
        values.push(color);
      }
      if (startDate !== undefined) {
        paramCount++;
        updates.push(`start_date = $${paramCount}`);
        values.push(startDate);
      }
      if (endDate !== undefined) {
        paramCount++;
        updates.push(`end_date = $${paramCount}`);
        values.push(endDate);
      }
      if (tags !== undefined) {
        paramCount++;
        updates.push(`tags = $${paramCount}`);
        values.push(tags);
      }

      // Always update the updated_at timestamp
      paramCount++;
      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) { // Only updated_at was added
        return NextResponse.json(
          { 
            error: 'Keine Änderungen vorgenommen',
            code: 'NO_CHANGES',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Add WHERE clause parameters
      paramCount++;
      values.push(id);
      paramCount++;
      values.push(user.id);

      const query = `
        UPDATE projects 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      // TODO: Route to N8N MCP endpoint for AI health score recalculation
      // POST to /mcp/project-analysis with updated project data
      // This maintains RIX PRD compliance

      return NextResponse.json({
        project: result.rows[0],
        message: 'Projekt erfolgreich aktualisiert',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update project error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/projects/[id]',
      method: 'PUT',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren des Projekts',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
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

    if (MockAuth.isEnabled()) {
      const projectIndex = mockProjects.findIndex(
        p => p.id === id && p.userId === payload.userId
      );

      if (projectIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Projekt nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      mockProjects.splice(projectIndex, 1);

      return NextResponse.json({
        message: 'Projekt erfolgreich gelöscht',
      });
    }

    // In real mode, delete from database
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

    const client = await pool.connect();
    
    try {
      // Check if project exists and belongs to user
      const existsResult = await client.query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existsResult.rows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Projekt nicht gefunden',
            code: 'RESOURCE_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete project
      await client.query(
        'DELETE FROM projects WHERE id = $1',
        [id]
      );

      return NextResponse.json({
        message: 'Projekt erfolgreich gelöscht',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete project error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/projects/[id]',
      method: 'DELETE',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen des Projekts',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}