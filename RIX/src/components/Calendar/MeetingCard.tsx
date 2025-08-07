// /src/components/Calendar/MeetingCard.tsx
// Motion-style meeting card component with preparation tracking and German business optimization
// Displays meeting details, travel time, preparation status, and smart scheduling features
// RELEVANT FILES: CalendarWidget.tsx, TimeBlock.tsx, useCalendar.ts, /src/types/calendar.ts

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Users,
  MapPin,
  Clock,
  Video,
  Phone,
  CheckCircle,
  AlertTriangle,
  Timer,
  Coffee,
  Car,
  Plane,
  Calendar,
  ExternalLink,
  Edit3,
  X,
  Bell,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarEvent, MeetingStatus, Priority, Attendee } from '@/types/calendar';

export interface MeetingCardProps {
  event: CalendarEvent;
  showDetails?: boolean;
  showPreparation?: boolean;
  showAttendees?: boolean;
  isUpcoming?: boolean;
  isActive?: boolean;
  timeUntilEvent?: string;
  
  // Actions
  onClick?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onJoin?: (meetingUrl: string) => void;
  onStartPrep?: (event: CalendarEvent) => void;
  onMarkPrepComplete?: (eventId: string) => void;
  
  // German business features
  businessHoursEnabled?: boolean;
  showGermanContext?: boolean;
  
  className?: string;
}

// Get meeting status styling
function getStatusStyle(status: MeetingStatus) {
  switch (status) {
    case 'confirmed':
      return 'border-green-500/40 bg-green-500/10';
    case 'tentative':
      return 'border-yellow-500/40 bg-yellow-500/10';
    case 'cancelled':
      return 'border-red-500/40 bg-red-500/10 opacity-60';
    case 'needs_action':
      return 'border-blue-500/40 bg-blue-500/10';
  }
}

// Get priority styling
function getPriorityStyle(priority: Priority) {
  switch (priority) {
    case 'critical':
      return 'ring-2 ring-red-400/50 shadow-lg shadow-red-500/20';
    case 'high':
      return 'ring-1 ring-orange-400/30';
    case 'medium':
      return '';
    case 'low':
      return 'opacity-80';
  }
}

// Format time range
function formatTimeRange(startTime: string, endTime: string, format24h = true): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !format24h
  };
  
  const startStr = start.toLocaleTimeString(format24h ? 'de-DE' : 'en-US', formatOptions);
  const endStr = end.toLocaleTimeString(format24h ? 'de-DE' : 'en-US', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

// Format meeting duration
function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

// Get attendee status color
function getAttendeeStatusColor(status: Attendee['status']) {
  switch (status) {
    case 'accepted':
      return 'text-green-400';
    case 'declined':
      return 'text-red-400';
    case 'tentative':
      return 'text-yellow-400';
    case 'needs_action':
      return 'text-gray-400';
  }
}

// Travel time icon
function getTravelIcon(travelTime: number) {
  if (travelTime <= 15) return Car;
  if (travelTime <= 60) return Car;
  return Plane;
}

// Attendee Status Component
interface AttendeeStatusProps {
  attendees: Attendee[];
  maxShow?: number;
}

const AttendeeStatus: React.FC<AttendeeStatusProps> = ({ attendees, maxShow = 3 }) => {
  const [showAll, setShowAll] = useState(false);
  
  const visibleAttendees = showAll ? attendees : attendees.slice(0, maxShow);
  const remainingCount = attendees.length - maxShow;
  
  return (
    <div className="space-y-1">
      {visibleAttendees.map((attendee, index) => (
        <div key={index} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              getAttendeeStatusColor(attendee.status)
            )} />
            <span className="truncate">{attendee.name || attendee.email}</span>
            {attendee.optional && (
              <span className="text-gray-500 text-xs">(optional)</span>
            )}
          </div>
          <span className={cn('text-xs capitalize', getAttendeeStatusColor(attendee.status))}>
            {attendee.status.replace('_', ' ')}
          </span>
        </div>
      ))}
      
      {!showAll && remainingCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          +{remainingCount} more
        </button>
      )}
      
      {showAll && attendees.length > maxShow && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
};

// Preparation Checklist Component
interface PreparationChecklistProps {
  event: CalendarEvent;
  onMarkComplete?: (eventId: string) => void;
}

