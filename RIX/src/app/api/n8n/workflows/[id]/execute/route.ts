import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import { n8nClient } from '@/lib/n8n/client';

// POST /api/n8n/workflows/[id]/execute - Execute workflow
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const accessToken = request.cookies.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { 
                    error: 'Nicht authentifiziert',
                    code: 'AUTH_TOKEN_INVALID',
                    timestamp: new Date().toISOString()
                },
                { status: 401 }
            );
        }

        const payload = await verifyToken(accessToken);
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

        const workflowId = id;
        const body = await request.json();

        const execution = await n8nClient.executeWorkflow(workflowId, {
            userId: user.id,
            ...body,
        });

        return NextResponse.json({
            execution,
            message: 'Workflow erfolgreich ausgeführt',
        });
    } catch (error) {
        console.error('Execute workflow error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            endpoint: '/api/n8n/workflows/[id]/execute',
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { 
                error: 'Fehler beim Ausführen des Workflows',
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
} 