import { create } from 'zustand';

export interface ConnectionStatus {
  online: boolean;
  n8nConnected: boolean;
  websocketConnected: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
}

export interface NetworkMetrics {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  lastCheck: Date;
}

interface ConnectionState {
  status: ConnectionStatus;
  metrics: NetworkMetrics;
  errors: string[];
  isLoading: boolean;
  
  // Actions
  setOnlineStatus: (online: boolean) => void;
  setN8NStatus: (connected: boolean) => void;
  setWebSocketStatus: (connected: boolean) => void;
  setSyncStatus: (inProgress: boolean) => void;
  updateMetrics: (metrics: Partial<NetworkMetrics>) => void;
  addError: (error: string) => void;
  clearErrors: () => void;
  checkConnections: () => Promise<void>;
}

const defaultStatus: ConnectionStatus = {
  online: navigator.onLine,
  n8nConnected: false,
  websocketConnected: false,
  lastSync: null,
  syncInProgress: false,
};

const defaultMetrics: NetworkMetrics = {
  latency: 0,
  bandwidth: 0,
  packetLoss: 0,
  lastCheck: new Date(),
};

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: defaultStatus,
  metrics: defaultMetrics,
  errors: [],
  isLoading: false,

  setOnlineStatus: (online) => {
    set((state) => ({
      status: {
        ...state.status,
        online,
      },
    }));
  },

  setN8NStatus: (connected) => {
    set((state) => ({
      status: {
        ...state.status,
        n8nConnected: connected,
      },
    }));
  },

  setWebSocketStatus: (connected) => {
    set((state) => ({
      status: {
        ...state.status,
        websocketConnected: connected,
      },
    }));
  },

  setSyncStatus: (inProgress) => {
    set((state) => ({
      status: {
        ...state.status,
        syncInProgress: inProgress,
        lastSync: inProgress ? new Date() : state.status.lastSync,
      },
    }));
  },

  updateMetrics: (newMetrics) => {
    set((state) => ({
      metrics: {
        ...state.metrics,
        ...newMetrics,
        lastCheck: new Date(),
      },
    }));
  },

  addError: (error) => {
    set((state) => ({
      errors: [...state.errors, `${new Date().toISOString()}: ${error}`].slice(-10), // Keep last 10 errors
    }));
  },

  clearErrors: () => {
    set({ errors: [] });
  },

  checkConnections: async () => {
    set({ isLoading: true });

    try {
      // Check online status
      const online = navigator.onLine;
      get().setOnlineStatus(online);

      // Check N8N connection
      try {
        const response = await fetch('/api/n8n/status', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        get().setN8NStatus(data.connected);
      } catch (error) {
        get().setN8NStatus(false);
        get().addError(`N8N connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Check WebSocket connection (if implemented)
      // get().setWebSocketStatus(websocketConnected);

      // Update metrics
      const startTime = performance.now();
      try {
        await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        const latency = performance.now() - startTime;
        get().updateMetrics({ latency });
      } catch (error) {
        get().updateMetrics({ latency: -1 });
        get().addError(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      get().addError(`Connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useConnectionStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useConnectionStore.getState().setOnlineStatus(false);
  });
} 