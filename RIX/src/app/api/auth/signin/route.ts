import { NextRequest, NextResponse } from 'next/server';
import { createToken, createRefreshToken, validateUser, createUserSession, getTokenExpirationTime } from '@/lib/auth';
import { MockAuth } from '@/lib/mock-auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { 
                    error: 'Email und Passwort sind erforderlich',
                    code: 'AUTH_MISSING_CREDENTIALS',
                    timestamp: new Date().toISOString()
                },
                { status: 400 }
            );
        }

        // Mock-Auth oder echte Validierung
        const user = await validateUser(email, password);

        if (!user) {
            return NextResponse.json(
                { 
                    error: 'Ungültige Anmeldedaten',
                    code: 'AUTH_INVALID_CREDENTIALS',
                    timestamp: new Date().toISOString()
                },
                { status: 401 }
            );
        }

        // Access token (15 minutes) und Refresh token (7 days) erstellen
        const accessToken = await createToken({
            userId: user.id,
            email: user.email,
        });
        
        const refreshToken = await createRefreshToken({
            userId: user.id,
            email: user.email,
        });

        // Session in der Datenbank erstellen
        if (MockAuth.isEnabled()) {
            await MockAuth.createSession(user.id);
        } else {
            await createUserSession(user.id, refreshToken);
        }

        // Calculate token expiration for frontend
        const tokenExpiration = getTokenExpirationTime(accessToken);
        
        // Response mit Token und Expiration info
        const response = NextResponse.json({
            message: 'Erfolgreich angemeldet',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
            },
            accessToken: accessToken,
            tokenType: 'Bearer',
            expiresIn: 15 * 60, // 15 minutes in seconds
            tokenExpiresAt: tokenExpiration, // Exact expiration timestamp
            loginAt: new Date().toISOString(),
        });

        // Access token cookie (15 minutes) with enhanced security
        response.cookies.set('accessToken', accessToken, {
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
        
        // Add token to response header for immediate client-side access
        response.headers.set('X-Access-Token', accessToken);
        response.headers.set('X-Token-Expires-At', tokenExpiration?.toString() || '');
        
        // Refresh token cookie (7 days)
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/api/auth',
        });

        return response;
    } catch (error) {
        console.error('Signin error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/auth/signin',
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { 
                error: 'Fehler bei der Anmeldung',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 