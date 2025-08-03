import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { createToken } from '@/lib/auth/jwt';
import { MockAuth } from '@/lib/mock-auth';

export async function POST(request: NextRequest) {
    try {
        const { email, password, firstName, lastName } = await request.json();

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

        // Mock-Auth oder echte Registrierung
        let user;
        try {
            user = await createUser(email, password, firstName, lastName);
        } catch (error: any) {
            if (error.message === 'User already exists') {
                return NextResponse.json(
                    { 
                        error: 'Benutzer existiert bereits',
                        code: 'AUTH_USER_EXISTS',
                        timestamp: new Date().toISOString()
                    },
                    { status: 409 }
                );
            }
            throw error;
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
            message: 'Benutzer erfolgreich erstellt',
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
        console.error('Signup error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/auth/signup',
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { 
                error: 'Fehler bei der Registrierung',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 