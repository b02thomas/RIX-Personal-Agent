import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Plus, Clock, Flag, Search, X, CheckCircle, Circle, PlayCircle, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number; // 1-10
  status: 'todo' | 'in_progress' | 'completed' | 'overdue';
  due_date?: string;
  created_at: string;
  project_id?: string;
  tags: string[];
  category?: string;
  estimated_duration?: number; // in minutes
  completion_percentage?: number;
}

type FilterMode = 'today' | 'tomorrow' | 'week' | 'month' | 'all' | 'overdue';
type ViewMode = 'daily' | 'general';
type StatusFilter = 'all' | 'todo' | 'in_progress' | 'completed' | 'overdue';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export const EnhancedTasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTasks();
  }, [filterMode, viewMode, selectedDate, statusFilter, priorityFilter]);
  
  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?filter=${filterMode}&view=${viewMode}&date=${selectedDate}&status=${statusFilter}&priority=${priorityFilter}`);
      const data = await response.json();
      setTasks(data.tasks || mockTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  };
  
  // Mock tasks for development
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Meeting Vorbereitung für Q4 Review',
      description: 'Präsentation erstellen und Zahlen analysieren',
      priority: 8,
      status: 'todo',
      due_date: '2025-08-04T14:00:00',
      created_at: '2025-08-04T09:00:00',
      tags: ['meeting', 'wichtig', 'q4'],
      category: 'Business',
      estimated_duration: 120,
      completion_percentage: 0
    },
    {
      id: '2',
      title: 'Einkaufen gehen',
      description: 'Lebensmittel für die Woche besorgen',
      priority: 4,
      status: 'todo',
      due_date: '2025-08-04T18:00:00',
      created_at: '2025-08-04T08:00:00',
      tags: ['persönlich', 'alltag'],
      category: 'Personal',
      estimated_duration: 60
    },
    {
      id: '3',
      title: 'Code Review für RIX Voice Features',
      description: 'Neue Voice Intelligence Features überprüfen',
      priority: 7,
      status: 'in_progress',
      due_date: '2025-08-05T10:00:00',
      created_at: '2025-08-03T15:00:00',
      tags: ['entwicklung', 'review', 'voice'],
      category: 'Development',
      estimated_duration: 90,
      completion_percentage: 65
    },
    {
      id: '4',
      title: 'Deutschkurs Hausaufgaben',
      description: 'Kapitel 12 durcharbeiten und Übungen machen',
      priority: 6,
      status: 'completed',
      due_date: '2025-08-03T20:00:00',
      created_at: '2025-08-02T19:00:00',
      tags: ['lernen', 'deutsch', 'bildung'],
      category: 'Education',
      estimated_duration: 45,
      completion_percentage: 100
    },
    {
      id: '5',
      title: 'Zahnarzttermin vereinbaren',
      description: 'Kontrollermin für nächsten Monat buchen',
      priority: 5,
      status: 'overdue',
      due_date: '2025-08-02T12:00:00',
      created_at: '2025-07-30T10:00:00',
      tags: ['gesundheit', 'termin'],
      category: 'Health',
      estimated_duration: 15
    }
  ];
  
  const filteredTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const taskDate = task.due_date?.split('T')[0];
    
    // Date filtering
    let dateMatch = true;
    switch (filterMode) {
      case 'today':
        dateMatch = taskDate === today;
        break;
      case 'tomorrow':
        dateMatch = taskDate === tomorrow;
        break;
      case 'week':
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateMatch = taskDate && taskDate <= weekFromNow && taskDate >= today;
        break;
      case 'month':
        const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateMatch = taskDate && taskDate <= monthFromNow && taskDate >= today;
        break;
      case 'overdue':
        dateMatch = taskDate && taskDate < today && task.status !== 'completed';
        break;
      case 'all':
      default:
        dateMatch = true;
    }
    
    // Daily view specific filtering
    if (viewMode === 'daily' && selectedDate) {
      dateMatch = taskDate === selectedDate;
    }
    
    // Status filtering
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    
    // Priority filtering
    let priorityMatch = true;
    if (priorityFilter === 'high') priorityMatch = task.priority >= 8;
    else if (priorityFilter === 'medium') priorityMatch = task.priority >= 4 && task.priority < 8;
    else if (priorityFilter === 'low') priorityMatch = task.priority < 4;
    
    // Completed tasks toggle
    const completedMatch = showCompleted || task.status !== 'completed';
    
    // Search query
    const searchMatch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return dateMatch && statusMatch && priorityMatch && completedMatch && searchMatch;
  });
  
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (priority >= 6) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    if (priority >= 4) return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) return 'Heute';
    if (date.toDateString() === tomorrow.toDateString()) return 'Morgen';
    
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return `${days[date.getDay()]}, ${date.toLocaleDateString('de-DE')}`;
  };
  
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div className={`p-4 rounded-lg border-l-4 ${getPriorityColor(task.priority)} bg-gray-800 mb-3 hover:bg-gray-750 transition-colors ${
      compactView ? 'py-3' : 'py-4'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(task.status)}
          <div className="flex-1">
            <h3 className={`font-semibold text-white ${compactView ? 'text-sm' : 'text-base'}`}>
              {task.title}
            </h3>
            {task.description && !compactView && (
              <p className="text-gray-300 text-sm mb-2 mt-1">{task.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span className={`px-2 py-1 rounded text-xs ${
            task.priority >= 8 ? 'bg-red-600 text-white' :
            task.priority >= 6 ? 'bg-yellow-600 text-white' :
            task.priority >= 4 ? 'bg-blue-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            Priorität {task.priority}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            task.status === 'completed' ? 'bg-green-600 text-white' :
            task.status === 'overdue' ? 'bg-red-600 text-white' :
            task.status === 'in_progress' ? 'bg-blue-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {task.status === 'todo' ? 'Offen' :
             task.status === 'in_progress' ? 'In Arbeit' :
             task.status === 'completed' ? 'Erledigt' :
             'Überfällig'}
          </span>
        </div>
      </div>
      
      {/* Progress bar for in-progress tasks */}
      {task.status === 'in_progress' && task.completion_percentage !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Fortschritt</span>
            <span>{task.completion_percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${task.completion_percentage}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-gray-400">
        <div className="flex items-center gap-4 flex-wrap">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(task.due_date)} {new Date(task.due_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          
          {task.estimated_duration && (
            <div className="flex items-center gap-1">
              <span>⏱️ {task.estimated_duration}min</span>
            </div>
          )}
          
          {task.category && (
            <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs">
              {task.category}
            </span>
          )}
          
          {task.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {task.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-700 rounded text-xs">
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={() => toggleTaskStatus(task.id)}
          className={`px-3 py-1 rounded text-white text-xs transition-colors ${
            task.status === 'completed' 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {task.status === 'completed' ? 'Erledigt ✓' : 'Abschließen'}
        </button>
      </div>
    </div>
  );
  
  const toggleTaskStatus = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/toggle`, { method: 'POST' });
      loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };
  
  const TaskStatistics = () => {
    const totalTasks = filteredTasks.length;
    const openTasks = filteredTasks.filter(t => t.status !== 'completed').length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = filteredTasks.filter(t => t.status === 'overdue').length;
    const highPriorityTasks = filteredTasks.filter(t => t.priority >= 8).length;
    const todayTasks = filteredTasks.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.due_date?.split('T')[0] === today;
    }).length;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{totalTasks}</div>
          <div className="text-gray-400 text-sm">Gesamt</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-500">{openTasks}</div>
          <div className="text-gray-400 text-sm">Offen</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
          <div className="text-gray-400 text-sm">Erledigt</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-500">{overdueTasks}</div>
          <div className="text-gray-400 text-sm">Überfällig</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-500">{highPriorityTasks}</div>
          <div className="text-gray-400 text-sm">Hohe Priorität</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-500">{todayTasks}</div>
          <div className="text-gray-400 text-sm">Heute fällig</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Aufgaben verwalten</h1>
          <p className="text-gray-400">Organisieren Sie Ihre Aufgaben effizient mit intelligenter Priorisierung</p>
        </div>
        
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neue Aufgabe
        </button>
      </div>
      
      {/* Enhanced Filter Bar */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'daily' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              📅 Tagesansicht
            </button>
            <button
              onClick={() => setViewMode('general')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              📋 Allgemein
            </button>
          </div>
          
          {/* Quick Time Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['today', 'tomorrow', 'week', 'month', 'all', 'overdue'] as FilterMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  filterMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mode === 'today' ? '📅 Heute' :
                 mode === 'tomorrow' ? '➡️ Morgen' :
                 mode === 'week' ? '📅 Diese Woche' :
                 mode === 'month' ? '🗓️ Dieser Monat' :
                 mode === 'all' ? '🌐 Alle' :
                 '⚠️ Überfällig'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Date Picker (for daily view) */}
          {viewMode === 'daily' && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Aufgaben durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 text-white rounded-lg pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Advanced Filters */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Status</option>
            <option value="todo">Offen</option>
            <option value="in_progress">In Arbeit</option>
            <option value="completed">Erledigt</option>
            <option value="overdue">Überfällig</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Prioritäten</option>
            <option value="high">Hoch (8-10)</option>
            <option value="medium">Mittel (4-7)</option>
            <option value="low">Niedrig (1-3)</option>
          </select>
          
          {/* Toggle Controls */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Erledigte anzeigen</span>
            </label>
            
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Kompakte Ansicht</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Task Statistics */}
      <TaskStatistics />
      
      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Lade Aufgaben...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <p>Keine Aufgaben für die ausgewählte Ansicht gefunden.</p>
              {searchQuery && (
                <p className="text-sm mt-2">
                  Suchkriterien: "<span className="text-white">{searchQuery}</span>"
                </p>
              )}
            </div>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
              Erste Aufgabe erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks
              .sort((a, b) => {
                // Sort by priority first, then by due date
                if (a.priority !== b.priority) return b.priority - a.priority;
                if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                return 0;
              })
              .map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
          </div>
        )}
      </div>
      
      {/* Results Summary */}
      {!loading && filteredTasks.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            Zeige {filteredTasks.length} von {tasks.length} Aufgaben
            {searchQuery && ` für "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
};