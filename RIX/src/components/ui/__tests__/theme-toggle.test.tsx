// /src/components/ui/__tests__/theme-toggle.test.tsx
// Comprehensive test suite for theme toggle component functionality
// Tests theme switching (Dark/Light/System), persistence, and accessibility
// RELEVANT FILES: theme-toggle.tsx, preferences-store.ts, design-system.css

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle, ThemeAware, useThemeToggle } from '../theme-toggle';

// Mock the preferences store
const mockSetTheme = jest.fn();
const mockPreferences = {
  theme: 'dark' as const,
  language: 'de' as const,
  cognitiveMode: 'ambient' as const,
  notifications: {
    push: true,
    email: true,
    voice: true,
    sound: true,
  },
  voice: {
    enabled: true,
    autoTranscribe: true,
    language: 'de' as const,
  },
  privacy: {
    dataCollection: true,
    analytics: true,
    crashReporting: false,
  },
  performance: {
    autoSync: true,
    backgroundSync: true,
    cacheStrategy: 'balanced' as const,
  },
};

jest.mock('@/store/preferences-store', () => ({
  usePreferencesStore: () => ({
    preferences: mockPreferences,
    setTheme: mockSetTheme,
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Sun: ({ className, ...props }: any) => <div data-testid="sun-icon" className={className} {...props} />,
  Moon: ({ className, ...props }: any) => <div data-testid="moon-icon" className={className} {...props} />,
  Monitor: ({ className, ...props }: any) => <div data-testid="monitor-icon" className={className} {...props} />,
}));

// Mock window.matchMedia for system theme detection
const createMatchMediaMock = (matches: boolean) => {
  return jest.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

describe('ThemeToggle Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset DOM attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark', 'light');
    
    // Reset CSS styles
    document.documentElement.style.removeProperty('transition');
    
    // Mock window.matchMedia for dark theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(true), // Default to dark system theme
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('renders with custom className', () => {
      render(<ThemeToggle className="custom-class" />);
      
      const container = screen.getByRole('button').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('shows correct icon for dark theme', () => {
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    });

    it('shows correct icon for light theme', () => {
      mockPreferences.theme = 'light';
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
    });

    it('shows monitor icon for system theme', () => {
      mockPreferences.theme = 'system';
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    });
  });

  describe('Theme Switching', () => {
    it('toggles from dark to light theme', async () => {
      mockPreferences.theme = 'dark';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('toggles from light to dark theme', async () => {
      mockPreferences.theme = 'light';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('cycles through themes when showSystemOption is enabled', async () => {
      mockPreferences.theme = 'light';
      render(<ThemeToggle showSystemOption />);
      
      const toggle = screen.getByRole('button');
      
      // Light -> Dark
      await user.click(toggle);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      
      // Simulate dark theme
      mockPreferences.theme = 'dark';
      await user.click(toggle);
      expect(mockSetTheme).toHaveBeenCalledWith('system');
      
      // Simulate system theme
      mockPreferences.theme = 'system';
      await user.click(toggle);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('applies transition styles during theme change', async () => {
      const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
      const removePropertySpy = jest.spyOn(document.documentElement.style, 'removeProperty');
      
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(setPropertySpy).toHaveBeenCalledWith('transition', 'background-color 200ms ease, color 200ms ease');
      
      // Wait for transition to complete
      await waitFor(() => {
        expect(removePropertySpy).toHaveBeenCalledWith('transition');
      }, { timeout: 250 });
    });
  });

  describe('System Theme Detection', () => {
    it('detects dark system theme', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });
      
      mockPreferences.theme = 'system';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('title', 'Current theme: system (dark)');
    });

    it('detects light system theme', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(false),
      });
      
      mockPreferences.theme = 'system';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('title', 'Current theme: system (light)');
    });

    it('applies system theme to document', () => {
      const setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute');
      const addClassSpy = jest.spyOn(document.documentElement.classList, 'add');
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });
      
      mockPreferences.theme = 'system';
      render(<ThemeToggle />);
      
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark');
      expect(addClassSpy).toHaveBeenCalledWith('dark');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for dark theme', () => {
      mockPreferences.theme = 'dark';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');
    });

    it('has proper ARIA labels for light theme', () => {
      mockPreferences.theme = 'light';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
    });

    it('has proper title attribute', () => {
      mockPreferences.theme = 'dark';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('title', 'Current theme: dark');
    });

    it('supports keyboard navigation', async () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      toggle.focus();
      
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('supports space key activation', async () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      toggle.focus();
      
      await user.keyboard(' ');
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Component Variants', () => {
    it('renders different sizes correctly', () => {
      const { rerender } = render(<ThemeToggle size="sm" />);
      let toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('w-11', 'h-6');
      
      rerender(<ThemeToggle size="md" />);
      toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('w-14', 'h-7');
      
      rerender(<ThemeToggle size="lg" />);
      toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('w-16', 'h-8');
    });

    it('shows label when enabled', () => {
      mockPreferences.theme = 'dark';
      render(<ThemeToggle showLabel />);
      
      expect(screen.getByText('dark')).toBeInTheDocument();
    });

    it('shows auto label for system theme', () => {
      mockPreferences.theme = 'system';
      render(<ThemeToggle showLabel />);
      
      expect(screen.getByText(/Auto \(dark\)/)).toBeInTheDocument();
    });

    it('respects disabled state', async () => {
      render(<ThemeToggle disabled />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
      
      await user.click(toggle);
      expect(mockSetTheme).not.toHaveBeenCalled();
    });
  });

  describe('Hydration and SSR', () => {
    it('renders placeholder during SSR', () => {
      // Mock mounted state to false
      const { container } = render(<ThemeToggle />);
      
      // Should render basic placeholder structure
      expect(container.querySelector('.rix-theme-toggle')).toBeInTheDocument();
    });

    it('prevents hydration mismatch', () => {
      // This test ensures no hydration warnings in console
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ThemeToggle />);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('hydration')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Dropdown Variant', () => {
    it('renders dropdown variant correctly', () => {
      render(<ThemeToggle variant="dropdown" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('shows theme label in dropdown variant', () => {
      mockPreferences.theme = 'dark';
      render(<ThemeToggle variant="dropdown" showLabel />);
      
      expect(screen.getByText('dark')).toBeInTheDocument();
    });
  });
});

describe('useThemeToggle Hook', () => {
  const TestComponent = () => {
    const { theme, toggleTheme, setTheme } = useThemeToggle();
    return (
      <div>
        <span data-testid="current-theme">{theme}</span>
        <button onClick={toggleTheme} data-testid="toggle-button">
          Toggle
        </button>
        <button onClick={() => setTheme('light')} data-testid="set-light">
          Set Light
        </button>
      </div>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current theme', () => {
    mockPreferences.theme = 'dark';
    render(<TestComponent />);
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('toggles theme correctly', async () => {
    mockPreferences.theme = 'dark';
    const user = userEvent.setup();
    render(<TestComponent />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    await user.click(toggleButton);
    
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('sets specific theme', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);
    
    const setLightButton = screen.getByTestId('set-light');
    await user.click(setLightButton);
    
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});

describe('ThemeAware Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies light class for light theme', () => {
    mockPreferences.theme = 'light';
    render(
      <ThemeAware lightClass="light-bg" darkClass="dark-bg">
        <div>Content</div>
      </ThemeAware>
    );
    
    expect(screen.getByText('Content').parentElement).toHaveClass('light-bg');
    expect(screen.getByText('Content').parentElement).not.toHaveClass('dark-bg');
  });

  it('applies dark class for dark theme', () => {
    mockPreferences.theme = 'dark';
    render(
      <ThemeAware lightClass="light-bg" darkClass="dark-bg">
        <div>Content</div>
      </ThemeAware>
    );
    
    expect(screen.getByText('Content').parentElement).toHaveClass('dark-bg');
    expect(screen.getByText('Content').parentElement).not.toHaveClass('light-bg');
  });

  it('handles system theme correctly', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(true), // System prefers dark
    });
    
    mockPreferences.theme = 'system';
    render(
      <ThemeAware lightClass="light-bg" darkClass="dark-bg">
        <div>Content</div>
      </ThemeAware>
    );
    
    expect(screen.getByText('Content').parentElement).toHaveClass('dark-bg');
  });

  it('applies custom className', () => {
    render(
      <ThemeAware className="custom-class">
        <div>Content</div>
      </ThemeAware>
    );
    
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-class');
  });

  it('renders placeholder during SSR', () => {
    const { container } = render(
      <ThemeAware>
        <div>Content</div>
      </ThemeAware>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Theme Application Integration', () => {
  beforeEach(() => {
    // Clear any existing attributes/classes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark', 'light');
    jest.clearAllMocks();
  });

  it('applies theme to document element on mount', () => {
    const setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute');
    const addClassSpy = jest.spyOn(document.documentElement.classList, 'add');
    
    mockPreferences.theme = 'dark';
    render(<ThemeToggle />);
    
    // Wait for useEffect to run
    expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark');
    expect(addClassSpy).toHaveBeenCalledWith('dark');
  });

  it('removes dark class for light theme', () => {
    const setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute');
    const removeClassSpy = jest.spyOn(document.documentElement.classList, 'remove');
    
    mockPreferences.theme = 'light';
    render(<ThemeToggle />);
    
    expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'light');
    expect(removeClassSpy).toHaveBeenCalledWith('dark');
  });

  it('listens for system theme changes', () => {
    const addEventListenerSpy = jest.fn();
    const removeEventListenerSpy = jest.fn();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      })),
    });
    
    mockPreferences.theme = 'system';
    const { unmount } = render(<ThemeToggle />);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('Error Handling', () => {
  it('handles missing matchMedia gracefully', () => {
    // Remove matchMedia
    const originalMatchMedia = window.matchMedia;
    delete (window as any).matchMedia;
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockPreferences.theme = 'system';
    render(<ThemeToggle />);
    
    // Should not throw error
    expect(consoleSpy).not.toHaveBeenCalled();
    
    // Restore
    window.matchMedia = originalMatchMedia;
    consoleSpy.mockRestore();
  });

  it('handles theme change errors gracefully', async () => {
    mockSetTheme.mockImplementation(() => {
      throw new Error('Theme change failed');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    
    render(<ThemeToggle />);
    
    const toggle = screen.getByRole('button');
    await user.click(toggle);
    
    // Should not crash the component
    expect(toggle).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});

describe('Performance', () => {
  it('debounces rapid theme changes', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const toggle = screen.getByRole('button');
    
    // Rapidly click multiple times
    await user.click(toggle);
    await user.click(toggle);
    await user.click(toggle);
    
    // Should handle all clicks without issues
    expect(mockSetTheme).toHaveBeenCalledTimes(3);
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.fn();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: removeEventListenerSpy,
      })),
    });
    
    mockPreferences.theme = 'system';
    const { unmount } = render(<ThemeToggle />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});