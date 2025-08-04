// /src/app/dashboard/routines/page.tsx
// Routines page with completion boxes and habit tracking interface
// Integrates with backend API for routine management and N8N MCP routing for AI insights
// RELEVANT FILES: /src/app/api/routines/route.ts, components/ui/card.tsx, components/ui/button.tsx, store/navigation-store.ts

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useMobileOptimization } from '@/components/mobile/mobile-touch-optimizer';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
import { AICoachingCard } from '@/components/intelligence/ai-coaching-card';
// Mobile components for enhanced mobile experience
import { MobileSwipeCard } from '@/components/mobile/mobile-swipe-card';
import { MobileFAB } from '@/components/mobile/mobile-fab';
import { MobilePullRefresh } from '@/components/mobile/mobile-pull-refresh';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance optimization
const Icons = {
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Flame: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Flame })), { ssr: false }),
  Target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  Circle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Circle })), { ssr: false }),
  Coffee: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Coffee })), { ssr: false }),
  Book: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Book })), { ssr: false }),
  Dumbbell: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Dumbbell })), { ssr: false }),
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  Check: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Check })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Pause: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Pause })), { ssr: false })
};

interface Habit {
  id: string;
  name: string;
  duration: number;
  completed: boolean;
}

interface Routine {
  id: string;
  userId: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  durationMinutes: number;
  habits: Habit[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Client-side computed fields
  streak?: number;
  completedToday?: boolean;
  targetStreak?: number;
}

interface RoutineCompletion {
  id: string;
  routineId: string;
  userId: string;
  completionDate: string;
  habitsCompleted: Record<string, boolean>;
  totalHabits: number;
  completedHabits: number;
  completionPercentage: number;
  notes?: string;
  createdAt: string;
}

// API functions for routine management
const fetchRoutines = async (): Promise<{ routines: Routine[], total: number }> => {
  try {
    const response = await fetch('/api/routines?include_completions=true', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch routines');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching routines:', error);
    throw error;
  }
};

const createRoutine = async (routineData: Partial<Routine>): Promise<{ routine: Routine }> => {
  try {
    const response = await fetch('/api/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(routineData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create routine');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
};

const completeRoutine = async (routineId: string, habitsCompleted: Record<string, boolean>): Promise<{ completion: RoutineCompletion }> => {
  try {
    const response = await fetch(`/api/routines/${routineId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ habitsCompleted }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to complete routine');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing routine:', error);
    throw error;
  }
};

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<'all' | Routine['frequency']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuthStore();
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback();
  
  // Enhanced mobile gesture support for routine interactions
  const { setupSwipeToClose } = useMobileGestures({
    onSwipeLeft: undefined,
    onSwipeRight: undefined,
    enabled: isMobile
  });

  useEffect(() => {
    setMounted(true);
    loadRoutines();
  }, []);
  
  const loadRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRoutines();
      setRoutines(data.routines.map(routine => ({
        ...routine,
        streak: Math.floor(Math.random() * 30), // Mock streak data
        completedToday: Math.random() > 0.5,
        targetStreak: 30
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateRoutine = async (routineData: Partial<Routine>) => {
    try {
      const result = await createRoutine(routineData);
      setRoutines(prev => [...prev, { 
        ...result.routine, 
        streak: 0, 
        completedToday: false,
        targetStreak: 30
      }]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create routine');
    }
  };

  const filteredRoutines = routines.filter(routine => 
    selectedFrequency === 'all' || routine.frequency === selectedFrequency
  );

  const toggleHabitCompletion = (routineId: string, habitId: string) => {
    // Enhanced haptic feedback for habit completion
    triggerHaptic('impact', 'medium');
    setRoutines(routines.map(routine => {
      if (routine.id === routineId) {
        const updatedHabits = routine.habits.map(habit => 
          habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
        );
        const completedHabits = updatedHabits.filter(h => h.completed).length;
        const isFullyCompleted = completedHabits === updatedHabits.length;
        
        // Additional success haptic when routine is fully completed
        if (isFullyCompleted && !routine.completedToday) {
          setTimeout(() => triggerHaptic('notification', 'medium', 'success'), 150);
        }
        
        return {
          ...routine,
          habits: updatedHabits,
          completedToday: isFullyCompleted
        };
      }
      return routine;
    }));
  };
  
  const completeEntireRoutine = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    
    // Strong haptic feedback for complete routine action
    triggerHaptic('impact', 'heavy');
    
    try {
      const habitsCompleted = routine.habits.reduce((acc, habit) => {
        acc[habit.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      await completeRoutine(routineId, habitsCompleted);
      
      // Success haptic when routine is completed
      triggerHaptic('notification', 'medium', 'success');
      
      setRoutines(routines.map(r => {
        if (r.id === routineId) {
          return {
            ...r,
            habits: r.habits.map(h => ({ ...h, completed: true })),
            completedToday: true,
            streak: (r.streak || 0) + 1
          };
        }
        return r;
      }));
    } catch (err) {
      // Error haptic feedback
      triggerHaptic('notification', 'heavy', 'error');
      setError(err instanceof Error ? err.message : 'Failed to complete routine');
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'weekly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'monthly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Täglich';
      case 'weekly': return 'Wöchentlich';
      case 'monthly': return 'Monatlich';
      default: return frequency;
    }
  };

  const getRoutineIcon = (timeOfDay: string) => {
    const hour = parseInt(timeOfDay.split(':')[0]);
    if (hour < 12) return Icons.Coffee; // Morning
    if (hour < 17) return Icons.Brain; // Afternoon
    return Icons.Book; // Evening
  };

  const getStreakColor = (streak: number, target: number) => {
    const percentage = (streak / target) * 100;
    if (percentage >= 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const formatTime = (timeString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01T${timeString}`));
  };

  const totalRoutines = routines.length;
  const completedToday = routines.filter(r => r.completedToday).length;
  const averageStreak = totalRoutines > 0 ? Math.round(routines.reduce((sum, r) => sum + (r.streak || 0), 0) / totalRoutines) : 0;
  const totalTime = routines.filter(r => r.completedToday).reduce((sum, r) => sum + r.durationMinutes, 0);

  // Mobile helper functions for swipe actions and FAB
  const getRoutineActions = (
    onComplete: () => void,
    onEdit: () => void,
    onPause: () => void,
    onDelete: () => void
  ) => ({
    left: [
      {
        id: 'complete',
        label: 'Complete',
        icon: Icons.Check,
        color: 'green' as const,
        action: onComplete
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: Icons.Settings,
        color: 'blue' as const,
        action: onEdit
      }
    ],
    right: [
      {
        id: 'pause',
        label: 'Pause',
        icon: Icons.Pause,
        color: 'yellow' as const,
        action: onPause
      }
    ]
  });

  const getRoutineFABActions = (
    onCreateRoutine: () => void,
    onRefresh: () => void
  ) => [
    {
      id: 'create',
      label: 'New Routine',
      icon: Icons.Plus,
      onClick: onCreateRoutine,
      color: 'primary' as const
    }
  ];

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
          <Icons.RotateCcw className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-rix-text-primary mb-2">Error loading routines</h3>
          <p className="text-rix-text-secondary mb-4">{error}</p>
          <Button onClick={loadRoutines}>Retry</Button>
        </div>
      </div>
    );
  }

  const RoutinesContent = (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-rix-text-primary">
            Routinen & Gewohnheiten
          </h1>
          <p className="text-rix-text-secondary mt-1">
            Entwickeln Sie nachhaltige Gewohnheiten für persönliches Wachstum
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
          Neue Routine
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Icons.Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Heute</p>
                <p className="text-xl font-bold text-rix-text-primary">
                  {completedToday}/{totalRoutines}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Icons.Flame className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Ø Streak</p>
                <p className="text-xl font-bold text-rix-text-primary">{averageStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Icons.Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Zeit heute</p>
                <p className="text-xl font-bold text-rix-text-primary">{totalTime}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Icons.TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Erfolgsrate</p>
                <p className="text-xl font-bold text-rix-text-primary">
                  {Math.round((completedToday / totalRoutines) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="border-rix-border-primary">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFrequency === 'all' ? 'default' : 'outline'}
              size={isMobile ? "default" : "sm"}
              onClick={() => {
                triggerHaptic('selection');
                setSelectedFrequency('all');
              }}
              className={cn(
                "min-h-[44px] touch-manipulation",
                isMobile && "px-6 text-sm font-medium"
              )}
            >
              Alle
            </Button>
            {['daily', 'weekly', 'monthly'].map((frequency) => (
              <Button
                key={frequency}
                variant={selectedFrequency === frequency ? 'default' : 'outline'}
                size={isMobile ? "default" : "sm"}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedFrequency(frequency as Routine['frequency']);
                }}
                className={cn(
                  "min-h-[44px] touch-manipulation",
                  isMobile && "px-6 text-sm font-medium"
                )}
              >
                {getFrequencyLabel(frequency)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Routines List */}
      <div className="space-y-4">
        {filteredRoutines.length === 0 ? (
          <Card className="border-rix-border-primary">
            <CardContent className="p-8 text-center">
              <Icons.RotateCcw className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-rix-text-primary mb-2">
                Keine Routinen gefunden
              </h3>
              <p className="text-rix-text-secondary">
                Erstellen Sie Ihre erste Routine für diese Kategorie.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRoutines.map((routine) => {
            const IconComponent = getRoutineIcon(routine.timeOfDay);
            const streakPercentage = ((routine.streak || 0) / (routine.targetStreak || 30)) * 100;
            const completedHabits = routine.habits.filter(h => h.completed).length;
            const completionPercentage = routine.habits.length > 0 ? (completedHabits / routine.habits.length) * 100 : 0;
            
            // Enhanced mobile interactions with swipe actions
            const swipeActions = isMobile ? getRoutineActions(
              () => completeEntireRoutine(routine.id),
              () => {
                // TODO: Implement edit functionality
                console.log('Edit routine:', routine.id);
              },
              () => {
                // TODO: Implement pause functionality
                console.log('Pause routine:', routine.id);
              },
              () => {
                // TODO: Implement delete functionality
                console.log('Delete routine:', routine.id);
              }
            ) : { left: [], right: [] };
            
            const RoutineCard = (
              <Card 
                className={cn(
                  "border-rix-border-primary transition-all duration-200",
                  "touch-manipulation select-none",
                  isMobile ? (
                    "active:scale-[0.98] rounded-xl"
                  ) : (
                    "hover:shadow-rix-md"
                  ),
                  routine.completedToday && "ring-2 ring-rix-success ring-opacity-20"
                )}
              >
                {/* Card content remains the same */}
                <CardContent className={cn(
                  isMobile ? "p-4" : "p-4 md:p-6"
                )}>
                  <div className="flex items-start space-x-4">
                    {/* Quick Complete Button - Enhanced for Mobile */}
                    <button
                      onClick={() => completeEntireRoutine(routine.id)}
                      className={cn(
                        "flex-shrink-0 rounded-full border-2 transition-all duration-200",
                        "flex items-center justify-center touch-manipulation",
                        isMobile ? "w-12 h-12" : "w-8 h-8",
                        routine.completedToday
                          ? "bg-rix-success border-rix-success text-white"
                          : "border-rix-border-primary hover:border-rix-accent-primary active:scale-95"
                      )}
                      disabled={routine.completedToday}
                      title={routine.completedToday ? "Already completed" : "Complete all habits"}
                      aria-label={routine.completedToday ? "Routine bereits abgeschlossen" : "Alle Gewohnheiten abschließen"}
                    >
                      {routine.completedToday ? (
                        <Icons.CheckCircle className={cn(isMobile ? "w-6 h-6" : "w-5 h-5")} />
                      ) : (
                        <Icons.Circle className={cn(isMobile ? "w-6 h-6" : "w-5 h-5")} />
                      )}
                    </button>

                    {/* Routine Icon */}
                    <div className={cn(
                      "flex-shrink-0 p-3 rounded-lg",
                      getFrequencyColor(routine.frequency).replace('text-', 'bg-').replace('-800', '-100').replace('-400', '/20')
                    )}>
                      <IconComponent className={cn(
                        "w-6 h-6",
                        getFrequencyColor(routine.frequency).split(' ')[1]
                      )} />
                    </div>

                    {/* Routine Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        {/* Title and Description */}
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-semibold text-rix-text-primary",
                            routine.completedToday && "text-rix-success"
                          )}>
                            {routine.name}
                          </h3>
                          <p className="text-sm text-rix-text-secondary mt-1">
                            {routine.description}
                          </p>
                          
                          {/* Frequency and Duration */}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={cn("text-xs", getFrequencyColor(routine.frequency))}>
                              {getFrequencyLabel(routine.frequency)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Icons.Clock className="w-3 h-3 mr-1" />
                              {routine.durationMinutes}min
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {formatTime(routine.timeOfDay)}
                            </Badge>
                          </div>
                          
                          {/* Individual Habit Completion Boxes */}
                          <div className="mt-3">
                            <div className="text-sm font-medium text-rix-text-primary mb-2">
                              Gewohnheiten ({completedHabits}/{routine.habits.length})
                            </div>
                            <div className={cn(
                              "grid gap-2",
                              isMobile ? "grid-cols-1" : "grid-cols-1"
                            )}>
                              {routine.habits.map((habit) => (
                                <div 
                                  key={habit.id} 
                                  className={cn(
                                    "flex items-center space-x-3 p-3 border border-rix-border-secondary rounded-lg",
                                    "transition-colors duration-200",
                                    isMobile && "min-h-[56px] active:bg-rix-surface/50"
                                  )}
                                >
                                  <button
                                    onClick={() => toggleHabitCompletion(routine.id, habit.id)}
                                    className={cn(
                                      "rounded border-2 transition-all duration-200",
                                      "flex items-center justify-center touch-manipulation",
                                      isMobile ? "w-6 h-6 min-w-[24px]" : "w-5 h-5",
                                      habit.completed
                                        ? "bg-rix-success border-rix-success text-white"
                                        : "border-rix-border-primary hover:border-rix-accent-primary active:scale-95"
                                    )}
                                    aria-label={habit.completed ? `${habit.name} abgeschlossen` : `${habit.name} markieren`}
                                  >
                                    {habit.completed && (
                                      <Icons.CheckCircle className={cn(isMobile ? "w-4 h-4" : "w-3 h-3")} />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className={cn(
                                        isMobile ? "text-base" : "text-sm",
                                        "font-medium truncate",
                                        habit.completed ? "line-through text-rix-text-tertiary" : "text-rix-text-primary"
                                      )}>
                                        {habit.name}
                                      </span>
                                      <span className={cn(
                                        "text-xs text-rix-text-tertiary ml-2 flex-shrink-0",
                                        isMobile && "text-sm"
                                      )}>
                                        {habit.duration}min
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Progress and Streak */}
                        <div className="flex flex-col space-y-2 flex-shrink-0">
                          {/* Overall Progress */}
                          <div className="text-right">
                            <div className="text-xs text-rix-text-secondary mb-1">
                              Heute: {Math.round(completionPercentage)}%
                            </div>
                            <div className="w-24 h-2 bg-rix-border-secondary rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  completionPercentage >= 100 ? "bg-rix-success" :
                                  completionPercentage >= 75 ? "bg-blue-500" :
                                  completionPercentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${completionPercentage}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Streak Display */}
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Icons.Flame className={cn(
                                "w-4 h-4",
                                getStreakColor(routine.streak || 0, routine.targetStreak || 30)
                              )} />
                              <span className={cn(
                                "font-bold text-sm",
                                getStreakColor(routine.streak || 0, routine.targetStreak || 30)
                              )}>
                                {routine.streak || 0}
                              </span>
                            </div>
                            <p className="text-xs text-rix-text-tertiary">
                              Streak
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            
            return (
              <MobileSwipeCard
                key={routine.id}
                leftActions={swipeActions.left}
                rightActions={swipeActions.right}
                enableSwipe={isMobile && !routine.completedToday} // Disable swipe for completed routines
                className="mb-4"
              >
                {RoutineCard}
              </MobileSwipeCard>
            );
          })
        )}
      </div>

      {/* AI Coaching Section */}
      <AICoachingCard 
        type="routine" 
        context={{
          routines_count: totalRoutines,
          completed_today: completedToday,
          completion_rate: Math.round((completedToday / totalRoutines) * 100),
          average_streak: averageStreak,
          selected_frequency: selectedFrequency,
          user_id: user?.id
        }}
        className="mb-6"
      />

      {/* Motivation Card */}
      <Card className="border-rix-border-primary bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
        <CardContent className="p-6 text-center">
          <Icons.Target className="w-12 h-12 mx-auto text-rix-accent-primary mb-4" />
          <h3 className="text-lg font-semibold text-rix-text-primary mb-2">
            Großartige Arbeit! 
          </h3>
          <p className="text-rix-text-secondary">
            Sie haben heute {completedToday} von {totalRoutines} Routinen erfolgreich abgeschlossen. 
            Kontinuität ist der Schlüssel zum Erfolg.
          </p>
        </CardContent>
      </Card>
      
      {/* Mobile FAB for quick actions */}
      {isMobile && (
        <MobileFAB
          actions={getRoutineFABActions(
            () => {
              triggerHaptic('impact', 'medium');
              setShowCreateForm(true);
            },
            () => {
              triggerHaptic('impact', 'medium');
              // TODO: Implement quick habit functionality
              console.log('Quick habit');
            }
          )}
          position="bottom-right"
          expandDirection="up"
        />
      )}
      
      {/* Routine Creation Modal */}
      {showCreateForm && (
        <RoutineCreationModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateRoutine}
        />
      )}
    </div>
  );
  
  // Main component return with mobile optimization
  return isMobile ? (
    <MobilePullRefresh
      onRefresh={async () => {
        triggerHaptic('impact', 'light');
        await loadRoutines();
      }}
      className="min-h-screen"
    >
      {RoutinesContent}
    </MobilePullRefresh>
  ) : (
    RoutinesContent
  );
}

// Routine Creation Modal Component
interface RoutineCreationModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<Routine>) => void;
}

const RoutineCreationModal: React.FC<RoutineCreationModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as Routine['frequency'],
    timeOfDay: '09:00',
    durationMinutes: 30,
    habits: [] as Omit<Habit, 'id' | 'completed'>[],
  });
  const [habitInput, setHabitInput] = useState({ name: '', duration: 10 });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.habits.length === 0) return;
    
    onSubmit({
      ...formData,
      habits: formData.habits.map(habit => ({
        ...habit,
        id: `habit-${Date.now()}-${Math.random()}`,
        completed: false
      }))
    });
  };
  
  const addHabit = () => {
    if (habitInput.name.trim()) {
      setFormData(prev => ({
        ...prev,
        habits: [...prev.habits, { ...habitInput }]
      }));
      setHabitInput({ name: '', duration: 10 });
    }
  };
  
  const removeHabit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      habits: prev.habits.filter((_, i) => i !== index)
    }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Neue Routine erstellen</CardTitle>
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
                placeholder="Routine Name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Routine Beschreibung"
                className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Häufigkeit</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as Routine['frequency'] }))}
                  className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                >
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Uhrzeit</label>
                <Input
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeOfDay: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Gewohnheiten *</label>
              <div className="mt-1 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={habitInput.name}
                    onChange={(e) => setHabitInput(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Gewohnheit"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={habitInput.duration}
                    onChange={(e) => setHabitInput(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                    placeholder="Min"
                    className="w-20"
                    min="1"
                  />
                  <Button type="button" onClick={addHabit} size="sm">
                    <Icons.Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {formData.habits.map((habit, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-rix-border-secondary rounded">
                    <span className="text-sm">{habit.name} ({habit.duration}min)</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHabit(index)}
                    >
                      <Icons.X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={formData.habits.length === 0}>
                Erstellen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
  
