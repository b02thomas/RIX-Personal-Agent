// /src/hooks/useCalendar.ts
// React hook for calendar management with Motion-style time blocking and German business optimization
// Provides intelligent scheduling, AI suggestions, and real-time calendar synchronization
// RELEVANT FILES: CalendarWidget.tsx, TimeBlock.tsx, MeetingCard.tsx, /src/types/calendar.ts

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CalendarPreview,
  CalendarEvent,
  TimeBlock,
  AvailableSlot,
  SchedulingSuggestion,
  SchedulingWarning,
  BusinessSettings,
  SyncStatus,
  UseCalendarReturn,
  TimeBlockType,
  Priority
} from '@/types/calendar';

// Configuration interface for the hook
export interface UseCalendarOptions {
  includeBusinessSettings?: boolean;
  enableRealTimeUpdates?: boolean;
  autoRefreshInterval?: number; // minutes
  culture?: 'german' | 'international';
  timezone?: string;
}

// Default German business settings
const DEFAULT_GERMAN_BUSINESS: BusinessSettings = {
  culture: 'german',
  timezone: 'Europe/Berlin',
  workHours: {
    start: '08:00',
    end: '17:00',
    timezone: 'Europe/Berlin'
  },
  meetingPreferences: {
    bufferTime: 15, // German punctuality
    lunchBlock: true, // 12-13 Uhr sacred
    lateWarning: true, // After 17 Uhr
    overtimeAlert: true, // After 18 Uhr
    maxBackToBack: 4, // Max consecutive meetings
    preferredDurations: [30, 60, 90] // Standard German meeting lengths
  },
  breakPreferences: {
    morning: true, // 9:30-10:00 coffee break
    afternoon: true, // 15:00-15:15 afternoon break
    lunchDuration: 60, // Full hour lunch
    minBreakBetween: 15 // Minimum break between meetings
  },
  culturalSettings: {
    punctualityBuffer: 10, // Extra time for German punctuality
    preferMorningMeetings: true, // Germans prefer morning meetings
    avoidFridayAfternoon: true, // German weekend culture
    respectPublicHolidays: true
  }
};

