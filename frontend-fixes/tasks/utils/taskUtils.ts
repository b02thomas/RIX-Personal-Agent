// /frontend-fixes/tasks/utils/taskUtils.ts
// Utility functions for task filtering, sorting, and data manipulation
// Provides comprehensive task processing logic with German locale support
// RELEVANT FILES: types/task.ts, hooks/useTasks.ts, components/EnhancedTasksView.tsx

import { 
  Task, 
  TaskFilter, 
  TaskStatistics, 
  TaskPriority, 
  TaskStatus, 
  FilterPeriod,
  ViewMode 
} from '../types/task';

/**
 * Prüft ob eine Aufgabe überfällig ist
 */
export const istUeberFaellig = (task: Task): boolean => {
  if (!task.fälligkeitsdatum || task.status === 'erledigt' || task.status === 'abgebrochen') {
    return false;
  }
  
  const heute = new Date();
  heute.setHours(23, 59, 59, 999); // Ende des heutigen Tages
  
  return task.fälligkeitsdatum < heute;
};

/**
 * Prüft ob eine Aufgabe heute fällig ist
 */
export const istHeuteFaellig = (task: Task): boolean => {
  if (!task.fälligkeitsdatum) return false;
  
  const heute = new Date();
  const faelligkeitsdatum = new Date(task.fälligkeitsdatum);
  
  return (
    heute.getDate() === faelligkeitsdatum.getDate() &&
    heute.getMonth() === faelligkeitsdatum.getMonth() &&
    heute.getFullYear() === faelligkeitsdatum.getFullYear()
  );
};

/**
 * Prüft ob eine Aufgabe in der aktuellen Woche fällig ist
 */
export const istDieseWocheFaellig = (task: Task): boolean => {
  if (!task.fälligkeitsdatum) return false;
  
  const heute = new Date();
  const wochenStart = new Date(heute);
  wochenStart.setDate(heute.getDate() - heute.getDay() + 1); // Montag
  wochenStart.setHours(0, 0, 0, 0);
  
  const wochenEnde = new Date(wochenStart);
  wochenEnde.setDate(wochenStart.getDate() + 6); // Sonntag
  wochenEnde.setHours(23, 59, 59, 999);
  
  const faelligkeitsdatum = new Date(task.fälligkeitsdatum);
  
  return faelligkeitsdatum >= wochenStart && faelligkeitsdatum <= wochenEnde;
};

/**
 * Filtert Aufgaben basierend auf den angegebenen Filterkriterien
 */
