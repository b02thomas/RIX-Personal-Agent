import { NextRequest, NextResponse } from 'next/server';
import { validateRefreshToken, createToken, createRefreshToken, createUserSession, deleteUserSession, getTokenExpirationTime } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { 
                    error: 'Refresh token nicht gefunden',
                    code: 'AUTH_TOKEN_INVALID',
                    timestamp: new Date().toISOString()
                },
                { status: 401 }
            );
        }

        // Verify refresh token against database
        const userData = await validateRefreshToken(refreshToken);

        if (!userData) {
            return NextResponse.json(
                { 
                    error: 'Ungültiger oder abgelaufener refresh token',
                    code: 'AUTH_REFRESH_INVALID',
                    timestamp: new Date().toISOString()
                },
                { status: 401 }
            );
        }

        // Generate new access token
        const newAccessToken = await createToken({
            userId: userData.userId,
            email: userData.email,
        });

        // Generate new refresh token (refresh token rotation for security)
        const newRefreshToken = await createRefreshToken({
            userId: userData.userId,
            email: userData.email,
        });

        // Delete old session and create new one
        await deleteUserSession(refreshToken);
        await createUserSession(userData.userId, newRefreshToken);

        // Calculate exact expiration time for frontend
        const tokenExpiration = getTokenExpirationTime(newAccessToken);
        
        const response = NextResponse.json({
            message: 'Token erfolgreich erneuert',
            accessToken: newAccessToken,
            tokenType: 'Bearer',
            expiresIn: 15 * 60, // 15 minutes in seconds
            tokenExpiresAt: tokenExpiration, // Exact expiration timestamp
            refreshedAt: new Date().toISOString(),
        });

        // Set new access token cookie with enhanced security
        response.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/',
            // Add additional security headers
            ...(process.env.NODE_ENV === 'production' && {
                domain: process.env.COOKIE_DOMAIN,
            })
        });
        
        // Add token to response header for client-side access
        response.headers.set('X-Access-Token', newAccessToken);
        response.headers.set('X-Token-Expires-At', tokenExpiration?.toString() || '');

        // Set new refresh token cookie (refresh token rotation)
        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/api/auth',
        });

        return response;
    } catch (error) {
        console.error('Refresh error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/auth/refresh',
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { 
                error: 'Ungültiger refresh token',
                code: 'AUTH_TOKEN_EXPIRED',
                timestamp: new Date().toISOString()
            },
            { status: 401 }
        );
    }
} 