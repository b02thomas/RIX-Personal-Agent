// /src/app/dashboard/intelligence/page.tsx
// Intelligence Overview page with adaptive knowledge database and AI-powered insights
// Integrates with Main Agent intelligence endpoints for routine coaching, project intelligence, and calendar optimization
// RELEVANT FILES: /main-agent/app/api/endpoints/intelligence.py, components/ui/card.tsx, components/ui/input.tsx, store/auth-store.ts

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useMobileOptimization } from '@/components/mobile/mobile-touch-optimizer';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

// Dynamic icon imports for performance optimization
const Icons = {
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  Search: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Search })), { ssr: false }),
  Target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target })), { ssr: false }),
  Database: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Database })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  TrendingDown: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingDown })), { ssr: false }),
  Lightbulb: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Lightbulb })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  BookOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BookOpen })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  Award: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Award })), { ssr: false }),
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false })
};

// Type definitions for intelligence features
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'routine' | 'project' | 'calendar' | 'insight';
  relevance: number;
  lastAccessed: string;
  tags: string[];
  source: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'productivity' | 'health' | 'learning' | 'career';
  target: number;
  current: number;
  unit: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'routine_coaching' | 'project_intelligence' | 'calendar_optimization';
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
  timestamp: string;
}

interface IntelligenceMetrics {
  knowledgeItems: number;
  activeGoals: number;
  completedGoals: number;
  aiInsights: number;
  averageProgress: number;
}

// API functions for intelligence features
const fetchIntelligenceMetrics = async (): Promise<IntelligenceMetrics> => {
  try {
    const response = await fetch('/api/intelligence/metrics', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch intelligence metrics');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching intelligence metrics:', error);
    // Return mock data for now
    return {
      knowledgeItems: 342,
      activeGoals: 8,
      completedGoals: 23,
      aiInsights: 15,
      averageProgress: 73
    };
  }
};

