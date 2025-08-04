// /frontend-fixes/tasks/hooks/useTasks.ts
// Custom React hook for comprehensive task management with filtering and state management
// Provides centralized task operations, statistics, and optimized performance
// RELEVANT FILES: types/task.ts, utils/taskUtils.ts, components/EnhancedTasksView.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Task, 
  TaskFilter, 
  TaskStatistics, 
  TaskViewSettings,
  TaskFormData,
  ViewMode,
  FilterPeriod
} from '../types/task';
import {
  filtereAufgaben,
  sortiereAufgaben,
  berechneAufgabenStatistiken,
  erstelleStandardFilter,
  istUeberFaellig,
  istHeuteFaellig,
  gruppiereAufgaben
} from '../utils/taskUtils';

// Mock-Daten für die Entwicklung
const mockTasks: Task[] = [
  {
    id: '1',
    titel: 'RIX Frontend Design System finalisieren',
    beschreibung: 'Alle Komponenten des Design Systems implementieren und dokumentieren',
    status: 'in_bearbeitung',
    priorität: 'hoch',
    kategorie: 'arbeit',
    fälligkeitsdatum: new Date('2024-08-05'),
    erstellungsdatum: new Date('2024-08-01'),
    aktualisierungsdatum: new Date('2024-08-04'),
    geschätzte_dauer: 480, // 8 Stunden
    projekt_id: 'rix-dev',
    projekt_name: 'RIX Development',
    tags: ['frontend', 'design', 'components'],
    fortschritt: 75,
    benutzer_id: 'user-1',
    unter_aufgaben: [
      { id: 'sub-1', titel: 'Button-Komponente', erledigt: true, erstellungsdatum: new Date() },
      { id: 'sub-2', titel: 'Input-Komponente', erledigt: true, erstellungsdatum: new Date() },
      { id: 'sub-3', titel: 'Card-Komponente', erledigt: false, erstellungsdatum: new Date() }
    ]
  },
  {
    id: '2',
    titel: 'Mobile Navigation testen',
    beschreibung: 'Responsive Verhalten auf verschiedenen Geräten prüfen und optimieren',
    status: 'offen',
    priorität: 'mittel',
    kategorie: 'arbeit',
    fälligkeitsdatum: new Date('2024-08-06'),
    erstellungsdatum: new Date('2024-08-02'),
    aktualisierungsdatum: new Date('2024-08-02'),
    geschätzte_dauer: 180, // 3 Stunden
    projekt_id: 'rix-dev',
    projekt_name: 'RIX Development',
    tags: ['mobile', 'testing', 'responsive'],
    fortschritt: 0,
    benutzer_id: 'user-1'
  },
  {
    id: '3',
    titel: 'Wocheneinkauf erledigen',
    beschreibung: 'Lebensmittel für die kommende Woche einkaufen',
    status: 'offen',
    priorität: 'mittel',
    kategorie: 'persönlich',
    fälligkeitsdatum: new Date('2024-08-04'),
    erstellungsdatum: new Date('2024-08-03'),
    aktualisierungsdatum: new Date('2024-08-03'),
    geschätzte_dauer: 90, // 1.5 Stunden
    tags: ['einkaufen', 'alltag'],
    fortschritt: 0,
    benutzer_id: 'user-1'
  },
  {
    id: '4',
    titel: 'Quartalsbericht vorbereiten',
    beschreibung: 'Zusammenfassung der Projektfortschritte für Q3 2024',
    status: 'wartend',
    priorität: 'hoch',
    kategorie: 'arbeit',
    fälligkeitsdatum: new Date('2024-08-10'),
    erstellungsdatum: new Date('2024-07-30'),
    aktualisierungsdatum: new Date('2024-08-01'),
    geschätzte_dauer: 360, // 6 Stunden
    tags: ['bericht', 'management'],
    fortschritt: 25,
    benutzer_id: 'user-1'
  },
  {
    id: '5',
    titel: 'Zahnarzttermin vereinbaren',
    beschreibung: 'Kontrolltermin für nächsten Monat buchen',
    status: 'erledigt',
    priorität: 'niedrig',
    kategorie: 'gesundheit',
    fälligkeitsdatum: new Date('2024-08-02'),
    erstellungsdatum: new Date('2024-08-01'),
    aktualisierungsdatum: new Date('2024-08-02'),
    geschätzte_dauer: 15,
    tags: ['gesundheit', 'termin'],
    fortschritt: 100,
    benutzer_id: 'user-1'
  },
  {
    id: '6',
    titel: 'Performance Optimierung',
    beschreibung: 'Bundle Size reduzieren und Core Web Vitals verbessern',
    status: 'offen',
    priorität: 'kritisch',
    kategorie: 'arbeit',
    fälligkeitsdatum: new Date('2024-08-03'), // Überfällig
    erstellungsdatum: new Date('2024-07-28'),
    aktualisierungsdatum: new Date('2024-07-30'),
    geschätzte_dauer: 600, // 10 Stunden
    projekt_id: 'rix-dev',
    projekt_name: 'RIX Development',
    tags: ['performance', 'optimization', 'critical'],
    fortschritt: 10,
    benutzer_id: 'user-1'
  }
];

