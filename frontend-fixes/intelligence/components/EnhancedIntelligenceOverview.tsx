import React, { useState, useEffect } from 'react';
import { Brain, Target, BookOpen, TrendingUp, Settings, Plus, Search, Calendar, Clock, Tag, AlertCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'weekly' | 'monthly' | 'yearly';
  progress: number;
  target_value: number;
  current_value: number;
  due_date: string;
  status: 'active' | 'completed' | 'paused' | 'overdue';
  tags: string[];
  priority: 'high' | 'medium' | 'low';
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  embedding_score?: number;
  last_accessed?: string;
  access_count: number;
}

interface AIInsight {
  id: string;
  type: 'productivity' | 'goals' | 'patterns' | 'recommendations' | 'trends';
  title: string;
  description: string;
  confidence: number;
  data: any;
  generated_at: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export const EnhancedIntelligenceOverview: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [selectedKnowledgeCategory, setSelectedKnowledgeCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadIntelligenceData();
  }, []);
  
  const loadIntelligenceData = async () => {
    setLoading(true);
    try {
      // Load goals
      const goalsResponse = await fetch('/api/intelligence/goals');
      const goalsData = await goalsResponse.json();
      setGoals(goalsData.goals || mockGoals);
      
      // Load knowledge entries with vector search
      const knowledgeResponse = await fetch('/api/intelligence/knowledge');
      const knowledgeData = await knowledgeResponse.json();
      setKnowledgeEntries(knowledgeData.entries || mockKnowledge);
      
      // Load AI insights
      const insightsResponse = await fetch('/api/intelligence/insights');
      const insightsData = await insightsResponse.json();
      setAIInsights(insightsData.insights || mockInsights);
      
    } catch (error) {
      console.error('Failed to load intelligence data:', error);
      // Use mock data as fallback
      setGoals(mockGoals);
      setKnowledgeEntries(mockKnowledge);
      setAIInsights(mockInsights);
    } finally {
      setLoading(false);
    }
  };
  
  // Mock data for development
  const mockGoals: Goal[] = [
    {
      id: '1',
      title: 'RIX Voice Intelligence implementieren',
      description: 'Vollständige Sprachsteuerung für alle Features entwickeln',
      category: 'weekly',
      progress: 75,
      target_value: 100,
      current_value: 75,
      due_date: '2025-08-10',
      status: 'active',
      tags: ['entwicklung', 'ki', 'voice'],
      priority: 'high'
    },
    {
      id: '2',
      title: 'Deutsch lernen - Level B2 erreichen',
      description: 'Täglich 30 Minuten Deutsch lernen und B2-Prüfung bestehen',
      category: 'monthly',
      progress: 45,
      target_value: 100,
      current_value: 45,
      due_date: '2025-09-15',
      status: 'active',
      tags: ['bildung', 'sprache', 'personal'],
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Fitness Routine etablieren',
      description: '3x pro Woche Sport, Gewicht reduzieren um 5kg',
      category: 'yearly',
      progress: 20,
      target_value: 52, // weeks
      current_value: 10,
      due_date: '2025-12-31',
      status: 'active',
      tags: ['gesundheit', 'sport', 'routine'],
      priority: 'medium'
    }
  ];
  
  const mockKnowledge: KnowledgeEntry[] = [
    {
      id: '1',
      title: 'React Hook Optimization Patterns',
      content: 'useMemo und useCallback sollten strategisch eingesetzt werden. Nicht jede Funktion braucht useCallback - nur wenn sie als Dependency an andere Hooks weitergegeben wird oder an React.memo Components.',
      category: 'Programmierung',
      tags: ['react', 'performance', 'hooks'],
      created_at: '2025-08-01T10:00:00Z',
      embedding_score: 0.92,
      last_accessed: '2025-08-04T14:30:00Z',
      access_count: 15
    },
    {
      id: '2',
      title: 'Deutsche Grammatik: Konjunktiv II',
      content: 'Der Konjunktiv II wird für höfliche Bitten, irreale Wünsche und Bedingungen verwendet. Bildung: würde + Infinitiv oder Präteritumstamm + Konjunktivendung. Beispiel: "Ich hätte gerne..." oder "Wenn ich Zeit hätte, würde ich..."',
      category: 'Sprachen',
      tags: ['deutsch', 'grammatik', 'konjunktiv'],
      created_at: '2025-07-28T16:20:00Z',
      embedding_score: 0.88,
      last_accessed: '2025-08-03T09:15:00Z',
      access_count: 8
    },
    {
      id: '3',
      title: 'PostgreSQL Performance Tuning',
      content: 'Für bessere Performance: 1. Indizes auf häufig gefilterte Spalten, 2. EXPLAIN ANALYZE für Query-Analyse, 3. Connection Pooling verwenden, 4. Regelmäßig VACUUM und ANALYZE ausführen, 5. shared_buffers auf 25% des RAM setzen.',
      category: 'Datenbank',
      tags: ['postgresql', 'performance', 'database'],
      created_at: '2025-07-30T11:45:00Z',
      embedding_score: 0.95,
      last_accessed: '2025-08-04T13:20:00Z',
      access_count: 22
    }
  ];
  
  const mockInsights: AIInsight[] = [
    {
      id: '1',
      type: 'productivity',
      title: 'Beste Arbeitszeit identifiziert',
      description: 'Ihre produktivste Zeit ist zwischen 9-11 Uhr morgens. 73% Ihrer Aufgaben werden in diesem Zeitfenster abgeschlossen.',
      confidence: 0.87,
      data: { peak_hours: '09:00-11:00', completion_rate: 0.73 },
      generated_at: '2025-08-04T08:00:00Z',
      priority: 'high',
      actionable: true
    },
    {
      id: '2',
      type: 'goals',
      title: 'Ziel-Fortschritt Analyse',
      description: 'Ihr wöchentliches RIX-Entwicklungsziel ist 75% abgeschlossen. Bei aktuellem Tempo erreichen Sie das Ziel 2 Tage früher.',
      confidence: 0.92,
      data: { goal_id: '1', projected_completion: '2025-08-08' },
      generated_at: '2025-08-04T12:00:00Z',
      priority: 'medium',
      actionable: true
    },
    {
      id: '3',
      type: 'patterns',
      title: 'Lernmuster erkannt',
      description: 'Sie lernen Deutsch am effektivsten nach dem Mittagessen (14-16 Uhr). Retention Rate in diesem Zeitfenster: +34%.',
      confidence: 0.76,
      data: { optimal_time: '14:00-16:00', retention_boost: 0.34 },
      generated_at: '2025-08-04T15:30:00Z',
      priority: 'medium',
      actionable: true
    }
  ];
  
  const AddGoalModal: React.FC = () => {
    const [newGoal, setNewGoal] = useState({
      title: '',
      description: '',
      category: 'weekly' as Goal['category'],
      target_value: 100,
      due_date: '',
      priority: 'medium' as Goal['priority'],
      tags: ''
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        const response = await fetch('/api/intelligence/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newGoal,
            tags: newGoal.tags.split(',').map(t => t.trim()).filter(t => t)
          })
        });
        
        if (response.ok) {
          setShowAddGoal(false);
          loadIntelligenceData();
          setNewGoal({ 
            title: '', 
            description: '', 
            category: 'weekly', 
            target_value: 100, 
            due_date: '',
            priority: 'medium',
            tags: ''
          });
        }
      } catch (error) {
        console.error('Failed to create goal:', error);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Neues Ziel erstellen</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Titel</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ziel-Titel eingeben..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Detaillierte Beschreibung..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value as Goal['category']})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">📅 Wöchentlich</option>
                  <option value="monthly">📆 Monatlich</option>
                  <option value="yearly">🗓️ Jährlich</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value as Goal['priority']})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">🔴 Hoch</option>
                  <option value="medium">🟡 Mittel</option>
                  <option value="low">🟢 Niedrig</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zielwert</label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({...newGoal, target_value: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fälligkeitsdatum</label>
                <input
                  type="date"
                  value={newGoal.due_date}
                  onChange={(e) => setNewGoal({...newGoal, due_date: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags (kommagetrennt)</label>
              <input
                type="text"
                value={newGoal.tags}
                onChange={(e) => setNewGoal({...newGoal, tags: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="entwicklung, personal, gesundheit"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium"
              >
                Ziel erstellen
              </button>
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-4 py-2 font-medium"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  const AddKnowledgeModal: React.FC = () => {
    const [newEntry, setNewEntry] = useState({
      title: '',
      content: '',
      category: '',
      tags: ''
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        const response = await fetch('/api/intelligence/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newEntry,
            tags: newEntry.tags.split(',').map(t => t.trim()).filter(t => t)
          })
        });
        
        if (response.ok) {
          setShowAddKnowledge(false);
          loadIntelligenceData();
          setNewEntry({ title: '', content: '', category: '', tags: '' });
        }
      } catch (error) {
        console.error('Failed to create knowledge entry:', error);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Wissen hinzufügen</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Titel</label>
              <input
                type="text"
                value={newEntry.title}
                onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titel des Wissenseintrags..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Inhalt</label>
              <textarea
                value={newEntry.content}
                onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                placeholder="Beschreiben Sie hier Ihr Wissen, Erkenntnisse oder wichtige Informationen..."
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie</label>
                <input
                  type="text"
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({...newEntry, category: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Programmierung, Business, Persönlich"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (kommagetrennt)</label>
                <input
                  type="text"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry({...newEntry, tags: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="react, typescript, api, etc."
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium"
              >
                Wissen speichern
              </button>
              <button
                type="button"
                onClick={() => setShowAddKnowledge(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-4 py-2 font-medium"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  const filteredGoals = goals.filter(goal => goal.category === selectedGoalCategory);
  const filteredKnowledge = knowledgeEntries.filter(entry => {
    const searchMatch = !knowledgeSearchQuery || 
      entry.title.toLowerCase().includes(knowledgeSearchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(knowledgeSearchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(knowledgeSearchQuery.toLowerCase()));
    
    const categoryMatch = selectedKnowledgeCategory === 'all' || entry.category === selectedKnowledgeCategory;
    
    return searchMatch && categoryMatch;
  });
  
  const knowledgeCategories = [...new Set(knowledgeEntries.map(entry => entry.category))];
  
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-400">Lade Intelligence Daten...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Intelligence Overview</h1>
          <p className="text-gray-400">KI-gestützte Einblicke in Ihre Produktivität, Ziele und Wissensbasis</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>KI-Analyse aktiv</span>
          </div>
        </div>
      </div>
      
      {/* AI Insights Dashboard */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          KI-Einblicke & Empfehlungen
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiInsights.length > 0 ? aiInsights.map(insight => (
            <div key={insight.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    insight.priority === 'high' ? 'bg-red-600 text-white' :
                    insight.priority === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {insight.priority === 'high' ? 'Hoch' :
                     insight.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                  </span>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>{new Date(insight.generated_at).toLocaleDateString('de-DE')}</span>
                {insight.actionable && (
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Umsetzbar
                  </span>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-8 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>KI-Einblicke werden generiert, sobald genügend Daten vorhanden sind.</p>
              <p className="text-sm mt-1">Verwenden Sie RIX regelmäßig für personalisierte Empfehlungen.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Goals Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Ziel-Management
          </h2>
          <button
            onClick={() => setShowAddGoal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neues Ziel
          </button>
        </div>
        
        {/* Goal Category Tabs */}
        <div className="flex gap-2 mb-4">
          {(['weekly', 'monthly', 'yearly'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedGoalCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedGoalCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category === 'weekly' ? '📅 Wöchentlich' :
               category === 'monthly' ? '📆 Monatlich' :
               '🗓️ Jährlich'}
              <span className="ml-2 text-xs">
                ({goals.filter(g => g.category === category).length})
              </span>
            </button>
          ))}
        </div>
        
        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length > 0 ? filteredGoals.map(goal => (
            <div key={goal.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{goal.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      goal.priority === 'high' ? 'bg-red-600 text-white' :
                      goal.priority === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {goal.priority === 'high' ? 'Hoch' :
                       goal.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{goal.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Fortschritt</span>
                      <span>{goal.progress}% ({goal.current_value}/{goal.target_value})</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.progress >= 90 ? 'bg-green-500' :
                          goal.progress >= 70 ? 'bg-blue-500' :
                          goal.progress >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Tags and Due Date */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(goal.due_date).toLocaleDateString('de-DE')}</span>
                    </div>
                    {goal.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <div className="flex gap-1">
                          {goal.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    goal.status === 'completed' ? 'bg-green-600 text-white' :
                    goal.status === 'overdue' ? 'bg-red-600 text-white' :
                    goal.status === 'paused' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {goal.status === 'completed' ? '✓ Abgeschlossen' :
                     goal.status === 'overdue' ? '⚠️ Überfällig' :
                     goal.status === 'paused' ? '⏸️ Pausiert' :
                     '🎯 Aktiv'}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Keine Ziele in der Kategorie "{selectedGoalCategory}" gefunden.</p>
              <button
                onClick={() => setShowAddGoal(true)}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                Erstes Ziel erstellen
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Knowledge Base Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Wissensbasis & Notizen
          </h2>
          <button
            onClick={() => setShowAddKnowledge(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Wissen hinzufügen
          </button>
        </div>
        
        {/* Knowledge Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Wissen durchsuchen..."
              value={knowledgeSearchQuery}
              onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
              className="bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedKnowledgeCategory}
            onChange={(e) => setSelectedKnowledgeCategory(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle Kategorien</option>
            {knowledgeCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* Knowledge Entries */}
        <div className="space-y-4">
          {filteredKnowledge.length > 0 ? filteredKnowledge
            .sort((a, b) => {
              // Sort by access count and embedding score
              if (a.access_count !== b.access_count) return b.access_count - a.access_count;
              return (b.embedding_score || 0) - (a.embedding_score || 0);
            })
            .map(entry => (
            <div key={entry.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{entry.title}</h3>
                  <p className="text-gray-300 text-sm line-clamp-3 mb-2">{entry.content}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="px-2 py-1 bg-gray-600 rounded">{entry.category}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(entry.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                    <span>{entry.access_count} Aufrufe</span>
                    {entry.embedding_score && (
                      <span className="text-green-400">
                        Relevanz: {Math.round(entry.embedding_score * 100)}%
                      </span>
                    )}
                  </div>
                  
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-1 text-gray-400 hover:text-white">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>
                {knowledgeSearchQuery 
                  ? `Keine Einträge für "${knowledgeSearchQuery}" gefunden.`
                  : 'Noch keine Wissenseinträge vorhanden.'
                }
              </p>
              <button
                onClick={() => setShowAddKnowledge(true)}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                Erstes Wissen hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {showAddGoal && <AddGoalModal />}
      {showAddKnowledge && <AddKnowledgeModal />}
    </div>
  );
};