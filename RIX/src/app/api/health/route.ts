import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        const startTime = Date.now();

        // Check database connection
        let dbStatus = 'error';
        let dbResponseTime = 0;

        try {
            const dbStartTime = Date.now();
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            dbResponseTime = Date.now() - dbStartTime;
            dbStatus = 'connected';
        } catch (error) {
            console.error('Database health check failed:', error);
            dbStatus = 'error';
        }

        // Check environment variables
        const envStatus = {
            database: !!process.env.DB_HOST && !!process.env.DB_NAME,
            jwt: !!process.env.JWT_SECRET,
            n8n: !!process.env.N8N_BASE_URL,
        };

        // Calculate overall response time
        const responseTime = Date.now() - startTime;

        // Determine overall health
        const isHealthy = dbStatus === 'connected' && Object.values(envStatus).every(Boolean);

        return NextResponse.json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            services: {
                database: {
                    status: dbStatus,
                    responseTime: `${dbResponseTime}ms`,
                },
                environment: {
                    status: Object.values(envStatus).every(Boolean) ? 'configured' : 'misconfigured',
                    variables: envStatus,
                },
            },
            version: '1.0.0',
            uptime: process.uptime(),
        }, {
            status: isHealthy ? 200 : 503,
        });
    } catch (error) {
        console.error('Health check error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/health',
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }, {
            status: 500,
        });
    }
} 