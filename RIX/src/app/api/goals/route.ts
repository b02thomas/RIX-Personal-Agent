// /src/app/api/goals/route.ts
// User goals CRUD API for goal tracking and management
// Handles creation, retrieval, and management of user goals with AI insights and progress tracking
// RELEVANT FILES: /src/lib/auth.ts, /src/lib/database.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

interface CreateGoalRequest {
  title: string;
  description?: string;
  category: 'productivity' | 'health' | 'learning' | 'career';
  target: number;
  unit: string;
  deadline: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  current?: number;
  status?: 'active' | 'completed' | 'paused';
  ai_insights?: Record<string, any>;
}

// GET - Retrieve user's goals with filtering and pagination
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
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    
    try {
      // Build query with filters
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [payload.userId];
      let paramIndex = 2;
      
      if (status && ['active', 'completed', 'paused'].includes(status)) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (category && ['productivity', 'health', 'learning', 'career'].includes(category)) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }
      
      if (priority && ['low', 'medium', 'high'].includes(priority)) {
        whereClause += ` AND priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM user_goals ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      
      // Get goals
      const query = `
        SELECT 
          id,
          title,
          description,
          category,
          target,
          current,
          unit,
          deadline,
          priority,
          status,
          ai_insights,
          metadata,
          created_at,
          updated_at
        FROM user_goals
        ${whereClause}
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
          END,
          deadline ASC,
          updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      const result = await client.query(query, params);
      
      const goals = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        target: row.target,
        current: row.current,
        unit: row.unit,
        deadline: row.deadline,
        priority: row.priority,
        status: row.status,
        progress: Math.min((row.current / row.target) * 100, 100),
        aiInsights: row.ai_insights || {},
        metadata: row.metadata || {},
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }));
      
      return NextResponse.json({
        data: goals,
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
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new goal
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
    const requestData: CreateGoalRequest = await request.json();
    
    // Validate required fields
    if (!requestData.title || !requestData.category || !requestData.target || !requestData.unit || !requestData.deadline) {
      return NextResponse.json(
        { error: 'Title, category, target, unit, and deadline are required' },
        { status: 400 }
      );
    }
    
    // Validate category
    if (!['productivity', 'health', 'learning', 'career'].includes(requestData.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: productivity, health, learning, career' },
        { status: 400 }
      );
    }
    
    // Validate priority if provided
    if (requestData.priority && !['low', 'medium', 'high'].includes(requestData.priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high' },
        { status: 400 }
      );
    }
    
    // Validate target
    if (requestData.target <= 0) {
      return NextResponse.json(
        { error: 'Target must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Validate deadline
    const deadlineDate = new Date(requestData.deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: 'Deadline must be a valid future date' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO user_goals (
          user_id,
          title,
          description,
          category,
          target,
          unit,
          deadline,
          priority,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING 
          id,
          title,
          description,
          category,
          target,
          current,
          unit,
          deadline,
          priority,
          status,
          ai_insights,
          metadata,
          created_at,
          updated_at
      `;
      
      const values = [
        payload.userId,
        requestData.title,
        requestData.description || '',
        requestData.category,
        requestData.target,
        requestData.unit,
        requestData.deadline,
        requestData.priority || 'medium',
        requestData.metadata || {}
      ];
      
      const result = await client.query(query, values);
      const createdGoal = result.rows[0];
      
      return NextResponse.json({
        id: createdGoal.id,
        title: createdGoal.title,
        description: createdGoal.description,
        category: createdGoal.category,
        target: createdGoal.target,
        current: createdGoal.current,
        unit: createdGoal.unit,
        deadline: createdGoal.deadline,
        priority: createdGoal.priority,
        status: createdGoal.status,
        progress: 0,
        aiInsights: createdGoal.ai_insights || {},
        metadata: createdGoal.metadata || {},
        createdAt: createdGoal.created_at.toISOString(),
        updatedAt: createdGoal.updated_at.toISOString()
      }, { status: 201 });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}