export const filtereAufgaben = (tasks: Task[], filter: TaskFilter): Task[] => {
  return tasks.filter(task => {
    // Suchbegriff Filter
    if (filter.suchbegriff) {
      const suchbegriff = filter.suchbegriff.toLowerCase();
      const matches = 
        task.titel.toLowerCase().includes(suchbegriff) ||
        task.beschreibung?.toLowerCase().includes(suchbegriff) ||
        task.tags.some(tag => tag.toLowerCase().includes(suchbegriff)) ||
        task.projekt_name?.toLowerCase().includes(suchbegriff) ||
        task.notizen?.toLowerCase().includes(suchbegriff);
      
      if (!matches) return false;
    }
    
    // Status Filter
    if (filter.status !== 'alle' && task.status !== filter.status) {
      return false;
    }
    
    // Priorität Filter
    if (filter.priorität !== 'alle' && task.priorität !== filter.priorität) {
      return false;
    }
    
    // Kategorie Filter
    if (filter.kategorie !== 'alle' && task.kategorie !== filter.kategorie) {
      return false;
    }
    
    // Projekt Filter
    if (filter.projekt_id && task.projekt_id !== filter.projekt_id) {
      return false;
    }
    
    // Tags Filter
    if (filter.tags.length > 0) {
      const hatGefilteresTags = filter.tags.some(filterTag => 
        task.tags.includes(filterTag)
      );
      if (!hatGefilteresTags) return false;
    }
    
    // Zeitraum Filter
    if (filter.zeitraum !== 'alle') {
      switch (filter.zeitraum) {
        case 'heute':
          if (!istHeuteFaellig(task)) return false;
          break;
        case 'morgen':
          if (!task.fälligkeitsdatum) return false;
          const morgen = new Date();
          morgen.setDate(morgen.getDate() + 1);
          const faelligkeitsdatum = new Date(task.fälligkeitsdatum);
          if (!
            (morgen.getDate() === faelligkeitsdatum.getDate() &&
             morgen.getMonth() === faelligkeitsdatum.getMonth() &&
             morgen.getFullYear() === faelligkeitsdatum.getFullYear())
          ) return false;
          break;
        case 'woche':
          if (!istDieseWocheFaellig(task)) return false;
          break;
        case 'monat':
          if (!task.fälligkeitsdatum) return false;
          const heute = new Date();
          const taskDatum = new Date(task.fälligkeitsdatum);
          if (taskDatum.getMonth() !== heute.getMonth() || 
              taskDatum.getFullYear() !== heute.getFullYear()) return false;
          break;
        case 'überfällig':
          if (!istUeberFaellig(task)) return false;
          break;
      }
    }
    
    // Nur heute Filter
    if (filter.nur_heute && !istHeuteFaellig(task)) {
      return false;
    }
    
    // Nur überfällige Filter
    if (filter.nur_überfällig && !istUeberFaellig(task)) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sortiert Aufgaben basierend auf verschiedenen Kriterien
 */
export const sortiereAufgaben = (
  tasks: Task[], 
  sortBy: keyof Task = 'erstellungsdatum', 
  sortDirection: 'aufsteigend' | 'absteigend' = 'absteigend'
): Task[] => {
  return [...tasks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Spezielle Behandlung für verschiedene Datentypen
    if (sortBy === 'priorität') {
      const priorityOrder = { 'kritisch': 4, 'hoch': 3, 'mittel': 2, 'niedrig': 1 };
      aValue = priorityOrder[a.priorität as TaskPriority];
      bValue = priorityOrder[b.priorität as TaskPriority];
    }
    
    if (sortBy === 'fälligkeitsdatum') {
      // Aufgaben ohne Fälligkeitsdatum am Ende
      if (!a.fälligkeitsdatum && !b.fälligkeitsdatum) return 0;
      if (!a.fälligkeitsdatum) return 1;
      if (!b.fälligkeitsdatum) return -1;
      
      aValue = new Date(a.fälligkeitsdatum).getTime();
      bValue = new Date(b.fälligkeitsdatum).getTime();
    }
    
    if (sortBy === 'fortschritt') {
      aValue = a.fortschritt || 0;
      bValue = b.fortschritt || 0;
    }
    
    // Sortierung anwenden
    if (aValue < bValue) {
      return sortDirection === 'aufsteigend' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'aufsteigend' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Berechnet umfassende Statistiken für eine Liste von Aufgaben
 */
export const berechneAufgabenStatistiken = (tasks: Task[]): TaskStatistics => {
  const stats: TaskStatistics = {
    gesamt: tasks.length,
    offen: 0,
    in_bearbeitung: 0,
    erledigt: 0,
    überfällig: 0,
    heute_fällig: 0,
    diese_woche_fällig: 0,
    ohne_fälligkeitsdatum: 0,
    nach_priorität: {
      'niedrig': 0,
      'mittel': 0,
      'hoch': 0,
      'kritisch': 0
    },
    nach_kategorie: {
      'allgemein': 0,
      'arbeit': 0,
      'persönlich': 0,
      'gesundheit': 0,
      'finanzen': 0,
      'projekte': 0
    },
    produktivitäts_score: 0
  };
  
  tasks.forEach(task => {
    // Status Statistiken
    if (task.status === 'offen') stats.offen++;
    else if (task.status === 'in_bearbeitung') stats.in_bearbeitung++;
    else if (task.status === 'erledigt') stats.erledigt++;
    
    // Zeitbasierte Statistiken
    if (istUeberFaellig(task)) stats.überfällig++;
    if (istHeuteFaellig(task)) stats.heute_fällig++;
    if (istDieseWocheFaellig(task)) stats.diese_woche_fällig++;
    if (!task.fälligkeitsdatum) stats.ohne_fälligkeitsdatum++;
    
    // Priorität Statistiken
    stats.nach_priorität[task.priorität]++;
    
    // Kategorie Statistiken
    stats.nach_kategorie[task.kategorie]++;
  });
  
  // Produktivitäts-Score berechnen (0-100)
  if (stats.gesamt > 0) {
    const erledigungsRate = stats.erledigt / stats.gesamt;
    const überfälligRate = stats.überfällig / stats.gesamt;
    const inBearbeitungRate = stats.in_bearbeitung / stats.gesamt;
    
    stats.produktivitäts_score = Math.round(
      (erledigungsRate * 50) + // 50% für Erledigungsrate
      (inBearbeitungRate * 30) + // 30% für aktive Bearbeitung
      ((1 - überfälligRate) * 20) // 20% für pünktliche Erledigung
    ) * 100;
  }
  
  return stats;
};

/**
 * Formatiert ein Datum für die deutsche Anzeige
 */
export const formatiereAnzeigeDatum = (datum: Date): string => {
  const heute = new Date();
  const morgen = new Date(heute);
  morgen.setDate(heute.getDate() + 1);
  
  const datumNormalisiert = new Date(datum);
  datumNormalisiert.setHours(0, 0, 0, 0);
  
  const heuteNormalisiert = new Date(heute);
  heuteNormalisiert.setHours(0, 0, 0, 0);
  
  const morgenNormalisiert = new Date(morgen);
  morgenNormalisiert.setHours(0, 0, 0, 0);
  
  if (datumNormalisiert.getTime() === heuteNormalisiert.getTime()) {
    return 'Heute';
  }
  
  if (datumNormalisiert.getTime() === morgenNormalisiert.getTime()) {
    return 'Morgen';
  }
  
  const gestern = new Date(heute);
  gestern.setDate(heute.getDate() - 1);
  const gesternNormalisiert = new Date(gestern);
  gesternNormalisiert.setHours(0, 0, 0, 0);
  
  if (datumNormalisiert.getTime() === gesternNormalisiert.getTime()) {
    return 'Gestern';
  }
  
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(datum);
};

/**
 * Formatiert eine geschätzte Dauer in eine lesbare Form
 */
export const formatiereGeschaetzteDauer = (minuten?: number): string => {
  if (!minuten) return 'Nicht angegeben';
  
  if (minuten < 60) {
    return `${minuten} Min`;
  }
  
  const stunden = Math.floor(minuten / 60);
  const verbleibendeMinuten = minuten % 60;
  
  if (verbleibendeMinuten === 0) {
    return `${stunden}h`;
  }
  
  return `${stunden}h ${verbleibendeMinuten}m`;
};

/**
 * Generiert eine Farbe basierend auf der Priorität
 */
export const getPrioritaetsFarbe = (priorität: TaskPriority): {
  bg: string;
  text: string;
  border: string;
} => {
  switch (priorität) {
    case 'kritisch':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      };
    case 'hoch':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-800 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800'
      };
    case 'mittel':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'niedrig':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      };
  }
};

/**
 * Generiert eine Farbe basierend auf dem Status
 */
export const getStatusFarbe = (status: TaskStatus): {
  bg: string;
  text: string;
  border: string;
} => {
  switch (status) {
    case 'erledigt':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      };
    case 'in_bearbeitung':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-800 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      };
    case 'wartend':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'abgebrochen':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      };
    default: // 'offen'
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700'
      };
  }
};

/**
 * Erstellt einen Standard-Task-Filter
 */
export const erstelleStandardFilter = (): TaskFilter => ({
  suchbegriff: '',
  status: 'alle',
  priorität: 'alle',
  kategorie: 'alle',
  zeitraum: 'alle',
  tags: [],
  nur_heute: false,
  nur_überfällig: false
});

/**
 * Gruppiert Aufgaben nach einem bestimmten Kriterium
 */
export const gruppiereAufgaben = (
  tasks: Task[], 
  gruppierungsKriterium: 'priorität' | 'kategorie' | 'projekt' | 'status'
) => {
  const gruppiert = tasks.reduce((acc, task) => {
    let key: string;
    
    switch (gruppierungsKriterium) {
      case 'priorität':
        key = task.priorität;
        break;
      case 'kategorie':
        key = task.kategorie;
        break;
      case 'projekt':
        key = task.projekt_name || 'Ohne Projekt';
        break;
      case 'status':
        key = task.status;
        break;
      default:
        key = 'Allgemein';
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(task);
    
    return acc;
  }, {} as Record<string, Task[]>);
  
  return gruppiert;
};
