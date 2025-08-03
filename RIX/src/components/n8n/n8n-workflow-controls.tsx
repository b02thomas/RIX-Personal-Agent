'use client';

// /src/components/n8n/n8n-workflow-controls.tsx
// Enhanced workflow management with activation controls and AI-trigger settings
// Provides workflow discovery, activation/deactivation, and AI-triggered execution configuration
// RELEVANT FILES: main-agent/app/api/endpoints/n8n.py, src/store/n8n-store.ts, src/components/n8n/n8n-workflow-manager.tsx, src/app/dashboard/settings/page.tsx

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Dynamic icon imports for performance optimization
const Icons = {
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Play: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Play })), { ssr: false }),
  Pause: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Pause })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  Search: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Search })), { ssr: false }),
  Filter: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Filter })), { ssr: false }),
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false }),
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  XCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.XCircle })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  Tag: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Tag })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  Activity: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Activity })), { ssr: false })
};

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  version: string;
  description?: string;
  ai_trigger_enabled?: boolean;
  ai_trigger_confidence?: number;
  execution_count?: number;
  success_rate?: number;
  last_execution?: string;
}

interface WorkflowDiscoveryResponse {
  workflows: N8NWorkflow[];
  categories: Record<string, N8NWorkflow[]>;
  metrics?: Record<string, any>;
  total_count: number;
  active_count: number;
  stored_count: number;
}

