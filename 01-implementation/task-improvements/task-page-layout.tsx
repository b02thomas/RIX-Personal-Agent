// /01-implementation/task-improvements/task-page-layout.tsx
// Complete task management page layout with advanced filtering and mobile optimization
// Provides comprehensive task organization with seamless RIX design system integration
// RELEVANT FILES: enhanced-task-cards.tsx, task-organization.md, responsive-breakpoints.css, color-system.css

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { EnhancedTaskCard, TaskCardSkeleton, type Task } from './enhanced-task-cards';

// Dynamic icon imports for performance optimization
const Icons = {
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  Search: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Search })), { ssr: false }),
  Filter: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Filter })), { ssr: false }),
  Sort: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ArrowUpDown })), { ssr: false }),
  Grid: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Grid3X3 })), { ssr: false }),
  List: dynamic(() => import('lucide-react').then(mod => ({ default: mod.List })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  ChevronDown: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
};

type FilterState = {
  search: string;
  status: 'all' | 'todo' | 'in_progress' | 'completed' | 'blocked';
  priority: 'all' | 'low' | 'medium' | 'high';
  dateRange: 'all' | 'overdue' | 'today' | 'week' | 'month' | 'no_date';
  project: string;
  tags: string[];
};

type SortOption = {
  field: 'priority' | 'dueDate' | 'title' | 'status' | 'updatedAt' | 'createdAt';
  direction: 'asc' | 'desc';
};

type ViewMode = 'list' | 'compact' | 'board';
type GroupBy = 'none' | 'status' | 'priority' | 'project' | 'dueDate';

interface TaskPageLayoutProps {
  initialTasks?: Task[];
  onTaskCreate?: () => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  className?: string;
}

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'RIX Frontend Implementation',
    description: 'Complete the dual theme system integration and optimize navigation components for mobile',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date('2024-08-04'),
    project: 'RIX Development',
    tags: ['frontend', 'react', 'mobile'],
    assignee: 'Development Team',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-03')
  },
  {
    id: '2',
    title: 'Mobile Navigation Testing',
    description: 'Test responsive behavior across different devices and screen sizes',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-08-05'),
    project: 'RIX Development',
    tags: ['testing', 'mobile', 'qa'],
    createdAt: new Date('2024-08-02'),
    updatedAt: new Date('2024-08-02')
  },
  {
    id: '3',
    title: 'Design System Documentation',
    description: 'Create comprehensive documentation for RIX design system components',
    status: 'completed',
    priority: 'medium',
    project: 'Documentation',
    tags: ['documentation', 'design-system'],
    createdAt: new Date('2024-07-28'),
    updatedAt: new Date('2024-08-01')
  },
  {
    id: '4',
    title: 'Performance Optimization',
    description: 'Optimize bundle size and improve Core Web Vitals metrics',
    status: 'blocked',
    priority: 'high',
    dueDate: new Date('2024-08-02'), // Overdue
    project: 'RIX Development',
    tags: ['performance', 'optimization'],
    createdAt: new Date('2024-07-30'),
    updatedAt: new Date('2024-08-01')
  },
  {
    id: '5',
    title: 'Voice Command Integration',
    description: 'Integrate voice commands with the AI sphere component',
    status: 'todo',
    priority: 'low',
    dueDate: new Date('2024-08-10'),
    project: 'AI Features',
    tags: ['ai', 'voice', 'integration'],
    createdAt: new Date('2024-08-03'),
    updatedAt: new Date('2024-08-03')
  }
];

