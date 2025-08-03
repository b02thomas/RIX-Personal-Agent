import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

// GET /api/n8n/status - Check n8n instance connectivity and workflow status
export async function GET(request: NextRequest) {
  try {
    const n8nUrl = process.env.N8N_BASE_URL || 'https://n8n.smb-ai-solution.com';
    
    if (!n8nUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'N8N Base URL nicht konfiguriert',
        connected: false,
        workflows: {}
      });
    }

    // Check basic connectivity
    let isConnected = false;
    let healthMessage = '';
    
    try {
      const healthUrl = `${n8nUrl}/healthz`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      isConnected = response.ok;
      healthMessage = isConnected ? 'N8N ist verfügbar' : `N8N Health Check fehlgeschlagen: ${response.status}`;
    } catch (error) {
      healthMessage = 'N8N nicht erreichbar';
      console.error('N8N health check error:', error);
    }

    // Check workflow endpoints if connected
    const workflowStatus = isConnected ? await checkWorkflowEndpoints(n8nUrl) : {};

    return NextResponse.json({
      status: isConnected ? 'connected' : 'error',
      message: healthMessage,
      connected: isConnected,
      url: n8nUrl,
      workflows: workflowStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('N8N status check error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: '/api/n8n/status',
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

async function checkWorkflowEndpoints(baseUrl: string) {
  const workflows = {
    masterBrain: '/webhook/master-brain-orchestrator',
    voiceProcessing: '/webhook/voice-processing-pipeline',
    newsIntelligence: '/webhook/news-intelligence-engine',
    calendarIntelligence: '/webhook/calendar-intelligence-system',
    taskManagement: '/webhook/task-management-automation',
    projectChatbot: '/webhook/project-chatbot-engine',
    morningBrief: '/webhook/morning-brief-generator',
    notifications: '/webhook/notification-management-system',
    analytics: '/webhook/analytics-learning-engine'
  };

  const status: Record<string, { available: boolean; responseTime?: number }> = {};

  for (const [name, endpoint] of Object.entries(workflows)) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(3000)
      });

      const responseTime = Date.now() - startTime;
      
      // Consider available if we get any response (even 400/500 means endpoint exists)
      status[name] = {
        available: true,
        responseTime
      };
    } catch (error) {
      status[name] = {
        available: false
      };
    }
  }

  return status;
} 