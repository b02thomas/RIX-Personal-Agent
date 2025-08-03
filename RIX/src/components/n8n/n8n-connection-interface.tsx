'use client';

// /src/components/n8n/n8n-connection-interface.tsx
// N8N connection status and configuration interface
// Manages N8N instance connection settings, API keys, and connection testing
// RELEVANT FILES: src/components/n8n/n8n-status.tsx, src/store/n8n-store.ts, src/app/dashboard/settings/page.tsx, main-agent/app/api/endpoints/n8n.py

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useN8NStore } from '@/store/n8n-store';
import { cn } from '@/lib/utils';

// Dynamic icon imports for performance optimization
const Icons = {
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  XCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.XCircle })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  Eye: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Eye })), { ssr: false }),
  EyeOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.EyeOff })), { ssr: false }),
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false }),
  Key: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Key })), { ssr: false }),
  Link: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Link })), { ssr: false })
};

interface N8NConnectionConfig {
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export function N8NConnectionInterface() {
  const { status, isLoading, error, checkStatus } = useN8NStore();
  const [config, setConfig] = useState<N8NConnectionConfig>({
    baseUrl: process.env.NEXT_PUBLIC_N8N_BASE_URL || 'https://n8n.smb-ai-solution.com',
    apiKey: '',
    enabled: true,
    autoSync: true,
    syncInterval: 30
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem('n8n-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved N8N config:', error);
      }
    }
  }, []);

  const handleConfigChange = (field: keyof N8NConnectionConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null); // Clear test result when config changes
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test connection with current config
      const response = await fetch('/api/n8n/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey && { 'X-N8N-API-Key': config.apiKey })
        }
      });

      const data = await response.json();

      if (response.ok && data.connected) {
        setTestResult({
          success: true,
          message: `Verbindung erfolgreich! Response Time: ${data.response_time || 'N/A'}ms`
        });
        // Refresh the status in the store
        checkStatus();
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Verbindung fehlgeschlagen'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Verbindung konnte nicht getestet werden'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);

    try {
      // Save to localStorage
      localStorage.setItem('n8n-config', JSON.stringify(config));
      
      // If connection is enabled, test it
      if (config.enabled) {
        await testConnection();
      }

      setTestResult({
        success: true,
        message: 'Konfiguration gespeichert'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Fehler beim Speichern der Konfiguration'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = () => {
    if (!config.enabled) {
      return <Icons.XCircle className="h-5 w-5 text-gray-400" />;
    }
    if (isLoading || isTesting) {
      return <Icons.RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    }
    if (status?.connected) {
      return <Icons.CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Icons.XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (!config.enabled) return 'Deaktiviert';
    if (isLoading || isTesting) return 'Teste Verbindung...';
    if (status?.connected) return 'Verbunden';
    return 'Nicht verbunden';
  };

  const getStatusColor = () => {
    if (!config.enabled) return 'text-gray-500';
    if (isLoading || isTesting) return 'text-blue-500';
    if (status?.connected) return 'text-green-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Overview */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Link className="h-5 w-5" />
            N8N Verbindungsstatus
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            Aktuelle Verbindung zu Ihrer N8N Instance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-rix-bg-secondary rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className={cn("font-medium", getStatusColor())}>
                  {getStatusText()}
                </p>
                {status?.connected && (
                  <p className="text-sm text-rix-text-secondary">
                    {status.url} - {status.workflows ? Object.keys(status.workflows).length : 0} Workflows verfügbar
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={isTesting || !config.enabled}
                className="min-h-[36px] touch-manipulation"
              >
                <Icons.RefreshCw className={cn("h-4 w-4", isTesting && "animate-spin")} />
                {isTesting ? 'Teste...' : 'Test'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Configuration */}
      <Card className="border-rix-border-primary bg-rix-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rix-text-primary">
            <Icons.Settings className="h-5 w-5" />
            Verbindungseinstellungen
          </CardTitle>
          <CardDescription className="text-rix-text-secondary">
            Konfigurieren Sie Ihre N8N Instance Verbindung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable N8N */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-rix-text-primary">N8N Integration aktiviert</label>
              <p className="text-xs text-rix-text-secondary mt-1">
                Aktiviert die Verbindung zu N8N für Workflow-Automatisierung
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => handleConfigChange('enabled', enabled)}
            />
          </div>

          {config.enabled && (
            <>
              {/* Base URL Configuration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-rix-text-primary">N8N Base URL</label>
                <Input
                  type="url"
                  placeholder="https://n8n.example.com"
                  value={config.baseUrl}
                  onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                  className="bg-rix-surface border-rix-border-primary text-rix-text-primary"
                />
                <p className="text-xs text-rix-text-secondary">
                  Die URL Ihrer N8N Instance (ohne abschließenden Slash)
                </p>
              </div>

              {/* API Key Configuration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-rix-text-primary">API Key</label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="n8n_api_..."
                    value={config.apiKey}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    className="bg-rix-surface border-rix-border-primary text-rix-text-primary pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    {showApiKey ? <Icons.EyeOff className="h-4 w-4" /> : <Icons.Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-rix-text-secondary">
                  Ihr N8N API Key für authentifizierte Anfragen (optional)
                </p>
              </div>

              {/* Auto-Sync Configuration */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-rix-text-primary">Automatische Synchronisierung</label>
                  <p className="text-xs text-rix-text-secondary mt-1">
                    Workflows automatisch alle {config.syncInterval} Sekunden synchronisieren
                  </p>
                </div>
                <Switch
                  checked={config.autoSync}
                  onCheckedChange={(autoSync) => handleConfigChange('autoSync', autoSync)}
                />
              </div>

              {config.autoSync && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-rix-text-primary">Sync-Intervall (Sekunden)</label>
                  <Input
                    type="number"
                    min="10"
                    max="300"
                    value={config.syncInterval}
                    onChange={(e) => handleConfigChange('syncInterval', parseInt(e.target.value) || 30)}
                    className="bg-rix-surface border-rix-border-primary text-rix-text-primary w-32"
                  />
                  <p className="text-xs text-rix-text-secondary">
                    Wie oft die Workflow-Synchronisierung stattfinden soll (10-300 Sekunden)
                  </p>
                </div>
              )}
            </>
          )}

          {/* Test Result Display */}
          {testResult && (
            <div className={cn(
              "p-3 rounded-lg border",
              testResult.success 
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400"
            )}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Icons.CheckCircle className="h-4 w-4" />
                ) : (
                  <Icons.AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Save Configuration */}
          <div className="flex items-center gap-3 pt-4 border-t border-rix-border-primary">
            <Button
              onClick={saveConfiguration}
              disabled={isSaving || !config.baseUrl}
              className="min-h-[44px] touch-manipulation"
            >
              <Icons.Key className="h-4 w-4 mr-2" />
              {isSaving ? 'Speichere...' : 'Konfiguration speichern'}
            </Button>
            
            {config.enabled && (
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={isTesting || !config.baseUrl}
                className="min-h-[44px] touch-manipulation"
              >
                <Icons.Zap className="h-4 w-4 mr-2" />
                Verbindung testen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}