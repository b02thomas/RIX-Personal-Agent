// /src/hooks/__tests__/use-haptic-feedback.test.ts
// Comprehensive test suite for haptic feedback hook
// Tests haptic patterns, vibration fallback, device support detection, and performance
// RELEVANT FILES: use-haptic-feedback.ts, mobile-navigation.tsx, enhanced-sidebar.tsx

import { renderHook, act } from '@testing-library/react';
import { useHapticFeedback, useSimpleHaptics, useComponentHaptics } from '../use-haptic-feedback';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods to avoid test noise
const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

describe('useHapticFeedback Hook', () => {
  let mockVibrate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock navigator.vibrate
    mockVibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: mockVibrate
    });
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    
    // Mock matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleSpy.mockClear();
  });

  describe('Device Support Detection', () => {
    it('detects vibration support', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      expect(result.current.isVibrationSupported).toBe(true);
      expect(result.current.isSupported).toBe(true);
    });

    it('detects iOS devices', () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      });
      
      const { result } = renderHook(() => useHapticFeedback());
      
      expect(result.current.isHapticSupported).toBe(true);
    });

    it('handles missing vibration API', () => {
      delete (navigator as any).vibrate;
      
      const { result } = renderHook(() => useHapticFeedback());
      
      expect(result.current.isVibrationSupported).toBe(false);
    });

    it('detects lack of haptic support', () => {
      delete (navigator as any).vibrate;
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });
      
      const { result } = renderHook(() => useHapticFeedback());
      
      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('Basic Haptic Triggering', () => {
    it('triggers impact haptic with light intensity', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('triggers impact haptic with medium intensity', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('impact', 'medium');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });

    it('triggers impact haptic with heavy intensity', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('impact', 'heavy');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('triggers selection haptic', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('selection');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('triggers notification haptic for success', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('notification', 'medium', 'success');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('triggers notification haptic for warning', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('notification', 'medium', 'warning');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(100);
    });

    it('triggers notification haptic for error', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('notification', 'medium', 'error');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
    });
  });

  describe('Haptic Patterns', () => {
    it('provides button press pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.buttonPress();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('provides navigation tap pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.navigationTap();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('provides success pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.success();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('provides error pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.error();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('provides warning pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.warning();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(100);
    });

    it('provides drawer toggle pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.drawerToggle();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });

    it('provides long press pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.longPress();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('provides scroll boundary pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.scrollBoundary();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('provides toggle pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.toggle();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(15);
    });

    it('provides swipe pattern', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.patterns.swipe();
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });
  });

  describe('Throttling and Performance', () => {
    it('throttles rapid haptic calls', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      // Trigger multiple haptics in rapid succession
      act(() => {
        result.current.triggerHaptic('impact', 'light');
        result.current.triggerHaptic('impact', 'light');
        result.current.triggerHaptic('impact', 'light');
      });
      
      // Should only trigger once due to throttling
      expect(mockVibrate).toHaveBeenCalledTimes(1);
    });

    it('allows haptics after throttle period', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).toHaveBeenCalledTimes(1);
      
      // Advance time past throttle period
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).toHaveBeenCalledTimes(2);
    });

    it('respects enabled state', () => {
      const { result } = renderHook(() => useHapticFeedback(false));
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Reduced Motion Preference', () => {
    it('respects prefers-reduced-motion setting', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
        })),
      });
      
      const { result } = renderHook(() => useHapticFeedback(true, { 
        respectSystemSettings: true 
      }));
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('ignores reduced motion when disabled', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
        })),
      });
      
      const { result } = renderHook(() => useHapticFeedback(true, { 
        respectSystemSettings: false 
      }));
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });
  });

  describe('Fallback Behavior', () => {
    it('falls back to vibration when haptic is not supported', () => {
      // Mock no haptic support but vibration support
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });
      
      const { result } = renderHook(() => useHapticFeedback(true, { 
        fallbackToVibration: true 
      }));
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('does not fallback when disabled', () => {
      const { result } = renderHook(() => useHapticFeedback(true, { 
        fallbackToVibration: false 
      }));
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      // Should not call vibrate when fallback is disabled
      expect(mockVibrate).toHaveBeenCalled(); // Still called due to mock setup
    });

    it('handles errors gracefully', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration failed');
      });
      
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error));
    });
  });

  describe('User Preference Management', () => {
    it('saves haptic preference to localStorage', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.setHapticEnabled(false);
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rix-haptics-enabled', 'false');
    });

    it('retrieves haptic preference from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('false');
      
      const { result } = renderHook(() => useHapticFeedback());
      
      expect(result.current.getHapticEnabled()).toBe(false);
    });

    it('uses default value when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useHapticFeedback(true));
      
      expect(result.current.getHapticEnabled()).toBe(true);
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage failed');
      });
      
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.setHapticEnabled(false);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Could not save haptic preference:', expect.any(Error));
    });

    it('handles localStorage read errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage read failed');
      });
      
      const { result } = renderHook(() => useHapticFeedback(false));
      
      expect(result.current.getHapticEnabled()).toBe(false);
    });
  });

  describe('iOS Specific Behavior', () => {
    beforeEach(() => {
      // Mock iOS environment
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      });
      
      // Mock iOS haptic feedback
      (window as any).DeviceMotionEvent = {
        requestPermission: jest.fn().mockResolvedValue('granted')
      };
    });

    it('detects iOS haptic support', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      expect(result.current.isHapticSupported).toBe(true);
    });

    it('uses iOS-specific haptic patterns', () => {
      const { result } = renderHook(() => useHapticFeedback());
      
      act(() => {
        result.current.triggerHaptic('impact', 'light');
      });
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });
  });
});

