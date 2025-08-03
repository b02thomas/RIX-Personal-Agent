// /src/app/api/analytics/summary/route.ts
// Analytics summary API for dashboard metrics and performance insights
// Provides aggregated analytics data for routine performance trends and overall metrics
// RELEVANT FILES: /src/lib/auth.ts, /src/lib/database.ts, /src/app/dashboard/intelligence/page.tsx

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

interface AnalyticsSummary {
  overview: {
    totalRoutines: number;
    averageCompletionRate: number;
    averageConsistencyScore: number;
    trendsBreakdown: {
      improving: number;
      stable: number;
      declining: number;
    };
  };
  recentTrends: {
    last7Days: {
      averageCompletion: number;
      averageConsistency: number;
      trendDirection: 'up' | 'down' | 'stable';
    };
    last30Days: {
      averageCompletion: number;
      averageConsistency: number;
      trendDirection: 'up' | 'down' | 'stable';
    };
  };
  topPerformingRoutines: Array<{
    routineId: string;
    routineName: string;
    averageCompletion: number;
    averageConsistency: number;
    trend: string;
  }>;
  insights: Array<{
    type: 'improvement' | 'concern' | 'achievement';
    message: string;
    routineId?: string;
    routineName?: string;
  }>;
}

// GET - Retrieve analytics summary for dashboard
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
      // Get overview metrics
      const overviewQuery = `
        SELECT 
          COUNT(DISTINCT ra.routine_id) as total_routines,
          AVG(ra.completion_rate) as avg_completion_rate,
          AVG(ra.consistency_score) as avg_consistency_score,
          SUM(CASE WHEN ra.performance_trend = 'improving' THEN 1 ELSE 0 END) as improving_count,
          SUM(CASE WHEN ra.performance_trend = 'stable' THEN 1 ELSE 0 END) as stable_count,
          SUM(CASE WHEN ra.performance_trend = 'declining' THEN 1 ELSE 0 END) as declining_count
        FROM routine_analytics ra
        WHERE ra.user_id = $1
          AND ra.analysis_date >= CURRENT_DATE - INTERVAL '30 days'
      `;
      
      const overviewResult = await client.query(overviewQuery, [payload.userId]);
      const overview = overviewResult.rows[0];
      
      // Get recent trends (last 7 and 30 days)
      const recentTrendsQuery = `
        SELECT 
          CASE 
            WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'last_7_days'
            WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'last_30_days'
          END as period,
          AVG(ra.completion_rate) as avg_completion,
          AVG(ra.consistency_score) as avg_consistency
        FROM routine_analytics ra
        WHERE ra.user_id = $1
          AND ra.analysis_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY 
          CASE 
            WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'last_7_days'
            WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'last_30_days'
          END
      `;
      
      const trendsResult = await client.query(recentTrendsQuery, [payload.userId]);
      
      // Get trend directions by comparing periods
      const trendDirectionQuery = `
        WITH period_averages AS (
          SELECT 
            CASE 
              WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'recent'
              WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '14 days' AND ra.analysis_date < CURRENT_DATE - INTERVAL '7 days' THEN 'previous'
            END as period,
            AVG(ra.completion_rate) as avg_completion,
            AVG(ra.consistency_score) as avg_consistency
          FROM routine_analytics ra
          WHERE ra.user_id = $1
            AND ra.analysis_date >= CURRENT_DATE - INTERVAL '14 days'
          GROUP BY 
            CASE 
              WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'recent'
              WHEN ra.analysis_date >= CURRENT_DATE - INTERVAL '14 days' AND ra.analysis_date < CURRENT_DATE - INTERVAL '7 days' THEN 'previous'
            END
        )
        SELECT 
          recent.avg_completion as recent_completion,
          previous.avg_completion as previous_completion,
          recent.avg_consistency as recent_consistency,
          previous.avg_consistency as previous_consistency
        FROM 
          (SELECT * FROM period_averages WHERE period = 'recent') recent
        FULL OUTER JOIN 
          (SELECT * FROM period_averages WHERE period = 'previous') previous
        ON true
      `;
      
      const trendDirectionResult = await client.query(trendDirectionQuery, [payload.userId]);
      
      // Get top performing routines
      const topRoutinesQuery = `
        SELECT 
          ra.routine_id,
          r.name as routine_name,
          AVG(ra.completion_rate) as avg_completion,
          AVG(ra.consistency_score) as avg_consistency,
          ra.performance_trend
        FROM routine_analytics ra
        LEFT JOIN routines r ON ra.routine_id = r.id
        WHERE ra.user_id = $1
          AND ra.analysis_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ra.routine_id, r.name, ra.performance_trend
        ORDER BY AVG(ra.completion_rate) DESC, AVG(ra.consistency_score) DESC
        LIMIT 5
      `;
      
      const topRoutinesResult = await client.query(topRoutinesQuery, [payload.userId]);
      
      // Generate insights
      const insights: AnalyticsSummary['insights'] = [];
      
      // Check for achievements
      if (overview.avg_completion_rate >= 90) {
        insights.push({
          type: 'achievement',
          message: 'Excellent consistency! You\'re maintaining a 90%+ completion rate.'
        });
      }
      
      // Check for improvements
      if (overview.improving_count > overview.declining_count) {
        insights.push({
          type: 'improvement',
          message: `${overview.improving_count} routines are showing improvement trends.`
        });
      }
      
      // Check for concerns
      if (overview.declining_count > 0) {
        insights.push({
          type: 'concern',
          message: `${overview.declining_count} routines may need attention due to declining performance.`
        });
      }
      
      // Add routine-specific insights for top performers
      topRoutinesResult.rows.slice(0, 2).forEach(routine => {
        if (routine.avg_completion >= 95) {
          insights.push({
            type: 'achievement',
            message: `${routine.routine_name} is performing exceptionally well with ${Math.round(routine.avg_completion)}% completion rate.`,
            routineId: routine.routine_id,
            routineName: routine.routine_name
          });
        }
      });
      
      // Calculate trend directions
      const trendData = trendDirectionResult.rows[0];
      let last7DaysTrend: 'up' | 'down' | 'stable' = 'stable';
      let last30DaysTrend: 'up' | 'down' | 'stable' = 'stable';
      
      if (trendData) {
        const recentCompletion = trendData.recent_completion || 0;
        const previousCompletion = trendData.previous_completion || 0;
        
        if (recentCompletion > previousCompletion + 5) {
          last7DaysTrend = 'up';
        } else if (recentCompletion < previousCompletion - 5) {
          last7DaysTrend = 'down';
        }
      }
      
      // Build the summary response
      const summary: AnalyticsSummary = {
        overview: {
          totalRoutines: parseInt(overview.total_routines) || 0,
          averageCompletionRate: parseFloat(overview.avg_completion_rate) || 0,
          averageConsistencyScore: parseFloat(overview.avg_consistency_score) || 0,
          trendsBreakdown: {
            improving: parseInt(overview.improving_count) || 0,
            stable: parseInt(overview.stable_count) || 0,
            declining: parseInt(overview.declining_count) || 0
          }
        },
        recentTrends: {
          last7Days: {
            averageCompletion: trendsResult.rows.find(r => r.period === 'last_7_days')?.avg_completion || 0,
            averageConsistency: trendsResult.rows.find(r => r.period === 'last_7_days')?.avg_consistency || 0,
            trendDirection: last7DaysTrend
          },
          last30Days: {
            averageCompletion: trendsResult.rows.find(r => r.period === 'last_30_days')?.avg_completion || 0,
            averageConsistency: trendsResult.rows.find(r => r.period === 'last_30_days')?.avg_consistency || 0,
            trendDirection: last30DaysTrend
          }
        },
        topPerformingRoutines: topRoutinesResult.rows.map(row => ({
          routineId: row.routine_id,
          routineName: row.routine_name || 'Unknown Routine',
          averageCompletion: parseFloat(row.avg_completion),
          averageConsistency: parseFloat(row.avg_consistency),
          trend: row.performance_trend
        })),
        insights
      };
      
      return NextResponse.json({
        summary,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
          }
        }
      });
      
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Analytics summary error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}