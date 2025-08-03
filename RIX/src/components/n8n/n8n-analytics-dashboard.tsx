'use client';

// /src/components/n8n/n8n-analytics-dashboard.tsx
// N8N workflow analytics and performance monitoring dashboard
// Displays execution history, performance metrics, and AI-triggered execution statistics
// RELEVANT FILES: main-agent/app/api/endpoints/n8n.py, src/store/n8n-store.ts, src/components/n8n/n8n-workflow-controls.tsx, src/app/dashboard/settings/page.tsx

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Dynamic icon imports for performance optimization
const Icons = {
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  TrendingDown: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingDown })), { ssr: false }),
  Activity: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Activity })), { ssr: false }),
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  XCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.XCircle })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false })
};

interface WorkflowAnalytics {
  summary: {
    total_executions: number;
    total_ai_triggered: number;
    avg_success_rate: number;
    avg_execution_time: number;
    period_start: string;
    period_end: string;
  };
  categories: Array<{
    category: string;
    workflow_count: number;
    active_count: number;
    total_executions: number;
    avg_success_rate: number;
  }>;
  top_performers: Array<{
    workflow_id: string;
    name: string;
    execution_count: number;
    success_rate: number;
    avg_execution_time: number;
    ai_triggered_count: number;
  }>;
  recent_executions: Array<{
    id: string;
    workflow_id: string;
    workflow_name: string;
    status: string;
    started_at: string;
    finished_at?: string;
    execution_time?: number;
    ai_triggered: boolean;
  }>;
  ai_triggered_stats: {
    total_ai_triggered: number;
    ai_triggered_percentage: number;
    avg_confidence: number;
  };
  period_days: number;
}