export default function TaskPageLayout({
  initialTasks = mockTasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  className
}: TaskPageLayoutProps) {
  // State management
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    project: 'all',
    tags: []
  });
  const [sort, setSort] = useState<SortOption>({ field: 'priority', direction: 'desc' });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get unique projects and tags for filter options
  const uniqueProjects = useMemo(() => {
    const projects = tasks.map(task => task.project).filter(Boolean) as string[];
    return Array.from(new Set(projects)).sort();
  }, [tasks]);

  const uniqueTags = useMemo(() => {
    const allTags = tasks.flatMap(task => task.tags);
    return Array.from(new Set(allTags)).sort();
  }, [tasks]);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          task.project?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const taskDue = task.dueDate ? new Date(task.dueDate) : null;
        
        switch (filters.dateRange) {
          case 'overdue':
            if (!taskDue || taskDue >= today || task.status === 'completed') return false;
            break;
          case 'today':
            if (!taskDue || taskDue.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (!taskDue || taskDue < today || taskDue > weekFromNow) return false;
            break;
          case 'month':
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            if (!taskDue || taskDue < today || taskDue > monthFromNow) return false;
            break;
          case 'no_date':
            if (taskDue) return false;
            break;
        }
      }

      // Project filter
      if (filters.project !== 'all' && task.project !== filters.project) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasSelectedTag = filters.tags.some(tag => task.tags.includes(tag));
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Sort filtered tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = a.dueDate ? a.dueDate.getTime() : Infinity;
          bValue = b.dueDate ? b.dueDate.getTime() : Infinity;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          const statusOrder = { todo: 1, in_progress: 2, blocked: 3, completed: 4 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredTasks, sort]);

  // Group sorted tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': sortedTasks };
    }
    
    const groups: Record<string, Task[]> = {};
    
    sortedTasks.forEach(task => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'status':
          groupKey = {
            todo: 'To Do',
            in_progress: 'In Progress',
            completed: 'Completed',
            blocked: 'Blocked'
          }[task.status];
          break;
        case 'priority':
          groupKey = {
            high: 'High Priority',
            medium: 'Medium Priority',
            low: 'Low Priority'
          }[task.priority];
          break;
        case 'project':
          groupKey = task.project || 'No Project';
          break;
        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'No Due Date';
          } else {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const taskDue = new Date(task.dueDate);
            const diffTime = taskDue.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) groupKey = 'Overdue';
            else if (diffDays === 0) groupKey = 'Due Today';
            else if (diffDays <= 7) groupKey = 'Due This Week';
            else if (diffDays <= 30) groupKey = 'Due This Month';
            else groupKey = 'Due Later';
          }
          break;
        default:
          groupKey = 'All Tasks';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [sortedTasks, groupBy]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return new Date(t.dueDate) < today;
    }).length;
    
    return { total, completed, inProgress, overdue, pending: total - completed };
  }, [tasks]);

  // Event handlers
  const handleTaskStatusChange = useCallback((taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status, updatedAt: new Date() }
        : task
    ));
    onTaskUpdate?.(taskId, { status });
  }, [onTaskUpdate]);

  const handleTaskPriorityChange = useCallback((taskId: string, priority: Task['priority']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, priority, updatedAt: new Date() }
        : task
    ));
    onTaskUpdate?.(taskId, { priority });
  }, [onTaskUpdate]);

  const handleTaskEdit = useCallback((taskId: string) => {
    // In a real implementation, this would open an edit modal/drawer
    console.log('Edit task:', taskId);
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
    onTaskDelete?.(taskId);
  }, [onTaskDelete]);

  const handleSelectionChange = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);

  const handleFilterChange = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSortChange = useCallback((field: SortOption['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dateRange: 'all',
      project: 'all',
      tags: []
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.search ||
           filters.status !== 'all' ||
           filters.priority !== 'all' ||
           filters.dateRange !== 'all' ||
           filters.project !== 'all' ||
           filters.tags.length > 0;
  }, [filters]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-rix-border-primary rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-rix-text-primary">
            Task Management
          </h1>
          <p className="text-rix-text-secondary mt-1">
            Organize and prioritize your work with intelligent task management
          </p>
        </div>
        
        <Button 
          onClick={onTaskCreate}
          className="w-full md:w-auto min-h-[44px] touch-manipulation"
          size="lg"
        >
          <Icons.Plus className="w-5 h-5 mr-2" />
          New Task
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-rix-border-primary">
        <CardContent className="p-4 md:p-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-rix-text-tertiary" />
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 min-h-[44px] bg-rix-surface border-rix-border-primary text-rix-text-primary"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Status Filters */}
            {(['all', 'todo', 'in_progress', 'completed', 'blocked'] as const).map((status) => (
              <Button
                key={status}
                variant={filters.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('status', status)}
                className="min-h-[36px] capitalize"
              >
                {status.replace('_', ' ')}
                {status !== 'all' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {tasks.filter(t => t.status === status).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-rix-text-secondary"
            >
              <Icons.Filter className="w-4 h-4 mr-2" />
              Advanced Filters
              <Icons.ChevronDown className={cn(
                'w-4 h-4 ml-2 transition-transform',
                showFilters && 'rotate-180'
              )} />
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-rix-text-secondary"
              >
                <Icons.X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-rix-border-primary space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-rix-text-secondary mb-2">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value as FilterState['priority'])}
                    className={cn(
                      'w-full min-h-[44px] px-3 py-2 rounded-md border',
                      'bg-rix-surface border-rix-border-primary text-rix-text-primary',
                      'focus:outline-none focus:ring-2 focus:ring-rix-accent-primary'
                    )}
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-rix-text-secondary mb-2">
                    Due Date
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value as FilterState['dateRange'])}
                    className={cn(
                      'w-full min-h-[44px] px-3 py-2 rounded-md border',
                      'bg-rix-surface border-rix-border-primary text-rix-text-primary',
                      'focus:outline-none focus:ring-2 focus:ring-rix-accent-primary'
                    )}
                  >
                    <option value="all">All Dates</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Due Today</option>
                    <option value="week">Due This Week</option>
                    <option value="month">Due This Month</option>
                    <option value="no_date">No Due Date</option>
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-rix-text-secondary mb-2">
                    Project
                  </label>
                  <select
                    value={filters.project}
                    onChange={(e) => handleFilterChange('project', e.target.value)}
                    className={cn(
                      'w-full min-h-[44px] px-3 py-2 rounded-md border',
                      'bg-rix-surface border-rix-border-primary text-rix-text-primary',
                      'focus:outline-none focus:ring-2 focus:ring-rix-accent-primary'
                    )}
                  >
                    <option value="all">All Projects</option>
                    {uniqueProjects.map(project => (
                      <option key={project} value={project}>{project}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Sort and Group Controls */}
        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-rix-text-secondary">Sort by:</span>
            <select
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [SortOption['field'], SortOption['direction']];
                setSort({ field, direction });
              }}
              className={cn(
                'px-3 py-1 rounded border bg-rix-surface border-rix-border-primary',
                'text-rix-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-rix-accent-primary'
              )}
            >
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="title-asc">Title (A to Z)</option>
              <option value="title-desc">Title (Z to A)</option>
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="createdAt-desc">Recently Created</option>
            </select>
          </div>

          {/* Group By */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-rix-text-secondary">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className={cn(
                'px-3 py-1 rounded border bg-rix-surface border-rix-border-primary',
                'text-rix-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-rix-accent-primary'
              )}
            >
              <option value="none">No Grouping</option>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="project">Project</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>

        {/* View Mode and Selection */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-rix-border-primary rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-r border-rix-border-primary"
            >
              <Icons.List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="rounded-none"
            >
              <Icons.Grid className="w-4 h-4" />
            </Button>
          </div>

          {/* Results Count */}
          <span className="text-sm text-rix-text-secondary">
            {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Icons.CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Total</p>
                <p className="text-xl font-bold text-rix-text-primary">{taskStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Icons.Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Pending</p>
                <p className="text-xl font-bold text-rix-text-primary">{taskStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Icons.CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Completed</p>
                <p className="text-xl font-bold text-rix-text-primary">{taskStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Icons.AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Overdue</p>
                <p className="text-xl font-bold text-rix-text-primary">{taskStats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <Card className="border-rix-accent-primary bg-rix-accent-primary text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTasks(new Set())}
                  className="text-white hover:bg-white/10"
                >
                  <Icons.X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    selectedTasks.forEach(taskId => {
                      handleTaskStatusChange(taskId, 'completed');
                    });
                    setSelectedTasks(new Set());
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Mark Complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    selectedTasks.forEach(taskId => {
                      handleTaskDelete(taskId);
                    });
                  }}
                  className="text-white hover:bg-white/10"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName}>
            {/* Group Header */}
            {groupBy !== 'none' && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-rix-text-primary flex items-center gap-2">
                  {groupName}
                  <Badge variant="outline" className="text-xs">
                    {groupTasks.length}
                  </Badge>
                </h3>
              </div>
            )}

            {/* Group Tasks */}
            <div className={cn(
              'space-y-3',
              viewMode === 'compact' && 'space-y-2'
            )}>
              {groupTasks.length === 0 ? (
                <Card className="border-rix-border-primary">
                  <CardContent className="p-8 text-center">
                    <Icons.CheckSquare className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
                    <h3 className="text-lg font-semibold text-rix-text-primary mb-2">
                      No tasks found
                    </h3>
                    <p className="text-rix-text-secondary">
                      {hasActiveFilters
                        ? 'Try adjusting your filters or search terms.'
                        : 'Create your first task to get started.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                groupTasks.map((task) => (
                  <EnhancedTaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                    onPriorityChange={handleTaskPriorityChange}
                    onEdit={handleTaskEdit}
                    onDelete={handleTaskDelete}
                    isSelected={selectedTasks.has(task.id)}
                    onSelectionChange={selectedTasks.size > 0 ? handleSelectionChange : undefined}
                    showProject={groupBy !== 'project'}
                    compact={viewMode === 'compact'}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <TaskCardSkeleton key={i} compact={viewMode === 'compact'} />
          ))}
        </div>
      )}
    </div>
  );
}