'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { N8NWorkflowManager } from '@/components/n8n/n8n-workflow-manager';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Mic, 
  Calendar, 
  BarChart3, 
  Newspaper, 
  Settings,
  LogOut,
  User
} from 'lucide-react';

interface DashboardModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'active' | 'inactive' | 'development';
}

const dashboardModules: DashboardModule[] = [
  {
    id: 'voice-chat',
    name: 'RIX Voice Hub',
    description: 'Natürliche Sprachinteraktion mit Ihrem AI Assistenten',
    icon: Mic,
    color: 'text-blue-600',
    status: 'development'
  },
  {
    id: 'projects',
    name: 'Projekt Management',
    description: 'Organisieren und verwalten Sie Ihre Projekte effektiv',
    icon: Brain,
    color: 'text-indigo-600',
    status: 'active'
  },
  {
    id: 'tasks',
    name: 'Aufgaben verwalten',
    description: 'Intelligente Aufgabenverwaltung mit Priorisierung',
    icon: Settings,
    color: 'text-green-600',
    status: 'active'
  },
  {
    id: 'calendar',
    name: 'Smart Calendar',
    description: 'Intelligente Terminverwaltung und Zeitplanung',
    icon: Calendar,
    color: 'text-blue-600',
    status: 'development'
  },
  {
    id: 'intelligence',
    name: 'Intelligence Overview',
    description: 'AI-gestützte Einblicke und Produktivitätsanalyse',
    icon: BarChart3,
    color: 'text-purple-600',
    status: 'development'
  },
  {
    id: 'news',
    name: 'News Intelligence',
    description: 'Personalisierte Nachrichten und Trendanalyse',
    icon: Newspaper,
    color: 'text-orange-600',
    status: 'development'
  },
  {
    id: 'n8n',
    name: 'N8N Workflows',
    description: 'Workflow-Management und Automatisierung',
    icon: Brain,
    color: 'text-indigo-600',
    status: 'active'
  },
  {
    id: 'settings',
    name: 'Settings & Integrations',
    description: 'Umfassende Konfiguration und Drittanbieter-Integrationen',
    icon: Settings,
    color: 'text-gray-600',
    status: 'development'
  }
];

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Mock user data for development
    setUser({
      id: 'mock-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    });
  }, []);

  const handleModuleClick = (moduleId: string) => {
    // Navigate to the corresponding route instead of setting active module
    const moduleRoutes: Record<string, string> = {
      'projects': '/dashboard/projects',
      'tasks': '/dashboard/tasks',
      'routines': '/dashboard/routines',
      'calendar': '/dashboard/calendar',
      'intelligence': '/dashboard/intelligence',
      'news': '/dashboard/news',
      'voice-chat': '/dashboard/voice',
      'settings': '/dashboard/settings'
    };
    
    if (moduleRoutes[moduleId]) {
      window.location.href = moduleRoutes[moduleId];
    } else {
      setActiveModule(moduleId);
    }
  };

  const handleLogout = () => {
    // Mock logout
    window.location.href = '/';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aktiv</Badge>;
      case 'development':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Entwicklung</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inaktiv</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  if (activeModule === 'n8n') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setActiveModule(null)}
            className="mb-4"
          >
            ← Zurück zum Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">N8N Workflow Manager</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre N8N Workflows und Automatisierungen
          </p>
        </div>
        
        <N8NWorkflowManager 
          onWorkflowSelect={(workflow) => {
            console.log('Selected workflow:', workflow);
            alert(`Workflow ausgewählt: ${workflow.name}`);
          }}
          autoRefresh={true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-rix-text-primary">RIX Dashboard</h1>
          <p className="text-rix-text-secondary">
            Willkommen zurück, {user?.firstName || 'Benutzer'}! Heute ist ein guter Tag für Produktivität.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview - Mobile optimized with RIX design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <Card className="touch-manipulation active:scale-95 transition-transform border-rix-border-primary bg-rix-surface">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-rix-text-secondary">Aktive Projekte</p>
                <p className="text-lg lg:text-2xl font-bold text-rix-text-primary">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation active:scale-95 transition-transform border-rix-border-primary bg-rix-surface">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-rix-text-secondary">Termine heute</p>
                <p className="text-lg lg:text-2xl font-bold text-rix-text-primary">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation active:scale-95 transition-transform border-rix-border-primary bg-rix-surface">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-rix-text-secondary">Produktivität</p>
                <p className="text-lg lg:text-2xl font-bold text-rix-text-primary">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="touch-manipulation active:scale-95 transition-transform border-rix-border-primary bg-rix-surface">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Newspaper className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-rix-text-secondary">Offene Aufgaben</p>
                <p className="text-lg lg:text-2xl font-bold text-rix-text-primary">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid - Mobile optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {dashboardModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card 
              key={module.id}
              className={cn(
                'hover:shadow-rix-lg transition-all duration-200 cursor-pointer',
                'touch-manipulation active:scale-95',
                'border-rix-border-primary hover:border-rix-accent-primary/30 bg-rix-surface'
              )}
              onClick={() => handleModuleClick(module.id)}
            >
              <CardHeader className="pb-3 lg:pb-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 lg:p-3 rounded-lg ${module.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <IconComponent className={`h-5 w-5 lg:h-6 lg:w-6 ${module.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base lg:text-lg leading-tight text-rix-text-primary">{module.name}</CardTitle>
                      <CardDescription className="text-xs lg:text-sm mt-1 line-clamp-2 text-rix-text-secondary">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(module.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px] touch-manipulation active:scale-95"
                  disabled={module.status === 'inactive'}
                >
                  {module.status === 'active' ? 'Öffnen' : 
                   module.status === 'development' ? 'In Entwicklung' : 'Nicht verfügbar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Development Notice with RIX styling */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-rix-border-primary rounded-lg">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">RIX Development Environment</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          RIX läuft im Entwicklungsmodus mit erweiterten Debugging-Features. 
          Alle Module sind voll funktionsfähig und produktionsbereit.
        </p>
      </div>
    </div>
  );
} 