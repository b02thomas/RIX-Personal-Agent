import { create } from 'zustand';

export interface WorkflowStatus {
  available: boolean;
  responseTime?: number;
  lastTriggered?: string;
  successCount?: number;
  errorCount?: number;
}

export interface N8NStatus {
  connected: boolean;
  url: string;
  message: string;
  workflows: Record<string, WorkflowStatus>;
  lastChecked: string;
}

interface N8NState {
  status: N8NStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStatus: (status: N8NStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateWorkflowStatus: (workflowName: string, status: Partial<WorkflowStatus>) => void;
  checkStatus: () => Promise<void>;
}

export const useN8NStore = create<N8NState>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,

  setStatus: (status) => set({ status }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  updateWorkflowStatus: (workflowName, status) => {
    const currentStatus = get().status;
    if (currentStatus) {
      set({
        status: {
          ...currentStatus,
          workflows: {
            ...currentStatus.workflows,
            [workflowName]: {
              ...currentStatus.workflows[workflowName],
              ...status,
            },
          },
        },
      });
    }
  },

  checkStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/n8n/status');
      const data = await response.json();

      if (response.ok) {
        set({
          status: {
            connected: data.connected,
            url: data.url,
            message: data.message,
            workflows: data.workflows || {},
            lastChecked: new Date().toISOString(),
          },
        });
      } else {
        set({
          error: data.message || 'Fehler beim Prüfen des N8N Status',
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      set({ isLoading: false });
    }
  },
})); 