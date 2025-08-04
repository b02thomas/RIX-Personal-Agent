// /src/app/api/intelligence/goals/route.ts
// Intelligence goals API endpoint for frontend integration
// Provides goal data in the format expected by the intelligence dashboard
// RELEVANT FILES: /src/app/api/goals/route.ts, /src/lib/auth.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

// GET - Retrieve goals in intelligence dashboard format
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

    const client = await pool.connect();
    
    try {
      // Get user's goals with priority ordering
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
        WHERE user_id = $1
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
          END,
          CASE status
            WHEN 'active' THEN 1
            WHEN 'paused' THEN 2
            WHEN 'completed' THEN 3
          END,
          deadline ASC
        LIMIT 20
      `;
      
      const result = await client.query(query, [payload.userId]);
      
      // Transform to frontend format
      const goals = result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        category: row.category,
        target: row.target,
        current: row.current,
        unit: row.unit,
        deadline: row.deadline,
        priority: row.priority,
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString()
      }));
      
      return NextResponse.json(goals);
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Intelligence goals GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}