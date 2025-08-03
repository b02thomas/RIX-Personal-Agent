// /src/app/dashboard/calendar/page.tsx
// Calendar page with time-blocking interface and intelligent scheduling display
// Integrates with backend API for calendar management and N8N MCP routing for AI optimization
// RELEVANT FILES: /src/app/api/calendar/route.ts, components/ui/card.tsx, components/ui/button.tsx, components/calendar/time-block-editor.tsx

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useMobileOptimization } from '@/components/mobile/mobile-touch-optimizer';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useMobileGestures } from '@/hooks/use-mobile-gestures';
import { CalendarAISidebar } from '@/components/intelligence/calendar-ai-sidebar';
// Mobile components temporarily disabled for build fix
// import { MobileFAB, getCalendarFABActions } from '@/components/mobile/mobile-fab';
// import { MobilePullRefresh } from '@/components/mobile/mobile-pull-refresh';

// Dynamic icon imports for performance optimization
const Icons = {
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  Users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), { ssr: false }),
  MapPin: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MapPin })), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), { ssr: false }),
  Lightbulb: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Lightbulb })), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  Filter: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Filter })), { ssr: false }),
  ChevronLeft: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronLeft })), { ssr: false }),
  ChevronRight: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false })
};

// Use Icons.ComponentName instead of individual imports
const CalendarIcon = Icons.Calendar;
const ClockIcon = Icons.Clock;
const UsersIcon = Icons.Users;
const MapPinIcon = Icons.MapPin;
const TrendingUpIcon = Icons.TrendingUp;
const LightbulbIcon = Icons.Lightbulb;
const PlusIcon = Icons.Plus;
const FilterIcon = Icons.Filter;

interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  eventType?: 'time_block' | 'meeting' | 'task' | 'reminder';
  projectId?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'work' | 'break' | 'meeting' | 'focus' | 'personal';
  productivity?: number;
  projectId?: string;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  type: 'schedule_optimization' | 'break_reminder' | 'task_suggestion';
}