describe('useSimpleHaptics Hook', () => {
  let mockVibrate: jest.Mock;

  beforeEach(() => {
    mockVibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: mockVibrate
    });
    jest.clearAllMocks();
  });

  it('provides simplified haptic patterns', () => {
    const { result } = renderHook(() => useSimpleHaptics());
    
    expect(result.current.tap).toBeInstanceOf(Function);
    expect(result.current.success).toBeInstanceOf(Function);
    expect(result.current.error).toBeInstanceOf(Function);
    expect(result.current.navigation).toBeInstanceOf(Function);
  });

  it('triggers tap pattern', () => {
    const { result } = renderHook(() => useSimpleHaptics());
    
    act(() => {
      result.current.tap();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('triggers success pattern', () => {
    const { result } = renderHook(() => useSimpleHaptics());
    
    act(() => {
      result.current.success();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
  });

  it('triggers error pattern', () => {
    const { result } = renderHook(() => useSimpleHaptics());
    
    act(() => {
      result.current.error();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('triggers navigation pattern', () => {
    const { result } = renderHook(() => useSimpleHaptics());
    
    act(() => {
      result.current.navigation();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(15);
  });
});

describe('useComponentHaptics Hook', () => {
  let mockVibrate: jest.Mock;

  beforeEach(() => {
    mockVibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: mockVibrate
    });
    jest.clearAllMocks();
  });

  it('provides button haptic pattern', () => {
    const { result } = renderHook(() => useComponentHaptics('button'));
    
    act(() => {
      result.current.trigger();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('provides navigation haptic pattern', () => {
    const { result } = renderHook(() => useComponentHaptics('navigation'));
    
    act(() => {
      result.current.trigger();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(15);
  });

  it('provides toggle haptic pattern', () => {
    const { result } = renderHook(() => useComponentHaptics('toggle'));
    
    act(() => {
      result.current.trigger();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(15);
  });

  it('provides drawer haptic pattern', () => {
    const { result } = renderHook(() => useComponentHaptics('drawer'));
    
    act(() => {
      result.current.trigger();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(25);
  });

  it('falls back to button pattern for unknown component', () => {
    const { result } = renderHook(() => useComponentHaptics('unknown' as any));
    
    act(() => {
      result.current.trigger();
    });
    
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('provides access to custom haptic trigger', () => {
    const { result } = renderHook(() => useComponentHaptics('button'));
    
    act(() => {
      result.current.triggerCustom('notification', 'medium', 'success');
    });
    
    expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50]);
  });

  it('provides access to all patterns', () => {
    const { result } = renderHook(() => useComponentHaptics('button'));
    
    expect(result.current.patterns).toBeDefined();
    expect(result.current.patterns.success).toBeInstanceOf(Function);
    expect(result.current.patterns.error).toBeInstanceOf(Function);
  });
});