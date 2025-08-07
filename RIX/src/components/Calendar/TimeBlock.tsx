// /src/components/Calendar/TimeBlock.tsx
// Motion-style time blocking component with drag-and-drop functionality and AI optimization
// Supports German business hours, energy-based scheduling, and intelligent conflict resolution
// RELEVANT FILES: CalendarWidget.tsx, MeetingCard.tsx, useCalendar.ts, /src/types/calendar.ts

'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  Brain, 
  Clock, 
  Zap, 
  Coffee, 
  Book, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle,
  GripVertical,
  X,
  Edit3,
  Target,
  Timer,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeBlock, TimeBlockType, Priority, AvailableSlot } from '@/types/calendar';

export interface TimeBlockComponentProps {
  block: TimeBlock;
  availableSlots?: AvailableSlot[];
  isSelected?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
  showDetails?: boolean;
  
  // Drag and drop
  onDragStart?: (block: TimeBlock, event: React.DragEvent) => void;
  onDragEnd?: (block: TimeBlock) => void;
  onDrop?: (block: TimeBlock, newTime: { start: string; end: string }) => void;
  
  // Actions
  onClick?: (block: TimeBlock) => void;
  onEdit?: (block: TimeBlock) => void;
  onDelete?: (blockId: string) => void;
  onResize?: (blockId: string, newDuration: number) => void;
  
  // German business optimization
  businessHoursEnabled?: boolean;
  className?: string;
}

// Get time block type info (colors, icons, labels)
function getTimeBlockInfo(type: TimeBlockType) {
  switch (type) {
    case 'deep_work':
      return { 
        icon: Brain, 
        label: 'Deep Work',
        color: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
        gradient: 'from-purple-600/20 to-purple-800/20'
      };
    case 'shallow_work':
      return { 
        icon: Zap, 
        label: 'Light Work',
        color: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
        gradient: 'from-blue-600/20 to-blue-800/20'
      };
    case 'creative':
      return { 
        icon: Sparkles, 
        label: 'Creative',
        color: 'bg-green-500/20 border-green-500/40 text-green-300',
        gradient: 'from-green-600/20 to-green-800/20'
      };
    case 'learning':
      return { 
        icon: Book, 
        label: 'Learning',
        color: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
        gradient: 'from-orange-600/20 to-orange-800/20'
      };
    case 'admin':
      return { 
        icon: Clock, 
        label: 'Admin',
        color: 'bg-gray-500/20 border-gray-500/40 text-gray-300',
        gradient: 'from-gray-600/20 to-gray-800/20'
      };
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
      return 'opacity-75';
  }
}

// Calculate energy level styling
function getEnergyStyle(energyLevel: 'low' | 'medium' | 'high') {
  switch (energyLevel) {
    case 'high':
      return 'shadow-lg shadow-yellow-500/10';
    case 'medium':
      return '';
    case 'low':
      return 'opacity-80';
  }
}

// Format time duration
function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

