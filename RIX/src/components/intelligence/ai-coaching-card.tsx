// /src/components/intelligence/ai-coaching-card.tsx
// Reusable AI coaching card component for routine and calendar optimization suggestions
// Integrates with Main Agent intelligence endpoints to provide context-aware coaching
// RELEVANT FILES: /src/app/api/intelligence/routine-coaching/route.ts, components/ui/card.tsx, components/ui/button.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileOptimization } from '@/components/mobile/mobile-touch-optimizer';

// Dynamic icon imports for performance optimization
const Icons = {
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  Lightbulb: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Lightbulb })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  Target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false })
};

interface AICoachingSuggestion {
  id: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  type: 'routine_coaching' | 'calendar_optimization' | 'project_intelligence';
  metadata?: Record<string, any>;
}

interface AICoachingCardProps {
  type: 'routine' | 'calendar' | 'project';
  context?: Record<string, any>;
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
}

export function AICoachingCard({ 
  type, 
  context = {}, 
  className,
  compact = false,
  showHeader = true
}: AICoachingCardProps) {
  const [suggestions, setSuggestions] = useState<AICoachingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { triggerHaptic } = useHapticFeedback();
  const { isMobile } = useMobileOptimization();
  
  const loadCoachingSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '';
      let message = '';
      
      switch (type) {
        case 'routine':
          endpoint = '/api/intelligence/routine-coaching';
          message = 'Analyze my routine performance and provide coaching suggestions';
          break;
        case 'calendar':
          endpoint = '/api/intelligence/calendar-optimization';
          message = 'Analyze my schedule and provide optimization suggestions';
          break;
        case 'project':
          endpoint = '/api/intelligence/project-intelligence';
          message = 'Analyze my project health and provide intelligence insights';
          break;
        default:
          throw new Error('Invalid coaching type');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          context: {
            ...context,
            type: 'coaching_suggestions',
            compact
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} coaching suggestions`);
      }
      
      const data = await response.json();
      
      // Parse the response into suggestions format
      const suggestion: AICoachingSuggestion = {
        id: `${type}-coaching-${Date.now()}`,
        title: getCoachingTitle(type, data),
        description: getCoachingDescription(type, data),
        confidence: data.processing_info?.confidence || 0.85,
        actionable: true,
        priority: getCoachingPriority(type, data),
        type: `${type}_${type === 'calendar' ? 'optimization' : type === 'project' ? 'intelligence' : 'coaching'}` as AICoachingSuggestion['type'],
        metadata: data
      };
      
      setSuggestions([suggestion]);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Error loading coaching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load coaching suggestions');
    } finally {
      setLoading(false);
    }
  }, [type, context, compact]);
  
  useEffect(() => {
    loadCoachingSuggestions();
  }, [loadCoachingSuggestions]);
  
  const getCoachingTitle = (coachingType: string, data: any): string => {
    switch (coachingType) {
      case 'routine':
        if (data.routine_analysis?.completion_rate > 80) {
          return 'Excellent Routine Performance';
        } else if (data.routine_analysis?.completion_rate > 60) {
          return 'Good Progress, Room for Improvement';
        } else {
          return 'Routine Needs Attention';
        }
      case 'calendar':
        if (data.schedule_analysis?.schedule_efficiency > 80) {
          return 'Well-Optimized Schedule';
        } else {
          return 'Schedule Optimization Available';
        }
      case 'project':
        if (data.project_analysis?.average_health_score > 80) {
          return 'Projects on Track';
        } else {
          return 'Project Health Alert';
        }
      default:
        return 'AI Coaching Insight';
    }
  };
  
  const getCoachingDescription = (coachingType: string, data: any): string => {
    switch (coachingType) {
      case 'routine':
        return data.coaching_insights || 'Your routine performance shows consistent progress with opportunities for optimization.';
      case 'calendar':
        return data.optimization_insights || 'Your schedule can be optimized for better productivity and work-life balance.';
      case 'project':
        return data.intelligence_insights || 'Your projects show healthy progress with some areas requiring attention.';
      default:
        return 'AI analysis completed with actionable insights available.';
    }
  };
  
  const getCoachingPriority = (coachingType: string, data: any): 'low' | 'medium' | 'high' => {
    switch (coachingType) {
      case 'routine':
        const completionRate = data.routine_analysis?.completion_rate || 0;
        return completionRate < 60 ? 'high' : completionRate < 80 ? 'medium' : 'low';
      case 'calendar':
        const efficiency = data.schedule_analysis?.schedule_efficiency || 0;
        return efficiency < 60 ? 'high' : efficiency < 80 ? 'medium' : 'low';
      case 'project':
        const healthScore = data.project_analysis?.average_health_score || 0;
        return healthScore < 60 ? 'high' : healthScore < 80 ? 'medium' : 'low';
      default:
        return 'medium';
    }
  };
  
  const getTypeIcon = (coachingType: string) => {
    switch (coachingType) {
      case 'routine': return Icons.RotateCcw;
      case 'calendar': return Icons.Calendar;
      case 'project': return Icons.Target;
      default: return Icons.Brain;
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
  
  const TypeIcon = getTypeIcon(type);
  
  if (loading) {
    return (
      <Card className={cn('border-rix-border-primary', className)}>
        <CardContent className={cn(compact ? 'p-4' : 'p-6')}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rix-surface rounded-lg">
              <Icons.RefreshCw className="w-5 h-5 text-rix-accent-primary animate-spin" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn('border-rix-border-primary', className)}>
        <CardContent className={cn(compact ? 'p-4' : 'p-6')}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Icons.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-rix-text-primary mb-1">Coaching Unavailable</h4>
              <p className="text-sm text-rix-text-secondary">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                triggerHaptic('selection');
                loadCoachingSuggestions();
              }}
              className={cn(isMobile && 'min-h-[40px] touch-manipulation')}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (suggestions.length === 0) {
    return (
      <Card className={cn('border-rix-border-primary', className)}>
        <CardContent className={cn(compact ? 'p-4' : 'p-6')}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <TypeIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-rix-text-primary mb-1">No Insights Available</h4>
              <p className="text-sm text-rix-text-secondary">
                AI coaching will appear as you use the system more.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn(
      'border-rix-border-primary',
      'bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10',
      className
    )}>
      {showHeader && !compact && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Icons.Brain className="h-5 w-5 text-rix-accent-primary" />
            AI Coaching
          </CardTitle>
          <CardDescription>
            Personalized insights to optimize your {type} performance
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={cn(compact ? 'p-4' : showHeader ? 'pt-0 px-6 pb-6' : 'p-6')}>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={cn(
                'transition-colors',
                compact ? 'space-y-2' : 'space-y-3'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white dark:bg-rix-surface rounded-lg shadow-sm">
                    <TypeIcon className="w-5 h-5 text-rix-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        'font-medium text-rix-text-primary',
                        compact ? 'text-sm' : 'text-base'
                      )}>
                        {suggestion.title}
                      </h4>
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className={cn(
                      'text-rix-text-secondary mb-3',
                      compact ? 'text-xs' : 'text-sm'
                    )}>
                      {suggestion.description}
                    </p>
                    
                    {!compact && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-rix-text-tertiary">
                            Confidence: {Math.round(suggestion.confidence * 100)}%
                          </span>
                          {lastUpdated && (
                            <span className="text-xs text-rix-text-tertiary">
                              Updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              triggerHaptic('selection');
                              loadCoachingSuggestions();
                            }}
                            className={cn(isMobile && 'min-h-[36px] touch-manipulation')}
                          >
                            <Icons.RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                          {suggestion.actionable && (
                            <Button
                              size="sm"
                              onClick={() => {
                                triggerHaptic('impact', 'light');
                                // TODO: Implement suggestion application
                                console.log('Applying suggestion:', suggestion);
                              }}
                              className={cn(isMobile && 'min-h-[36px] touch-manipulation')}
                            >
                              <Icons.Zap className="w-3 h-3 mr-1" />
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {compact && suggestion.actionable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          triggerHaptic('impact', 'light');
                          // TODO: Implement suggestion application
                          console.log('Applying suggestion:', suggestion);
                        }}
                        className={cn(
                          'mt-2',
                          isMobile && 'min-h-[36px] touch-manipulation text-xs'
                        )}
                      >
                        <Icons.Zap className="w-3 h-3 mr-1" />
                        Apply Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}