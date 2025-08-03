// /src/app/api/goals/[id]/route.ts
// Individual goal API for detailed operations (get, update, delete, progress tracking)
// Handles single goal operations with AI insights integration and progress management
// RELEVANT FILES: /src/lib/auth.ts, /src/lib/database.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: 'productivity' | 'health' | 'learning' | 'career';
  target?: number;
  current?: number;
  unit?: string;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'paused';
  ai_insights?: Record<string, any>;
  metadata?: Record<string, any>;
}

// GET - Retrieve specific goal by ID
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
      // Get goal with access check
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
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await client.query(query, [id, payload.userId]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Goal not found or access denied' },
          { status: 404 }
        );
      }
      
      const goal = result.rows[0];
      
      return NextResponse.json({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        target: goal.target,
        current: goal.current,
        unit: goal.unit,
        deadline: goal.deadline,
        priority: goal.priority,
        status: goal.status,
        progress: Math.min((goal.current / goal.target) * 100, 100),
        daysRemaining: Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        aiInsights: goal.ai_insights || {},
        metadata: goal.metadata || {},
        createdAt: goal.created_at.toISOString(),
        updatedAt: goal.updated_at.toISOString()
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Goal GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH - Update specific goal
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
    const requestData: UpdateGoalRequest = await request.json();

    const client = await pool.connect();
    
    try {
      // Check if goal exists and belongs to user
      const checkQuery = 'SELECT target, current, status FROM user_goals WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [id, payload.userId]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Goal not found or access denied' },
          { status: 404 }
        );
      }
      
      const currentGoal = checkResult.rows[0];
      
      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [id, payload.userId];
      let paramIndex = 3;
      
      if (requestData.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(requestData.title);
        paramIndex++;
      }
      
      if (requestData.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(requestData.description);
        paramIndex++;
      }
      
      if (requestData.category !== undefined) {
        if (!['productivity', 'health', 'learning', 'career'].includes(requestData.category)) {
          return NextResponse.json(
            { error: 'Invalid category. Must be one of: productivity, health, learning, career' },
            { status: 400 }
          );
        }
        updateFields.push(`category = $${paramIndex}`);
        updateValues.push(requestData.category);
        paramIndex++;
      }
      
      if (requestData.target !== undefined) {
        if (requestData.target <= 0) {
          return NextResponse.json(
            { error: 'Target must be greater than 0' },
            { status: 400 }
          );
        }
        updateFields.push(`target = $${paramIndex}`);
        updateValues.push(requestData.target);
        paramIndex++;
      }
      
      if (requestData.current !== undefined) {
        if (requestData.current < 0) {
          return NextResponse.json(
            { error: 'Current progress cannot be negative' },
            { status: 400 }
          );
        }
        updateFields.push(`current = $${paramIndex}`);
        updateValues.push(requestData.current);
        paramIndex++;
        
        // Auto-complete goal if current >= target
        const newTarget = requestData.target !== undefined ? requestData.target : currentGoal.target;
        if (requestData.current >= newTarget && currentGoal.status === 'active') {
          updateFields.push(`status = $${paramIndex}`);
          updateValues.push('completed');
          paramIndex++;
        }
      }
      
      if (requestData.unit !== undefined) {
        updateFields.push(`unit = $${paramIndex}`);
        updateValues.push(requestData.unit);
        paramIndex++;
      }
      
      if (requestData.deadline !== undefined) {
        const deadlineDate = new Date(requestData.deadline);
        if (isNaN(deadlineDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid deadline date format' },
            { status: 400 }
          );
        }
        updateFields.push(`deadline = $${paramIndex}`);
        updateValues.push(requestData.deadline);
        paramIndex++;
      }
      
      if (requestData.priority !== undefined) {
        if (!['low', 'medium', 'high'].includes(requestData.priority)) {
          return NextResponse.json(
            { error: 'Invalid priority. Must be one of: low, medium, high' },
            { status: 400 }
          );
        }
        updateFields.push(`priority = $${paramIndex}`);
        updateValues.push(requestData.priority);
        paramIndex++;
      }
      
      if (requestData.status !== undefined) {
        if (!['active', 'completed', 'paused'].includes(requestData.status)) {
          return NextResponse.json(
            { error: 'Invalid status. Must be one of: active, completed, paused' },
            { status: 400 }
          );
        }
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(requestData.status);
        paramIndex++;
      }
      
      if (requestData.ai_insights !== undefined) {
        if (typeof requestData.ai_insights !== 'object' || requestData.ai_insights === null) {
          return NextResponse.json(
            { error: 'AI insights must be a valid JSON object' },
            { status: 400 }
          );
        }
        updateFields.push(`ai_insights = $${paramIndex}`);
        updateValues.push(requestData.ai_insights);
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
      
      // Always update the updated_at timestamp
      updateFields.push('updated_at = NOW()');
      
      if (updateFields.length === 1) { // Only updated_at was added
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }
      
      const query = `
        UPDATE user_goals 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
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
      
      const result = await client.query(query, updateValues);
      const updatedGoal = result.rows[0];
      
      return NextResponse.json({
        id: updatedGoal.id,
        title: updatedGoal.title,
        description: updatedGoal.description,
        category: updatedGoal.category,
        target: updatedGoal.target,
        current: updatedGoal.current,
        unit: updatedGoal.unit,
        deadline: updatedGoal.deadline,
        priority: updatedGoal.priority,
        status: updatedGoal.status,
        progress: Math.min((updatedGoal.current / updatedGoal.target) * 100, 100),
        daysRemaining: Math.ceil((new Date(updatedGoal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        aiInsights: updatedGoal.ai_insights || {},
        metadata: updatedGoal.metadata || {},
        createdAt: updatedGoal.created_at.toISOString(),
        updatedAt: updatedGoal.updated_at.toISOString()
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Goal PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific goal
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
      // Check if goal exists and belongs to user before deletion
      const checkQuery = 'SELECT id, title, status FROM user_goals WHERE id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [id, payload.userId]);
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Goal not found or access denied' },
          { status: 404 }
        );
      }
      
      const goalToDelete = checkResult.rows[0];
      
      // Delete the goal
      const deleteQuery = 'DELETE FROM user_goals WHERE id = $1 AND user_id = $2 RETURNING id';
      const deleteResult = await client.query(deleteQuery, [id, payload.userId]);
      
      if (deleteResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to delete goal' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Goal deleted successfully',
        deletedGoal: {
          id: goalToDelete.id,
          title: goalToDelete.title,
          status: goalToDelete.status
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Goal DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}