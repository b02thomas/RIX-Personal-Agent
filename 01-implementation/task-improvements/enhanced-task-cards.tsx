// /01-implementation/task-improvements/enhanced-task-cards.tsx
// Enhanced task card component with advanced status indicators and mobile optimization
// Integrates with RIX design system and provides intuitive task management interface
// RELEVANT FILES: task-ui-improvements.md, task-status-indicators.css, color-system.css, responsive-breakpoints.css

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance optimization
const Icons = {
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  Circle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Circle })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  MoreHorizontal: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MoreHorizontal })), { ssr: false }),
  Play: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Play })), { ssr: false }),
  Pause: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Pause })), { ssr: false }),
  AlertTriangle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertTriangle })), { ssr: false }),
  Tag: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Tag })), { ssr: false }),
};

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  project?: string;
  tags: string[];
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EnhancedTaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onPriorityChange: (taskId: string, priority: Task['priority']) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  showProject?: boolean;
  compact?: boolean;
  className?: string;
}

export function EnhancedTaskCard({
  task,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onDelete,
  isSelected = false,
  onSelectionChange,
  showProject = true,
  compact = false,
  className
}: EnhancedTaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Status indicator configuration
  const statusConfig = useMemo(() => {
    switch (task.status) {
      case 'todo':
        return {
          icon: Icons.Circle,
          color: 'text-rix-text-secondary border-rix-border-primary',
          bgColor: 'transparent',
          label: 'To Do'
        };
      case 'in_progress':
        return {
          icon: Icons.Play,
          color: 'text-rix-accent-primary border-rix-accent-primary',
          bgColor: 'bg-rix-accent-primary/10',
          label: 'In Progress',
          pulse: true
        };
      case 'completed':
        return {
          icon: Icons.CheckCircle,
          color: 'text-rix-success border-rix-success',
          bgColor: 'bg-rix-success/10',
          label: 'Completed'
        };
      case 'blocked':
        return {
          icon: Icons.AlertTriangle,
          color: 'text-rix-error border-rix-error',
          bgColor: 'bg-rix-error/10',
          label: 'Blocked'
        };
      default:
        return {
          icon: Icons.Circle,
          color: 'text-rix-text-secondary',
          bgColor: 'transparent',
          label: 'Unknown'
        };
    }
  }, [task.status]);

  // Priority indicator configuration
  const priorityConfig = useMemo(() => {
    switch (task.priority) {
      case 'high':
        return {
          icon: Icons.AlertCircle,
          color: 'text-red-400 bg-red-900/20',
          borderColor: 'border-l-red-500',
          borderWidth: 'border-l-4',
          label: 'High'
        };
      case 'medium':
        return {
          icon: Icons.Clock,
          color: 'text-yellow-400 bg-yellow-900/20',
          borderColor: 'border-l-yellow-500',
          borderWidth: 'border-l-2',
          label: 'Medium'
        };
      case 'low':
        return {
          icon: Icons.CheckCircle,
          color: 'text-green-400 bg-green-900/20',
          borderColor: 'border-l-green-500',
          borderWidth: 'border-l-1',
          label: 'Low'
        };
      default:
        return {
          icon: Icons.Circle,
          color: 'text-rix-text-secondary bg-rix-border-primary/20',
          borderColor: 'border-l-rix-border-primary',
          borderWidth: 'border-l-1',
          label: 'None'
        };
    }
  }, [task.priority]);

  // Due date urgency calculation
  const dueDateUrgency = useMemo(() => {
    if (!task.dueDate) return null;
    
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        urgency: 'overdue',
        color: 'text-red-400 bg-red-900/20',
        icon: Icons.AlertTriangle,
        label: `${Math.abs(diffDays)} days overdue`,
        pulse: true
      };
    } else if (diffDays === 0) {
      return {
        urgency: 'today',
        color: 'text-yellow-400 bg-yellow-900/20',
        icon: Icons.Clock,
        label: 'Due today'
      };
    } else if (diffDays <= 3) {
      return {
        urgency: 'soon',
        color: 'text-blue-400 bg-blue-900/20',
        icon: Icons.Calendar,
        label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`
      };
    } else {
      return {
        urgency: 'future',
        color: 'text-rix-text-secondary bg-rix-border-primary/20',
        icon: Icons.Calendar,
        label: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric'
        }).format(due)
      };
    }
  }, [task.dueDate]);

  // Handle status toggle with animation
  const handleStatusToggle = useCallback(async () => {
    setIsAnimating(true);
    
    let newStatus: Task['status'] = 'todo';
    switch (task.status) {
      case 'todo':
        newStatus = 'in_progress';
        break;
      case 'in_progress':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'todo';
        break;
      case 'blocked':
        newStatus = 'todo';
        break;
    }
    
    // Add slight delay for animation
    setTimeout(() => {
      onStatusChange(task.id, newStatus);
      setIsAnimating(false);
    }, 200);
  }, [task.id, task.status, onStatusChange]);

  // Handle selection change
  const handleSelectionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectionChange?.(task.id, e.target.checked);
  }, [task.id, onSelectionChange]);

  // Format relative time
  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }, []);

  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;
  const DueDateIcon = dueDateUrgency?.icon;

  return (
    <Card
      className={cn(
        // Base styling with RIX design system
        'border-rix-border-primary transition-all duration-200 hover:shadow-rix-md cursor-pointer',
        'hw-accel', // Hardware acceleration
        
        // Priority left border
        priorityConfig.borderColor,
        priorityConfig.borderWidth,
        
        // Status-based styling
        task.status === 'completed' && 'opacity-75',
        task.status === 'blocked' && 'border-red-500/30',
        
        // Selection state
        isSelected && 'ring-2 ring-rix-accent-primary border-rix-accent-primary',
        
        // Hover state
        isHovered && 'bg-rix-card-hover border-rix-border-light',
        
        // Compact mode
        compact && 'py-2',
        
        // Animation state
        isAnimating && 'scale-[0.98]',
        
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(task.id)}
    >
      <CardContent className={cn(
        'p-4 md:p-6',
        compact && 'p-3'
      )}>
        <div className="flex items-start space-x-4">
          {/* Selection Checkbox (when multi-select is active) */}
          {onSelectionChange && (
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectionChange}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'w-5 h-5 rounded border-2 border-rix-border-primary',
                  'bg-transparent checked:bg-rix-accent-primary checked:border-rix-accent-primary',
                  'focus:ring-2 focus:ring-rix-accent-primary focus:ring-offset-2',
                  'touch-manipulation mobile-touch-target'
                )}
              />
            </div>
          )}

          {/* Status Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusToggle();
            }}
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200',
              'flex items-center justify-center touch-manipulation',
              'hover:scale-110 active:scale-95',
              statusConfig.color,
              statusConfig.bgColor,
              statusConfig.pulse && 'animate-pulse',
              'mobile-touch-target' // Ensures 44px touch target
            )}
            aria-label={`Mark as ${statusConfig.label}`}
          >
            <StatusIcon className="w-4 h-4" />
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
              {/* Title and Description */}
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-semibold text-rix-text-primary transition-colors duration-200',
                  task.status === 'completed' && 'line-through text-rix-text-tertiary',
                  compact ? 'text-base' : 'text-lg'
                )}>
                  {task.title}
                </h3>
                
                {!compact && task.description && (
                  <p className="text-sm text-rix-text-secondary mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-rix-text-muted">
                  <span>Updated {formatRelativeTime(task.updatedAt)}</span>
                  {task.assignee && (
                    <>
                      <span>•</span>
                      <span>Assigned to {task.assignee}</span>
                    </>
                  )}
                </div>
                
                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.slice(0, compact ? 2 : 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                        <Icons.Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {task.tags.length > (compact ? 2 : 4) && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        +{task.tags.length - (compact ? 2 : 4)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Priority and Due Date */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Priority Badge */}
                <Badge className={cn(
                  'text-xs px-2 py-1 flex items-center gap-1',
                  priorityConfig.color
                )}>
                  <PriorityIcon className="w-3 h-3" />
                  <span className="capitalize">{task.priority}</span>
                </Badge>

                {/* Due Date Badge */}
                {dueDateUrgency && DueDateIcon && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs px-2 py-1 flex items-center gap-1',
                      dueDateUrgency.color,
                      dueDateUrgency.pulse && 'animate-pulse'
                    )}
                  >
                    <DueDateIcon className="w-3 h-3" />
                    {dueDateUrgency.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Project */}
            {showProject && task.project && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {task.project}
                </Badge>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={cn(
                'w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                (isHovered || showActions) && 'opacity-100',
                'mobile-touch-target'
              )}
              aria-label="Task actions"
            >
              <Icons.MoreHorizontal className="w-4 h-4" />
            </Button>
            
            {/* Quick Actions Popup */}
            {showActions && (
              <div className={cn(
                'absolute right-0 mt-2 w-48 bg-rix-card-background',
                'border border-rix-border-primary rounded-lg shadow-lg z-50',
                'p-2 space-y-1'
              )}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task.id);
                    setShowActions(false);
                  }}
                  className="w-full justify-start text-sm"
                >
                  Edit Task
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPriorityChange(task.id, task.priority === 'high' ? 'medium' : 'high');
                    setShowActions(false);
                  }}
                  className="w-full justify-start text-sm"
                >
                  {task.priority === 'high' ? 'Lower Priority' : 'Higher Priority'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                    setShowActions(false);
                  }}
                  className="w-full justify-start text-sm text-red-400 hover:text-red-300"
                >
                  Delete Task
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loading component for task cards
export function TaskCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="border-rix-border-primary animate-pulse">
      <CardContent className={cn('p-4 md:p-6', compact && 'p-3')}>
        <div className="flex items-start space-x-4">
          {/* Status Circle Skeleton */}
          <div className="flex-shrink-0 w-6 h-6 bg-rix-border-primary rounded-full" />
          
          {/* Content Skeleton */}
          <div className="flex-1 space-y-2">
            {/* Title */}
            <div className="h-5 bg-rix-border-primary rounded w-3/4" />
            
            {/* Description (if not compact) */}
            {!compact && (
              <div className="h-4 bg-rix-border-primary rounded w-1/2" />
            )}
            
            {/* Meta Info */}
            <div className="flex space-x-2">
              <div className="h-3 bg-rix-border-primary rounded w-16" />
              <div className="h-3 bg-rix-border-primary rounded w-20" />
            </div>
          </div>
          
          {/* Badges Skeleton */}
          <div className="flex-shrink-0 space-y-1">
            <div className="h-6 bg-rix-border-primary rounded w-16" />
            <div className="h-6 bg-rix-border-primary rounded w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export component types for external use
export type { Task, EnhancedTaskCardProps };