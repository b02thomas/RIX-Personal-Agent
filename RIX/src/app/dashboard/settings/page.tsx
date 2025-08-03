'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { N8NStatus } from '@/components/n8n/n8n-status';
import { N8NWorkflowManager } from '@/components/n8n/n8n-workflow-manager';
import { useAuthStore } from '@/store/auth-store';
import { usePreferencesStore } from '@/store/preferences-store';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance optimization
const Icons = {
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Bell: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Bell })), { ssr: false }),
  LogOut: dynamic(() => import('lucide-react').then(mod => ({ default: mod.LogOut })), { ssr: false }),
  Shield: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Shield })), { ssr: false }),
  Palette: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Palette })), { ssr: false }),
  Workflow: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Workflow })), { ssr: false }),
  Volume2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Volume2 })), { ssr: false }),
  Smartphone: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Smartphone })), { ssr: false }),
  Download: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Download })), { ssr: false }),
  Trash2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trash2 })), { ssr: false })
};

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { preferences, toggleNotification, setVoiceSettings, setPrivacySettings } = usePreferencesStore();
  const [activeTab, setActiveTab] = useState<'general' | 'n8n' | 'privacy'>('general');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        logout();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleWorkflowSelect = (workflow: any) => {
    console.log('Selected workflow:', workflow);
    // TODO: Implement workflow details view
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-rix-text-primary">Einstellungen & Integrationen</h1>
        <p className="text-rix-text-secondary">
          Verwalten Sie Ihre RIX Konfiguration, Preferences und Verbindungen
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-rix-surface border border-rix-border-primary p-1 rounded-lg">
        <Button
          variant={activeTab === 'general' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('general')}
          className="flex-1 min-h-[44px] touch-manipulation"
        >
          <Icons.Settings className="h-4 w-4 mr-2" />
          Allgemein
        </Button>
        <Button
          variant={activeTab === 'privacy' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('privacy')}
          className="flex-1 min-h-[44px] touch-manipulation"
        >
          <Icons.Shield className="h-4 w-4 mr-2" />
          Datenschutz
        </Button>
        <Button
          variant={activeTab === 'n8n' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('n8n')}
          className="flex-1 min-h-[44px] touch-manipulation"
        >
          <Icons.Workflow className="h-4 w-4 mr-2" />
          N8N
        </Button>
      </div>

      {activeTab === 'general' && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Settings */}
            <Card className="border-rix-border-primary bg-rix-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                  <Icons.User className="h-5 w-5" />
                  Profil
                </CardTitle>
                <CardDescription className="text-rix-text-secondary">
                  Ihre persönlichen Informationen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-rix-text-primary">Name</label>
                  <Input
                    value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    disabled
                    className="mt-1 bg-rix-bg-secondary border-rix-border-primary text-rix-text-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-rix-text-primary">E-Mail</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="mt-1 bg-rix-bg-secondary border-rix-border-primary text-rix-text-primary"
                  />
                </div>
                <Button variant="outline" className="w-full min-h-[44px] touch-manipulation">
                  Profil bearbeiten
                </Button>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card className="border-rix-border-primary bg-rix-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                  <Icons.Palette className="h-5 w-5" />
                  Erscheinungsbild
                </CardTitle>
                <CardDescription className="text-rix-text-secondary">
                  Theme und visuelle Einstellungen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-rix-text-primary">Theme</span>
                    <p className="text-xs text-rix-text-secondary">Aktuell: {preferences.theme}</p>
                  </div>
                  <ThemeToggle 
                    size="md" 
                    showLabel={false} 
                    showSystemOption={true}
                  />
                </div>
                <div className="border-t border-rix-border-primary pt-4">
                  <h4 className="text-sm font-medium text-rix-text-primary mb-3">Sprache</h4>
                  <select
                    value={preferences.language}
                    className={cn(
                      "w-full px-3 py-2 rounded-md border",
                      "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
                    )}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-rix-border-primary bg-rix-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                  <Icons.Bell className="h-5 w-5" />
                  Benachrichtigungen
                </CardTitle>
                <CardDescription className="text-rix-text-secondary">
                  Push-Benachrichtigungen und Alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icons.Smartphone className="h-4 w-4 text-rix-text-tertiary" />
                    <span className="text-sm text-rix-text-primary">Push-Benachrichtigungen</span>
                  </div>
                  <Switch
                    checked={preferences.notifications.push}
                    onCheckedChange={() => toggleNotification('push')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icons.Bell className="h-4 w-4 text-rix-text-tertiary" />
                    <span className="text-sm text-rix-text-primary">E-Mail Benachrichtigungen</span>
                  </div>
                  <Switch 
                    checked={preferences.notifications.email}
                    onCheckedChange={() => toggleNotification('email')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icons.Volume2 className="h-4 w-4 text-rix-text-tertiary" />
                    <span className="text-sm text-rix-text-primary">Voice Alerts</span>
                  </div>
                  <Switch
                    checked={preferences.notifications.voice}
                    onCheckedChange={() => toggleNotification('voice')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icons.Volume2 className="h-4 w-4 text-rix-text-tertiary" />
                    <span className="text-sm text-rix-text-primary">Sound</span>
                  </div>
                  <Switch
                    checked={preferences.notifications.sound}
                    onCheckedChange={() => toggleNotification('sound')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card className="border-rix-border-primary bg-rix-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                  <Icons.Volume2 className="h-5 w-5" />
                  Voice Settings
                </CardTitle>
                <CardDescription className="text-rix-text-secondary">
                  Sprachinteraktion und Transcription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-rix-text-primary">Voice aktiviert</span>
                  <Switch
                    checked={preferences.voice.enabled}
                    onCheckedChange={(enabled) => setVoiceSettings({ enabled })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-rix-text-primary">Auto-Transcription</span>
                  <Switch
                    checked={preferences.voice.autoTranscribe}
                    onCheckedChange={(autoTranscribe) => setVoiceSettings({ autoTranscribe })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-rix-text-primary mb-2 block">Voice Sprache</label>
                  <select
                    value={preferences.voice.language}
                    onChange={(e) => setVoiceSettings({ language: e.target.value as 'de' | 'en' })}
                    className={cn(
                      "w-full px-3 py-2 rounded-md border",
                      "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
                    )}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integrations */}
          <Card className="border-rix-border-primary bg-rix-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                <Icons.Settings className="h-5 w-5" />
                Integrationen
              </CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Externe Dienste und APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border border-rix-border-primary rounded-lg bg-rix-bg-secondary">
                  <h4 className="font-medium mb-2 text-rix-text-primary">Google Calendar</h4>
                  <p className="text-sm text-rix-text-secondary mb-3">
                    Kalender-Integration für Termin-Management
                  </p>
                  <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation">
                    Verbinden
                  </Button>
                </div>
                <div className="p-4 border border-rix-border-primary rounded-lg bg-rix-bg-secondary">
                  <h4 className="font-medium mb-2 text-rix-text-primary">Slack</h4>
                  <p className="text-sm text-rix-text-secondary mb-3">
                    Team-Kommunikation Integration
                  </p>
                  <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation">
                    Verbinden
                  </Button>
                </div>
                <div className="p-4 border border-rix-border-primary rounded-lg bg-rix-bg-secondary">
                  <h4 className="font-medium mb-2 text-rix-text-primary">Notion</h4>
                  <p className="text-sm text-rix-text-secondary mb-3">
                    Dokumenten-Management Integration
                  </p>
                  <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation">
                    Verbinden
                  </Button>
                </div>
                <div className="p-4 border border-rix-border-primary rounded-lg bg-rix-bg-secondary">
                  <h4 className="font-medium mb-2 text-rix-text-primary">Zapier</h4>
                  <p className="text-sm text-rix-text-secondary mb-3">
                    Automatisierung und Workflows
                  </p>
                  <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation">
                    Verbinden
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-rix-border-primary bg-rix-surface">
            <CardHeader>
              <CardTitle className="text-rix-text-primary">Konto-Aktionen</CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Erweiterte Konto-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation">
                <Icons.Download className="h-4 w-4 mr-2" />
                Daten exportieren
              </Button>
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                <Icons.Trash2 className="h-4 w-4 mr-2" />
                Konto löschen
              </Button>
              <Button 
                variant="destructive" 
                className="w-full min-h-[44px] touch-manipulation"
                onClick={handleLogout}
              >
                <Icons.LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Privacy Settings */}
          <Card className="border-rix-border-primary bg-rix-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                <Icons.Shield className="h-5 w-5" />
                Datenschutz & Sicherheit
              </CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Kontrollieren Sie Ihre Datenschutz-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-rix-text-primary">Datensammlung</span>
                    <p className="text-xs text-rix-text-secondary">Erlaubt RIX, Nutzungsdaten zu sammeln</p>
                  </div>
                  <Switch
                    checked={preferences.privacy.dataCollection}
                    onCheckedChange={(dataCollection) => setPrivacySettings({ dataCollection })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-rix-text-primary">Analytics</span>
                    <p className="text-xs text-rix-text-secondary">Anonyme Nutzungsstatistiken</p>
                  </div>
                  <Switch
                    checked={preferences.privacy.analytics}
                    onCheckedChange={(analytics) => setPrivacySettings({ analytics })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-rix-text-primary">Crash Reporting</span>
                    <p className="text-xs text-rix-text-secondary">Automatische Fehlerberichte senden</p>
                  </div>
                  <Switch
                    checked={preferences.privacy.crashReporting}
                    onCheckedChange={(crashReporting) => setPrivacySettings({ crashReporting })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="border-rix-border-primary bg-rix-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                <Icons.Shield className="h-5 w-5" />
                Sicherheit
              </CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Passwort und Authentifizierung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation">
                Passwort ändern
              </Button>
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation">
                Zwei-Faktor-Authentifizierung
              </Button>
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation">
                Aktive Sitzungen verwalten
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="border-rix-border-primary bg-rix-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rix-text-primary">
                <Icons.Download className="h-5 w-5" />
                Datenverwaltung
              </CardTitle>
              <CardDescription className="text-rix-text-secondary">
                Ihre Daten exportieren oder löschen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-rix-border-primary rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <h4 className="text-sm font-medium text-rix-text-primary mb-2">DSGVO Compliance</h4>
                <p className="text-xs text-rix-text-secondary">
                  RIX respektiert Ihre Datenschutzrechte. Sie können jederzeit eine Kopie Ihrer Daten anfordern 
                  oder die Löschung Ihres Kontos beantragen.
                </p>
              </div>
              <Button variant="outline" className="w-full min-h-[44px] touch-manipulation">
                <Icons.Download className="h-4 w-4 mr-2" />
                Meine Daten herunterladen
              </Button>
              <Button 
                variant="outline" 
                className="w-full min-h-[44px] touch-manipulation text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <Icons.Trash2 className="h-4 w-4 mr-2" />
                Alle Daten löschen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'n8n' && (
        <div className="space-y-6">
          {/* N8N Status */}
          <N8NStatus />

          {/* N8N Workflow Manager */}
          <N8NWorkflowManager onWorkflowSelect={handleWorkflowSelect} />
        </div>
      )}
    </div>
  );
} 