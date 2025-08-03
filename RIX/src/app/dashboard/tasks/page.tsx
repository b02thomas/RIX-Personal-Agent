// /src/app/dashboard/tasks/page.tsx
// Task management page implementing RIX design system and responsive layout
// Provides comprehensive task organization with project integration and mobile optimization
// RELEVANT FILES: components/ui/card.tsx, components/ui/button.tsx, store/navigation-store.ts

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance optimization
const Icons = {
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false }),
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  Circle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Circle })), { ssr: false }),
  Search: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Search })), { ssr: false }),
  Filter: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Filter })), { ssr: false })
};

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  project?: string;
  tags: string[];
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'RIX Frontend Implementation abschließen',
    description: 'Dual theme system integrieren und Navigation optimieren',
    completed: false,
    priority: 'high',
    dueDate: new Date('2024-08-03'),
    project: 'RIX Development',
    tags: ['development', 'frontend', 'urgent']
  },
  {
    id: '2',
    title: 'Mobile Navigation testen',
    description: 'Responsive Verhalten auf verschiedenen Geräten prüfen',
    completed: false,
    priority: 'medium',
    dueDate: new Date('2024-08-04'),
    project: 'RIX Development',
    tags: ['testing', 'mobile']
  },
  {
    id: '3',
    title: 'Design System dokumentieren',
    description: 'Vollständige Dokumentation der RIX Design System Komponenten',
    completed: true,
    priority: 'medium',
    project: 'Documentation',
    tags: ['documentation', 'design']
  },
  {
    id: '4',
    title: 'Performance Optimierung',
    description: 'Bundle Size und Core Web Vitals optimieren',
    completed: false,
    priority: 'high',
    dueDate: new Date('2024-08-05'),
    project: 'RIX Development',
    tags: ['performance', 'optimization']
  }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed);
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Icons.AlertCircle className="w-3 h-3" />;
      case 'medium': return <Icons.Clock className="w-3 h-3" />;
      case 'low': return <Icons.CheckCircle className="w-3 h-3" />;
      default: return <Icons.Circle className="w-3 h-3" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const isOverdue = (date?: Date) => {
    if (!date) return false;
    return date < new Date() && date.toDateString() !== new Date().toDateString();
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-rix-text-primary">
            Aufgaben verwalten
          </h1>
          <p className="text-rix-text-secondary mt-1">
            Organisieren Sie Ihre Aufgaben effizient mit intelligenter Priorisierung
          </p>
        </div>
        
        <Button 
          className="w-full md:w-auto min-h-[44px] touch-manipulation"
          size="lg"
        >
          <Icons.Plus className="w-5 h-5 mr-2" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-rix-border-primary">
        <CardContent className="p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-rix-text-tertiary" />
              <Input
                placeholder="Aufgaben durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px] bg-rix-surface border-rix-border-primary text-rix-text-primary"
              />
            </div>
            
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-md border",
                "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
              )}
            >
              <option value="all">Alle Prioritäten</option>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={cn(
                "min-h-[44px] px-3 py-2 rounded-md border",
                "bg-rix-surface border-rix-border-primary text-rix-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-rix-accent-primary"
              )}
            >
              <option value="all">Alle Status</option>
              <option value="pending">Offen</option>
              <option value="completed">Erledigt</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-rix-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Icons.CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-rix-text-secondary">Gesamt</p>
                <p className="text-xl font-bold text-rix-text-primary">{tasks.length}</p>
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
                <p className="text-sm text-rix-text-secondary">Offen</p>
                <p className="text-xl font-bold text-rix-text-primary">
                  {tasks.filter(t => !t.completed).length}
                </p>
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
                <p className="text-sm text-rix-text-secondary">Erledigt</p>
                <p className="text-xl font-bold text-rix-text-primary">
                  {tasks.filter(t => t.completed).length}
                </p>
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
                <p className="text-sm text-rix-text-secondary">Überfällig</p>
                <p className="text-xl font-bold text-rix-text-primary">
                  {tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card className="border-rix-border-primary">
            <CardContent className="p-8 text-center">
              <Icons.CheckSquare className="w-12 h-12 mx-auto text-rix-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-rix-text-primary mb-2">
                Keine Aufgaben gefunden
              </h3>
              <p className="text-rix-text-secondary">
                {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Erstellen Sie Ihre erste Aufgabe.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card 
              key={task.id}
              className={cn(
                "border-rix-border-primary transition-all duration-200 hover:shadow-rix-md",
                task.completed && "opacity-75"
              )}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start space-x-4">
                  {/* Completion Toggle */}
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200",
                      "flex items-center justify-center touch-manipulation",
                      task.completed
                        ? "bg-rix-success border-rix-success text-white"
                        : "border-rix-border-primary hover:border-rix-accent-primary"
                    )}
                  >
                    {task.completed && <Icons.CheckCircle className="w-4 h-4" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                      {/* Title and Description */}
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold text-rix-text-primary",
                          task.completed && "line-through text-rix-text-tertiary"
                        )}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-rix-text-secondary mt-1">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Priority and Due Date */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {/* Priority Badge */}
                        <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1 capitalize">{task.priority}</span>
                        </Badge>

                        {/* Due Date */}
                        {task.dueDate && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              isOverdue(task.dueDate) && !task.completed && 
                              "border-red-500 text-red-600 dark:text-red-400"
                            )}
                          >
                            <Icons.Calendar className="w-3 h-3 mr-1" />
                            {formatDate(task.dueDate)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Project */}
                    {task.project && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {task.project}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}