import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth/jwt';
import { validateUser } from '@/lib/auth/jwt';
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

        // Token erstellen
        const token = await createToken({
            userId: user.id,
            email: user.email,
        });

        // Mock-Session erstellen (falls Mock-Auth aktiv)
        if (MockAuth.isEnabled()) {
            await MockAuth.createSession(user.id);
        }

        // Response mit Token
        const response = NextResponse.json({
            message: 'Erfolgreich angemeldet',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
            },
        });

        // Cookie setzen
        response.cookies.set('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
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