interface UseTasksReturn {
  // Daten
  tasks: Task[];
  filteredTasks: Task[];
  groupedTasks: Record<string, Task[]> | null;
  statistics: TaskStatistics;
  
  // Filter und Ansicht
  filter: TaskFilter;
  viewSettings: TaskViewSettings;
  viewMode: ViewMode;
  selectedDate: Date;
  
  // Lade-Status
  isLoading: boolean;
  error: string | null;
  
  // Aktionen
  setFilter: (filter: Partial<TaskFilter>) => void;
  resetFilter: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  updateViewSettings: (settings: Partial<TaskViewSettings>) => void;
  
  // Task-Operationen
  createTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  
  // Bulk-Operationen
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  
  // Hilfsfunktionen
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
  refreshTasks: () => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  // State für Tasks und Filter
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilterState] = useState<TaskFilter>(erstelleStandardFilter());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('allgemein');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Standard View Settings
  const [viewSettings, setViewSettings] = useState<TaskViewSettings>({
    ansicht_modus: 'allgemein',
    sortierung: {
      feld: 'fälligkeitsdatum',
      richtung: 'aufsteigend'
    },
    gruppierung: 'keine',
    kompakte_ansicht: false,
    zeige_erledigte: true,
    zeige_unter_aufgaben: true,
    automatische_aktualisierung: true
  });
  
  // Gefilterte und sortierte Tasks berechnen
  const filteredTasks = useMemo(() => {
    let filtered = filtereAufgaben(tasks, filter);
    
    // Zusätzliche Filter basierend auf View Mode
    if (viewMode === 'täglich') {
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(task => {
        if (!task.fälligkeitsdatum) return false;
        const taskDate = new Date(task.fälligkeitsdatum);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === targetDate.getTime();
      });
    }
    
    // Erledigte Tasks ausblenden falls gewünscht
    if (!viewSettings.zeige_erledigte) {
      filtered = filtered.filter(task => task.status !== 'erledigt');
    }
    
    // Sortierung anwenden
    return sortiereAufgaben(
      filtered, 
      viewSettings.sortierung.feld, 
      viewSettings.sortierung.richtung
    );
  }, [tasks, filter, viewMode, selectedDate, viewSettings]);
  
  // Gruppierte Tasks berechnen
  const groupedTasks = useMemo(() => {
    if (viewSettings.gruppierung === 'keine') return null;
    return gruppiereAufgaben(filteredTasks, viewSettings.gruppierung);
  }, [filteredTasks, viewSettings.gruppierung]);
  
  // Statistiken berechnen
  const statistics = useMemo(() => {
    return berechneAufgabenStatistiken(tasks);
  }, [tasks]);
  
  // Filter-Funktionen
  const setFilter = useCallback((newFilter: Partial<TaskFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  }, []);
  
  const resetFilter = useCallback(() => {
    setFilterState(erstelleStandardFilter());
  }, []);
  
  // View Settings aktualisieren
  const updateViewSettings = useCallback((settings: Partial<TaskViewSettings>) => {
    setViewSettings(prev => ({ ...prev, ...settings }));
  }, []);
  
  // Task-Operationen
  const createTask = useCallback(async (taskData: TaskFormData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        titel: taskData.titel,
        beschreibung: taskData.beschreibung,
        status: 'offen',
        priorität: taskData.priorität,
        kategorie: taskData.kategorie,
        fälligkeitsdatum: taskData.fälligkeitsdatum,
        erstellungsdatum: new Date(),
        aktualisierungsdatum: new Date(),
        geschätzte_dauer: taskData.geschätzte_dauer,
        projekt_id: taskData.projekt_id,
        tags: taskData.tags,
        notizen: taskData.notizen,
        wiederholung: taskData.wiederholung,
        unter_aufgaben: taskData.unter_aufgaben.map((sub, index) => ({
          id: `sub-${Date.now()}-${index}`,
          titel: sub.titel,
          erledigt: false,
          erstellungsdatum: new Date()
        })),
        fortschritt: 0,
        benutzer_id: 'user-1'
      };
      
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Aufgabe');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      setTasks(prev => prev.map(task => 
        task.id === id 
          ? { ...task, ...updates, aktualisierungsdatum: new Date() }
          : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Aufgabe');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Aufgabe');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const toggleTaskStatus = useCallback(async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'erledigt' ? 'offen' : 'erledigt';
    const newProgress = newStatus === 'erledigt' ? 100 : task.fortschritt;
    
    await updateTask(id, { status: newStatus, fortschritt: newProgress });
  }, [tasks, updateTask]);
  
  const duplicateTask = useCallback(async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const duplicatedTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      titel: `${task.titel} (Kopie)`,
      status: 'offen',
      fortschritt: 0,
      erstellungsdatum: new Date(),
      aktualisierungsdatum: new Date(),
      unter_aufgaben: task.unter_aufgaben?.map((sub, index) => ({
        id: `sub-${Date.now()}-${index}`,
        titel: sub.titel,
        erledigt: false,
        erstellungsdatum: new Date()
      }))
    };
    
    setTasks(prev => [...prev, duplicatedTask]);
  }, [tasks]);
  
  // Bulk-Operationen
  const bulkUpdateTasks = useCallback(async (taskIds: string[], updates: Partial<Task>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      setTasks(prev => prev.map(task => 
        taskIds.includes(task.id)
          ? { ...task, ...updates, aktualisierungsdatum: new Date() }
          : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Aufgaben');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const bulkDeleteTasks = useCallback(async (taskIds: string[]): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Aufgaben');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Hilfsfunktionen
  const getTodayTasks = useCallback((): Task[] => {
    return tasks.filter(task => istHeuteFaellig(task));
  }, [tasks]);
  
  const getOverdueTasks = useCallback((): Task[] => {
    return tasks.filter(task => istUeberFaellig(task));
  }, [tasks]);
  
  const refreshTasks = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In einer echten Anwendung würde hier ein API-Call stehen
      // Simuliere Netzwerk-Delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tasks neu laden (hier würde normalerweise ein API-Call stehen)
      // setTasks(await fetchTasksFromAPI());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Aufgaben');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Automatische Aktualisierung
  useEffect(() => {
    if (viewSettings.automatische_aktualisierung) {
      const interval = setInterval(() => {
        // Hier könnte eine automatische Aktualisierung der Tasks erfolgen
        // refreshTasks();
      }, 60000); // Alle 60 Sekunden
      
      return () => clearInterval(interval);
    }
  }, [viewSettings.automatische_aktualisierung, refreshTasks]);
  
  return {
    // Daten
    tasks,
    filteredTasks,
    groupedTasks,
    statistics,
    
    // Filter und Ansicht
    filter,
    viewSettings,
    viewMode,
    selectedDate,
    
    // Lade-Status
    isLoading,
    error,
    
    // Aktionen
    setFilter,
    resetFilter,
    setViewMode,
    setSelectedDate,
    updateViewSettings,
    
    // Task-Operationen
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    duplicateTask,
    
    // Bulk-Operationen
    bulkUpdateTasks,
    bulkDeleteTasks,
    
    // Hilfsfunktionen
    getTodayTasks,
    getOverdueTasks,
    refreshTasks
  };
};
