// /src/components/intelligence/calendar-ai-sidebar.tsx
// Calendar AI suggestions sidebar component with smart scheduling and optimization recommendations
// Integrates with Main Agent calendar optimization endpoint for intelligent scheduling insights
// RELEVANT FILES: /src/app/api/intelligence/calendar-optimization/route.ts, components/ui/card.tsx, components/ui/button.tsx

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
  Lightbulb: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Lightbulb })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  Zap: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Zap })), { ssr: false }),
  AlertTriangle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertTriangle })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  Users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), { ssr: false }),
  Focus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Focus })), { ssr: false }),
  Coffee: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Coffee })), { ssr: false })
};

interface ScheduleSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'conflict' | 'break' | 'focus_time' | 'meeting_prep';
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  timeSlot?: {
    start: string;
    end: string;
  };
  actionable: boolean;
  metadata?: Record<string, any>;
}

interface CalendarAISidebarProps {
  selectedDate: Date;
  events: any[];
  className?: string;
}

export function CalendarAISidebar({ selectedDate, events, className }: CalendarAISidebarProps) {
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { triggerHaptic } = useHapticFeedback();
  const { isMobile } = useMobileOptimization();
  
  const loadScheduleSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/intelligence/calendar-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: 'Analyze my schedule and provide optimization suggestions',
          context: {
            type: 'sidebar_suggestions',
            selectedDate: selectedDate.toISOString(),
            events: events.map(event => ({
              id: event.id,
              title: event.title,
              startTime: event.startTime,
              endTime: event.endTime,
              eventType: event.eventType,
              priority: event.priority
            })),
            requestedSuggestions: ['optimization', 'conflicts', 'breaks', 'focus_time']
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar suggestions');
      }
      
      const data = await response.json();
      
      // Parse response into suggestions
      const parsedSuggestions = parseCalendarSuggestions(data, events);
      setSuggestions(parsedSuggestions);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Error loading calendar suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      
      // Fallback to mock suggestions for demo
      setSuggestions(generateMockSuggestions(events, selectedDate));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, events]);
  
  useEffect(() => {
    loadScheduleSuggestions();
  }, [loadScheduleSuggestions]);
  
  const parseCalendarSuggestions = (data: any, calendarEvents: any[]): ScheduleSuggestion[] => {
    const suggestions: ScheduleSuggestion[] = [];
    
    // Add break suggestions
    if (calendarEvents.length > 3) {
      suggestions.push({
        id: 'break-suggestion',
        title: 'Schedule a Break',
        description: 'You have a busy day with multiple meetings. Consider adding a 15-minute break between sessions.',
        type: 'break',
        priority: 'medium',
        confidence: 0.85,
        timeSlot: {
          start: '14:00',
          end: '14:15'
        },
        actionable: true,
        metadata: { suggestedDuration: 15 }
      });
    }
    
    // Add focus time suggestions
    const hasEarlyMorning = calendarEvents.some(event => 
      new Date(event.startTime).getHours() < 10
    );
    
    if (!hasEarlyMorning) {
      suggestions.push({
        id: 'focus-time-suggestion',
        title: 'Morning Focus Block',
        description: 'Your morning is free. This is an ideal time for deep work and focused tasks.',
        type: 'focus_time',
        priority: 'high',
        confidence: 0.92,
        timeSlot: {
          start: '08:00',
          end: '10:00'
        },
        actionable: true,
        metadata: { suggestedDuration: 120, taskType: 'deep_work' }
      });
    }
    
    // Add meeting preparation suggestions
    const upcomingMeetings = calendarEvents.filter(event => 
      event.eventType === 'meeting' && 
      new Date(event.startTime) > new Date()
    );
    
    if (upcomingMeetings.length > 0) {
      const nextMeeting = upcomingMeetings[0];
      const prepTime = new Date(new Date(nextMeeting.startTime).getTime() - 30 * 60000);
      
      suggestions.push({
        id: 'meeting-prep-suggestion',
        title: 'Meeting Preparation',
        description: `Prepare for "${nextMeeting.title}" - review agenda and materials.`,
        type: 'meeting_prep',
        priority: 'medium',
        confidence: 0.88,
        timeSlot: {
          start: prepTime.toTimeString().slice(0, 5),
          end: new Date(nextMeeting.startTime).toTimeString().slice(0, 5)
        },
        actionable: true,
        metadata: { meetingId: nextMeeting.id, prepDuration: 30 }
      });
    }
    
    // Add optimization suggestions from AI response
    if (data.optimization_insights) {
      suggestions.push({
        id: 'ai-optimization',
        title: 'Schedule Optimization',
        description: data.optimization_insights,
        type: 'optimization',
        priority: 'medium',
        confidence: data.processing_info?.confidence || 0.85,
        actionable: true,
        metadata: data.schedule_analysis || {}
      });
    }
    
    return suggestions;
  };
  
  const generateMockSuggestions = (calendarEvents: any[], date: Date): ScheduleSuggestion[] => {
    const suggestions: ScheduleSuggestion[] = [];
    
    // Mock suggestions based on current time and events
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 10 && calendarEvents.length > 0) {
      suggestions.push({
        id: 'morning-focus',
        title: 'Prime Focus Time',
        description: 'Your cognitive peak hours (8-10 AM) are available. Perfect for important tasks.',
        type: 'focus_time',
        priority: 'high',
        confidence: 0.92,
        timeSlot: { start: '08:00', end: '10:00' },
        actionable: true
      });
    }
    
    if (calendarEvents.length > 2) {
      suggestions.push({
        id: 'break-needed',
        title: 'Break Reminder',
        description: 'You have a packed schedule. Consider adding short breaks to maintain energy.',
        type: 'break',
        priority: 'medium',
        confidence: 0.85,
        timeSlot: { start: '14:00', end: '14:15' },
        actionable: true
      });
    }
    
    suggestions.push({
      id: 'schedule-optimization',
      title: 'Meeting Consolidation',
      description: 'Consider grouping similar meetings together to create larger blocks of focused time.',
      type: 'optimization',
      priority: 'low',
      confidence: 0.78,
      actionable: true
    });
    
    return suggestions;
  };
  
  const getSuggestionIcon = (type: ScheduleSuggestion['type']) => {
    switch (type) {
      case 'optimization': return Icons.TrendingUp;
      case 'conflict': return Icons.AlertTriangle;
      case 'break': return Icons.Coffee;
      case 'focus_time': return Icons.Focus;
      case 'meeting_prep': return Icons.Users;
      default: return Icons.Lightbulb;
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
  
  const applySuggestion = (suggestion: ScheduleSuggestion) => {
    triggerHaptic('impact', 'medium');
    
    // TODO: Implement suggestion application logic
    switch (suggestion.type) {
      case 'break':
        console.log('Adding break to calendar:', suggestion.timeSlot);
        break;
      case 'focus_time':
        console.log('Blocking focus time:', suggestion.timeSlot);
        break;
      case 'meeting_prep':
        console.log('Adding meeting prep time:', suggestion.metadata);
        break;
      default:
        console.log('Applying suggestion:', suggestion);
    }
  };
  
  return (
    <Card className={cn('border-rix-border-primary h-fit', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Lightbulb className="h-5 w-5 text-rix-accent-primary" />
            AI Suggestions
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              triggerHaptic('selection');
              loadScheduleSuggestions();
            }}
            disabled={loading}
            className={cn(isMobile && 'min-h-[40px] touch-manipulation')}
          >
            <Icons.RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </CardTitle>
        <CardDescription>
          Smart scheduling and optimization for {selectedDate.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading && suggestions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <Icons.AlertTriangle className="w-8 h-8 mx-auto text-rix-text-tertiary mb-2" />
            <p className="text-sm text-rix-text-secondary">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadScheduleSuggestions}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-6">
            <Icons.CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-rix-text-secondary">
              Your schedule looks well-optimized!
            </p>
          </div>
        ) : (
          suggestions.map((suggestion) => {
            const IconComponent = getSuggestionIcon(suggestion.type);
            return (
              <div
                key={suggestion.id}
                className={cn(
                  'p-3 border border-rix-border-secondary rounded-lg transition-colors',
                  'bg-gradient-to-br from-white to-gray-50/50 dark:from-rix-surface dark:to-rix-surface/50',
                  isMobile && 'touch-manipulation active:scale-95'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-rix-accent-primary/10 rounded-lg">
                    <IconComponent className="w-4 h-4 text-rix-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-rix-text-primary text-sm">
                        {suggestion.title}
                      </h4>
                      <Badge className={cn('text-xs', getPriorityColor(suggestion.priority))}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-rix-text-secondary mb-2">
                      {suggestion.description}
                    </p>
                    
                    {suggestion.timeSlot && (
                      <div className="flex items-center gap-1 mb-2">
                        <Icons.Clock className="w-3 h-3 text-rix-text-tertiary" />
                        <span className="text-xs text-rix-text-tertiary">
                          {suggestion.timeSlot.start} - {suggestion.timeSlot.end}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rix-text-tertiary">
                        {Math.round(suggestion.confidence * 100)}% confident
                      </span>
                      
                      {suggestion.actionable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySuggestion(suggestion)}
                          className={cn(
                            'text-xs h-7 px-2',
                            isMobile && 'min-h-[32px] touch-manipulation'
                          )}
                        >
                          <Icons.Zap className="w-3 h-3 mr-1" />
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
        
        {lastUpdated && (
          <div className="text-center">
            <p className="text-xs text-rix-text-tertiary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}