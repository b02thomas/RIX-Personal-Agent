// /src/app/api/intelligence/metrics/route.ts
// Intelligence metrics API for dashboard overview statistics
// Provides aggregated metrics for knowledge entries, goals, AI insights, and progress tracking
// RELEVANT FILES: /src/lib/vector-search.ts, /src/lib/auth.ts, /src/lib/database.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';
import { getKnowledgeMetrics } from '@/lib/vector-search';

interface IntelligenceMetrics {
  knowledgeItems: number;
  activeGoals: number;
  completedGoals: number;
  aiInsights: number;
  averageProgress: number;
}

// GET - Retrieve intelligence metrics for dashboard
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
      // Get knowledge metrics using vector search utility
      const knowledgeMetrics = await getKnowledgeMetrics(payload.userId);
      
      // Get goals metrics
      const goalsQuery = `
        SELECT 
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_goals,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals,
          AVG(CASE WHEN status = 'active' AND target > 0 THEN (current::DECIMAL / target::DECIMAL) * 100 ELSE NULL END) as avg_progress
        FROM user_goals 
        WHERE user_id = $1
      `;
      
      const goalsResult = await client.query(goalsQuery, [payload.userId]);
      const goalsData = goalsResult.rows[0];
      
      // Get AI insights count (recent insights from various sources)
      const insightsQuery = `
        SELECT 
          (
            SELECT COUNT(*) FROM routine_analytics 
            WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
          ) +
          (
            SELECT COUNT(*) FROM knowledge_entries 
            WHERE user_id = $1 AND type = 'insight' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
          ) as ai_insights_count
      `;
      
      const insightsResult = await client.query(insightsQuery, [payload.userId]);
      const aiInsightsCount = parseInt(insightsResult.rows[0].ai_insights_count) || 0;
      
      // Build metrics response
      const metrics: IntelligenceMetrics = {
        knowledgeItems: knowledgeMetrics.totalEntries,
        activeGoals: parseInt(goalsData.active_goals) || 0,
        completedGoals: parseInt(goalsData.completed_goals) || 0,
        aiInsights: aiInsightsCount,
        averageProgress: parseFloat(goalsData.avg_progress) || 0
      };
      
      return NextResponse.json(metrics);
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Intelligence metrics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}