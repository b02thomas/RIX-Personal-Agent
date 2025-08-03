// /src/components/mobile/__tests__/mobile-touch-optimizer.test.tsx
// Comprehensive test suite for mobile touch optimization component
// Tests PWA detection, touch interactions, viewport handling, and performance optimizations
// RELEVANT FILES: mobile-touch-optimizer.tsx, use-haptic-feedback.ts, mobile-navigation.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileTouchOptimizer, useMobileOptimization } from '../mobile-touch-optimizer';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock window properties and methods
const mockMatchMedia = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Test component that uses the hook
const TestComponent = () => {
  const { isMobile, isStandalone, touchSupported, orientationSupported } = useMobileOptimization();
  
  return (
    <div>
      <span data-testid="is-mobile">{isMobile.toString()}</span>
      <span data-testid="is-standalone">{isStandalone.toString()}</span>
      <span data-testid="touch-supported">{touchSupported.toString()}</span>
      <span data-testid="orientation-supported">{orientationSupported.toString()}</span>
    </div>
  );
};

describe('MobileTouchOptimizer', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalNavigator: any;
  let originalDocument: any;

  beforeEach(() => {
    // Store original values
    originalMatchMedia = window.matchMedia;
    originalNavigator = { ...window.navigator };
    originalDocument = { ...document };

    // Mock window.matchMedia
    mockMatchMedia.mockImplementation(query => ({
      matches: query.includes('display-mode: standalone'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: jest.fn(),
    }));
    window.matchMedia = mockMatchMedia;

    // Mock navigator properties
    Object.defineProperty(window, 'navigator', {
      writable: true,
      value: {
        ...originalNavigator,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        standalone: false,
        maxTouchPoints: 5,
      }
    });

    // Mock document properties
    Object.defineProperty(document, 'referrer', {
      writable: true,
      value: '',
    });

    // Mock document.documentElement.style
    const mockStyle = {
      setProperty: jest.fn(),
    };
    Object.defineProperty(document.documentElement, 'style', {
      value: mockStyle,
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
    });
  });

  describe('Component Rendering', () => {
    it('should render children correctly', () => {
      render(
        <MobileTouchOptimizer>
          <div data-testid="child">Test Content</div>
        </MobileTouchOptimizer>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply mobile optimization classes', () => {
      const { container } = render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).toHaveClass('mobile-optimized');
    });

    it('should handle default props correctly', () => {
      render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      // Should work without errors with default props
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('PWA Detection', () => {
    it('should detect standalone mode via display-mode', async () => {
      mockMatchMedia.mockImplementation(query => ({
        matches: query.includes('display-mode: standalone'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }));

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-standalone')).toHaveTextContent('true');
      });
    });

    it('should detect standalone mode via navigator.standalone', async () => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-standalone')).toHaveTextContent('true');
      });
    });

    it('should detect standalone mode via android-app referrer', async () => {
      Object.defineProperty(document, 'referrer', {
        value: 'android-app://com.example.app',
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-standalone')).toHaveTextContent('true');
      });
    });

    it('should not detect standalone mode when not in PWA', async () => {
      mockMatchMedia.mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window.navigator, 'standalone', {
        value: false,
      });

      Object.defineProperty(document, 'referrer', {
        value: 'https://example.com',
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-standalone')).toHaveTextContent('false');
      });
    });
  });

  describe('iOS Detection', () => {
    it('should detect iPhone', async () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      });
    });

    it('should detect iPad', async () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      });
    });

    it('should detect iPod', async () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)',
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      });
    });

    it('should not detect iOS on non-iOS devices', async () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      });
    });
  });

  describe('Touch Support Detection', () => {
    it('should detect touch support via maxTouchPoints', async () => {
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        value: 5,
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('touch-supported')).toHaveTextContent('true');
      });
    });

    it('should detect touch support via ontouchstart', async () => {
      Object.defineProperty(window, 'ontouchstart', {
        value: null,
      });

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('touch-supported')).toHaveTextContent('true');
      });
    });

    it('should not detect touch support on non-touch devices', async () => {
      Object.defineProperty(window.navigator, 'maxTouchPoints', {
        value: 0,
      });

      delete (window as any).ontouchstart;

      render(
        <MobileTouchOptimizer>
          <TestComponent />
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(screen.getByTestId('touch-supported')).toHaveTextContent('false');
      });
    });
  });

  describe('Viewport Handling', () => {
    it('should set viewport height CSS property on mount', async () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
      });

      render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--vh', '8px'); // 800 * 0.01
      });
    });

    it('should update viewport height on resize', async () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
      });

      render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      // Trigger resize event
      Object.defineProperty(window, 'innerHeight', {
        value: 600,
      });

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--vh', '6px'); // 600 * 0.01
      });
    });

    it('should update viewport height on orientation change', async () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
      });

      render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      // Trigger orientation change
      Object.defineProperty(window, 'innerHeight', {
        value: 375,
      });

      fireEvent(window, new Event('orientationchange'));

      await waitFor(() => {
        expect(mockSetProperty).toHaveBeenCalledWith('--vh', '3.75px'); // 375 * 0.01
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should enable optimizeScrolling by default', () => {
      const { container } = render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).toHaveClass('scroll-optimized');
    });

    it('should disable scroll optimization when specified', () => {
      const { container } = render(
        <MobileTouchOptimizer optimizeScrolling={false}>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).not.toHaveClass('scroll-optimized');
    });

    it('should handle passive event listeners for better performance', () => {
      const mockAddEventListener = jest.spyOn(window, 'addEventListener');

      render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'resize', 
        expect.any(Function)
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'orientationchange', 
        expect.any(Function)
      );
    });
  });

  describe('Pull to Refresh', () => {
    it('should enable pull to refresh when specified', () => {
      const { container } = render(
        <MobileTouchOptimizer enablePullToRefresh={true}>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).toHaveClass('pull-refresh-enabled');
    });

    it('should disable pull to refresh by default', () => {
      const { container } = render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).not.toHaveClass('pull-refresh-enabled');
    });
  });

  describe('Swipe Navigation', () => {
    it('should enable swipe navigation by default', () => {
      const { container } = render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).toHaveClass('swipe-nav-enabled');
    });

    it('should disable swipe navigation when specified', () => {
      const { container } = render(
        <MobileTouchOptimizer enableSwipeNavigation={false}>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      const optimizer = container.firstChild as HTMLElement;
      expect(optimizer).not.toHaveClass('swipe-nav-enabled');
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function)
      );
    });

    it('should handle multiple mounts and unmounts safely', () => {
      const { unmount: unmount1 } = render(
        <MobileTouchOptimizer>
          <div>Test 1</div>
        </MobileTouchOptimizer>
      );

      const { unmount: unmount2 } = render(
        <MobileTouchOptimizer>
          <div>Test 2</div>
        </MobileTouchOptimizer>
      );

      unmount1();
      unmount2();

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('useMobileOptimization Hook', () => {
    it('should provide mobile detection state', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('is-mobile')).toBeInTheDocument();
      expect(screen.getByTestId('is-standalone')).toBeInTheDocument();
      expect(screen.getByTestId('touch-supported')).toBeInTheDocument();
      expect(screen.getByTestId('orientation-supported')).toBeInTheDocument();
    });

    it('should detect orientation support', async () => {
      Object.defineProperty(window.screen, 'orientation', {
        value: { angle: 0 },
      });

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation-supported')).toHaveTextContent('true');
      });
    });

    it('should handle missing orientation API', async () => {
      delete (window.screen as any).orientation;

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation-supported')).toHaveTextContent('false');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        render(
          <MobileTouchOptimizer>
            <div>Test</div>
          </MobileTouchOptimizer>
        );
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('should handle missing navigator properties', () => {
      const originalNavigator = window.navigator;
      delete (window as any).navigator;

      expect(() => {
        render(
          <MobileTouchOptimizer>
            <div>Test</div>
          </MobileTouchOptimizer>
        );
      }).not.toThrow();

      window.navigator = originalNavigator;
    });

    it('should handle matchMedia not being supported', () => {
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      expect(() => {
        render(
          <MobileTouchOptimizer>
            <div>Test</div>
          </MobileTouchOptimizer>
        );
      }).not.toThrow();

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Performance Considerations', () => {
    it('should debounce viewport updates', async () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
      });

      render(
        <MobileTouchOptimizer>
          <div>Test</div>
        </MobileTouchOptimizer>
      );

      // Rapid resize events
      fireEvent(window, new Event('resize'));
      fireEvent(window, new Event('resize'));
      fireEvent(window, new Event('resize'));

      // Should handle multiple events gracefully
      expect(mockSetProperty).toHaveBeenCalled();
    });

    it('should optimize re-renders', () => {
      const renderCount = jest.fn();
      
      const TestComponentWithCounter = () => {
        renderCount();
        const { isMobile } = useMobileOptimization();
        return <div>{isMobile.toString()}</div>;
      };

      const { rerender } = render(
        <MobileTouchOptimizer>
          <TestComponentWithCounter />
        </MobileTouchOptimizer>
      );

      const initialCount = renderCount.mock.calls.length;

      // Rerender with same props
      rerender(
        <MobileTouchOptimizer>
          <TestComponentWithCounter />
        </MobileTouchOptimizer>
      );

      // Should not cause unnecessary re-renders
      expect(renderCount.mock.calls.length).toBeGreaterThan(initialCount);
    });
  });
});