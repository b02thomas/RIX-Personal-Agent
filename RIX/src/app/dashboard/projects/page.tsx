// /src/app/dashboard/projects/page.tsx
// Project management page with expandable cards and AI health score display
// Integrates with backend API for project CRUD operations and N8N MCP routing
// RELEVANT FILES: /src/app/api/projects/route.ts, components/ui/card.tsx, store/navigation-store.ts, components/projects/project-form.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigation-store';
import { useAuthStore } from '@/store/auth-store';
import { useMobileOptimization } from '@/components/mobile/mobile-touch-optimizer';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
// Mobile components temporarily disabled for build fix
// import { MobileSwipeCard, getProjectActions } from '@/components/mobile/mobile-swipe-card';
// import { MobileFAB, getProjectFABActions } from '@/components/mobile/mobile-fab';
// import { MobilePullRefresh } from '@/components/mobile/mobile-pull-refresh';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance optimization
const Icons = {
  FolderOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen })), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  Search: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Search })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  Target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  Folder: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Folder })), { ssr: false }),
  Star: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Star })), { ssr: false }),
  MoreVertical: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MoreVertical })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Archive: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Archive })), { ssr: false }),
  ChevronRight: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false })
};

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  color: string;
  aiHealthScore: number; // AI health score 0-100
  startDate: string;
  endDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Client-side computed fields
  isStarred?: boolean;
  isExpanded?: boolean;
}

