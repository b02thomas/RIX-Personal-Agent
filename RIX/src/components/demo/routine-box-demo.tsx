// /src/components/demo/routine-box-demo.tsx
// Demo routine box component implementing Phase 2 design specifications
// Showcases the RoutineBox component design with coaching integration and progress tracking
// RELEVANT FILES: component-specifications.md, design-system.css, preferences-store.ts

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/store/preferences-store';

// Dynamic icon imports for performance
const Icons = {
  CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  Flame: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Flame })), { ssr: false }),
  Heart: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Heart })), { ssr: false }),
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  Target: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Target })), { ssr: false }),
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  Sparkles: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sparkles })), { ssr: false })
};

interface RoutineData {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  lastCompleted?: Date;
  nextDue: Date;
  category: 'health' | 'productivity' | 'learning' | 'personal';
  progress: number; // 0-100
  completed: boolean;
  overdue: boolean;
}

interface CoachingData {
  message: string;
  motivation: string;
  tips: string[];
  confidence: number; // 0-100
}

interface RoutineBoxDemoProps {
  routine: RoutineData;
  coaching?: CoachingData;
  onComplete?: (routineId: string) => void;
  onSkip?: (routineId: string) => void;
  onViewDetails?: (routineId: string) => void;
  className?: string;
}

const categoryIcons = {
  health: Icons.Heart,
  productivity: Icons.Target,
  learning: Icons.Brain,
  personal: Icons.User
};

const categoryColors = {
  health: '#34D399', // Green
  productivity: '#60A5FA', // Blue
  learning: '#A78BFA', // Purple
  personal: '#FBBF24' // Yellow
};