// Mock data for development
const MOCK_CALENDAR_PREVIEW: CalendarPreview = {
  today: new Date(),
  nextMeetings: [
    {
      id: 'meeting-1',
      title: 'Team Standup',
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      location: 'Conference Room A',
      type: 'meeting',
      priority: 'medium',
      status: 'confirmed',
      isAllDay: false,
      attendees: [
        { email: 'team@company.com', name: 'Development Team', status: 'accepted' }
      ],
      source: 'google',
      preparation: {
        suggestedMinutes: 10,
        tasks: ['Review sprint progress', 'Prepare blockers discussion'],
        aiSuggestions: ['Check latest commits before meeting']
      },
      businessContext: {
        isGermanBusinessHours: true,
        requiresLunchBreak: false,
        lateWarning: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'meeting-2',
      title: 'Client Presentation',
      startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      meetingUrl: 'https://meet.google.com/abc-def-ghi',
      type: 'meeting',
      priority: 'high',
      status: 'confirmed',
      isAllDay: false,
      attendees: [
        { email: 'client@partner.com', name: 'Client Team', status: 'accepted' },
        { email: 'sales@company.com', name: 'Sales Rep', status: 'accepted' }
      ],
      source: 'google',
      bufferBefore: 30,
      preparation: {
        suggestedMinutes: 45,
        tasks: ['Review presentation slides', 'Test video setup', 'Prepare Q&A answers'],
        aiSuggestions: ['Practice key talking points', 'Have backup slides ready']
      },
      businessContext: {
        isGermanBusinessHours: true,
        requiresLunchBreak: false,
        lateWarning: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  availableSlots: [
    {
      startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
      endTime: new Date(Date.now() + 150 * 60 * 1000).toISOString(), // 2.5 hours from now
      duration: 60, // 1 hour
      type: 'focus',
      energyLevel: 'high',
      suitability: {
        deepWork: 85,
        meetings: 20,
        creative: 90,
        admin: 50
      }
    },
    {
      startTime: new Date(Date.now() + 300 * 60 * 1000).toISOString(), // 5 hours from now
      endTime: new Date(Date.now() + 420 * 60 * 1000).toISOString(), // 7 hours from now
      duration: 120, // 2 hours
      type: 'focus',
      energyLevel: 'medium',
      suitability: {
        deepWork: 95,
        meetings: 10,
        creative: 75,
        admin: 60
      }
    }
  ],
  focusBlocks: [],
  dailyOverview: {
    totalMeetings: 3,
    totalFocusTime: 120, // 2 hours
    totalFreeTime: 240, // 4 hours
    energyOptimization: 'good',
    scheduleBalance: 78
  },
  suggestions: [
    {
      id: 'suggestion-1',
      type: 'focus_time',
      title: 'Block focus time for deep work',
      description: 'You have a 2-hour slot this afternoon perfect for deep work',
      timeSlot: {
        start: new Date(Date.now() + 300 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 420 * 60 * 1000).toISOString()
      },
      priority: 'medium',
      aiConfidence: 85,
      reasoning: ['High energy slot', 'No interruptions scheduled', 'Matches your productivity patterns'],
      quickActions: [
        {
          id: 'create-focus-block',
          label: 'Block 2h Focus Time',
          action: 'create_time_block',
          parameters: { type: 'deep_work', duration: 120 }
        }
      ]
    }
  ],
  warnings: [],
  businessDayStatus: {
    withinBusinessHours: true,
    lunchBreakProtected: true,
    overtimeRisk: false
  },
  lastUpdated: new Date().toISOString()
};

// Custom hook implementation
export const useCalendar = (options: UseCalendarOptions = {}): UseCalendarReturn => {
  const {
    includeBusinessSettings = false,
    enableRealTimeUpdates = false,
    autoRefreshInterval = 5,
    culture = 'german',
    timezone = 'Europe/Berlin'
  } = options;

  // State management
  const [preview, setPreview] = useState<CalendarPreview | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: true,
    lastSync: new Date().toISOString(),
    syncInProgress: false,
    errorCount: 0,
    integrations: []
  });

  // Refs for intervals and cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket | null>(null);

  // Business settings based on culture
  const businessSettings = useMemo(() => {
    if (culture === 'german') {
      return DEFAULT_GERMAN_BUSINESS;
    }
    return null;
  }, [culture]);

  // Fetch calendar preview data
  const fetchCalendarPreview = useCallback(async () => {
    try {
      setError(null);
      
      // TODO: Replace with real API call
      const response = await fetch('/api/calendar/preview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // For now, use mock data instead of throwing
        console.warn('Calendar API not available, using mock data');
        setPreview(MOCK_CALENDAR_PREVIEW);
        setEvents(MOCK_CALENDAR_PREVIEW.nextMeetings);
        setAvailableSlots(MOCK_CALENDAR_PREVIEW.availableSlots);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setPreview(data);
      setEvents(data.nextMeetings || []);
      setAvailableSlots(data.availableSlots || []);
      
      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        syncInProgress: false
      }));
      
    } catch (err) {
      console.warn('Calendar fetch failed, using mock data:', err);
      // Use mock data for development
      setPreview(MOCK_CALENDAR_PREVIEW);
      setEvents(MOCK_CALENDAR_PREVIEW.nextMeetings);
      setAvailableSlots(MOCK_CALENDAR_PREVIEW.availableSlots);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create time block
  const createTimeBlock = useCallback(async (blockData: Partial<TimeBlock>): Promise<TimeBlock> => {
    try {
      const newBlock: TimeBlock = {
        id: `block-${Date.now()}`,
        startTime: blockData.startTime || new Date().toISOString(),
        endTime: blockData.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        type: blockData.type || 'deep_work',
        title: blockData.title || 'Focus Time',
        priority: blockData.priority || 'medium',
        isFlexible: blockData.isFlexible ?? true,
        minimumDuration: blockData.minimumDuration || 30,
        energyLevel: blockData.energyLevel || 'medium',
        aiSuggested: blockData.aiSuggested || false,
        color: blockData.color || '#8B5CF6',
        isDraft: blockData.isDraft || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...blockData
      };

      // TODO: Replace with real API call
      const response = await fetch('/api/calendar/block-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBlock)
      });

      if (!response.ok) {
        // For development, just add to local state
        setTimeBlocks(prev => [...prev, newBlock]);
        return newBlock;
      }

      const result = await response.json();
      setTimeBlocks(prev => [...prev, result.block]);
      
      return result.block;
    } catch (err) {
      console.error('Failed to create time block:', err);
      throw new Error('Failed to create time block');
    }
  }, []);

  // Update calendar event
  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      // TODO: Replace with real API call
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ));
    } catch (err) {
      console.error('Failed to update event:', err);
      throw new Error('Failed to update event');
    }
  }, []);

  // Delete calendar event
  const deleteEvent = useCallback(async (id: string) => {
    try {
      // TODO: Replace with real API call
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw new Error('Failed to delete event');
    }
  }, []);

  // Reschedule event
  const rescheduleEvent = useCallback(async (
    id: string, 
    newTime: { start: string; end: string }
  ) => {
    try {
      await updateEvent(id, {
        startTime: newTime.start,
        endTime: newTime.end,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to reschedule event:', err);
      throw new Error('Failed to reschedule event');
    }
  }, [updateEvent]);

  // Get AI suggestions
  const getSuggestions = useCallback(async (): Promise<SchedulingSuggestion[]> => {
    try {
      // TODO: Replace with real API call
      return preview?.suggestions || [];
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      return [];
    }
  }, [preview]);

  // Apply AI suggestion
  const applySuggestion = useCallback(async (suggestionId: string) => {
    try {
      const suggestion = preview?.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // Handle different suggestion types
      switch (suggestion.type) {
        case 'focus_time':
          if (suggestion.timeSlot) {
            await createTimeBlock({
              startTime: suggestion.timeSlot.start,
              endTime: suggestion.timeSlot.end,
              type: 'deep_work',
              title: 'Focus Time',
              aiSuggested: true
            });
          }
          break;
        // Add other suggestion types...
      }

      // Remove applied suggestion
      if (preview) {
        setPreview({
          ...preview,
          suggestions: preview.suggestions.filter(s => s.id !== suggestionId)
        });
      }
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
      throw new Error('Failed to apply suggestion');
    }
  }, [preview, createTimeBlock]);

  // Dismiss warning
  const dismissWarning = useCallback(async (warningId: string) => {
    try {
      if (preview) {
        setPreview({
          ...preview,
          warnings: preview.warnings.filter(w => w.id !== warningId)
        });
      }
    } catch (err) {
      console.error('Failed to dismiss warning:', err);
    }
  }, [preview]);

  // Find available slots
  const findAvailableSlots = useCallback((
    duration: number, 
    preferences?: any
  ): AvailableSlot[] => {
    return availableSlots.filter(slot => 
      slot.duration >= duration &&
      (!preferences?.energyLevel || slot.energyLevel === preferences.energyLevel)
    );
  }, [availableSlots]);

  // Optimize schedule using AI
  const optimizeSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with real AI optimization API call
      console.log('Optimizing schedule...');
      
      // Simulate optimization by reorganizing time blocks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error('Failed to optimize schedule:', err);
      throw new Error('Failed to optimize schedule');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync calendars
  const syncCalendars = useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
      
      // TODO: Replace with real sync API call
      await fetchCalendarPreview();
      
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Failed to sync calendars:', err);
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        errorCount: prev.errorCount + 1
      }));
    }
  }, [fetchCalendarPreview]);

  // Refresh calendar data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchCalendarPreview();
  }, [fetchCalendarPreview]);

  // Validate German business hours
  const validateBusinessHours = useCallback((
    eventData: Partial<CalendarEvent>
  ): SchedulingWarning[] => {
    if (!businessSettings || !eventData.startTime) return [];

    const warnings: SchedulingWarning[] = [];
    const startTime = new Date(eventData.startTime);
    const hour = startTime.getHours();

    // Check business hours (8-17 Uhr)
    if (hour < 8 || hour >= 17) {
      warnings.push({
        id: `warning-${Date.now()}`,
        type: 'cultural',
        severity: 'medium',
        title: 'Outside German Business Hours',
        description: `Meeting scheduled at ${hour}:${startTime.getMinutes().toString().padStart(2, '0')} is outside typical German business hours (8-17 Uhr)`,
        affectedEvents: [eventData.id || ''],
        recommendations: ['Consider rescheduling to 9-16 Uhr', 'Add note about unusual timing']
      });
    }

    // Check lunch time (12-13 Uhr)
    if (hour === 12 && businessSettings.meetingPreferences.lunchBlock) {
      warnings.push({
        id: `warning-lunch-${Date.now()}`,
        type: 'cultural',
        severity: 'high',
        title: 'Conflicts with Lunch Break',
        description: 'Meeting scheduled during traditional German lunch hour (12-13 Uhr)',
        affectedEvents: [eventData.id || ''],
        recommendations: ['Reschedule to 11:00 or 14:00', 'Ensure all attendees agree to lunch meeting']
      });
    }

    // Check overtime (after 18 Uhr)
    if (hour >= 18) {
      warnings.push({
        id: `warning-overtime-${Date.now()}`,
        type: 'overtime',
        severity: 'high',
        title: 'Overtime Meeting',
        description: 'Meeting scheduled after typical German work hours (18+ Uhr)',
        affectedEvents: [eventData.id || ''],
        recommendations: ['Confirm necessity of late meeting', 'Consider next-day morning alternative']
      });
    }

    return warnings;
  }, [businessSettings]);

  // WebSocket subscription for real-time updates
  const subscribe = useCallback(() => {
    if (!enableRealTimeUpdates) return;

    try {
      // TODO: Replace with real WebSocket connection
      const ws = new WebSocket('ws://localhost:8001/ws/calendar');
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle real-time calendar updates
        if (data.type === 'calendar_update') {
          fetchCalendarPreview();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSyncStatus(prev => ({ ...prev, isConnected: false }));
      };

      ws.onclose = () => {
        setSyncStatus(prev => ({ ...prev, isConnected: false }));
      };
    } catch (err) {
      console.error('Failed to setup WebSocket:', err);
    }
  }, [enableRealTimeUpdates, fetchCalendarPreview]);

  // Unsubscribe from WebSocket
  const unsubscribe = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Initialize hook
  useEffect(() => {
    fetchCalendarPreview();

    // Setup auto-refresh interval
    if (autoRefreshInterval > 0) {
      refreshIntervalRef.current = setInterval(
        fetchCalendarPreview,
        autoRefreshInterval * 60 * 1000
      );
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchCalendarPreview, autoRefreshInterval]);

  // Setup real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      subscribe();
      return unsubscribe;
    }
  }, [enableRealTimeUpdates, subscribe, unsubscribe]);

  // Return hook interface
  return {
    // Data
    preview,
    events,
    timeBlocks,
    availableSlots,

    // State
    isLoading,
    error,
    syncStatus,

    // Actions
    createTimeBlock,
    updateEvent,
    deleteEvent,
    rescheduleEvent,

    // AI suggestions
    getSuggestions,
    applySuggestion,
    dismissWarning,

    // Time blocking
    findAvailableSlots,
    optimizeSchedule,

    // Sync
    syncCalendars,
    refresh,

    // German business
    validateBusinessHours,

    // Real-time updates
    subscribe,
    unsubscribe
  };
};

export default useCalendar;