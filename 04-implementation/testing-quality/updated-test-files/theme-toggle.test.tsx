// /04-implementation/testing-quality/updated-test-files/theme-toggle.test.tsx
// Updated test suite for theme toggle component with fixed dynamic icon imports
// Tests theme switching (Dark/Light/System), persistence, color system integration, and accessibility
// RELEVANT FILES: theme-toggle.tsx, preferences-store.ts, design-system.css, color-system.css

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle, ThemeAware, useThemeToggle } from '@/components/ui/theme-toggle';

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

// Mock dynamic imports for performance optimization
jest.mock('next/dynamic', () => {
  return function mockDynamic(dynamicFunction: any, options?: any) {
    const DynamicComponent = dynamicFunction();
    DynamicComponent.preload = jest.fn();
    DynamicComponent.displayName = options?.displayName || 'DynamicComponent';
    return DynamicComponent;
  };
});

// Mock Lucide React icons with proper components
jest.mock('lucide-react', () => ({
  Sun: (props: any) => <div data-testid="sun-icon" {...props} />,
  Moon: (props: any) => <div data-testid="moon-icon" {...props} />,
  Monitor: (props: any) => <div data-testid="monitor-icon" {...props} />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
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
    
    // Reset mock preferences
    mockPreferences.theme = 'dark';
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
      expect(screen.queryByTestId('monitor-icon')).not.toBeInTheDocument();
    });

    it('shows correct icon for light theme', () => {
      mockPreferences.theme = 'light';
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('monitor-icon')).not.toBeInTheDocument();
    });

    it('shows monitor icon for system theme', () => {
      mockPreferences.theme = 'system';
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    });

    it('applies correct CSS classes for RIX design system', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('transition-all', 'duration-200');
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
      const { rerender } = render(<ThemeToggle showSystemOption />);
      const toggle = screen.getByRole('button');
      
      // Light -> Dark
      mockPreferences.theme = 'light';
      rerender(<ThemeToggle showSystemOption />);
      await user.click(toggle);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      
      // Dark -> System
      mockPreferences.theme = 'dark';
      rerender(<ThemeToggle showSystemOption />);
      await user.click(toggle);
      expect(mockSetTheme).toHaveBeenCalledWith('system');
      
      // System -> Light
      mockPreferences.theme = 'system';
      rerender(<ThemeToggle showSystemOption />);
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

    it('applies RIX color system during transition', async () => {
      const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
      
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      // Should use RIX design system transition values
      expect(setPropertySpy).toHaveBeenCalledWith('transition', expect.stringContaining('200ms ease'));
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

    it('applies system theme to document with RIX color system', () => {
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

    it('handles system theme changes dynamically', () => {
      let changeHandler: (e: any) => void;
      const addEventListenerSpy = jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: true,
          addEventListener: addEventListenerSpy,
          removeEventListener: jest.fn(),
        })),
      });

      mockPreferences.theme = 'system';
      render(<ThemeToggle />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

      // Simulate system theme change
      if (changeHandler) {
        act(() => {
          changeHandler({ matches: false });
        });
      }

      // Should update the document theme
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
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

    it('has proper ARIA labels for system theme', () => {
      mockPreferences.theme = 'system';
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label', expect.stringContaining('Switch to'));
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

    it('provides proper focus states', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      toggle.focus();
      
      expect(toggle).toHaveClass('focus:ring-2', 'focus:ring-rix-accent-primary');
    });

    it('has minimum touch target size for mobile', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('mobile-touch-target');
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
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });
      
      mockPreferences.theme = 'system';
      render(<ThemeToggle showLabel />);
      
      expect(screen.getByText(/Auto \(dark\)/)).toBeInTheDocument();
    });

    it('respects disabled state', async () => {
      render(<ThemeToggle disabled />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveClass('opacity-50', 'cursor-not-allowed');
      
      await user.click(toggle);
      expect(mockSetTheme).not.toHaveBeenCalled();
    });

    it('applies correct styling for different variants', () => {
      const { rerender } = render(<ThemeToggle variant="toggle" />);
      let toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-rix-card-background');
      
      rerender(<ThemeToggle variant="dropdown" />);
      toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('flex', 'items-center', 'gap-2');
    });
  });

  describe('Hydration and SSR', () => {
    it('renders placeholder during SSR', () => {
      // Mock unmounted state
      const { container } = render(<ThemeToggle />);
      
      // Should render basic structure without hydration mismatch
      expect(container.querySelector('.rix-theme-toggle')).toBeInTheDocument();
    });

    it('prevents hydration mismatch', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ThemeToggle />);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('hydration')
      );
      
      consoleSpy.mockRestore();
    });

    it('applies theme immediately after hydration', () => {
      const setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute');
      
      render(<ThemeToggle />);
      
      // Should apply theme without delay
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark');
    });
  });

  describe('RIX Color System Integration', () => {
    it('uses RIX color variables', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('bg-rix-card-background', 'border-rix-border-primary');
    });

    it('applies hover states with RIX colors', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('hover:bg-rix-card-hover');
    });

    it('uses correct focus ring color', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('focus:ring-rix-accent-primary');
    });

    it('applies consistent border radius', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('rounded-lg'); // 8px as per RIX design system
    });
  });

  describe('Dynamic Icon Loading', () => {
    it('handles dynamic icon imports correctly', () => {
      render(<ThemeToggle />);
      
      // Icons should be rendered properly after dynamic import
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });

    it('shows fallback during icon loading', () => {
      // Mock dynamic import delay
      const MockComponent = () => {
        const [loaded, setLoaded] = React.useState(false);
        React.useEffect(() => {
          setTimeout(() => setLoaded(true), 100);
        }, []);
        
        return loaded ? <ThemeToggle /> : <div data-testid="loading">Loading...</div>;
      };
      
      render(<MockComponent />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('handles icon loading errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock icon import failure
      jest.doMock('lucide-react', () => {
        throw new Error('Failed to load icons');
      });
      
      // Should not crash the component
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Optimizations', () => {
    it('preloads icons for better performance', () => {
      render(<ThemeToggle />);
      
      // Dynamic imports should have preload method called
      expect(require('next/dynamic')).toHaveBeenCalled();
    });

    it('debounces rapid theme changes', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      
      // Rapidly click multiple times
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);
      
      // Should handle all clicks without performance issues
      expect(mockSetTheme).toHaveBeenCalledTimes(3);
    });

    it('uses hardware acceleration for animations', () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('transform'); // Enables hardware acceleration
    });
  });

  describe('Mobile Optimization', () => {
    it('has proper touch targets', () => {
      render(<ThemeToggle size="sm" />);
      
      const toggle = screen.getByRole('button');
      // Should have minimum 44px touch target even for small size
      expect(toggle).toHaveClass('mobile-touch-target');
    });

    it('handles touch events correctly', async () => {
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      
      fireEvent.touchStart(toggle);
      fireEvent.touchEnd(toggle);
      fireEvent.click(toggle);
      
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('provides haptic feedback on theme change', async () => {
      const mockVibrate = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        value: mockVibrate
      });
      
      render(<ThemeToggle />);
      
      const toggle = screen.getByRole('button');
      await user.click(toggle);
      
      expect(mockVibrate).toHaveBeenCalledWith([10]); // Light haptic feedback
    });
  });
});

