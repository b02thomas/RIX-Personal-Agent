// /src/types/calendar.ts
// TypeScript types for calendar system with Motion-style time blocking and German business optimization
// Defines comprehensive calendar structures for intelligent scheduling and meeting management
// RELEVANT FILES: useCalendar.ts, CalendarWidget.tsx, TimeBlock.tsx, MeetingCard.tsx

// Core Calendar Types

export type EventType = 'meeting' | 'focus' | 'break' | 'travel' | 'personal' | 'blocked';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type MeetingStatus = 'confirmed' | 'tentative' | 'cancelled' | 'needs_action';
export type TimeBlockType = 'deep_work' | 'shallow_work' | 'admin' | 'creative' | 'learning';
export type CultureSettings = 'german' | 'international' | 'custom';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  location?: string;
  isAllDay: boolean;
  type: EventType;
  priority: Priority;
  status: MeetingStatus;
  
  // Meeting-specific fields
  attendees?: Attendee[];
  organizer?: Attendee;
  meetingUrl?: string;
  recurring?: RecurrenceRule;
  
  // Motion-style fields
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
  travelTime?: number; // minutes
  preparation?: PreparationInfo;
  
  // Integration fields
  calendarId?: string;
  externalId?: string;
  source: 'google' | 'outlook' | 'manual' | 'ai_generated';
  
  // Visual and interaction
  color?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  
  // German business fields
  businessContext?: BusinessContext;
  
  createdAt: string;
  updatedAt: string;
}

export interface Attendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  optional?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  count?: number;
  byWeekDay?: number[]; // 0 = Sunday
}

export interface PreparationInfo {
  suggestedMinutes: number;
  tasks: string[];
  materials?: string[];
  aiSuggestions?: string[];
}

export interface BusinessContext {
  isGermanBusinessHours: boolean;
  requiresLunchBreak: boolean; // 12-13 Uhr
  lateWarning?: boolean; // After 17 Uhr
  overtimeAlert?: boolean; // After 18 Uhr
}

// Time Blocking Types

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  type: TimeBlockType;
  title: string;
  description?: string;
  priority: Priority;
  
  // Motion-style properties
  isFlexible: boolean; // Can be moved automatically
  minimumDuration: number; // minutes
  idealDuration?: number; // minutes
  energyLevel: 'low' | 'medium' | 'high'; // Required energy
  
  // Dependencies
  dependencies?: string[]; // IDs of tasks/events that must come before
  linkedTaskId?: string;
  linkedProjectId?: string;
  
  // AI optimization
  focusScore?: number; // 0-100 how focused this time should be
  interruptible?: boolean;
  aiSuggested: boolean;
  
  // Visual and interaction
  color: string;
  isDraft: boolean; // User is still positioning
  isDraggable?: boolean;
  isResizable?: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  duration: number; // minutes
  type: 'focus' | 'meetings' | 'break' | 'flexible';
  energyLevel: 'low' | 'medium' | 'high';
  suitability: {
    deepWork: number; // 0-100 score
    meetings: number; // 0-100 score
    creative: number; // 0-100 score
    admin: number; // 0-100 score
  };
  conflicts?: string[]; // Conflicting event IDs
}

// German Business Optimization

export interface BusinessSettings {
  culture: CultureSettings;
  timezone: string;
  workHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  meetingPreferences: {
    bufferTime: number; // German default: 15 min
    lunchBlock: boolean; // 12-13 Uhr protection
    lateWarning: boolean; // After 17 Uhr warning
    overtimeAlert: boolean; // After 18 Uhr alert
    maxBackToBack: number; // Max consecutive meetings
    preferredDurations: number[]; // [30, 60, 90] minutes
  };
  breakPreferences: {
    morning: boolean; // 9:30-10:00 German coffee break
    afternoon: boolean; // 15:00-15:15 German afternoon break
    lunchDuration: number; // Default 60 minutes
    minBreakBetween: number; // Min minutes between meetings
  };
  culturalSettings: {
    punctualityBuffer: number; // Extra time for German punctuality
    preferMorningMeetings: boolean;
    avoidFridayAfternoon: boolean;
    respectPublicHolidays: boolean;
  };
}

// Calendar Preview & Dashboard Types

export interface CalendarPreview {
  today: Date;
  nextMeetings: CalendarEvent[]; // Next 3 upcoming meetings
  availableSlots: AvailableSlot[]; // Available time slots today
  focusBlocks: TimeBlock[]; // Suggested focus time blocks
  
  // Motion-style insights
  dailyOverview: {
    totalMeetings: number;
    totalFocusTime: number; // minutes
    totalFreeTime: number; // minutes
    energyOptimization: 'good' | 'okay' | 'poor';
    scheduleBalance: number; // 0-100 score
  };
  
