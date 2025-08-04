// /frontend-fixes/tasks/types/task.ts
// TypeScript interfaces and types for comprehensive task management system
// Provides type safety for task operations, filtering, and state management
// RELEVANT FILES: hooks/useTasks.ts, utils/taskUtils.ts, components/EnhancedTasksView.tsx

export type TaskPriority = 'niedrig' | 'mittel' | 'hoch' | 'kritisch';
export type TaskStatus = 'offen' | 'in_bearbeitung' | 'wartend' | 'erledigt' | 'abgebrochen';
export type TaskCategory = 'allgemein' | 'arbeit' | 'persönlich' | 'gesundheit' | 'finanzen' | 'projekte';
export type ViewMode = 'täglich' | 'allgemein';
export type FilterPeriod = 'heute' | 'morgen' | 'woche' | 'monat' | 'überfällig' | 'alle';

export interface Task {
  id: string;
  titel: string;
  beschreibung?: string;
  status: TaskStatus;
  priorität: TaskPriority;
  kategorie: TaskCategory;
  fälligkeitsdatum?: Date;
  erstellungsdatum: Date;
  aktualisierungsdatum: Date;
  geschätzte_dauer?: number; // in Minuten
  projekt_id?: string;
  projekt_name?: string;
  tags: string[];
  notizen?: string;
  wiederholung?: {
    typ: 'täglich' | 'wöchentlich' | 'monatlich' | 'jährlich';
    intervall: number;
    ende_datum?: Date;
  };
  unter_aufgaben?: SubTask[];
  fortschritt: number; // 0-100%
  benutzer_id: string;
}

export interface SubTask {
  id: string;
  titel: string;
  erledigt: boolean;
  erstellungsdatum: Date;
}

export interface TaskFilter {
  suchbegriff: string;
  status: TaskStatus | 'alle';
  priorität: TaskPriority | 'alle';
  kategorie: TaskCategory | 'alle';
  zeitraum: FilterPeriod;
  projekt_id?: string;
  tags: string[];
  nur_heute: boolean;
  nur_überfällig: boolean;
}

export interface TaskStatistics {
  gesamt: number;
  offen: number;
  in_bearbeitung: number;
  erledigt: number;
  überfällig: number;
  heute_fällig: number;
  diese_woche_fällig: number;
  ohne_fälligkeitsdatum: number;
  nach_priorität: Record<TaskPriority, number>;
  nach_kategorie: Record<TaskCategory, number>;
  durchschnittliche_bearbeitungszeit?: number;
  produktivitäts_score: number; // 0-100
}

export interface TaskFormData {
  titel: string;
  beschreibung?: string;
  priorität: TaskPriority;
  kategorie: TaskCategory;
  fälligkeitsdatum?: Date;
  geschätzte_dauer?: number;
  projekt_id?: string;
  tags: string[];
  notizen?: string;
  wiederholung?: {
    typ: 'täglich' | 'wöchentlich' | 'monatlich' | 'jährlich';
    intervall: number;
    ende_datum?: Date;
  };
  unter_aufgaben: { titel: string }[];
}

export interface TaskContextMenuAction {
  id: string;
  label: string;
  icon: string;
  action: (task: Task) => void;
  destructive?: boolean;
  requiresConfirmation?: boolean;
}

export interface TaskViewSettings {
  ansicht_modus: ViewMode;
  sortierung: {
    feld: keyof Task;
    richtung: 'aufsteigend' | 'absteigend';
  };
  gruppierung: 'keine' | 'priorität' | 'kategorie' | 'projekt' | 'status';
  kompakte_ansicht: boolean;
  zeige_erledigte: boolean;
  zeige_unter_aufgaben: boolean;
  automatische_aktualisierung: boolean;
}

// Utility types für bessere Typsicherheit
export type TaskUpdate = Partial<Omit<Task, 'id' | 'erstellungsdatum' | 'benutzer_id'>>;
export type TaskCreate = Omit<Task, 'id' | 'erstellungsdatum' | 'aktualisierungsdatum' | 'fortschritt'>;

// Konstanten für bessere Wartbarkeit
export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'niedrig', label: 'Niedrig', color: 'green' },
  { value: 'mittel', label: 'Mittel', color: 'yellow' },
  { value: 'hoch', label: 'Hoch', color: 'orange' },
  { value: 'kritisch', label: 'Kritisch', color: 'red' }
];

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'offen', label: 'Offen', color: 'gray' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung', color: 'blue' },
  { value: 'wartend', label: 'Wartend', color: 'yellow' },
  { value: 'erledigt', label: 'Erledigt', color: 'green' },
  { value: 'abgebrochen', label: 'Abgebrochen', color: 'red' }
];

export const TASK_CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'allgemein', label: 'Allgemein', icon: 'List' },
  { value: 'arbeit', label: 'Arbeit', icon: 'Briefcase' },
  { value: 'persönlich', label: 'Persönlich', icon: 'User' },
  { value: 'gesundheit', label: 'Gesundheit', icon: 'Heart' },
  { value: 'finanzen', label: 'Finanzen', icon: 'DollarSign' },
  { value: 'projekte', label: 'Projekte', icon: 'FolderOpen' }
];

export const FILTER_PERIODS: { value: FilterPeriod; label: string }[] = [
  { value: 'heute', label: 'Heute' },
  { value: 'morgen', label: 'Morgen' },
  { value: 'woche', label: 'Diese Woche' },
  { value: 'monat', label: 'Dieser Monat' },
  { value: 'überfällig', label: 'Überfällig' },
  { value: 'alle', label: 'Alle' }
];
