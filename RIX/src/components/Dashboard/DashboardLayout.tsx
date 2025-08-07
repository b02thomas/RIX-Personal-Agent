// /src/components/Dashboard/DashboardLayout.tsx
// Main dashboard layout with responsive 4-widget grid and theme-aware RIX logo integration
// Implements glassmorphism design with floating cards and progressive disclosure structure
// RELEVANT FILES: DashboardWidget.tsx, RixLogo.tsx, theme-provider.tsx, dashboard.module.css

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Target, 
  Zap,
  Plus,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { DashboardWidget, TodayWidget, GoalsWidget, CalendarWidget as CalendarWidgetBase, ActionsWidget } from './DashboardWidget';
import { TodayOverviewWidget } from './TodayOverviewWidget';
import { GoalsProgressWidget } from './GoalsProgressWidget';
import { CalendarWidget } from './CalendarWidget';
import { RixLogo } from '../ui/RixLogo';
import { BreathingAnimation } from '../ui/BreathingAnimation';

export interface DashboardLayoutProps {
  className?: string;
  onNavigate?: (section: string) => void;
}

interface WidgetData {
  id: string;
  type: 'today' | 'goals' | 'calendar' | 'actions';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isLoading: boolean;
  error: string | null;
  data: any;
}

const initialWidgetState: WidgetData[] = [
  {
    id: 'today',
    type: 'today',
    title: 'Today',
    subtitle: 'Your daily overview',
    icon: <CheckSquare className="w-5 h-5" />,
    isLoading: false, // TodayOverviewWidget handles its own loading
    error: null,
    data: null
  },
  {
    id: 'goals',
    type: 'goals',
    title: 'Goals Progress',
    subtitle: 'AI-driven analytics',
    icon: <Target className="w-5 h-5" />,
    isLoading: false, // GoalsProgressWidget handles its own loading
    error: null,
    data: null
  },
  {
    id: 'calendar',
    type: 'calendar',
    title: 'Calendar',
    subtitle: 'Upcoming events',
    icon: <Calendar className="w-5 h-5" />,
    isLoading: true,
    error: null,
    data: null
  },
  {
    id: 'actions',
    type: 'actions',
    title: 'Quick Actions',
    subtitle: 'Common tasks',
    icon: <Zap className="w-5 h-5" />,
    isLoading: false, // Actions don't need loading
    error: null,
    data: null
  }
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  className,
  onNavigate
}) => {
  const { effectiveTheme } = useTheme();
  const [widgets, setWidgets] = useState<WidgetData[]>(initialWidgetState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate data loading
  const loadWidgetData = useCallback(async (widgetId: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Simulate occasional errors for demonstration
    if (Math.random() < 0.1) {
      throw new Error('Failed to load data');
    }
    
    // Return mock data based on widget type
    switch (widgetId) {
      case 'today':
        return {
          tasks: { completed: 7, total: 12, overdue: 2 },
          routines: { completed: 3, total: 5 },
          nextEvent: 'Team meeting at 2:00 PM'
        };
      case 'goals':
        return {
          active: 4,
          progress: 67,
          recentActivity: 'Health goal updated 2 hours ago'
        };
      case 'calendar':
        return {
          todayEvents: 3,
          weekEvents: 8,
          nextEvent: { title: 'Project Review', time: '14:00' }
        };
      default:
        return null;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadAllData = async () => {
      const updatedWidgets = await Promise.all(
        initialWidgetState.map(async (widget) => {
          if (widget.type === 'actions' || widget.type === 'today' || widget.type === 'goals') return widget; // Skip loading for actions, today, and goals (handled by their own widgets)
          
          try {
            const data = await loadWidgetData(widget.id);
            return { ...widget, isLoading: false, data, error: null };
          } catch (error) {
            return { 
              ...widget, 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );
      
      setWidgets(updatedWidgets);
    };

    loadAllData();
  }, [loadWidgetData]);

  // Refresh widget data
  const refreshWidget = async (widgetId: string) => {
    if (widgetId === 'today' || widgetId === 'goals') return; // TodayOverviewWidget and GoalsProgressWidget handle their own refresh
    
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, isLoading: true, error: null } : w
    ));
    
    try {
      const data = await loadWidgetData(widgetId);
      setWidgets(prev => prev.map(w => 
        w.id === widgetId ? { ...w, isLoading: false, data, error: null } : w
      ));
    } catch (error) {
      setWidgets(prev => prev.map(w => 
        w.id === widgetId ? { 
          ...w, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } : w
      ));
    }
  };

  // Refresh all widgets
  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all(
      widgets.filter(w => w.type !== 'actions' && w.type !== 'today' && w.type !== 'goals').map(w => refreshWidget(w.id))
    );
    setIsRefreshing(false);
  };

  // Widget content renderers
  const renderWidgetContent = (widget: WidgetData) => {
    if (widget.error || widget.isLoading) return null;
    
    switch (widget.type) {
      case 'today':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {widget.data?.tasks?.total - widget.data?.tasks?.completed || 0}
                </div>
                <div className="text-sm text-gray-500">Tasks left</div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {widget.data?.routines?.completed || 0}/{widget.data?.routines?.total || 0}
                </div>
                <div className="text-sm text-gray-500">Routines</div>
              </div>
            </div>
            {widget.data?.nextEvent && (
              <div className="p-3 bg-gray-500/10 rounded-lg">
                <div className="text-sm text-gray-400">Next:</div>
                <div className="text-gray-200 font-medium">{widget.data.nextEvent}</div>
              </div>
            )}
          </div>
        );
        
      case 'goals':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {widget.data?.progress || 0}%
              </div>
              <div className="text-sm text-gray-500">Overall progress</div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${widget.data?.progress || 0}%` }}
              />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-200">
                {widget.data?.active || 0} Active Goals
              </div>
            </div>
          </div>
        );
        
      case 'calendar':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {widget.data?.todayEvents || 0}
                </div>
                <div className="text-sm text-gray-500">Today</div>
              </div>
              <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {widget.data?.weekEvents || 0}
                </div>
                <div className="text-sm text-gray-500">This week</div>
              </div>
            </div>
            {widget.data?.nextEvent && (
              <div className="p-3 bg-gray-500/10 rounded-lg">
                <div className="text-sm text-gray-400">Next event:</div>
                <div className="text-gray-200 font-medium">
                  {widget.data.nextEvent.title} at {widget.data.nextEvent.time}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'actions':
        return (
          <div className="space-y-3">
            {[
              { icon: <Plus className="w-4 h-4" />, label: 'New Task', action: 'tasks' },
              { icon: <Calendar className="w-4 h-4" />, label: 'Add Event', action: 'calendar' },
              { icon: <Target className="w-4 h-4" />, label: 'Set Goal', action: 'goals' },
              { icon: <Settings className="w-4 h-4" />, label: 'Settings', action: 'settings' }
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => onNavigate?.(action.action)}
                className="w-full flex items-center gap-3 p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg text-gray-200 text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="text-orange-400">
                  {action.icon}
                </div>
                {action.label}
              </button>
            ))}
          </div>
        );
        
      default:
        return <div className="text-gray-500 text-center">No content available</div>;
    }
  };

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      effectiveTheme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20',
      className
    )}>
      {/* Enhanced Header with RIX Logo */}
      <div className={cn(
        'sticky top-0 z-50 backdrop-blur-lg transition-all duration-300',
        effectiveTheme === 'dark' 
          ? 'bg-gray-900/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50',
        'border-b'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <BreathingAnimation 
              intensity="subtle" 
              duration={5000}
              className="flex items-center gap-4"
            >
              <RixLogo 
                variant="header" 
                size={40} 
                showLabel={false}
                priority
                className="hover:scale-105 transition-transform cursor-pointer"
                onClick={() => onNavigate?.('home')}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  RIX Personal Agent
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your AI-powered productivity dashboard
                </p>
              </div>
            </BreathingAnimation>
            
            {/* Header actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={refreshAll}
                disabled={isRefreshing}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'text-gray-600 dark:text-gray-300',
                  isRefreshing && 'animate-spin cursor-not-allowed opacity-50'
                )}
                aria-label="Refresh all widgets"
                title="Refresh all data"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onNavigate?.('settings')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Message */}
        <div className="mb-8 text-center">
          <BreathingAnimation intensity="subtle" duration={6000}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to your Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stay organized and productive with AI-powered insights and quick access to your most important tasks.
            </p>
          </BreathingAnimation>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {widgets.map((widget) => {
            // Special handling for Today widget
            if (widget.type === 'today') {
              return (
                <TodayOverviewWidget
                  key={widget.id}
                  className="h-full"
                  onNavigate={onNavigate}
                  onTaskClick={(taskId) => onNavigate?.(`tasks/${taskId}`)}
                  onEventClick={(eventId) => onNavigate?.(`calendar/${eventId}`)}
                />
              );
            }

            // Special handling for Goals widget with AI-powered progress
            if (widget.type === 'goals') {
              return (
                <GoalsProgressWidget
                  key={widget.id}
                  className="h-full"
                  onNavigate={onNavigate}
                  onGoalClick={(goalId) => onNavigate?.(`goals/${goalId}`)}
                  onCreateGoal={() => onNavigate?.('goals/create')}
                />
              );
            }

            // Special handling for Calendar widget
            if (widget.type === 'calendar') {
              return (
                <CalendarWidget
                  key={widget.id}
                  className="h-full"
                  onNavigate={onNavigate}
                  onEventClick={(eventId) => onNavigate?.(`calendar/event/${eventId}`)}
                  onCreateTimeBlock={(slot) => {
                    console.log('Create time block requested:', slot);
                    // Could open time block creation modal or navigate to calendar
                    onNavigate?.('calendar/block-time');
                  }}
                  businessCulture="german"
                />
              );
            }

            // Actions widget handling
            return (
              <ActionsWidget
                key={widget.id}
                title={widget.title}
                subtitle={widget.subtitle}
                icon={widget.icon}
                isLoading={widget.isLoading}
                error={widget.error}
                onRefresh={() => refreshWidget(widget.id)}
                className="h-full"
              >
                {renderWidgetContent(widget)}
              </ActionsWidget>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Ready to build your second brain? Start by exploring the widgets above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;