'use client';

// /src/components/n8n/n8n-workflow-manager.tsx
// Enhanced N8N workflow manager with comprehensive controls and monitoring
// Integrates workflow controls, analytics dashboard, and connection interface
// RELEVANT FILES: src/components/n8n/n8n-workflow-controls.tsx, src/components/n8n/n8n-analytics-dashboard.tsx, src/components/n8n/n8n-connection-interface.tsx, src/app/dashboard/settings/page.tsx

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { N8NConnectionInterface } from './n8n-connection-interface';
import { N8NWorkflowControls } from './n8n-workflow-controls';
import { N8NAnalyticsDashboard } from './n8n-analytics-dashboard';
import { cn } from '@/lib/utils';

// Dynamic icon imports for performance optimization
const Icons = {
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Activity: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Activity })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  Link: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Link })), { ssr: false }),
  Workflow: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Workflow })), { ssr: false })
};

interface N8NWorkflowManagerProps {
  onWorkflowSelect?: (workflow: any) => void;
  autoRefresh?: boolean;
}

export function N8NWorkflowManager({ onWorkflowSelect, autoRefresh = true }: N8NWorkflowManagerProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'workflows' | 'analytics'>('connection');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Workflow className="h-5 w-5" />
            N8N Workflow-Management
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">Laden...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-rix-bg-secondary rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Workflow className="h-5 w-5" />
            N8N Workflow-Management
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            Umfassende N8N Integration mit Workflow-Verwaltung und Analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 bg-rix-bg-secondary border border-rix-border-primary p-1 rounded-lg">
            <Button
              variant={activeTab === 'connection' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('connection')}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              <Icons.Link className="h-4 w-4 mr-2" />
              Verbindung
            </Button>
            <Button
              variant={activeTab === 'workflows' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('workflows')}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              <Icons.Settings className="h-4 w-4 mr-2" />
              Workflows
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('analytics')}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              <Icons.BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'connection' && (
        <div className="space-y-6">
          <N8NConnectionInterface />
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <N8NWorkflowControls />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <N8NAnalyticsDashboard />
        </div>
      )}
    </div>
  );
}