// API functions for project management
const fetchProjects = async (): Promise<{ projects: Project[], total: number }> => {
  try {
    const response = await fetch('/api/projects', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

const createProject = async (projectData: Partial<Project>): Promise<{ project: Project }> => {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Project['status']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Project['priority']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { setActiveProject, activeProject } = useNavigationStore();
  const { user } = useAuthStore();
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback();
  
  // Mobile gesture support for project cards
  const { setupSwipeToClose } = useMobileGestures({
    onSwipeLeft: undefined,
    onSwipeRight: undefined,
    enabled: isMobile
  });

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, []);
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects();
      setProjects(data.projects.map(project => ({
        ...project,
        isStarred: false, // Add client-side state
        isExpanded: false
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      const result = await createProject(projectData);
      setProjects(prev => [...prev, { ...result.project, isStarred: false, isExpanded: false }]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const toggleProjectStar = (projectId: string) => {
    // Add haptic feedback for mobile interactions
    triggerHaptic('selection');
    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, isStarred: !project.isStarred } : project
    ));
  };
  
  const toggleProjectExpansion = (projectId: string) => {
    // Add haptic feedback for expansion/collapse
    triggerHaptic('impact', 'light');
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleProjectClick = (projectId: string) => {
    // Enhanced mobile interaction feedback
    triggerHaptic('impact', 'medium');
    setActiveProject(activeProject === projectId ? null : projectId);
    toggleProjectExpansion(projectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'on-hold': return 'Pausiert';
      case 'completed': return 'Abgeschlossen';
      case 'archived': return 'Archiviert';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date < new Date() && date.toDateString() !== new Date().toDateString();
  };

  // Statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const averageHealthScore = totalProjects > 0 ? Math.round(projects.reduce((sum, p) => sum + p.aiHealthScore, 0) / totalProjects) : 0;

  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Icons.FolderOpen className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-rix-text-primary mb-2">Error loading projects</h3>
          <p className="text-rix-text-secondary mb-4">{error}</p>
          <Button onClick={loadProjects}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-rix-text-primary">
            Projekt Management
          </h1>
          <p className="text-rix-text-secondary mt-1">
            Organisieren und verwalten Sie Ihre Projekte effektiv
          </p>
        </div>
        
        <Button 
          className={cn(
            "w-full md:w-auto min-h-[48px] touch-manipulation",
            isMobile && "text-base font-semibold shadow-lg active:scale-95 transition-transform duration-150"
          )}
          size="lg"
          onClick={() => {
            triggerHaptic('impact', 'medium');
            setShowCreateForm(true);
          }}
        >
          <Icons.Plus className="w-5 h-5 mr-2" />
          Neues Projekt
        </Button>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Icons.FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Gesamt</p>
                <p className="text-xl font-bold text-rix-text-primary">{totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Icons.Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Aktiv</p>
                <p className="text-xl font-bold text-rix-text-primary">{activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Icons.TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Ø Health Score</p>
                <p className="text-xl font-bold text-rix-text-primary">{averageHealthScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Icons.Archive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Abgeschlossen</p>
                <p className="text-xl font-bold text-rix-text-primary">{completedProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-rix-border-primary">
        <CardContent className="p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-rix-text-tertiary" />
              <Input
                placeholder="Projekte durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px] bg-rix-surface border-rix-border-primary text-rix-text-primary"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-md border",
                "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
              )}
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="on-hold">Pausiert</option>
              <option value="completed">Abgeschlossen</option>
              <option value="archived">Archiviert</option>
            </select>
            
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-md border",
                "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
              )}
            >
              <option value="all">Alle Prioritäten</option>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid - Enhanced for Mobile */}
      <div className={cn(
        "grid gap-4 md:gap-6",
        isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
      )}>
        {filteredProjects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3">
            <Card className="border-rix-border-primary">
              <CardContent className="p-8 text-center">
                <Icons.FolderOpen className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-rix-text-primary mb-2">
                  Keine Projekte gefunden
                </h3>
                <p className="text-rix-text-secondary">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                    ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                    : 'Erstellen Sie Ihr erstes Projekt.'}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredProjects.map((project) => {
            // Enhanced mobile interactions with swipe actions
            const swipeActions = isMobile ? getProjectActions(
              () => toggleProjectStar(project.id),
              () => {
                // TODO: Implement edit functionality
                console.log('Edit project:', project.id);
              },
              () => {
                // TODO: Implement archive functionality
                console.log('Archive project:', project.id);
              },
              () => {
                // TODO: Implement delete functionality
                console.log('Delete project:', project.id);
              }
            ) : { left: [], right: [] };
            
            const ProjectCard = (
              <Card 
                className={cn(
                  "border-rix-border-primary transition-all duration-200 cursor-pointer",
                  "touch-manipulation select-none",
                  isMobile ? (
                    "active:scale-[0.98] active:shadow-lg rounded-xl"
                  ) : (
                    "hover:shadow-rix-md"
                  ),
                  expandedProjects.has(project.id) && "ring-2 ring-rix-accent-primary ring-opacity-50"
                )}
                onClick={() => handleProjectClick(project.id)}
              >
                {/* Card content remains the same */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <Icons.Folder 
                        className="w-6 h-6"
                        style={{ color: project.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base leading-tight text-rix-text-primary truncate">
                          {project.name}
                        </CardTitle>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectStar(project.id);
                          }}
                          className={cn(
                            "flex-shrink-0 p-1 touch-manipulation",
                            isMobile && "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          )}
                        >
                          <Icons.Star 
                            className={cn(
                              "w-4 h-4 transition-colors",
                              project.isStarred 
                                ? "text-yellow-500 fill-current" 
                                : "text-rix-text-tertiary hover:text-yellow-500"
                            )}
                          />
                        </button>
                      </div>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Expansion Icon - Enhanced for Mobile */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProjectExpansion(project.id);
                    }}
                    className={cn(
                      "flex-shrink-0 p-1 touch-manipulation transition-transform duration-200",
                      isMobile && "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-rix-surface",
                      expandedProjects.has(project.id) && isMobile && "bg-rix-surface"
                    )}
                    aria-label={expandedProjects.has(project.id) ? "Projekt einklappen" : "Projekt erweitern"}
                  >
                    <Icons.ChevronRight 
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedProjects.has(project.id) && "rotate-90"
                      )}
                    />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* AI Health Score */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-rix-text-secondary">AI Health Score</span>
                    <span className={cn(
                      "font-semibold",
                      getHealthScoreColor(project.aiHealthScore)
                    )}>
                      {project.aiHealthScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-rix-border-secondary rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        project.aiHealthScore >= 80 ? "bg-green-500" :
                        project.aiHealthScore >= 60 ? "bg-yellow-500" :
                        project.aiHealthScore >= 40 ? "bg-orange-500" : "bg-red-500"
                      )}
                      style={{ width: `${project.aiHealthScore}%` }}
                    />
                  </div>
                  <div className="text-xs text-rix-text-tertiary mt-1">
                    {getHealthScoreLabel(project.aiHealthScore)}
                  </div>
                </div>

                {/* Project Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Status and Priority */}
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-xs", getStatusColor(project.status))}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getPriorityColor(project.priority))}
                  >
                    {project.priority === 'high' ? 'Hoch' : 
                     project.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                  </Badge>
                </div>

                {/* Date Information */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <Icons.Calendar className="w-3 h-3 text-rix-text-tertiary" />
                    <span className="text-rix-text-secondary">
                      Start: {formatDate(project.startDate)}
                    </span>
                  </div>
                  {project.endDate && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Icons.Calendar className="w-3 h-3 text-rix-text-tertiary" />
                      <span className={cn(
                        "text-rix-text-secondary",
                        isOverdue(project.endDate) && project.status === 'active' && "text-red-600 dark:text-red-400"
                      )}>
                        Ende: {formatDate(project.endDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Updated */}
                <div className="flex items-center space-x-2 text-xs">
                  <Icons.Clock className="w-3 h-3 text-rix-text-tertiary" />
                  <span className="text-rix-text-secondary">
                    Aktualisiert: {formatDate(project.updatedAt)}
                  </span>
                </div>
                
                {/* Expanded Content */}
                {expandedProjects.has(project.id) && (
                  <div className="mt-4 pt-4 border-t border-rix-border-secondary space-y-3">
                    <div className="text-sm">
                      <h4 className="font-medium text-rix-text-primary mb-2">Projekt Details</h4>
                      <p className="text-rix-text-secondary">{project.description}</p>
                    </div>
                    
                    {/* Action Buttons - Mobile Optimized */}
                    <div className={cn(
                      "flex space-x-2",
                      isMobile && "flex-col space-x-0 space-y-2"
                    )}>
                      <Button 
                        size={isMobile ? "default" : "sm"} 
                        variant="outline" 
                        className={cn(
                          isMobile ? "min-h-[44px] text-sm touch-manipulation" : "text-xs"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('impact', 'light');
                          // TODO: Implement edit functionality
                        }}
                      >
                        <Icons.Settings className={cn(isMobile ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1")} />
                        Bearbeiten
                      </Button>
                      <Button 
                        size={isMobile ? "default" : "sm"} 
                        variant="outline" 
                        className={cn(
                          isMobile ? "min-h-[44px] text-sm touch-manipulation" : "text-xs"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('impact', 'light');
                          // TODO: Implement AI insights
                        }}
                      >
                        <Icons.TrendingUp className={cn(isMobile ? "w-4 h-4 mr-2" : "w-3 h-3 mr-1")} />
                        AI Insights
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              </Card>
            );
            
            return (
              <MobileSwipeCard
                key={project.id}
                leftActions={swipeActions.left}
                rightActions={swipeActions.right}
                onTap={() => handleProjectClick(project.id)}
                enableSwipe={isMobile}
                className="mb-4"
              >
                {ProjectCard}
              </MobileSwipeCard>
            );
          })
        )}
      </div>
      
      {/* Mobile FAB for quick actions */}
      {isMobile && (
        <MobileFAB
          actions={getProjectFABActions(
            () => {
              triggerHaptic('impact', 'medium');
              setShowCreateForm(true);
            },
            () => {
              triggerHaptic('impact', 'medium');
              // TODO: Implement create task functionality
              console.log('Create task');
            },
            () => {
              triggerHaptic('impact', 'medium');
              // TODO: Implement quick note functionality
              console.log('Quick note');
            }
          )}
          position="bottom-right"
          expandDirection="up"
        />
      )}
      
      {/* Project Creation Modal/Form */}
      {showCreateForm && (
        <ProjectCreationModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
  
  // Main component return with mobile optimization
  return isMobile ? (
    <MobilePullRefresh
      onRefresh={async () => {
        triggerHaptic('impact', 'light');
        await loadProjects();
      }}
      className="min-h-screen"
    >
      {ProjectsContent}
    </MobilePullRefresh>
  ) : (
    ProjectsContent
  );
}

// Project Creation Modal Component
interface ProjectCreationModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<Project>) => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium' as Project['priority'],
    color: '#60A5FA',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({
      ...formData,
      endDate: formData.endDate || undefined,
    });
  };
  
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Neues Projekt erstellen</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icons.X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Projekt Name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Projekt Beschreibung"
                className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Priorität</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Project['priority'] }))}
                  className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Farbe</label>
                <div className="mt-1 flex space-x-1">
                  {['#60A5FA', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={cn(
                        "w-8 h-8 rounded border-2 transition-all",
                        formData.color === color ? "border-rix-text-primary" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Startdatum</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Enddatum</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Tags</label>
              <div className="mt-1 flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Tag hinzufügen"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Icons.Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1">
                Erstellen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
  