const PreparationChecklist: React.FC<PreparationChecklistProps> = ({ 
  event, 
  onMarkComplete 
}) => {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  
  const handleTaskToggle = useCallback((taskIndex: number) => {
    setCompletedTasks(prev => {
      const updated = new Set(prev);
      if (updated.has(taskIndex)) {
        updated.delete(taskIndex);
      } else {
        updated.add(taskIndex);
      }
      
      // If all tasks completed, mark preparation as complete
      if (event.preparation && updated.size === event.preparation.tasks.length) {
        onMarkComplete?.(event.id);
      }
      
      return updated;
    });
  }, [event, onMarkComplete]);
  
  if (!event.preparation?.tasks?.length) return null;
  
  const completionRate = (completedTasks.size / event.preparation.tasks.length) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Preparation ({event.preparation.suggestedMinutes} min)
        </span>
        <span className="text-xs text-blue-400">
          {Math.round(completionRate)}% complete
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-1">
        <div 
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${completionRate}%` }}
        />
      </div>
      
      <div className="space-y-1">
        {event.preparation.tasks.map((task, index) => (
          <label 
            key={index}
            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-500/10 rounded p-1 -m-1"
          >
            <input
              type="checkbox"
              checked={completedTasks.has(index)}
              onChange={() => handleTaskToggle(index)}
              className="w-3 h-3 rounded border-gray-500 text-blue-500 focus:ring-blue-400"
            />
            <span className={cn(
              'flex-1',
              completedTasks.has(index) && 'line-through text-gray-500'
            )}>
              {task}
            </span>
          </label>
        ))}
      </div>
      
      {event.preparation.aiSuggestions && event.preparation.aiSuggestions.length > 0 && (
        <div className="pt-1 border-t border-gray-500/20">
          <div className="flex items-center gap-1 text-xs text-blue-400 mb-1">
            <Sparkles className="w-3 h-3" />
            <span>AI Suggestions</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {event.preparation.aiSuggestions[0]}
          </div>
        </div>
      )}
    </div>
  );
};

// German Business Context Component
interface GermanBusinessContextProps {
  event: CalendarEvent;
}

const GermanBusinessContext: React.FC<GermanBusinessContextProps> = ({ event }) => {
  const businessContext = event.businessContext;
  if (!businessContext) return null;
  
  const warnings = [];
  
  if (!businessContext.isGermanBusinessHours) {
    warnings.push('Outside business hours (8-17 Uhr)');
  }
  
  if (businessContext.requiresLunchBreak) {
    warnings.push('Conflicts with lunch break (12-13 Uhr)');
  }
  
  if (businessContext.lateWarning) {
    warnings.push('Late meeting (after 17 Uhr)');
  }
  
  if (businessContext.overtimeAlert) {
    warnings.push('Overtime meeting (after 18 Uhr)');
  }
  
  if (warnings.length === 0) return null;
  
  return (
    <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
      <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
        <AlertTriangle className="w-3 h-3" />
        <span className="font-medium">German Business Context</span>
      </div>
      <div className="space-y-1">
        {warnings.map((warning, index) => (
          <div key={index} className="text-xs text-yellow-300">
            • {warning}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Meeting Card Component
export const MeetingCard: React.FC<MeetingCardProps> = ({
  event,
  showDetails = false,
  showPreparation = false,
  showAttendees = false,
  isUpcoming = false,
  isActive = false,
  timeUntilEvent,
  onClick,
  onEdit,
  onDelete,
  onJoin,
  onStartPrep,
  onMarkPrepComplete,
  businessHoursEnabled = true,
  showGermanContext = true,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);
  
  // Check if meeting is in German business hours
  const isInBusinessHours = useMemo(() => {
    if (!businessHoursEnabled) return true;
    
    const start = new Date(event.startTime);
    const hour = start.getHours();
    return hour >= 8 && hour <= 17;
  }, [event.startTime, businessHoursEnabled]);
  
  // Handle card click
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) {
      onClick?.(event);
    }
  }, [event, onClick, isActive]);
  
  // Handle join meeting
  const handleJoinMeeting = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.meetingUrl) {
      onJoin?.(event.meetingUrl);
    }
  }, [event.meetingUrl, onJoin]);
  
  // Handle copy meeting details
  const handleCopyDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const details = `${event.title}
${formatTimeRange(event.startTime, event.endTime)}
${event.location ? `Location: ${event.location}` : ''}
${event.meetingUrl ? `Join: ${event.meetingUrl}` : ''}`;
    
    navigator.clipboard.writeText(details);
  }, [event]);
  
  // Get meeting type icon
  const getMeetingIcon = () => {
    if (event.meetingUrl) return Video;
    if (event.location) return MapPin;
    return Users;
  };
  
  const MeetingIcon = getMeetingIcon();
  const TravelIcon = event.travelTime ? getTravelIcon(event.travelTime) : null;
  
  return (
    <div
      className={cn(
        'relative group transition-all duration-200 cursor-pointer',
        'rounded-lg border-2 p-4',
        getStatusStyle(event.status),
        getPriorityStyle(event.priority),
        isUpcoming && 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/20',
        isActive && 'ring-2 ring-green-400/50 shadow-lg shadow-green-500/20 animate-pulse',
        !isInBusinessHours && businessHoursEnabled && 'opacity-75 border-dashed',
        'hover:scale-[1.02] hover:shadow-lg',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <MeetingIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {event.title}
            </h4>
            
            {/* Time and status */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              <span>{formatTimeRange(event.startTime, event.endTime)}</span>
              <span className="text-gray-500">•</span>
              <span>{formatDuration(event.startTime, event.endTime)}</span>
              
              {timeUntilEvent && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-blue-400 font-medium">in {timeUntilEvent}</span>
                </>
              )}
            </div>
            
            {/* Location or meeting URL */}
            {(event.location || event.meetingUrl) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                {event.meetingUrl ? (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Video meeting</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{event.location}</span>
                  </>
                )}
              </div>
            )}
            
            {/* Attendees count */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status and action indicators */}
        <div className="flex flex-col items-end gap-1 ml-3">
          {/* Active meeting indicator */}
          {isActive && (
            <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Now</span>
            </div>
          )}
          
          {/* Preparation status */}
          {event.preparation && (
            <Timer className={cn(
              "w-4 h-4",
              showPrepChecklist ? 'text-green-400' : 'text-yellow-500'
            )} />
          )}
          
          {/* Travel time indicator */}
          {TravelIcon && event.travelTime && (
            <div className="flex items-center gap-1 text-orange-400 text-xs">
              <TravelIcon className="w-3 h-3" />
              <span>{event.travelTime}min</span>
            </div>
          )}
          
          {/* Priority indicator */}
          {event.priority === 'high' || event.priority === 'critical' && (
            <AlertTriangle className={cn(
              "w-4 h-4",
              event.priority === 'critical' ? 'text-red-400' : 'text-orange-400'
            )} />
          )}
        </div>
      </div>
      
      {/* Description */}
      {showDetails && event.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
          {event.description}
        </p>
      )}
      
      {/* Meeting actions */}
      <div className="flex items-center gap-2 mb-3">
        {/* Join meeting button */}
        {event.meetingUrl && isUpcoming && (
          <button
            onClick={handleJoinMeeting}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors"
          >
            <Video className="w-3 h-3" />
            Join
          </button>
        )}
        
        {/* Start preparation button */}
        {event.preparation && !showPrepChecklist && isUpcoming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPrepChecklist(true);
              onStartPrep?.(event);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Prep ({event.preparation.suggestedMinutes}min)
          </button>
        )}
        
        {/* Show details toggle */}
        {(event.attendees?.length || event.preparation) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-500/30 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Details
          </button>
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-500/20">
          {/* Attendees */}
          {showAttendees && event.attendees && event.attendees.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Attendees
              </h5>
              <AttendeeStatus attendees={event.attendees} />
            </div>
          )}
          
          {/* Preparation checklist */}
          {showPreparation && showPrepChecklist && (
            <div>
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Preparation
              </h5>
              <PreparationChecklist 
                event={event} 
                onMarkComplete={onMarkPrepComplete}
              />
            </div>
          )}
          
          {/* German business context */}
          {showGermanContext && businessHoursEnabled && (
            <GermanBusinessContext event={event} />
          )}
        </div>
      )}
      
      {/* Action buttons (hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          onClick={handleCopyDetails}
          className="p-1.5 rounded hover:bg-gray-700/30 transition-colors"
          title="Copy meeting details"
        >
          <Copy className="w-3 h-3 text-gray-400" />
        </button>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            className="p-1.5 rounded hover:bg-gray-700/30 transition-colors"
            title="Edit meeting"
          >
            <Edit3 className="w-3 h-3 text-gray-400" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            className="p-1.5 rounded hover:bg-red-700/30 transition-colors"
            title="Delete meeting"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Meeting link indicator */}
      {event.meetingUrl && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default MeetingCard;