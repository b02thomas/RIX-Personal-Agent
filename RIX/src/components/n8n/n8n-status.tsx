'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useN8NStore } from '@/store/n8n-store';

// Dynamic icon imports for N8N component
const Icons = {
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  XCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.XCircle })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  Activity: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Activity })), { ssr: false })
};

export function N8NStatus() {
  const { status, isLoading, error, checkStatus } = useN8NStore();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const getStatusIcon = (connected: boolean) => {
    if (isLoading) return <Icons.RefreshCw className="h-4 w-4 animate-spin" />;
    return connected ? <Icons.CheckCircle className="h-4 w-4 text-green-500" /> : <Icons.XCircle className="h-4 w-4 text-red-500" />;
  };

  const getWorkflowStatusIcon = (available: boolean) => {
    return available ? <Icons.CheckCircle className="h-3 w-3 text-green-500" /> : <Icons.XCircle className="h-3 w-3 text-red-500" />;
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  const getWorkflowDisplayName = (name: string) => {
    const names: Record<string, string> = {
      masterBrain: 'Master Brain',
      voiceProcessing: 'Voice Processing',
      newsIntelligence: 'News Intelligence',
      calendarIntelligence: 'Calendar Intelligence',
      taskManagement: 'Task Management',
      projectChatbot: 'Project Chatbot',
      morningBrief: 'Morning Brief',
      notifications: 'Notifications',
      analytics: 'Analytics',
    };
    return names[name] || name;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icons.Activity className="h-5 w-5" />
              N8N Integration Status
            </CardTitle>
            <CardDescription>
              Verbindung und Workflow-Status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={isLoading}
          >
            <Icons.RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-700">
              <Icons.AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {status && (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(status.connected)}
                <span className="font-medium">N8N Verbindung</span>
              </div>
              <Badge variant={status.connected ? 'default' : 'destructive'}>
                {status.connected ? 'Verbunden' : 'Nicht verbunden'}
              </Badge>
            </div>

            {status.connected && (
              <>
                {/* Connection Details */}
                <div className="text-sm text-muted-foreground">
                  <p><strong>URL:</strong> {status.url}</p>
                  <p><strong>Status:</strong> {status.message}</p>
                  <p><strong>Letzte Prüfung:</strong> {new Date(status.lastChecked).toLocaleString('de-DE')}</p>
                </div>

                {/* Workflow Status */}
                <div>
                  <h4 className="font-medium mb-3">Workflow Status</h4>
                  <div className="space-y-2">
                    {Object.entries(status.workflows).map(([name, workflow]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {getWorkflowStatusIcon(workflow.available)}
                          <span className="text-sm">{getWorkflowDisplayName(name)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {workflow.responseTime && (
                            <span>{formatResponseTime(workflow.responseTime)}</span>
                          )}
                          <Badge variant={workflow.available ? 'secondary' : 'destructive'} className="text-xs">
                            {workflow.available ? 'Verfügbar' : 'Nicht verfügbar'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!status.connected && (
              <div className="text-center py-4 text-muted-foreground">
                <Icons.AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>N8N ist nicht erreichbar</p>
                <p className="text-sm">Überprüfen Sie die Konfiguration und Netzwerkverbindung</p>
              </div>
            )}
          </div>
        )}

        {!status && !isLoading && !error && (
          <div className="text-center py-4 text-muted-foreground">
            <Icons.Activity className="h-8 w-8 mx-auto mb-2" />
            <p>Status wird geladen...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 