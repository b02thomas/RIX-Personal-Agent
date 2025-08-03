import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById, createToken } from '@/lib/auth';

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

        // Verify refresh token
        const payload = await verifyToken(refreshToken);
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

        // Generate new access token
        const accessToken = await createToken({
            userId: user.id,
            email: user.email,
        });

        const response = NextResponse.json({
            message: 'Token erfolgreich erneuert',
            accessToken,
        });

        // Set new access token cookie
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60, // 15 minutes
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