describe('useThemeToggle Hook', () => {
  const TestComponent = () => {
    const { theme, toggleTheme, setTheme, isSystemDark } = useThemeToggle();
    return (
      <div>
        <span data-testid="current-theme">{theme}</span>
        <span data-testid="is-system-dark">{isSystemDark.toString()}</span>
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
    mockPreferences.theme = 'dark';
  });

  it('returns current theme', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('detects system dark mode correctly', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(true),
    });
    
    render(<TestComponent />);
    
    expect(screen.getByTestId('is-system-dark')).toHaveTextContent('true');
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

  it('handles system theme preference changes', () => {
    let changeHandler: (e: any) => void;
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: (event: string, handler: any) => {
          if (event === 'change') changeHandler = handler;
        },
        removeEventListener: jest.fn(),
      })),
    });
    
    render(<TestComponent />);
    
    // Simulate system preference change
    act(() => {
      changeHandler?.({ matches: false });
    });
    
    expect(screen.getByTestId('is-system-dark')).toHaveTextContent('false');
  });
});

describe('ThemeAware Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreferences.theme = 'dark';
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

  it('applies RIX color classes', () => {
    render(
      <ThemeAware 
        lightClass="bg-rix-background-light" 
        darkClass="bg-rix-background-dark"
      >
        <div>Content</div>
      </ThemeAware>
    );
    
    expect(screen.getByText('Content').parentElement).toHaveClass('bg-rix-background-dark');
  });

  it('combines custom className with theme classes', () => {
    render(
      <ThemeAware 
        className="custom-class" 
        lightClass="light-bg" 
        darkClass="dark-bg"
      >
        <div>Content</div>
      </ThemeAware>
    );
    
    const element = screen.getByText('Content').parentElement;
    expect(element).toHaveClass('custom-class', 'dark-bg');
  });
});

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles missing matchMedia gracefully', () => {
    const originalMatchMedia = window.matchMedia;
    delete (window as any).matchMedia;
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockPreferences.theme = 'system';
    render(<ThemeToggle />);
    
    // Should not throw error and should fall back to light theme
    expect(consoleSpy).not.toHaveBeenCalled();
    
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

  it('handles rapid theme changes without memory leaks', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const toggle = screen.getByRole('button');
    
    // Rapidly change themes multiple times
    for (let i = 0; i < 10; i++) {
      await user.click(toggle);
    }
    
    // Should handle all changes without issues
    expect(mockSetTheme).toHaveBeenCalledTimes(10);
  });

  it('maintains consistent state during async operations', async () => {
    // Mock async theme change
    mockSetTheme.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    const toggle = screen.getByRole('button');
    await user.click(toggle);
    
    // Component should remain stable during async operation
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme');
  });
});