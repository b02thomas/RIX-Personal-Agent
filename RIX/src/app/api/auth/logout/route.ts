import { NextRequest, NextResponse } from 'next/server';
import { deleteUserSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refreshToken')?.value;
        
        // Delete session from database if refresh token exists
        if (refreshToken) {
            try {
                await deleteUserSession(refreshToken);
            } catch (error) {
                console.warn('Could not delete session from database:', error);
                // Continue with logout even if database cleanup fails
            }
        }
        
        const response = NextResponse.json({
            message: 'Erfolgreich abgemeldet',
        });

        // Clear access token cookie
        response.cookies.set('accessToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        // Clear refresh token cookie
        response.cookies.set('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/api/auth',
        });

        return response;
    } catch (error) {
        console.error('Logout error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/auth/logout',
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { 
                error: 'Interner Serverfehler',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 