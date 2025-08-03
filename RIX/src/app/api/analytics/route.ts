// /src/app/api/analytics/route.ts
// Routine analytics API for performance tracking and optimization insights
// Provides analytics data for routine performance, trends, and AI-powered recommendations
// RELEVANT FILES: /src/lib/auth.ts, /src/lib/database.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

interface CreateAnalyticsRequest {
  routine_id: string;
  analysis_date: string;
  completion_rate: number;
  consistency_score: number;
  performance_trend: 'improving' | 'declining' | 'stable';
  insights?: Record<string, any>;
  recommendations?: Record<string, any>;
  metadata?: Record<string, any>;
}

// GET - Retrieve routine analytics with filtering
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
    const routineId = searchParams.get('routine_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const trend = searchParams.get('trend');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const client = await pool.connect();
    
    try {
      // Build query with filters
      let whereClause = 'WHERE ra.user_id = $1';
      const params: any[] = [payload.userId];
      let paramIndex = 2;
      
      if (routineId) {
        whereClause += ` AND ra.routine_id = $${paramIndex}`;
        params.push(routineId);
        paramIndex++;
      }
      
      if (fromDate) {
        whereClause += ` AND ra.analysis_date >= $${paramIndex}`;
        params.push(fromDate);
        paramIndex++;
      }
      
      if (toDate) {
        whereClause += ` AND ra.analysis_date <= $${paramIndex}`;
        params.push(toDate);
        paramIndex++;
      }
      
      if (trend && ['improving', 'declining', 'stable'].includes(trend)) {
        whereClause += ` AND ra.performance_trend = $${paramIndex}`;
        params.push(trend);
        paramIndex++;
      }
      
      // Get analytics with routine information
      const query = `
        SELECT 
          ra.id,
          ra.routine_id,
          ra.analysis_date,
          ra.completion_rate,
          ra.consistency_score,
          ra.performance_trend,
          ra.insights,
          ra.recommendations,
          ra.metadata,
          ra.created_at,
          r.name as routine_name,
          r.description as routine_description,
          r.frequency as routine_frequency
        FROM routine_analytics ra
        LEFT JOIN routines r ON ra.routine_id = r.id
        ${whereClause}
        ORDER BY ra.analysis_date DESC, ra.created_at DESC
        LIMIT $${paramIndex}
      `;
      
      params.push(limit);
      const result = await client.query(query, params);
      
      const analytics = result.rows.map(row => ({
        id: row.id,
        routineId: row.routine_id,
        analysisDate: row.analysis_date,
        completionRate: parseFloat(row.completion_rate),
        consistencyScore: parseFloat(row.consistency_score),
        performanceTrend: row.performance_trend,
        insights: row.insights || {},
        recommendations: row.recommendations || {},
        metadata: row.metadata || {},
        createdAt: row.created_at.toISOString(),
        routine: {
          name: row.routine_name,
          description: row.routine_description,
          frequency: row.routine_frequency
        }
      }));
      
      return NextResponse.json({
        data: analytics,
        summary: {
          totalRecords: analytics.length,
          filters: {
            routineId,
            fromDate,
            toDate,
            trend,
            limit
          }
        }
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new analytics entry
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
    const requestData: CreateAnalyticsRequest = await request.json();
    
    // Validate required fields
    if (!requestData.routine_id || !requestData.analysis_date || 
        requestData.completion_rate === undefined || requestData.consistency_score === undefined ||
        !requestData.performance_trend) {
      return NextResponse.json(
        { error: 'routine_id, analysis_date, completion_rate, consistency_score, and performance_trend are required' },
        { status: 400 }
      );
    }
    
    // Validate completion_rate and consistency_score ranges
    if (requestData.completion_rate < 0 || requestData.completion_rate > 100) {
      return NextResponse.json(
        { error: 'completion_rate must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    if (requestData.consistency_score < 0 || requestData.consistency_score > 100) {
      return NextResponse.json(
        { error: 'consistency_score must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Validate performance_trend
    if (!['improving', 'declining', 'stable'].includes(requestData.performance_trend)) {
      return NextResponse.json(
        { error: 'Invalid performance_trend. Must be one of: improving, declining, stable' },
        { status: 400 }
      );
    }
    
    // Validate date format
    const analysisDate = new Date(requestData.analysis_date);
    if (isNaN(analysisDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid analysis_date format' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Verify routine exists and belongs to user
      const routineCheck = await client.query(
        'SELECT id FROM routines WHERE id = $1 AND user_id = $2',
        [requestData.routine_id, payload.userId]
      );
      
      if (routineCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Routine not found or access denied' },
          { status: 404 }
        );
      }
      
      // Check if analytics for this routine and date already exists
      const existingCheck = await client.query(
        'SELECT id FROM routine_analytics WHERE user_id = $1 AND routine_id = $2 AND analysis_date = $3',
        [payload.userId, requestData.routine_id, requestData.analysis_date]
      );
      
      if (existingCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Analytics entry for this routine and date already exists' },
          { status: 409 }
        );
      }
      
      const query = `
        INSERT INTO routine_analytics (
          user_id,
          routine_id,
          analysis_date,
          completion_rate,
          consistency_score,
          performance_trend,
          insights,
          recommendations,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING 
          id,
          routine_id,
          analysis_date,
          completion_rate,
          consistency_score,
          performance_trend,
          insights,
          recommendations,
          metadata,
          created_at
      `;
      
      const values = [
        payload.userId,
        requestData.routine_id,
        requestData.analysis_date,
        requestData.completion_rate,
        requestData.consistency_score,
        requestData.performance_trend,
        requestData.insights || {},
        requestData.recommendations || {},
        requestData.metadata || {}
      ];
      
      const result = await client.query(query, values);
      const createdAnalytics = result.rows[0];
      
      return NextResponse.json({
        id: createdAnalytics.id,
        routineId: createdAnalytics.routine_id,
        analysisDate: createdAnalytics.analysis_date,
        completionRate: parseFloat(createdAnalytics.completion_rate),
        consistencyScore: parseFloat(createdAnalytics.consistency_score),
        performanceTrend: createdAnalytics.performance_trend,
        insights: createdAnalytics.insights || {},
        recommendations: createdAnalytics.recommendations || {},
        metadata: createdAnalytics.metadata || {},
        createdAt: createdAnalytics.created_at.toISOString()
      }, { status: 201 });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}