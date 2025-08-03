// /src/components/n8n/__tests__/n8n-connection-interface.test.tsx
// Comprehensive test suite for N8N connection interface component
// Tests connection status, configuration, API key management, and localStorage persistence
// RELEVANT FILES: n8n-connection-interface.tsx, n8n-store.ts, n8n-status.tsx, n8n-workflow-manager.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { N8NConnectionInterface } from '../n8n-connection-interface';

// Mock the N8N store
const mockCheckStatus = jest.fn();
const mockN8NStore = {
  status: {
    connected: false,
    url: 'https://n8n.smb-ai-solution.com',
    workflows: {},
    response_time: 150
  },
  isLoading: false,
  error: null,
  checkStatus: mockCheckStatus
};

jest.mock('@/store/n8n-store', () => ({
  useN8NStore: () => mockN8NStore
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Settings: ({ className, ...props }: any) => <div data-testid="settings-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div data-testid="check-circle-icon" className={className} {...props} />,
  XCircle: ({ className, ...props }: any) => <div data-testid="x-circle-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-circle-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  Eye: ({ className, ...props }: any) => <div data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }: any) => <div data-testid="eye-off-icon" className={className} {...props} />,
  Zap: ({ className, ...props }: any) => <div data-testid="zap-icon" className={className} {...props} />,
  Key: ({ className, ...props }: any) => <div data-testid="key-icon" className={className} {...props} />,
  Link: ({ className, ...props }: any) => <div data-testid="link-icon" className={className} {...props} />
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('N8NConnectionInterface Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ connected: true, response_time: 150 })
    });
    
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders connection status card', () => {
      render(<N8NConnectionInterface />);
      
      expect(screen.getByText('N8N Verbindungsstatus')).toBeInTheDocument();
      expect(screen.getByText('Aktuelle Verbindung zu Ihrer N8N Instance')).toBeInTheDocument();
    });

    it('renders configuration card', () => {
      render(<N8NConnectionInterface />);
      
      expect(screen.getByText('Verbindungseinstellungen')).toBeInTheDocument();
      expect(screen.getByText('Konfigurieren Sie Ihre N8N Instance Verbindung')).toBeInTheDocument();
    });

    it('shows disconnected status by default', () => {
      render(<N8NConnectionInterface />);
      
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Nicht verbunden')).toBeInTheDocument();
    });

    it('shows connected status when connected', () => {
      mockN8NStore.status.connected = true;
      render(<N8NConnectionInterface />);
      
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Verbunden')).toBeInTheDocument();
    });

    it('shows loading status when loading', () => {
      mockN8NStore.isLoading = true;
      render(<N8NConnectionInterface />);
      
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
      expect(screen.getByText('Teste Verbindung...')).toBeInTheDocument();
    });
  });

  describe('Configuration Management', () => {
    it('loads configuration from localStorage on mount', () => {
      const savedConfig = JSON.stringify({
        baseUrl: 'https://custom-n8n.example.com',
        apiKey: 'test-api-key',
        enabled: true,
        autoSync: false,
        syncInterval: 60
      });
      mockLocalStorage.getItem.mockReturnValue(savedConfig);
      
      render(<N8NConnectionInterface />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('n8n-config');
      expect(screen.getByDisplayValue('https://custom-n8n.example.com')).toBeInTheDocument();
    });

    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<N8NConnectionInterface />);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse saved N8N config:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('enables/disables N8N integration', async () => {
      render(<N8NConnectionInterface />);
      
      const enableSwitch = screen.getByRole('switch');
      expect(enableSwitch).toBeChecked(); // Default enabled
      
      await user.click(enableSwitch);
      expect(enableSwitch).not.toBeChecked();
      
      // Configuration fields should be hidden when disabled
      expect(screen.queryByLabelText('N8N Base URL')).not.toBeInTheDocument();
    });

    it('updates base URL configuration', async () => {
      render(<N8NConnectionInterface />);
      
      const urlInput = screen.getByLabelText('N8N Base URL');
      await user.clear(urlInput);
      await user.type(urlInput, 'https://new-n8n.example.com');
      
      expect(urlInput).toHaveValue('https://new-n8n.example.com');
    });

    it('updates API key configuration', async () => {
      render(<N8NConnectionInterface />);
      
      const apiKeyInput = screen.getByLabelText('API Key');
      await user.type(apiKeyInput, 'new-api-key');
      
      expect(apiKeyInput).toHaveValue('new-api-key');
    });

    it('toggles API key visibility', async () => {
      render(<N8NConnectionInterface />);
      
      const apiKeyInput = screen.getByLabelText('API Key') as HTMLInputElement;
      const toggleButton = screen.getByTestId('eye-icon').closest('button');
      
      expect(apiKeyInput.type).toBe('password');
      
      await user.click(toggleButton!);
      expect(apiKeyInput.type).toBe('text');
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });

    it('configures auto-sync settings', async () => {
      render(<N8NConnectionInterface />);
      
      const autoSyncSwitch = screen.getAllByRole('switch')[1]; // Second switch
      await user.click(autoSyncSwitch);
      
      // Sync interval input should appear
      expect(screen.getByLabelText('Sync-Intervall (Sekunden)')).toBeInTheDocument();
    });

    it('validates sync interval range', async () => {
      render(<N8NConnectionInterface />);
      
      // Enable auto-sync first
      const autoSyncSwitch = screen.getAllByRole('switch')[1];
      await user.click(autoSyncSwitch);
      
      const intervalInput = screen.getByLabelText('Sync-Intervall (Sekunden)');
      await user.clear(intervalInput);
      await user.type(intervalInput, '5'); // Below minimum
      
      expect(intervalInput).toHaveValue(5);
      
      await user.clear(intervalInput);
      await user.type(intervalInput, '500'); // Above maximum
      
      expect(intervalInput).toHaveValue(500);
    });
  });

  describe('Connection Testing', () => {
    it('tests connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          connected: true, 
          response_time: 120,
          message: 'Connection successful'
        })
      });
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Verbindung erfolgreich/)).toBeInTheDocument();
        expect(screen.getByText(/Response Time: 120ms/)).toBeInTheDocument();
      });
      
      expect(mockCheckStatus).toHaveBeenCalled();
    });

    it('handles connection test failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ 
          connected: false,
          message: 'Connection failed'
        })
      });
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
      });
    });

    it('handles network errors during testing', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verbindung konnte nicht getestet werden')).toBeInTheDocument();
      });
    });

    it('disables test button when testing', async () => {
      let resolvePromise: (value: any) => void;
      const testPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(testPromise);
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      expect(screen.getByText('Teste...')).toBeInTheDocument();
      expect(testButton).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ connected: true })
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(testButton).not.toBeDisabled();
      });
    });

    it('disables test button when N8N is disabled', () => {
      render(<N8NConnectionInterface />);
      
      // Disable N8N integration
      const enableSwitch = screen.getByRole('switch');
      fireEvent.click(enableSwitch);
      
      // Test button should be disabled
      const testButton = screen.getByText('Test');
      expect(testButton).toBeDisabled();
    });
  });

  describe('Configuration Persistence', () => {
    it('saves configuration to localStorage', async () => {
      render(<N8NConnectionInterface />);
      
      // Modify configuration
      const urlInput = screen.getByLabelText('N8N Base URL');
      await user.clear(urlInput);
      await user.type(urlInput, 'https://new-url.com');
      
      const apiKeyInput = screen.getByLabelText('API Key');
      await user.type(apiKeyInput, 'new-key');
      
      // Save configuration
      const saveButton = screen.getByText('Konfiguration speichern');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'n8n-config',
          expect.stringContaining('https://new-url.com')
        );
      });
    });

    it('tests connection after saving when enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ connected: true })
      });
      
      render(<N8NConnectionInterface />);
      
      const saveButton = screen.getByText('Konfiguration speichern');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/n8n/status', expect.any(Object));
      });
    });

    it('shows save success message', async () => {
      render(<N8NConnectionInterface />);
      
      const saveButton = screen.getByText('Konfiguration speichern');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Konfiguration gespeichert')).toBeInTheDocument();
      });
    });

    it('handles save errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      render(<N8NConnectionInterface />);
      
      const saveButton = screen.getByText('Konfiguration speichern');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fehler beim Speichern der Konfiguration')).toBeInTheDocument();
      });
    });

    it('disables save button when saving', async () => {
      render(<N8NConnectionInterface />);
      
      const saveButton = screen.getByText('Konfiguration speichern');
      await user.click(saveButton);
      
      expect(screen.getByText('Speichere...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('requires base URL for saving', () => {
      render(<N8NConnectionInterface />);
      
      // Clear base URL
      const urlInput = screen.getByLabelText('N8N Base URL');
      fireEvent.change(urlInput, { target: { value: '' } });
      
      const saveButton = screen.getByText('Konfiguration speichern');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Status Display', () => {
    it('shows workflow count when connected', () => {
      mockN8NStore.status = {
        connected: true,
        url: 'https://n8n.example.com',
        workflows: { workflow1: {}, workflow2: {}, workflow3: {} },
        response_time: 100
      };
      
      render(<N8NConnectionInterface />);
      
      expect(screen.getByText(/3 Workflows verfügbar/)).toBeInTheDocument();
      expect(screen.getByText('https://n8n.example.com')).toBeInTheDocument();
    });

    it('handles empty workflows object', () => {
      mockN8NStore.status = {
        connected: true,
        url: 'https://n8n.example.com',
        workflows: {},
        response_time: 100
      };
      
      render(<N8NConnectionInterface />);
      
      expect(screen.getByText(/0 Workflows verfügbar/)).toBeInTheDocument();
    });

    it('shows disabled status correctly', () => {
      render(<N8NConnectionInterface />);
      
      // Disable N8N integration
      const enableSwitch = screen.getByRole('switch');
      fireEvent.click(enableSwitch);
      
      expect(screen.getByText('Deaktiviert')).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toHaveClass('text-gray-400');
    });
  });

  describe('Test Result Display', () => {
    it('shows success message with green styling', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ connected: true, response_time: 150 })
      });
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        const successMessage = screen.getByText(/Verbindung erfolgreich/);
        expect(successMessage).toBeInTheDocument();
        expect(successMessage.closest('div')).toHaveClass('bg-green-50');
      });
    });

    it('shows error message with red styling', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Verbindung konnte nicht getestet werden');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.closest('div')).toHaveClass('bg-red-50');
      });
    });

    it('clears test result when configuration changes', async () => {
      // Show initial test result
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ connected: true })
      });
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Verbindung erfolgreich/)).toBeInTheDocument();
      });
      
      // Change configuration
      const urlInput = screen.getByLabelText('N8N Base URL');
      await user.type(urlInput, 'x');
      
      // Test result should be cleared
      expect(screen.queryByText(/Verbindung erfolgreich/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<N8NConnectionInterface />);
      
      expect(screen.getByLabelText('N8N Integration aktiviert')).toBeInTheDocument();
      expect(screen.getByLabelText('N8N Base URL')).toBeInTheDocument();
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
      expect(screen.getByLabelText('Automatische Synchronisierung')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<N8NConnectionInterface />);
      
      const enableSwitch = screen.getByRole('switch');
      enableSwitch.focus();
      
      await user.keyboard('{Enter}');
      expect(enableSwitch).not.toBeChecked();
    });

    it('has adequate touch targets', () => {
      render(<N8NConnectionInterface />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = getComputedStyle(button);
        expect(styles.minHeight).toBe('44px'); // Touch-friendly minimum
      });
    });
  });

  describe('Error Handling', () => {
    it('handles component mount errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<N8NConnectionInterface />);
      
      expect(screen.getByText('N8N Verbindungsstatus')).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('handles fetch API unavailable', async () => {
      // Mock fetch as undefined
      const originalFetch = global.fetch;
      delete (global as any).fetch;
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      await user.click(testButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verbindung konnte nicht getestet werden')).toBeInTheDocument();
      });
      
      global.fetch = originalFetch;
    });
  });

  describe('Performance', () => {
    it('debounces configuration changes', async () => {
      render(<N8NConnectionInterface />);
      
      const urlInput = screen.getByLabelText('N8N Base URL');
      
      // Rapid changes
      await user.type(urlInput, 'abc');
      
      // Test result should be cleared only once
      expect(screen.queryByText(/Verbindung erfolgreich/)).not.toBeInTheDocument();
    });

    it('prevents multiple simultaneous connection tests', async () => {
      let resolveFirst: (value: any) => void;
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });
      
      mockFetch.mockReturnValueOnce(firstPromise);
      
      render(<N8NConnectionInterface />);
      
      const testButton = screen.getByText('Test');
      
      // Start first test
      await user.click(testButton);
      expect(testButton).toBeDisabled();
      
      // Try to start second test
      await user.click(testButton);
      
      // Should still be disabled
      expect(testButton).toBeDisabled();
      
      // Resolve first test
      resolveFirst!({
        ok: true,
        json: () => Promise.resolve({ connected: true })
      });
      
      await waitFor(() => {
        expect(testButton).not.toBeDisabled();
      });
    });
  });
});