// API functions for calendar management
const fetchCalendarEvents = async (startDate?: string, endDate?: string): Promise<{ events: CalendarEvent[], total: number }> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('include_projects', 'true');
    
    const response = await fetch(`/api/calendar?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

const createCalendarEvent = async (eventData: Partial<CalendarEvent>): Promise<{ event: CalendarEvent }> => {
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

const fetchTimeBlocks = async (): Promise<{ timeBlocks: TimeBlock[] }> => {
  try {
    const response = await fetch('/api/calendar/time-blocks', {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch time blocks');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching time blocks:', error);
    throw error;
  }
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const { isMobile } = useMobileOptimization();
  const { triggerHaptic } = useHapticFeedback();
  
  // Enhanced mobile gesture support for calendar interactions
  const { setupSwipeToClose } = useMobileGestures({
    onSwipeLeft: () => {
      // Navigate to previous day on swipe left
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      triggerHaptic('selection');
      setSelectedDate(prevDay);
    },
    onSwipeRight: () => {
      // Navigate to next day on swipe right
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      triggerHaptic('selection');
      setSelectedDate(nextDay);
    },
    enabled: isMobile && view === 'day'
  });

  useEffect(() => {
    setMounted(true);
    loadCalendarData();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const [eventsData, timeBlocksData] = await Promise.all([
        fetchCalendarEvents(startDate.toISOString(), endDate.toISOString()),
        fetchTimeBlocks()
      ]);
      
      setEvents(eventsData.events);
      setTimeBlocks(timeBlocksData.timeBlocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      triggerHaptic('impact', 'medium');
      const result = await createCalendarEvent(eventData);
      setEvents(prev => [...prev, result.event]);
      triggerHaptic('notification', 'medium', 'success');
      setShowCreateForm(false);
    } catch (err) {
      triggerHaptic('notification', 'heavy', 'error');
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type?: string) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      task: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      time_block: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  const getTimeBlockTypeColor = (type: TimeBlock['type']) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      break: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      meeting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      focus: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      personal: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };
  
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.eventType === filter);
    
  // Generate mock AI suggestions based on current schedule
  const mockAISuggestions: AISuggestion[] = [
    {
      id: '1',
      title: 'Pause einlegen',
      description: 'Sie arbeiten seit 3 Stunden. Eine 15-minütige Pause würde Ihre Produktivität steigern.',
      priority: 'medium',
      type: 'break_reminder'
    },
    {
      id: '2', 
      title: 'Meeting vorbereiten',
      description: 'Ihr nächstes Meeting ist in 30 Minuten. Zeit für eine kurze Vorbereitung.',
      priority: 'high',
      type: 'task_suggestion'
    },
    {
      id: '3',
      title: 'Fokuszeit optimieren',
      description: 'Verschieben Sie Ihre Fokuszeit um 1 Stunde früher für bessere Konzentration.',
      priority: 'low',
      type: 'schedule_optimization'
    }
  ];
  
  // Mock daily schedule metrics
  const mockDailySchedule = {
    productivity: Math.round(75 + Math.random() * 20),
    focusHours: Math.round(4 + Math.random() * 4),
    breaks: Math.round(2 + Math.random() * 3)
  };
  
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
          <CalendarIcon className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-rix-text-primary mb-2">Error loading calendar</h3>
          <p className="text-rix-text-secondary mb-4">{error}</p>
          <Button onClick={loadCalendarData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header for Mobile */}
      <div className={cn(
        "flex items-center justify-between",
        isMobile && "flex-col space-y-4"
      )}>
        <div className={cn(isMobile && "text-center")}>
          <h1 className={cn(
            "font-bold text-rix-text-primary",
            isMobile ? "text-2xl" : "text-3xl"
          )}>Smart Calendar</h1>
          <p className="text-rix-text-secondary mt-1">
            Intelligente Terminplanung und Produktivitätsoptimierung
          </p>
        </div>
        
        {/* Mobile-optimized action buttons */}
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
              triggerHaptic('selection');
              // TODO: Implement filter functionality
            }}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            onClick={() => {
              triggerHaptic('impact', 'medium');
              setShowCreateForm(true);
            }}
            size={isMobile ? "default" : "sm"}
            className={cn(
              isMobile && "flex-1 min-h-[48px] touch-manipulation font-semibold"
            )}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Neuer Termin
          </Button>
        </div>
      </div>
      
      {/* Mobile Date Navigation */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 bg-rix-surface rounded-lg border border-rix-border-primary">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prevDay = new Date(selectedDate);
              prevDay.setDate(prevDay.getDate() - 1);
              triggerHaptic('selection');
              setSelectedDate(prevDay);
            }}
            className="touch-manipulation min-w-[44px] min-h-[44px]"
          >
            <Icons.ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <div className="font-semibold text-rix-text-primary">
              {formatDate(selectedDate)}
            </div>
            <div className="text-sm text-rix-text-secondary">
              {events.length} Termine
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextDay = new Date(selectedDate);
              nextDay.setDate(nextDay.getDate() + 1);
              triggerHaptic('selection');
              setSelectedDate(nextDay);
            }}
            className="touch-manipulation min-w-[44px] min-h-[44px]"
          >
            <Icons.ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Productivity Overview - Mobile Optimized */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "md:grid-cols-4"
      )}>
        <Card className="border-rix-border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produktivität</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDailySchedule.productivity}%</div>
            <p className="text-xs text-muted-foreground">
              +5% gegenüber gestern
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fokus-Zeit</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDailySchedule.focusHours}h</div>
            <p className="text-xs text-muted-foreground">
              von 8h geplant
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Termine</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              heute geplant
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausen</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDailySchedule.breaks}</div>
            <p className="text-xs text-muted-foreground">
              genommen
            </p>
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-1" : "md:grid-cols-3"
      )}>
        {/* Today's Schedule - Enhanced for Mobile */}
        <div className={cn(isMobile ? "" : "md:col-span-2")}>
          <Card className="border-rix-border-primary">
            <CardHeader className={cn(isMobile && "pb-4")}>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {isMobile ? "Heute" : `Heute: ${formatDate(selectedDate)}`}
              </CardTitle>
              <CardDescription>
                {isMobile ? "Tagesplan" : "Ihr Tagesplan mit Terminen und Zeitblöcken"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Blocks */}
              <div>
                <h3 className="font-medium mb-3">Zeitblöcke</h3>
                <div className="space-y-3">
                  {timeBlocks.length === 0 ? (
                    <div className="text-center py-6 text-rix-text-secondary">
                      <p>Keine Zeitblöcke für heute</p>
                    </div>
                  ) : (
                    timeBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "flex items-center justify-between p-3 border border-rix-border-primary rounded-lg transition-colors",
                          "touch-manipulation",
                          isMobile ? (
                            "active:bg-rix-surface min-h-[60px]"
                          ) : (
                            "hover:bg-rix-surface/50"
                          )
                        )}
                        onClick={() => isMobile && triggerHaptic('selection')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            (block.productivity || 0) >= 80 ? 'bg-green-500' :
                            (block.productivity || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium text-rix-text-primary">{block.title}</p>
                            <p className="text-sm text-rix-text-secondary">
                              {formatTime(block.startTime.toISOString())} - {formatTime(block.endTime.toISOString())}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getTimeBlockTypeColor(block.type)}>
                            {block.type}
                          </Badge>
                          {block.productivity && (
                            <span className="text-sm text-rix-text-secondary">
                              {block.productivity}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Events */}
              <div>
                <h3 className="font-medium mb-3">Termine</h3>
                <div className="space-y-3">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-6 text-rix-text-secondary">
                      <p>Keine Termine für heute</p>
                    </div>
                  ) : (
                    filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-3 border border-rix-border-primary rounded-lg transition-colors",
                          "touch-manipulation",
                          isMobile ? (
                            "active:bg-rix-surface min-h-[80px]"
                          ) : (
                            "hover:bg-rix-surface/50"
                          )
                        )}
                        onClick={() => isMobile && triggerHaptic('selection')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-rix-text-primary">{event.title}</h4>
                              {event.eventType && (
                                <Badge variant="outline" className={getEventTypeColor(event.eventType)}>
                                  {event.eventType === 'time_block' ? 'Block' : event.eventType}
                                </Badge>
                              )}
                              {event.priority === 'high' && (
                                <Badge className={getPriorityColor(event.priority)}>
                                  Hoch
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-rix-text-secondary mb-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-rix-text-tertiary">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" />
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                              {event.tags && event.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span>{event.tags.slice(0, 2).join(', ')}</span>
                                  {event.tags.length > 2 && <span>...</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions Sidebar */}
        <div>
          <CalendarAISidebar 
            selectedDate={selectedDate}
            events={events}
            className="sticky top-4"
          />
        </div>
      </div>
      
      {/* Mobile FAB for quick actions */}
      {isMobile && (
        <MobileFAB
          actions={getCalendarFABActions(
            () => {
              triggerHaptic('impact', 'medium');
              setShowCreateForm(true);
            },
            () => {
              triggerHaptic('impact', 'medium');
              // TODO: Implement quick time block functionality
              console.log('Quick time block');
            },
            () => {
              triggerHaptic('impact', 'medium');
              // TODO: Implement quick reminder functionality
              console.log('Quick reminder');
            }
          )}
          position="bottom-right"
          expandDirection="up"
        />
      )}
      
      {/* Event Creation Modal */}
      {showCreateForm && (
        <EventCreationModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateEvent}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

// Event Creation Modal Component
interface EventCreationModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<CalendarEvent>) => void;
  selectedDate: Date;
}

const EventCreationModal: React.FC<EventCreationModalProps> = ({ onClose, onSubmit, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    isAllDay: false,
    eventType: 'meeting' as CalendarEvent['eventType'],
    priority: 'medium' as CalendarEvent['priority'],
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  
  useEffect(() => {
    // Set default times based on selected date
    const start = new Date(selectedDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(10, 0, 0, 0);
    
    setFormData(prev => ({
      ...prev,
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16)
    }));
  }, [selectedDate]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.startTime || !formData.endTime) return;
    
    onSubmit({
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
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
      <Card className={cn(
        "w-full max-h-[90vh] overflow-y-auto border-rix-border-primary",
        "max-w-md",
        "bg-rix-bg-secondary"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-rix-text-primary">Neuen Termin erstellen</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="touch-manipulation min-w-[44px] min-h-[44px] text-rix-text-secondary"
            >
              <Icons.X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Titel *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Termin Titel"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Termin Beschreibung"
                className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Startzeit *</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Endzeit *</label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-rix-text-primary">Ort</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ort oder Online-Link"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Typ</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value as CalendarEvent['eventType'] }))}
                  className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                >
                  <option value="meeting">Meeting</option>
                  <option value="task">Aufgabe</option>
                  <option value="reminder">Erinnerung</option>
                  <option value="time_block">Zeitblock</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-rix-text-primary">Priorität</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
                  className="mt-1 w-full px-3 py-2 border border-rix-border-primary rounded-md bg-rix-surface text-rix-text-primary"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
                className="rounded border-rix-border-primary"
              />
              <label htmlFor="allDay" className="text-sm text-rix-text-primary">
                Ganztägig
              </label>
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
};

 