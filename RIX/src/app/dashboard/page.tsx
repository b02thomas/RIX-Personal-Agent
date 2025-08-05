// /Users/benediktthomas/RIX Personal Agent/RIX/src/app/dashboard/page.tsx
// Complete redesigned RIX Dashboard with crisp typography and logo integration
// Provides overview and chat interface with floating AI sphere
// RELEVANT FILES: components/ChatInterface.tsx, components/SphereWidget.tsx, globals.css, design-system.css

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Target, 
  BookOpen, 
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { ChatInterface } from '../components/ChatInterface';
import { SphereWidget } from '../components/SphereWidget';

interface Project {
  id: string;
  name: string;
  progress: number;
  status: 'active' | 'paused' | 'completed';
  lastActivity: string;
  type: 'personal' | 'business';
}

interface DashboardStats {
  tasks: { total: number; completed: number; overdue: number };
  calendar: { today: number; week: number };
  goals: { active: number; progress: number };
  routines: { completed: number; total: number };
}


export default function Dashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'chat'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    tasks: { total: 12, completed: 7, overdue: 2 },
    calendar: { today: 3, week: 8 },
    goals: { active: 4, progress: 67 },
    routines: { completed: 3, total: 5 }
  });

  const loadDashboardData = useCallback(async () => {
    try {
      // Load projects
      const projectsResponse = await fetch('/api/projects');
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);

      // Load stats
      const statsResponse = await fetch('/api/dashboard/stats');
      const statsData = await statsResponse.json();
      setStats(prev => statsData.stats || prev);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-300 tracking-wide">{title}</h3>
          </div>
          <div className="mb-1">
            <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className="text-xs text-green-400 font-medium">
            {trend}
          </div>
        )}
      </div>
    </div>
  );

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 border border-gray-700/40 hover:border-blue-500/40 transition-all duration-300 cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            project.status === 'active' ? 'bg-green-500' :
            project.status === 'paused' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
          <h4 className="text-white font-medium text-sm tracking-wide">{project.name}</h4>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Fortschritt</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        {project.lastActivity}
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20">
      {/* Enhanced Header with Logo */}
      <div className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* RIX Logo */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
                  {/* Neural Wave Pattern */}
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-cyan-400">
                    <path d="M3 12 Q6 8 9 12 T15 12 Q18 8 21 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
                    <path d="M3 14 Q6 10 9 14 T15 14 Q18 10 21 14" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
                    {/* Lightning Bolt */}
                    <path d="M13 3 L8 12 H11 L10 21 L15 12 H12 L13 3 Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">RIX Dashboard</h1>
                <p className="text-sm text-gray-400">Ihr KI-gestützter Produktivitäts-Assistent</p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-800/60 rounded-lg p-1">
              <button
                onClick={() => setActiveView('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeView === 'overview' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                📊 Übersicht
              </button>
              <button
                onClick={() => setActiveView('chat')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeView === 'chat'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                💬 RIX Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeView === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Aufgaben"
                value={stats.tasks.total - stats.tasks.completed}
                subtitle={`${stats.tasks.completed} erledigt, ${stats.tasks.overdue} überfällig`}
                icon={<CheckSquare className="w-5 h-5 text-white" />}
                color="bg-blue-600/20"
                trend="+12%"
              />
              
              <StatCard
                title="Termine"
                value={stats.calendar.today}
                subtitle={`${stats.calendar.week} diese Woche`}
                icon={<Calendar className="w-5 h-5 text-white" />}
                color="bg-green-600/20"
              />
              
              <StatCard
                title="Ziele"
                value={`${stats.goals.progress}%`}
                subtitle={`${stats.goals.active} aktive Ziele`}
                icon={<Target className="w-5 h-5 text-white" />}
                color="bg-purple-600/20"
                trend="+5%"
              />
              
              <StatCard
                title="Routinen"
                value={`${stats.routines.completed}/${stats.routines.total}`}
                subtitle="Heute abgeschlossen"
                icon={<TrendingUp className="w-5 h-5 text-white" />}
                color="bg-orange-600/20"
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <SphereWidget />
              
              {/* Quick Actions */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-3 tracking-wide">Schnellaktionen</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Neuer Termin
                  </button>
                  <button className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200 flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-green-400" />
                    Neue Aufgabe
                  </button>
                  <button className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200 flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Wissen speichern
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Recent Projects */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/40">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white tracking-wide">Aktuelle Projekte</h2>
                  <button className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm transition-all duration-200">
                    <Plus className="w-4 h-4" />
                    Neues Projekt
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProjectCard 
                    project={{
                      id: '1',
                      name: 'Personal Productivity',
                      progress: 75,
                      status: 'active',
                      lastActivity: 'Vor 2 Stunden',
                      type: 'personal'
                    }}
                  />
                  <ProjectCard 
                    project={{
                      id: '2', 
                      name: 'Learning Goals',
                      progress: 45,
                      status: 'active',
                      lastActivity: 'Gestern',
                      type: 'personal'
                    }}
                  />
                  <ProjectCard 
                    project={{
                      id: '3',
                      name: 'Business Development',
                      progress: 30,
                      status: 'paused',
                      lastActivity: 'Vor 3 Tagen',
                      type: 'business'
                    }}
                  />
                  <ProjectCard 
                    project={{
                      id: '4',
                      name: 'Health & Fitness',
                      progress: 88,
                      status: 'active',
                      lastActivity: 'Heute',
                      type: 'personal'
                    }}
                  />
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/40">
                <h2 className="text-xl font-semibold text-white tracking-wide mb-4">Heute geplant</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-1 h-12 bg-blue-500 rounded-full" />
                    <div className="flex items-center gap-3 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">09:00</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Team Meeting</h4>
                      <p className="text-sm text-gray-400">Sprint Planning Session</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>4 Teilnehmer</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-1 h-12 bg-green-500 rounded-full" />
                    <div className="flex items-center gap-3 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">14:00</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Client Call</h4>
                      <p className="text-sm text-gray-400">Project Review & Feedback</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Zap className="w-3 h-3" />
                      <span>High Priority</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat View */
          <div className="max-w-4xl mx-auto">
            <div className="h-[calc(100vh-200px)]">
              <ChatInterface />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 