  // Intelligent suggestions
  suggestions: SchedulingSuggestion[];
  warnings: SchedulingWarning[];
  
  // German business context
  businessDayStatus: {
    withinBusinessHours: boolean;
    lunchBreakProtected: boolean;
    overtimeRisk: boolean;
    holidayImpact?: string;
  };
  
  lastUpdated: string;
}

export interface SchedulingSuggestion {
  id: string;
  type: 'focus_time' | 'break' | 'preparation' | 'buffer' | 'reschedule';
  title: string;
  description: string;
  timeSlot?: {
    start: string;
    end: string;
  };
  priority: Priority;
  aiConfidence: number; // 0-100
  reasoning: string[];
  quickActions: QuickAction[];
}

export interface SchedulingWarning {
  id: string;
  type: 'conflict' | 'travel' | 'overtime' | 'back_to_back' | 'energy' | 'cultural';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedEvents: string[]; // Event IDs
  recommendations: string[];
  autoFix?: QuickAction;
}

export interface QuickAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
  confirmRequired?: boolean;
}

// API Response Types

export interface CalendarPreviewResponse {
  success: boolean;
  data: CalendarPreview;
  error?: string;
}

export interface TimeBlockResponse {
  success: boolean;
  block?: TimeBlock;
  conflicts?: string[];
  suggestions?: SchedulingSuggestion[];
  error?: string;
}

export interface SchedulingSuggestionsResponse {
  success: boolean;
  suggestions: SchedulingSuggestion[];
  availableSlots: AvailableSlot[];
  optimizationScore: number; // 0-100
  error?: string;
}

// Calendar Integration Types

export interface CalendarIntegration {
  id: string;
  type: 'google' | 'outlook' | 'apple' | 'caldav';
  name: string;
  isEnabled: boolean;
  isSyncEnabled: boolean;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending' | 'never';
  permissions: string[];
  settings: Record<string, any>;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSync: string;
  syncInProgress: boolean;
  errorCount: number;
  nextSync?: string;
  integrations: CalendarIntegration[];
}

// Drag and Drop Types

export interface DragDropContext {
  draggedEvent?: CalendarEvent | TimeBlock;
  dropTarget?: DropTarget;
  isValidDrop: boolean;
  previewTime?: {
    start: string;
    end: string;
  };
}

export interface DropTarget {
  type: 'time_slot' | 'calendar_event' | 'trash';
  startTime: string;
  endTime?: string;
  constraints?: DropConstraints;
}

export interface DropConstraints {
  minDuration?: number;
  maxDuration?: number;
  allowedTypes?: (EventType | TimeBlockType)[];
  businessHoursOnly?: boolean;
  bufferRequired?: number;
}

// Calendar View Types

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';
export type TimeFormat = '12h' | '24h';

export interface CalendarViewSettings {
  view: CalendarView;
  timeFormat: TimeFormat;
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday (German default)
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  timezone: string;
  showWeekends: boolean;
  showDeclined: boolean;
  compactMode: boolean;
}

// Mobile-specific Types

export interface MobileCalendarState {
  activeGesture?: 'swipe' | 'pinch' | 'tap' | 'drag';
  swipeDirection?: 'left' | 'right' | 'up' | 'down';
  touchStartTime?: number;
  touchStartPosition?: { x: number; y: number };
  isScrolling: boolean;
  selectedDate?: string;
  expandedEvent?: string;
}

// Hook Return Types

export interface UseCalendarReturn {
  // Data
  preview: CalendarPreview | null;
  events: CalendarEvent[];
  timeBlocks: TimeBlock[];
  availableSlots: AvailableSlot[];
  
  // State
  isLoading: boolean;
  error: Error | null;
  syncStatus: SyncStatus;
  
  // Actions
  createTimeBlock: (block: Partial<TimeBlock>) => Promise<TimeBlock>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  rescheduleEvent: (id: string, newTime: { start: string; end: string }) => Promise<void>;
  
  // AI suggestions
  getSuggestions: () => Promise<SchedulingSuggestion[]>;
  applySuggestion: (suggestionId: string) => Promise<void>;
  dismissWarning: (warningId: string) => Promise<void>;
  
  // Time blocking
  findAvailableSlots: (duration: number, preferences?: any) => AvailableSlot[];
  optimizeSchedule: () => Promise<void>;
  
  // Sync
  syncCalendars: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // German business
  validateBusinessHours: (event: Partial<CalendarEvent>) => SchedulingWarning[];
  
  // Real-time updates
  subscribe: () => void;
  unsubscribe: () => void;
}

// Utility Types

export type DateString = string; // YYYY-MM-DD
export type TimeString = string; // HH:MM
export type ISOString = string; // ISO 8601 datetime

export interface TimeRange {
  start: ISOString;
  end: ISOString;
}

export interface Duration {
  hours: number;
  minutes: number;
  total: number; // total minutes
}