// Format time range
function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false // Use 24h format for German business
  };
  
  const startStr = start.toLocaleTimeString('de-DE', formatOptions);
  const endStr = end.toLocaleTimeString('de-DE', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

// Time Block Component
export const TimeBlockComponent: React.FC<TimeBlockComponentProps> = ({
  block,
  availableSlots = [],
  isSelected = false,
  isDragging = false,
  isResizing = false,
  showDetails = false,
  onDragStart,
  onDragEnd,
  onDrop,
  onClick,
  onEdit,
  onDelete,
  onResize,
  businessHoursEnabled = true,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Get block styling info
  const blockInfo = getTimeBlockInfo(block.type);
  const IconComponent = blockInfo.icon;
  
  // Calculate if block is in German business hours (8-17 Uhr)
  const isInBusinessHours = useMemo(() => {
    if (!businessHoursEnabled) return true;
    
    const start = new Date(block.startTime);
    const hour = start.getHours();
    return hour >= 8 && hour <= 17;
  }, [block.startTime, businessHoursEnabled]);
  
  // Check for conflicts with other time blocks
  const hasConflicts = useMemo(() => {
    return availableSlots.some(slot => slot.conflicts && slot.conflicts.length > 0);
  }, [availableSlots]);
  
  // Handle drag start
  const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('text/plain', JSON.stringify(block));
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(block, event);
  }, [block, onDragStart]);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    onDragEnd?.(block);
  }, [block, onDragEnd]);
  
  // Handle click
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isDragging && !isResizing) {
      onClick?.(block);
    }
  }, [block, onClick, isDragging, isResizing]);
  
  // Handle edit
  const handleEdit = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
    onEdit?.(block);
  }, [block, onEdit]);
  
  // Handle delete
  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(block.id);
  }, [block.id, onDelete]);
  
  return (
    <div
      ref={dragRef}
      draggable={block.isDraggable && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative group transition-all duration-200',
        'rounded-lg border-2 cursor-pointer select-none',
        blockInfo.color,
        getPriorityStyle(block.priority),
        getEnergyStyle(block.energyLevel),
        isSelected && 'ring-2 ring-blue-400/50 shadow-lg',
        isDragging && 'opacity-50 scale-95 z-50',
        isResizing && 'cursor-ns-resize',
        !isInBusinessHours && businessHoursEnabled && 'opacity-60 border-dashed',
        hasConflicts && 'ring-1 ring-red-400/30',
        block.isDraft && 'animate-pulse',
        className
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${blockInfo.gradient})`
      }}
    >
      {/* Drag handle */}
      {block.isDraggable && (isHovered || isSelected) && (
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
          <GripVertical className="w-3 h-3 text-gray-400 opacity-60" />
        </div>
      )}
      
      {/* Main content */}
      <div className="p-3 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <IconComponent className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {block.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Timer className="w-3 h-3" />
                <span>{formatTimeRange(block.startTime, block.endTime)}</span>
                <span className="text-gray-500">•</span>
                <span>{formatDuration(block.startTime, block.endTime)}</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          {(isHovered || isSelected) && (
            <div className="flex items-center gap-1 ml-2">
              {block.aiSuggested && (
                <div title="AI suggested">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </div>
              )}
              <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-700/30 transition-colors opacity-0 group-hover:opacity-100"
                title="Edit time block"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-red-700/30 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete time block"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Description */}
        {showDetails && block.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {block.description}
          </p>
        )}
        
        {/* Metadata row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {/* Energy level indicator */}
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                block.energyLevel === 'high' ? 'bg-yellow-400' :
                block.energyLevel === 'medium' ? 'bg-blue-400' :
                'bg-gray-400'
              )} />
              <span className="text-gray-500 capitalize">{block.energyLevel}</span>
            </div>
            
            {/* Flexibility indicator */}
            {block.isFlexible && (
              <div className="flex items-center gap-1 text-green-400">
                <Move className="w-3 h-3" />
                <span>Flexible</span>
              </div>
            )}
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-1">
            {!isInBusinessHours && businessHoursEnabled && (
              <div title="Outside business hours">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              </div>
            )}
            {hasConflicts && (
              <div title="Schedule conflict">
                <AlertTriangle className="w-3 h-3 text-red-500" />
              </div>
            )}
            {block.linkedTaskId && (
              <div title="Linked to task">
                <Target className="w-3 h-3 text-blue-400" />
              </div>
            )}
          </div>
        </div>
        
        {/* Progress indicator for linked tasks */}
        {showDetails && block.linkedTaskId && block.focusScore && (
          <div className="mt-2 pt-2 border-t border-gray-500/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Focus needed</span>
              <span className="font-medium">{block.focusScore}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
              <div 
                className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${block.focusScore}%` }}
              />
            </div>
          </div>
        )}
        
        {/* German business context */}
        {businessHoursEnabled && !isInBusinessHours && (
          <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Outside German business hours (8-17 Uhr)</span>
            </div>
          </div>
        )}
        
        {/* AI optimization indicators */}
        {block.aiSuggested && showDetails && (
          <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <Sparkles className="w-3 h-3" />
              <span>AI optimized for your energy patterns</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Resize handle (bottom) */}
      {block.isResizable && (isHovered || isSelected) && (
        <div
          ref={resizeRef}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-gradient-to-t from-gray-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to resize"
        />
      )}
      
      {/* Draft indicator */}
      {block.isDraft && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

// Time Block Creation Zone (for drag and drop)
export interface TimeBlockZoneProps {
  availableSlot: AvailableSlot;
  onCreateBlock?: (slot: AvailableSlot, blockType?: TimeBlockType) => void;
  onDrop?: (slot: AvailableSlot, droppedBlock: TimeBlock) => void;
  className?: string;
}

export const TimeBlockZone: React.FC<TimeBlockZoneProps> = ({
  availableSlot,
  onCreateBlock,
  onDrop,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<TimeBlockType>('deep_work');
  
  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);
  
  // Handle drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    try {
      const blockData = event.dataTransfer.getData('text/plain');
      const droppedBlock: TimeBlock = JSON.parse(blockData);
      onDrop?.(availableSlot, droppedBlock);
    } catch (error) {
      console.error('Failed to handle drop:', error);
    }
  }, [availableSlot, onDrop]);
  
  // Handle quick create
  const handleQuickCreate = useCallback(() => {
    onCreateBlock?.(availableSlot, quickCreateType);
  }, [availableSlot, onCreateBlock, quickCreateType]);
  
  // Get slot suitability color
  const getSuitabilityColor = () => {
    const { suitability } = availableSlot;
    const maxSuitability = Math.max(
      suitability.deepWork,
      suitability.creative,
      suitability.meetings,
      suitability.admin
    );
    
    if (maxSuitability >= 80) return 'border-green-500/40 bg-green-500/10';
    if (maxSuitability >= 60) return 'border-blue-500/40 bg-blue-500/10';
    return 'border-gray-500/40 bg-gray-500/10';
  };
  
  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border-2 border-dashed transition-all duration-200',
        getSuitabilityColor(),
        isDragOver && 'border-solid border-blue-500/60 bg-blue-500/20 scale-105',
        'hover:border-solid hover:border-purple-500/40 hover:bg-purple-500/10',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Zone header */}
      <div className="text-center mb-3">
        <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {formatTimeRange(availableSlot.startTime, availableSlot.endTime)}
        </div>
        <div className="text-xs text-gray-500">
          {Math.floor(availableSlot.duration / 60)}h {availableSlot.duration % 60}min available
        </div>
      </div>
      
      {/* Suitability indicators */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {Object.entries(availableSlot.suitability).map(([type, score]) => (
          <div key={type} className="text-center">
            <div className="text-xs font-medium capitalize">{type.replace(/([A-Z])/g, ' $1')}</div>
            <div className={cn(
              'text-xs font-bold',
              score >= 80 ? 'text-green-400' :
              score >= 60 ? 'text-blue-400' :
              'text-gray-400'
            )}>
              {score}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick create button */}
      <button
        onClick={handleQuickCreate}
        className="w-full py-2 px-3 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-colors border border-purple-500/30"
      >
        + Create {quickCreateType.replace('_', ' ')} block
      </button>
      
      {/* Drop instruction */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg">
          <div className="text-blue-300 text-sm font-medium">
            Drop to schedule here
          </div>
        </div>
      )}
    </div>
  );
};

// Export with original name for backwards compatibility
export { TimeBlockComponent as TimeBlock };
export default TimeBlockComponent;