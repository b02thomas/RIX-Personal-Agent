// /src/app/api/auth/me/route.ts  
// Get current authenticated user endpoint with token refresh support
// Returns user information and handles token refresh if needed
// RELEVANT FILES: auth-store.ts, jwt.ts, use-session-manager.ts, middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createToken, getTokenExpirationTime, isTokenExpiringSoon, findUserById } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { 
                    error: 'Kein Zugriffstoken gefunden',
                    code: 'AUTH_TOKEN_MISSING',
                    timestamp: new Date().toISOString()
                },
                { status: 401 }
            );
        }

        // Verify current access token
        let payload;
        let needsRefresh = false;
        
        try {
            payload = await verifyToken(accessToken);
            
            // Check if token is expiring soon (within 5 minutes)
            needsRefresh = isTokenExpiringSoon(accessToken, 5);
        } catch (error) {
            // Token is invalid/expired
            return NextResponse.json(
                { 
                    error: 'Ungültiger oder abgelaufener Token',
                    code: 'AUTH_TOKEN_INVALID',
                    timestamp: new Date().toISOString()
                },
                { status: 401 }
            );
        }

        // Get user information
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

        // Prepare response
        const responseData = {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            },
            tokenExpiresAt: payload.exp * 1000, // Convert to milliseconds
            needsRefresh,
        };

        const response = NextResponse.json(responseData);

        // If token needs refresh, set a new access token
        if (needsRefresh) {
            try {
                const newAccessToken = await createToken({
                    userId: user.id,
                    email: user.email,
                });

                // Set new access token cookie
                response.cookies.set('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 15 * 60, // 15 minutes
                    path: '/',
                });

                // Update response with new token info
                const newTokenExpiration = getTokenExpirationTime(newAccessToken);
                if (newTokenExpiration) {
                    responseData.tokenExpiresAt = newTokenExpiration;
                    responseData.needsRefresh = false;
                }

                // Add header for client-side token extraction
                response.headers.set('X-Access-Token', newAccessToken);
            } catch (refreshError) {
                console.error('Token refresh during /me failed:', refreshError);
                // Continue with original token, let client handle refresh
            }
        }

        return response;

    } catch (error) {
        console.error('Get user info error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/auth/me',
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