const searchKnowledge = async (query: string, filters: string[] = []): Promise<KnowledgeItem[]> => {
  try {
    const params = new URLSearchParams({ query });
    filters.forEach(filter => params.append('filter', filter));
    
    const response = await fetch(`/api/intelligence/search?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to search knowledge base');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    // Return mock data for demo
    return [
      {
        id: '1',
        title: 'Morning Routine Optimization',
        content: 'Your morning routine shows 85% completion rate with peak productivity at 8-10 AM.',
        type: 'routine',
        relevance: 0.92,
        lastAccessed: new Date().toISOString(),
        tags: ['morning', 'productivity', 'routine'],
        source: 'Routine Analysis'
      },
      {
        id: '2',
        title: 'Project Health: Website Redesign',
        content: 'Project is 78% complete, on track for deadline with moderate risk factors.',
        type: 'project',
        relevance: 0.89,
        lastAccessed: new Date().toISOString(),
        tags: ['project', 'website', 'design'],
        source: 'Project Intelligence'
      }
    ];
  }
};

const getAIInsights = async (): Promise<AIInsight[]> => {
  try {
    // Get insights from routine coaching
    const routineResponse = await fetch('/api/intelligence/routine-coaching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        message: 'Get my routine insights for today',
        context: { type: 'daily_overview' }
      })
    });
    
    // Get insights from project intelligence
    const projectResponse = await fetch('/api/intelligence/project-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        message: 'Analyze my current project health',
        context: { type: 'health_overview' }
      })
    });
    
    // Get insights from calendar optimization
    const calendarResponse = await fetch('/api/intelligence/calendar-optimization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        message: 'Optimize my schedule for today',
        context: { type: 'daily_optimization' }
      })
    });
    
    const insights: AIInsight[] = [];
    
    if (routineResponse.ok) {
      const data = await routineResponse.json();
      insights.push({
        id: `routine-${Date.now()}`,
        title: 'Routine Performance',
        description: data.coaching_insights || 'Your routine completion rate is strong today.',
        type: 'routine_coaching',
        confidence: data.processing_info?.confidence || 0.9,
        actionable: true,
        priority: 'medium',
        metadata: data.routine_analysis || {},
        timestamp: new Date().toISOString()
      });
    }
    
    if (projectResponse.ok) {
      const data = await projectResponse.json();
      insights.push({
        id: `project-${Date.now()}`,
        title: 'Project Health Alert',
        description: data.intelligence_insights || 'Your active projects are progressing well.',
        type: 'project_intelligence',
        confidence: data.processing_info?.confidence || 0.92,
        actionable: true,
        priority: 'high',
        metadata: data.project_analysis || {},
        timestamp: new Date().toISOString()
      });
    }
    
    if (calendarResponse.ok) {
      const data = await calendarResponse.json();
      insights.push({
        id: `calendar-${Date.now()}`,
        title: 'Schedule Optimization',
        description: data.optimization_insights || 'Your schedule today can be optimized for better focus.',
        type: 'calendar_optimization',
        confidence: data.processing_info?.confidence || 0.88,
        actionable: true,
        priority: 'medium',
        metadata: data.schedule_analysis || {},
        timestamp: new Date().toISOString()
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return [];
  }
};

const fetchGoals = async (): Promise<Goal[]> => {
  try {
    const response = await fetch('/api/intelligence/goals', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching goals:', error);
    // Return mock goals for demo
    return [
      {
        id: '1',
        title: 'Daily Exercise',
        description: 'Complete 30 minutes of exercise daily',
        category: 'health',
        target: 30,
        current: 23,
        unit: 'days',
        deadline: '2024-01-31',
        priority: 'high',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Learn TypeScript',
        description: 'Complete advanced TypeScript course',
        category: 'learning',
        target: 100,
        current: 67,
        unit: 'percent',
        deadline: '2024-02-15',
        priority: 'medium',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];
  }
};

export default function IntelligencePage() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  
  // Hooks
  const { user } = useAuthStore();
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback();
  
  useEffect(() => {
    setMounted(true);
    loadIntelligenceData();
  }, []);
  
  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all intelligence data in parallel
      const [metricsData, goalsData, insightsData] = await Promise.all([
        fetchIntelligenceMetrics(),
        fetchGoals(),
        getAIInsights()
      ]);
      
      setMetrics(metricsData);
      setGoals(goalsData);
      setAiInsights(insightsData);
      
      // Load initial knowledge items
      const initialKnowledge = await searchKnowledge('recent insights', []);
      setKnowledgeItems(initialKnowledge);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      const initialKnowledge = await searchKnowledge('recent insights', []);
      setKnowledgeItems(initialKnowledge);
      return;
    }
    
    try {
      triggerHaptic('selection');
      const results = await searchKnowledge(query, selectedFilter !== 'all' ? [selectedFilter] : []);
      setKnowledgeItems(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [selectedFilter, triggerHaptic]);
  
  const getGoalProgress = (goal: Goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };
  
  const getGoalStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  const getInsightTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'routine_coaching': return Icons.RotateCcw;
      case 'project_intelligence': return Icons.Target;
      case 'calendar_optimization': return Icons.Calendar;
      default: return Icons.Lightbulb;
    }
  };
  
  const getKnowledgeTypeIcon = (type: KnowledgeItem['type']) => {
    switch (type) {
      case 'routine': return Icons.RotateCcw;
      case 'project': return Icons.Target;
      case 'calendar': return Icons.Calendar;
      case 'insight': return Icons.Lightbulb;
      default: return Icons.Database;
    }
  };

  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Icons.AlertCircle className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-rix-text-primary mb-2">Error loading intelligence data</h3>
          <p className="text-rix-text-secondary mb-4">{error}</p>
          <Button onClick={loadIntelligenceData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className={cn(
        "flex items-center justify-between",
        isMobile && "flex-col space-y-4"
      )}>
        <div className={cn(isMobile && "text-center")}>
          <h1 className={cn(
            "font-bold text-rix-text-primary",
            isMobile ? "text-2xl" : "text-3xl"
          )}>
            Intelligence Overview
          </h1>
          <p className="text-rix-text-secondary mt-1">
            Adaptive knowledge database with AI-powered insights and goal tracking
          </p>
        </div>
        
        <div className={cn(
          "flex items-center gap-2",
          isMobile && "w-full justify-between"
        )}>
          <Button 
            variant="outline" 
            size={isMobile ? "default" : "sm"}
            className={cn(
              isMobile && "flex-1 min-h-[48px] touch-manipulation"
            )}
            onClick={() => {
              triggerHaptic('impact', 'medium');
              loadIntelligenceData();
            }}
          >
            <Icons.Brain className="h-4 w-4 mr-2" />
            Refresh AI
          </Button>
          <Button 
            onClick={() => {
              triggerHaptic('impact', 'medium');
              setShowCreateGoal(true);
            }}
            size={isMobile ? "default" : "sm"}
            className={cn(
              isMobile && "flex-1 min-h-[48px] touch-manipulation font-semibold"
            )}
          >
            <Icons.Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Intelligence Metrics Overview */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "md:grid-cols-5"
      )}>
        <Card className="border-rix-border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Items</CardTitle>
            <Icons.Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.knowledgeItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              Indexed insights
            </p>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Icons.Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeGoals || 0}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Icons.CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completedGoals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Goals achieved
            </p>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Icons.Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              Today&apos;s insights
            </p>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Icons.TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageProgress || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion
            </p>
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-1" : "md:grid-cols-2"
      )}>
        {/* Adaptive Knowledge Database */}
        <Card className="border-rix-border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Database className="h-5 w-5" />
              Knowledge Database
            </CardTitle>
            <CardDescription>
              Context-aware search across your projects, routines, and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Interface */}
            <div className="space-y-3">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-rix-text-tertiary" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchQuery);
                    }
                  }}
                  placeholder="Search knowledge base..."
                  className="pl-10"
                />
              </div>
              
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                {['all', 'routine', 'project', 'calendar', 'insight'].map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedFilter(filter);
                      if (searchQuery) {
                        handleSearch(searchQuery);
                      }
                    }}
                    className={cn(
                      isMobile && "min-h-[40px] touch-manipulation text-xs"
                    )}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Knowledge Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {knowledgeItems.length === 0 ? (
                <div className="text-center py-8 text-rix-text-secondary">
                  <Icons.Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No knowledge items found</p>
                  <p className="text-sm">Try a different search query</p>
                </div>
              ) : (
                knowledgeItems.map((item) => {
                  const IconComponent = getKnowledgeTypeIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 border border-rix-border-secondary rounded-lg transition-colors",
                        "touch-manipulation cursor-pointer",
                        isMobile ? "active:bg-rix-surface/50" : "hover:bg-rix-surface/50"
                      )}
                      onClick={() => {
                        triggerHaptic('selection');
                        // TODO: Navigate to detailed view
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rix-surface rounded-lg">
                          <IconComponent className="w-4 h-4 text-rix-accent-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-rix-text-primary truncate">
                              {item.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(item.relevance * 100)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-rix-text-secondary line-clamp-2">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.source}
                            </Badge>
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs opacity-70">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goal Tracking Interface */}
        <Card className="border-rix-border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Target className="h-5 w-5" />
              Goal Tracking
            </CardTitle>
            <CardDescription>
              Create, manage, and track progress on your personal goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-8 text-rix-text-secondary">
                <Icons.Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No goals set</p>
                <p className="text-sm">Create your first goal to get started</p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    triggerHaptic('impact', 'medium');
                    setShowCreateGoal(true);
                  }}
                >
                  <Icons.Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            ) : (
              goals.map((goal) => {
                const progress = getGoalProgress(goal);
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "p-4 border border-rix-border-secondary rounded-lg transition-colors",
                      "touch-manipulation",
                      isMobile && "active:bg-rix-surface/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-rix-text-primary">{goal.title}</h4>
                        <p className="text-sm text-rix-text-secondary mt-1">
                          {goal.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getGoalStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{goal.current}/{goal.target} {goal.unit}</span>
                      </div>
                      <div className="w-full bg-rix-border-secondary rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            progress >= 100 ? "bg-green-500" :
                            progress >= 75 ? "bg-blue-500" :
                            progress >= 50 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Goal Details */}
                    <div className="flex items-center justify-between text-xs text-rix-text-tertiary">
                      <div className="flex items-center gap-1">
                        <Icons.Clock className="h-3 w-3" />
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.Award className="h-3 w-3" />
                        {goal.category}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Dashboard */}
      <Card className="border-rix-border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Brain className="h-5 w-5" />
            AI Insights Dashboard
          </CardTitle>
          <CardDescription>
            Real-time coaching insights, project health, and schedule optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "md:grid-cols-3"
          )}>
            {aiInsights.length === 0 ? (
              <div className="col-span-full text-center py-8 text-rix-text-secondary">
                <Icons.Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No AI insights available</p>
                <p className="text-sm">Insights will appear as you use the system</p>
              </div>
            ) : (
              aiInsights.map((insight) => {
                const IconComponent = getInsightTypeIcon(insight.type);
                return (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-4 border border-rix-border-secondary rounded-lg bg-gradient-to-br",
                      insight.type === 'routine_coaching' && "from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10",
                      insight.type === 'project_intelligence' && "from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10",
                      insight.type === 'calendar_optimization' && "from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10",
                      "transition-colors touch-manipulation",
                      isMobile && "active:scale-95"
                    )}
                    onClick={() => {
                      triggerHaptic('selection');
                      // TODO: Navigate to detailed insight view
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-rix-surface rounded-lg shadow-sm">
                        <IconComponent className="w-5 h-5 text-rix-accent-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-rix-text-primary">
                            {insight.title}
                          </h4>
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-rix-text-secondary mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rix-text-tertiary">
                              Confidence: {Math.round(insight.confidence * 100)}%
                            </span>
                            {insight.actionable && (
                              <Badge variant="secondary" className="text-xs">
                                Actionable
                              </Badge>
                            )}
                          </div>
                          {insight.actionable && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={cn(
                                isMobile && "min-h-[36px] touch-manipulation"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('impact', 'light');
                                // TODO: Apply insight action
                              }}
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goal Creation Modal */}
      {showCreateGoal && (
        <GoalCreationModal
          onClose={() => setShowCreateGoal(false)}
          onSubmit={(goalData) => {
            // TODO: Implement goal creation
            console.log('Creating goal:', goalData);
            setShowCreateGoal(false);
          }}
        />
      )}
    </div>
  );
}

// Goal Creation Modal Component
interface GoalCreationModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<Goal>) => void;
}

const GoalCreationModal: React.FC<GoalCreationModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'productivity' as Goal['category'],
    target: 1,
    unit: '',
    deadline: '',
    priority: 'medium' as Goal['priority']
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.unit.trim() || !formData.deadline) return;
    
    onSubmit({
      ...formData,
      current: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto border-rix-border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-rix-text-primary">Create New Goal</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icons.X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Goal title"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Goal description"
                className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Goal['category'] }))}
                  className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                >
                  <option value="productivity">Productivity</option>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                  <option value="career">Career</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Goal['priority'] }))}
                  className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Target *</label>
                <Input
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Unit *</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="days, hours, %"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Deadline *</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Goal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 