export const RoutineBoxDemo: React.FC<RoutineBoxDemoProps> = ({
  routine,
  coaching,
  onComplete,
  onSkip,
  onViewDetails,
  className
}) => {
  const { preferences } = usePreferencesStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCoaching, setShowCoaching] = useState(false);

  const CategoryIcon = categoryIcons[routine.category];
  const categoryColor = categoryColors[routine.category];

  const handleComplete = async () => {
    if (routine.completed || isCompleting) return;
    
    setIsCompleting(true);
    
    // Simulate API call with delay for animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onComplete?.(routine.id);
    setIsCompleting(false);
  };

  const handleSkip = () => {
    onSkip?.(routine.id);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Gerade eben';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    return `vor ${Math.floor(diffInHours / 24)}d`;
  };

  const getCoachingMessage = () => {
    if (!coaching) return null;
    
    const { cognitiveMode } = preferences;
    
    switch (cognitiveMode) {
      case 'focus':
        return `Quick insight: ${coaching.message}`;
      case 'ambient':
        return coaching.motivation;
      case 'discovery':
        return `Did you know? ${coaching.tips[0]}`;
      default:
        return coaching.message;
    }
  };

  return (
    <div
      className={cn(
        'rix-routine-box rix-interactive',
        routine.completed && 'rix-routine-box--completed',
        routine.overdue && 'rix-routine-box--overdue',
        className
      )}
      style={{
        background: routine.completed 
          ? `linear-gradient(135deg, var(--rix-surface) 0%, ${categoryColor}15 100%)`
          : routine.overdue
          ? 'linear-gradient(135deg, var(--rix-surface) 0%, rgba(248, 113, 113, 0.05) 100%)'
          : 'var(--rix-surface)'
      }}
    >
      {/* Header Section */}
      <div className="rix-routine-header">
        <div className="flex items-start space-x-3 flex-1">
          <div
            className="rix-routine-category"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor
            }}
          >
            <CategoryIcon className="w-3 h-3" />
            <span className="capitalize">{routine.category}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white leading-tight">
              {routine.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {routine.description}
            </p>
          </div>
        </div>

        <div className="rix-routine-streak">
          <Icons.Flame className="w-4 h-4" />
          <span>{routine.streak}</span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="rix-routine-progress">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {routine.frequency === 'daily' ? 'Heute' : 
             routine.frequency === 'weekly' ? 'Diese Woche' : 'Diesen Monat'}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {routine.progress}%
          </span>
        </div>
        
        <div className="rix-routine-progress-bar">
          <div
            className="rix-routine-progress-fill"
            style={{
              width: `${routine.progress}%`,
              background: routine.completed
                ? `linear-gradient(90deg, ${categoryColor}, ${categoryColor})`
                : 'linear-gradient(90deg, var(--rix-success) 0%, var(--rix-accent-primary) 100%)'
            }}
          />
        </div>
      </div>

      {/* Coaching Section */}
      {coaching && (
        <div 
          className={cn(
            'rix-routine-coaching transition-all duration-200',
            showCoaching ? 'opacity-100 max-h-40' : 'opacity-70 max-h-12 overflow-hidden cursor-pointer'
          )}
          onClick={() => setShowCoaching(!showCoaching)}
        >
          <div className="rix-routine-coaching-message">
            <div className="flex items-start gap-2">
              <Icons.Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{getCoachingMessage()}</p>
                {showCoaching && coaching.tips.length > 1 && (
                  <div className="rix-routine-coaching-tips mt-2">
                    {coaching.tips.slice(1).map((tip, index) => (
                      <span key={index} className="rix-routine-coaching-tip">
                        {tip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {coaching.confidence}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 mb-4">
        <div className="flex items-center gap-4">
          {routine.lastCompleted && (
            <div className="flex items-center gap-1">
              <Icons.CheckCircle className="w-3 h-3" />
              <span>Zuletzt: {formatTimeAgo(routine.lastCompleted)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Icons.Clock className="w-3 h-3" />
            <span>Fällig: {routine.nextDue.toLocaleDateString('de-DE')}</span>
          </div>
        </div>
        
        {routine.overdue && (
          <div className="text-red-500 dark:text-red-400 font-medium">
            Überfällig
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="rix-routine-actions">
        {!routine.completed ? (
          <>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className={cn(
                'rix-routine-btn-complete flex-1 flex items-center justify-center gap-2',
                isCompleting && 'opacity-75 cursor-not-allowed'
              )}
              style={{ backgroundColor: categoryColor }}
            >
              {isCompleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wird abgeschlossen...
                </>
              ) : (
                <>
                  <Icons.CheckCircle className="w-4 h-4" />
                  Abschließen
                </>
              )}
            </button>
            
            <button
              onClick={handleSkip}
              className="rix-routine-btn-skip"
              disabled={isCompleting}
            >
              Überspringen
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400 font-medium">
            <Icons.CheckCircle className="w-5 h-5" />
            Abgeschlossen
          </div>
        )}
      </div>

      {/* Details Link */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(routine.id)}
          className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Details anzeigen →
        </button>
      )}
    </div>
  );
};

// Sample routine data for demonstration
export const sampleRoutines: RoutineData[] = [
  {
    id: 'routine-1',
    title: 'Morgendliche Meditation',
    description: 'Täglich 10 Minuten Achtsamkeitsmeditation für einen klaren Start in den Tag',
    frequency: 'daily',
    streak: 12,
    lastCompleted: new Date(Date.now() - 86400000), // Yesterday
    nextDue: new Date(),
    category: 'health',
    progress: 80,
    completed: false,
    overdue: false
  },
  {
    id: 'routine-2',
    title: 'Projektplanung Review',
    description: 'Wöchentliche Überprüfung der aktuellen Projekte und Anpassung der Prioritäten',
    frequency: 'weekly',
    streak: 5,
    lastCompleted: new Date(Date.now() - 604800000), // Last week
    nextDue: new Date(Date.now() + 86400000), // Tomorrow
    category: 'productivity',
    progress: 100,
    completed: true,
    overdue: false
  },
  {
    id: 'routine-3',
    title: 'Neue Technologie lernen',
    description: 'Monatlich eine neue Technologie oder ein Framework erkunden und ausprobieren',
    frequency: 'monthly',
    streak: 3,
    lastCompleted: new Date(Date.now() - 2592000000), // Last month
    nextDue: new Date(Date.now() - 86400000), // Yesterday (overdue)
    category: 'learning',
    progress: 40,
    completed: false,
    overdue: true
  }
];

export const sampleCoaching: Record<string, CoachingData> = {
  'routine-1': {
    message: 'Meditation hilft nachweislich dabei, Stress zu reduzieren und die Konzentration zu verbessern.',
    motivation: 'Du bist auf einem großartigen Weg! 12 Tage in Folge zeigen deine Entschlossenheit.',
    tips: ['Versuche, immer zur gleichen Zeit zu meditieren', 'Starte mit kurzen 5-Minuten-Sitzungen', 'Nutze eine Meditations-App für Anleitung'],
    confidence: 92
  },
  'routine-2': {
    message: 'Regelmäßige Projektreviews erhöhen die Erfolgswahrscheinlichkeit um 40%.',
    motivation: 'Excellent! Du hast dieses Ziel bereits erreicht. Deine Konstanz zahlt sich aus.',
    tips: ['Dokumentiere deine Erkenntnisse', 'Priorisiere nach Impact und Aufwand', 'Plane Pufferzeiten ein'],
    confidence: 98
  },
  'routine-3': {
    message: 'Kontinuierliches Lernen ist entscheidend für berufliches Wachstum.',
    motivation: 'Keine Sorge wegen der Verspätung - wichtig ist, wieder anzufangen!',
    tips: ['Wähle Technologien nach aktuellem Bedarf', 'Baue kleine Projekte zum Üben', 'Tausche dich mit anderen Entwicklern aus'],
    confidence: 76
  }
};