export function N8NAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(7);

  const loadAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/main-agent/n8n/analytics?days=${periodDays}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WorkflowAnalytics = await response.json();
      setAnalytics(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load analytics: ${message}`);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <Icons.CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <Icons.XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Icons.Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Icons.Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'text-green-600 bg-green-100 border-green-200';
      case 'intelligence': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'communication': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'automation': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'analytics': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.BarChart3 className="h-5 w-5" />
            Workflow Analytics
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">Laden...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-rix-bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Icons.AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Analytics nicht verfügbar</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                <Icons.BarChart3 className="h-5 w-5" />
                Workflow Analytics
              </CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Performance-Metriken für die letzten {analytics.period_days} Tage
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={periodDays.toString()}
                onChange={(e) => setPeriodDays(parseInt(e.target.value))}
                className={cn(
                  "w-32 px-3 py-2 rounded-md border",
                  "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
                )}
              >
                <option value="1">1 Tag</option>
                <option value="7">7 Tage</option>
                <option value="30">30 Tage</option>
                <option value="90">90 Tage</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAnalytics}
                disabled={isRefreshing}
                className="min-h-[36px] touch-manipulation"
              >
                <Icons.RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Aktualisieren
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-rix-border-primary bg-rix-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                <Icons.Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Gesamt Ausführungen</p>
                <p className="text-2xl font-bold text-rix-text-primary">{analytics.summary.total_executions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary bg-rix-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg dark:bg-green-900/20">
                <Icons.CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Erfolgsrate</p>
                <p className="text-2xl font-bold text-rix-text-primary">
                  {formatPercentage(analytics.summary.avg_success_rate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary bg-rix-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                <Icons.Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">KI-getriggert</p>
                <p className="text-2xl font-bold text-rix-text-primary">{analytics.ai_triggered_stats.total_ai_triggered}</p>
                <p className="text-xs text-rix-text-tertiary">
                  {formatPercentage(analytics.ai_triggered_stats.ai_triggered_percentage / 100)} aller Ausführungen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary bg-rix-surface">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                <Icons.Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Ø Ausführungszeit</p>
                <p className="text-2xl font-bold text-rix-text-primary">
                  {formatDuration(analytics.summary.avg_execution_time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Performance */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Target className="h-5 w-5" />
            Kategorien Performance
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            Workflow-Performance nach Kategorien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.categories.length === 0 ? (
              <div className="text-center py-8 text-rix-text-secondary">
                <Icons.BarChart3 className="h-12 w-12 mx-auto mb-4 text-rix-text-tertiary" />
                <p>Keine Kategorie-Daten verfügbar</p>
              </div>
            ) : (
              analytics.categories.map((category) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-4 border border-rix-border-primary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn("flex items-center gap-1", getCategoryColor(category.category))}
                    >
                      <Icons.Settings className="h-3 w-3" />
                      {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-rix-text-primary">
                        {category.workflow_count} Workflows ({category.active_count} aktiv)
                      </p>
                      <p className="text-xs text-rix-text-secondary">
                        {category.total_executions} Ausführungen
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-rix-text-primary">
                      {formatPercentage(category.avg_success_rate)}
                    </p>
                    <p className="text-xs text-rix-text-secondary">Erfolgsrate</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {analytics.top_performers.length > 0 && (
        <Card className="border-rix-border-primary bg-rix-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rix-text-primary">
              <Icons.TrendingUp className="h-5 w-5" />
              Top Performance Workflows
            </CardTitle>
            <CardDescription className="text-rix-text-secondary">
              Die erfolgreichsten Workflows in diesem Zeitraum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_performers.map((workflow, index) => (
                <div
                  key={workflow.workflow_id}
                  className="flex items-center gap-4 p-4 border border-rix-border-primary rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-rix-bg-secondary rounded-full">
                    <span className="text-sm font-medium text-rix-text-primary">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-rix-text-primary">{workflow.name}</p>
                    <div className="flex items-center gap-4 text-xs text-rix-text-secondary mt-1">
                      <span>{workflow.execution_count} Ausführungen</span>
                      <span>{formatPercentage(workflow.success_rate)} Erfolg</span>
                      <span>{formatDuration(workflow.avg_execution_time)} Ø Zeit</span>
                      {workflow.ai_triggered_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Icons.Brain className="h-3 w-3" />
                          {workflow.ai_triggered_count} KI-getriggert
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={workflow.success_rate > 0.9 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {formatPercentage(workflow.success_rate)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Executions */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Activity className="h-5 w-5" />
            Aktuelle Ausführungen
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            Die letzten Workflow-Ausführungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recent_executions.length === 0 ? (
              <div className="text-center py-8 text-rix-text-secondary">
                <Icons.Activity className="h-12 w-12 mx-auto mb-4 text-rix-text-tertiary" />
                <p>Keine aktuellen Ausführungen verfügbar</p>
              </div>
            ) : (
              analytics.recent_executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border border-rix-border-primary rounded-lg hover:bg-rix-bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <p className="text-sm font-medium text-rix-text-primary">
                        {execution.workflow_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-rix-text-secondary">
                        <span>{formatDate(execution.started_at)}</span>
                        {execution.execution_time && (
                          <span>• {formatDuration(execution.execution_time)}</span>
                        )}
                        {execution.ai_triggered && (
                          <Badge variant="outline" className="text-xs">
                            <Icons.Brain className="h-3 w-3 mr-1" />
                            KI-getriggert
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={execution.status === 'completed' ? 'default' : 
                            execution.status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {execution.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Trigger Statistics */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Brain className="h-5 w-5" />
            KI-getriggerte Ausführungen
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            Statistiken über automatische KI-gesteuerte Workflow-Ausführungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-rix-bg-secondary rounded-lg">
              <div className="p-3 bg-purple-100 rounded-lg inline-block mb-3 dark:bg-purple-900/20">
                <Icons.Zap className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-rix-text-primary mb-1">
                {analytics.ai_triggered_stats.total_ai_triggered}
              </p>
              <p className="text-sm text-rix-text-secondary">KI-getriggerte Ausführungen</p>
            </div>
            
            <div className="text-center p-6 bg-rix-bg-secondary rounded-lg">
              <div className="p-3 bg-blue-100 rounded-lg inline-block mb-3 dark:bg-blue-900/20">
                <Icons.Target className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-rix-text-primary mb-1">
                {formatPercentage(analytics.ai_triggered_stats.ai_triggered_percentage / 100)}
              </p>
              <p className="text-sm text-rix-text-secondary">Anteil aller Ausführungen</p>
            </div>
            
            <div className="text-center p-6 bg-rix-bg-secondary rounded-lg">
              <div className="p-3 bg-green-100 rounded-lg inline-block mb-3 dark:bg-green-900/20">
                <Icons.TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-rix-text-primary mb-1">
                {Math.round(analytics.ai_triggered_stats.avg_confidence * 100)}%
              </p>
              <p className="text-sm text-rix-text-secondary">Ø KI-Konfidenz</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}