export function N8NWorkflowControls() {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Load workflows from backend with discovery API
  const discoverWorkflows = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/main-agent/n8n/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          active_only: statusFilter === 'active',
          include_metrics: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WorkflowDiscoveryResponse = await response.json();
      setWorkflows(data.workflows || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(
        data.workflows.map(w => w.category || 'general').filter(Boolean)
      ));
      setCategories(uniqueCategories);

      setSyncStatus({ success: true, message: `${data.total_count} Workflows discovered, ${data.active_count} active` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to discover workflows: ${message}`);
      setSyncStatus({ success: false, message });
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  // Sync workflows from N8N instance
  const syncWorkflows = useCallback(async () => {
    setIsRefreshing(true);
    setSyncStatus(null);

    try {
      const response = await fetch('/api/main-agent/n8n/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          force_refresh: true,
          update_metadata: true,
          categorize_workflows: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSyncStatus({ success: data.success, message: data.message });
      
      // Refresh workflows after sync
      if (data.success) {
        await discoverWorkflows();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setSyncStatus({ success: false, message: `Sync failed: ${message}` });
    } finally {
      setIsRefreshing(false);
    }
  }, [discoverWorkflows]);

  // Activate/deactivate workflow
  const toggleWorkflowActivation = async (workflowId: string, targetStatus: boolean) => {
    try {
      const response = await fetch('/api/main-agent/n8n/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          active: targetStatus
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, active: data.new_status } : w
        ));
        setSyncStatus({ success: true, message: data.message });
      } else {
        setSyncStatus({ success: false, message: data.message });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setSyncStatus({ success: false, message: `Activation failed: ${message}` });
    }
  };

  useEffect(() => {
    discoverWorkflows();
  }, [discoverWorkflows]);

  // Filter workflows based on search and filters
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && workflow.active) ||
                         (statusFilter === 'inactive' && !workflow.active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return <Icons.CheckCircle className="h-4 w-4" />;
      case 'intelligence': return <Icons.Brain className="h-4 w-4" />;
      case 'communication': return <Icons.Activity className="h-4 w-4" />;
      case 'automation': return <Icons.Zap className="h-4 w-4" />;
      case 'analytics': return <Icons.TrendingUp className="h-4 w-4" />;
      default: return <Icons.Settings className="h-4 w-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Settings className="h-5 w-5" />
            Workflow-Verwaltung
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">Laden...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-rix-bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                <Icons.Settings className="h-5 w-5" />
                Workflow-Verwaltung
              </CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Workflows entdecken, aktivieren und konfigurieren
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => discoverWorkflows(true)}
                disabled={isRefreshing}
                className="min-h-[36px] touch-manipulation"
              >
                <Icons.RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Aktualisieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={syncWorkflows}
                disabled={isRefreshing}
                className="min-h-[36px] touch-manipulation"
              >
                <Icons.Zap className="h-4 w-4" />
                Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-rix-text-tertiary" />
                  <Input
                    placeholder="Workflows durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-rix-surface border-rix-border-primary text-rix-text-primary"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <Icons.Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-rix-text-tertiary" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={cn(
                    "w-full md:w-48 pl-10 pr-3 py-2 rounded-md border",
                    "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
                  )}
                >
                  <option value="all">Alle Kategorien</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  "w-full md:w-48 px-3 py-2 rounded-md border",
                  "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
                )}
              >
                <option value="all">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>

            {/* Sync Status */}
            {syncStatus && (
              <div className={cn(
                "p-3 rounded-lg border text-sm",
                syncStatus.success 
                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400"
                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400"
              )}>
                <div className="flex items-center gap-2">
                  {syncStatus.success ? (
                    <Icons.CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icons.AlertCircle className="h-4 w-4" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <Icons.AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows List */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="text-rix-text-primary">
            Workflows ({filteredWorkflows.length})
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            {filteredWorkflows.filter(w => w.active).length} aktiv, {filteredWorkflows.filter(w => !w.active).length} inaktiv
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWorkflows.length === 0 ? (
            <div className="text-center py-12 text-rix-text-secondary">
              <Icons.Search className="h-12 w-12 mx-auto mb-4 text-rix-text-tertiary" />
              <h3 className="text-lg font-medium mb-2">Keine Workflows gefunden</h3>
              <p className="text-sm">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Versuchen Sie andere Suchbegriffe oder Filter'
                  : 'Stellen Sie sicher, dass N8N verbunden ist und Workflows verfügbar sind'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-6 border border-rix-border-primary rounded-lg hover:bg-rix-bg-secondary/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Workflow Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-lg text-rix-text-primary">{workflow.name}</h4>
                        <Badge
                          variant={workflow.active ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {workflow.active ? (
                            <Icons.CheckCircle className="h-3 w-3" />
                          ) : (
                            <Icons.XCircle className="h-3 w-3" />
                          )}
                          {workflow.active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                        {workflow.category && (
                          <Badge
                            variant="outline"
                            className={cn("flex items-center gap-1", getCategoryColor(workflow.category))}
                          >
                            {getCategoryIcon(workflow.category)}
                            {workflow.category.charAt(0).toUpperCase() + workflow.category.slice(1)}
                          </Badge>
                        )}
                      </div>

                      {/* Workflow Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-rix-text-secondary mb-4">
                        <div className="flex items-center gap-1">
                          <Icons.Tag className="h-4 w-4" />
                          <span>{workflow.tags.length} Tags</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icons.Activity className="h-4 w-4" />
                          <span>{workflow.execution_count || 0} Ausführungen</span>
                        </div>
                        {workflow.success_rate !== undefined && (
                          <div className="flex items-center gap-1">
                            <Icons.TrendingUp className="h-4 w-4" />
                            <span>{Math.round(workflow.success_rate * 100)}% Erfolg</span>
                          </div>
                        )}
                        {workflow.last_execution && (
                          <div className="flex items-center gap-1">
                            <Icons.Clock className="h-4 w-4" />
                            <span>Zuletzt: {formatDate(workflow.last_execution)}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {workflow.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {workflow.tags.slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs text-rix-text-tertiary">
                              {tag}
                            </Badge>
                          ))}
                          {workflow.tags.length > 5 && (
                            <Badge variant="outline" className="text-xs text-rix-text-tertiary">
                              +{workflow.tags.length - 5} mehr
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* AI Trigger Configuration */}
                      <div className="flex items-center justify-between p-3 bg-rix-bg-secondary rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icons.Brain className="h-4 w-4 text-rix-text-tertiary" />
                          <span className="text-sm text-rix-text-primary">KI-automatische Ausführung</span>
                        </div>
                        <Switch
                          checked={workflow.ai_trigger_enabled || false}
                          onCheckedChange={(enabled) => {
                            // TODO: Implement AI trigger configuration
                            console.log(`AI trigger ${enabled ? 'enabled' : 'disabled'} for workflow:`, workflow.id);
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant={workflow.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleWorkflowActivation(workflow.id, !workflow.active)}
                        className="min-h-[36px] touch-manipulation"
                      >
                        {workflow.active ? (
                          <>
                            <Icons.Pause className="h-4 w-4 mr-2" />
                            Deaktivieren
                          </>
                        ) : (
                          <>
                            <Icons.Play className="h-4 w-4 mr-2" />
                            Aktivieren
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}