// /src/components/Dashboard/CalendarWidget.tsx
// Calendar Preview Widget with Motion-style time blocking and intelligent scheduling
// Fourth dashboard widget featuring next meetings, focus time blocks, and German business optimization
// RELEVANT FILES: useCalendar.ts, TimeBlock.tsx, MeetingCard.tsx, /src/types/calendar.ts

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Plus,
  ZapOff,
  Coffee,
  Brain,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Timer,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardWidget } from './DashboardWidget';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarEvent, TimeBlock, AvailableSlot, SchedulingSuggestion } from '@/types/calendar';

export interface CalendarWidgetProps {
  className?: string;
  onNavigate?: (section: string) => void;
  onEventClick?: (eventId: string) => void;
  onCreateTimeBlock?: (slot: AvailableSlot) => void;
  businessCulture?: 'german' | 'international';
}

// Get event type icon and color
function getEventTypeInfo(type: CalendarEvent['type']) {
  switch (type) {
    case 'meeting':
      return { icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'focus':
      return { icon: Brain, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    case 'break':
      return { icon: Coffee, color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    case 'travel':
      return { icon: MapPin, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    default:
      return { icon: Calendar, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
  }
}

// Format time until event
function formatTimeUntil(eventTime: string): string {
  const now = new Date();
  const event = new Date(eventTime);
  const diffMs = event.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Now';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}min`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// Format time range
function formatTimeRange(start: string, end: string, format24h = true): string {
  const startTime = new Date(start);
  const endTime = new Date(end);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !format24h
  };
  
  const startStr = startTime.toLocaleTimeString('en-US', formatOptions);
  const endStr = endTime.toLocaleTimeString('en-US', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

// Meeting Card Component (Motion-style compact)
interface MeetingCardProps {
  event: CalendarEvent;
  showTimeUntil?: boolean;
  isNext?: boolean;
  onClick?: () => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ 
  event, 
  showTimeUntil = false, 
  isNext = false, 
  onClick 
}) => {
  const eventInfo = getEventTypeInfo(event.type);
  const IconComponent = eventInfo.icon;
  const timeUntil = showTimeUntil ? formatTimeUntil(event.startTime) : null;
  
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.02]',
        eventInfo.color,
        isNext && 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/20'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Event header */}
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className="w-3 h-3 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {event.title}
            </span>
            {isNext && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Next</span>
              </div>
            )}
          </div>
          
          {/* Time and location */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimeRange(event.startTime, event.endTime)}</span>
              {timeUntil && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-blue-400 font-medium">in {timeUntil}</span>
                </>
              )}
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Users className="w-3 h-3" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex flex-col gap-1 ml-2">
          {event.preparation && (
            <div title="Preparation needed">
              <Timer className="w-3 h-3 text-yellow-500" />
            </div>
          )}
          {event.travelTime && event.travelTime > 0 && (
            <div title={`${event.travelTime}min travel`}>
              <MapPin className="w-3 h-3 text-orange-500" />
            </div>
          )}
        </div>
      </div>
      
      {/* Preparation preview */}
      {isNext && event.preparation && (
        <div className="mt-2 pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Prep:</strong> {event.preparation.tasks[0] || 'Review agenda'}
          </div>
        </div>
      )}
    </div>
  );
};

// Available Slot Component (Motion-style time blocking)
interface AvailableSlotProps {
  slot: AvailableSlot;
  onCreateBlock?: () => void;
}

const AvailableSlot: React.FC<AvailableSlotProps> = ({ slot, onCreateBlock }) => {
  const duration = Math.floor(slot.duration / 60);
  const isLongSlot = slot.duration >= 120; // 2+ hours
  
  const getSlotColor = () => {
    if (slot.suitability.deepWork >= 80) return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
    if (slot.suitability.creative >= 80) return 'bg-green-500/20 border-green-500/30 text-green-400';
    if (slot.suitability.meetings >= 80) return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
  };
  
  return (
    <div
      className={cn(
        'p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.02]',
        getSlotColor(),
        isLongSlot && 'ring-1 ring-purple-400/20'
      )}
      onClick={onCreateBlock}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium">
            {formatTimeRange(slot.startTime, slot.endTime)}
          </div>
          <div className="text-xs opacity-75">
            {duration}h {slot.duration % 60}min available
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isLongSlot && <Brain className="w-3 h-3" />}
          <Plus className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

// German Business Status Component
interface BusinessStatusProps {
  isGermanBusiness: boolean;
  withinBusinessHours: boolean;
  lunchBreakProtected: boolean;
  overtimeRisk: boolean;
}

const BusinessStatus: React.FC<BusinessStatusProps> = ({
  isGermanBusiness,
  withinBusinessHours,
  lunchBreakProtected,
  overtimeRisk
}) => {
  if (!isGermanBusiness) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        {withinBusinessHours ? (
          <CheckCircle className="w-3 h-3 text-green-400" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
        )}
        <span className="text-gray-600 dark:text-gray-400">Business Hours</span>
      </div>
      
      {lunchBreakProtected && (
        <div className="flex items-center gap-1">
          <Coffee className="w-3 h-3 text-green-400" />
          <span className="text-gray-600 dark:text-gray-400">Lunch Protected</span>
        </div>
      )}
      
      {overtimeRisk && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span className="text-red-400">Overtime Risk</span>
        </div>
      )}
    </div>
  );
};

// Main Calendar Widget Component
export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  className,
  onNavigate,
  onEventClick,
  onCreateTimeBlock,
  businessCulture = 'german'
}) => {
  const [showAvailableSlots, setShowAvailableSlots] = useState(false);
  
  const {
    preview,
    isLoading,
    error,
    syncStatus,
    createTimeBlock,
    getSuggestions,
    applySuggestion,
    refresh,
    findAvailableSlots
  } = useCalendar({
    includeBusinessSettings: businessCulture === 'german',
    enableRealTimeUpdates: true
  });
  
  // Handle time block creation
  const handleCreateTimeBlock = useCallback(async (slot: AvailableSlot) => {
    try {
      const block = await createTimeBlock({
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: 'deep_work',
        title: 'Focus Time',
        priority: 'medium',
        isFlexible: true,
        energyLevel: slot.energyLevel,
        aiSuggested: true,
        color: '#8B5CF6',
        isDraft: false
      });
      
      onCreateTimeBlock?.(slot);
    } catch (error) {
      console.error('Failed to create time block:', error);
    }
  }, [createTimeBlock, onCreateTimeBlock]);
  
  // Handle suggestion application
  const handleApplySuggestion = useCallback(async (suggestion: SchedulingSuggestion) => {
    try {
      await applySuggestion(suggestion.id);
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  }, [applySuggestion]);
  
  // Available slots for today
  const todayAvailableSlots = useMemo(() => {
    if (!preview?.availableSlots) return [];
    return preview.availableSlots
      .filter(slot => slot.duration >= 30) // At least 30 minutes
      .slice(0, 3); // Show top 3
  }, [preview?.availableSlots]);
  
  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="animate-pulse space-y-3">
      {/* Next meetings skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Available slots skeleton */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
  
  // Render main content
  const renderContent = () => {
    if (!preview) return null;
    
    const nextMeetings = preview.nextMeetings.slice(0, 3);
    const hasNextMeeting = nextMeetings.length > 0;
    
    return (
      <div className="space-y-4">
        {/* Daily overview header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Today
                </div>
                <div className="text-xs text-gray-500">
                  {preview.dailyOverview.totalMeetings} meetings
                </div>
              </div>
            </div>
            
            {/* Energy optimization indicator */}
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              preview.dailyOverview.energyOptimization === 'good' ? 'bg-green-500/20 text-green-400' :
              preview.dailyOverview.energyOptimization === 'okay' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            )}>
              {preview.dailyOverview.scheduleBalance}% Balance
            </div>
          </div>
          
          {/* Sync status and refresh */}
          <div className="flex items-center gap-2">
            {syncStatus.isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Refresh calendar"
            >
              <RefreshCw className={cn("w-4 h-4 text-gray-500", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
        
        {/* German business status */}
        {businessCulture === 'german' && preview.businessDayStatus && (
          <BusinessStatus
            isGermanBusiness={true}
            withinBusinessHours={preview.businessDayStatus.withinBusinessHours}
            lunchBreakProtected={preview.businessDayStatus.lunchBreakProtected}
            overtimeRisk={preview.businessDayStatus.overtimeRisk}
          />
        )}
        
        {/* Next meetings */}
        <div className="space-y-2">
          {hasNextMeeting ? (
            <>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Coming Up
                </h4>
                {nextMeetings[0] && formatTimeUntil(nextMeetings[0].startTime) !== 'Now' && (
                  <div className="text-xs text-blue-400 font-medium">
                    Next in {formatTimeUntil(nextMeetings[0].startTime)}
                  </div>
                )}
              </div>
              
              {nextMeetings.map((meeting, index) => (
                <MeetingCard
                  key={meeting.id}
                  event={meeting}
                  showTimeUntil={index === 0}
                  isNext={index === 0}
                  onClick={() => onEventClick?.(meeting.id)}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No meetings today</p>
              <p className="text-xs">Perfect day for deep work!</p>
            </div>
          )}
        </div>
        
        {/* Available time slots */}
        {todayAvailableSlots.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Available for Focus
              </h4>
              <button
                onClick={() => setShowAvailableSlots(!showAvailableSlots)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showAvailableSlots ? 'Hide' : 'Show'} Slots
              </button>
            </div>
            
            {showAvailableSlots && (
              <div className="grid grid-cols-1 gap-2">
                {todayAvailableSlots.map((slot, index) => (
                  <AvailableSlot
                    key={index}
                    slot={slot}
                    onCreateBlock={() => handleCreateTimeBlock(slot)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* AI suggestions preview */}
        {preview.suggestions.length > 0 && (
          <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Smart Suggestion</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
              {preview.suggestions[0].title}
            </p>
            <button
              onClick={() => handleApplySuggestion(preview.suggestions[0])}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Apply suggestion →
            </button>
          </div>
        )}
        
        {/* Warnings */}
        {preview.warnings.length > 0 && (
          <div className="space-y-1">
            {preview.warnings.slice(0, 2).map(warning => (
              <div
                key={warning.id}
                className={cn(
                  'p-2 rounded-lg border text-xs',
                  warning.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  warning.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                )}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-medium">{warning.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Quick actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200/20 dark:border-gray-700/20">
          <button
            onClick={() => onNavigate?.('calendar')}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
          >
            <Calendar className="w-3 h-3" />
            Full Calendar
          </button>
          <button
            onClick={() => handleCreateTimeBlock(todayAvailableSlots[0])}
            disabled={todayAvailableSlots.length === 0}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Block Time
          </button>
        </div>
        
        {/* Last updated */}
        {preview.lastUpdated && (
          <div className="text-xs text-gray-400 text-center">
            Updated {new Date(preview.lastUpdated).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <DashboardWidget
      title="Calendar"
      subtitle={preview ? 
        `${preview.dailyOverview.totalMeetings} meetings, ${Math.floor(preview.dailyOverview.totalFocusTime / 60)}h focus` : 
        'Loading...'
      }
      icon={<Calendar className="w-5 h-5" />}
      isLoading={isLoading}
      error={error?.message || null}
      onRefresh={refresh}
      className={className}
      onClick={() => onNavigate?.('calendar')}
    >
      {isLoading ? renderLoadingSkeleton() : renderContent()}
    </DashboardWidget>
  );
};

export default CalendarWidget;