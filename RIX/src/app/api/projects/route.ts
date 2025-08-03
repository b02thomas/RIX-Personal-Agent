// /src/app/api/projects/route.ts
// API routes for project CRUD operations in RIX Personal Agent
// Provides complete project management with N8N MCP routing for AI features
// RELEVANT FILES: /src/lib/database.ts, /src/lib/auth.ts, /src/app/api/routines/route.ts, /src/app/api/calendar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import pool from '@/lib/database';
import { MockAuth } from '@/lib/mock-auth';

// Mock projects data for development
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
  },
  {
    id: 'project-2',
    userId: 'mock-user-1',
    name: 'Learning & Development',
    description: 'Continuous learning goals and skill development tracking',
    status: 'active',
    priority: 'medium',
    color: '#34D399',
    aiHealthScore: 72,
    startDate: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
    tags: ['learning', 'development', 'skills'],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// GET /api/projects - Get all projects for user
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

    // Extract query parameters for filtering and pagination
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // In mock mode, return filtered mock projects
    if (MockAuth.isEnabled()) {
      let filteredProjects = mockProjects.filter(
        project => project.userId === payload.userId
      );

      // Apply filters
      if (status) {
        filteredProjects = filteredProjects.filter(project => project.status === status);
      }
      if (priority) {
        filteredProjects = filteredProjects.filter(project => project.priority === priority);
      }

      // Apply pagination
      const paginatedProjects = filteredProjects.slice(offset, offset + limit);

      return NextResponse.json({
        projects: paginatedProjects,
        total: filteredProjects.length,
        limit,
        offset,
      });
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
      // Build dynamic query with filters
      let query = `
        SELECT 
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
        WHERE user_id = $1
      `;
      const params = [user.id];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      if (priority) {
        paramCount++;
        query += ` AND priority = $${paramCount}`;
        params.push(priority);
      }

      query += ` ORDER BY updated_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit.toString(), offset.toString());

      const result = await client.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM projects WHERE user_id = $1';
      const countParams = [user.id];
      let countParamCount = 1;

      if (status) {
        countParamCount++;
        countQuery += ` AND status = $${countParamCount}`;
        countParams.push(status);
      }
      
      if (priority) {
        countParamCount++;
        countQuery += ` AND priority = $${countParamCount}`;
        countParams.push(priority);
      }

      const countResult = await client.query(countQuery, countParams);

      return NextResponse.json({
        projects: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get projects error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/projects',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Laden der Projekte',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
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
    const projectData = await request.json();

    // Validate required fields
    const { name, description, status, priority, color, startDate, endDate, tags } = projectData;

    if (!name) {
      return NextResponse.json(
        { 
          error: 'Projektname ist erforderlich',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (MockAuth.isEnabled()) {
      const newProject = {
        id: `project-${Date.now()}`,
        userId: payload.userId,
        name,
        description: description || '',
        status: status || 'active',
        priority: priority || 'medium',
        color: color || '#60A5FA',
        aiHealthScore: 0, // Will be calculated by N8N MCP endpoint
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || null,
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockProjects.push(newProject);

      // TODO: Route to N8N MCP endpoint for AI health score calculation
      // This follows RIX PRD - no direct LLM integration, only routing

      return NextResponse.json({
        project: newProject,
        message: 'Projekt erfolgreich erstellt',
      });
    }

    // In real mode, create in database
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
        `INSERT INTO projects (
          user_id, name, description, status, priority, color, 
          start_date, end_date, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          user.id,
          name,
          description || '',
          status || 'active',
          priority || 'medium',
          color || '#60A5FA',
          startDate || null,
          endDate || null,
          tags || []
        ]
      );

      const newProject = result.rows[0];

      // TODO: Route to N8N MCP endpoint for initial AI health score calculation
      // POST to /mcp/project-analysis with project data
      // This maintains RIX PRD compliance - no direct LLM calls

      return NextResponse.json({
        project: newProject,
        message: 'Projekt erfolgreich erstellt',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create project error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/projects',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Projekts',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}