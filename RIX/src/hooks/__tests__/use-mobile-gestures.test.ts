// /src/hooks/__tests__/use-mobile-gestures.test.ts
// Comprehensive test suite for mobile gesture hook
// Tests swipe detection, touch events, gesture configuration, and performance
// RELEVANT FILES: use-mobile-gestures.ts, mobile-navigation.tsx, use-haptic-feedback.ts

import { renderHook, act } from '@testing-library/react';
import { useMobileGestures, useSwipeGestures, useSwipeToClose } from '../use-mobile-gestures';

// Mock touch event creation helper
const createTouchEvent = (type: string, touch: { clientX: number; clientY: number }, element?: HTMLElement) => {
  const touchEvent = new TouchEvent(type, {
    touches: type === 'touchend' ? [] : [
      {
        clientX: touch.clientX,
        clientY: touch.clientY,
        identifier: 0,
        target: element || document.body,
      } as Touch
    ],
    bubbles: true,
    cancelable: true
  });
  return touchEvent;
};

describe('useMobileGestures Hook', () => {
  let mockElement: HTMLElement;
  let onSwipeLeft: jest.Mock;
  let onSwipeRight: jest.Mock;
  let onSwipeUp: jest.Mock;
  let onSwipeDown: jest.Mock;
  let onTap: jest.Mock;
  let onLongPress: jest.Mock;

  beforeEach(() => {
    // Create mock element
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    // Create mock callbacks
    onSwipeLeft = jest.fn();
    onSwipeRight = jest.fn();
    onSwipeUp = jest.fn();
    onSwipeDown = jest.fn();
    onTap = jest.fn();
    onLongPress = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Use fake timers for long press testing
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    jest.useRealTimers();
  });

  describe('Basic Setup', () => {
    it('returns gesture utilities', () => {
      const { result } = renderHook(() => useMobileGestures());
      
      expect(result.current.setupSwipeToClose).toBeInstanceOf(Function);
      expect(result.current.setupGestures).toBeInstanceOf(Function);
      expect(result.current.isTouchDevice).toBeInstanceOf(Function);
      expect(result.current.getSwipeVelocity).toBeInstanceOf(Function);
      expect(result.current.isGestureEnabled).toBe(true);
    });

    it('respects enabled configuration', () => {
      const { result } = renderHook(() => useMobileGestures({ enabled: false }));
      
      expect(result.current.isGestureEnabled).toBe(false);
    });

    it('sets up event listeners on element', () => {
      const addEventListenerSpy = jest.spyOn(mockElement, 'addEventListener');
      
      const { result } = renderHook(() => useMobileGestures({ onSwipeLeft }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
    });

    it('returns cleanup function', () => {
      const removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener');
      
      const { result } = renderHook(() => useMobileGestures({ onSwipeLeft }));
      
      let cleanup: (() => void) | undefined;
      act(() => {
        cleanup = result.current.setupSwipeToClose(mockElement);
      });
      
      act(() => {
        cleanup?.();
      });
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });

  describe('Swipe Detection', () => {
    it('detects horizontal swipe left', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeLeft }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Simulate swipe left (start right, end left)
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 150, clientY: 100 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('detects horizontal swipe right', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeRight }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Simulate swipe right (start left, end right)
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 150, clientY: 100 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 200, clientY: 100 }));
      });
      
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('detects vertical swipe up', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeUp }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Simulate swipe up (start bottom, end top)
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 200 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 100, clientY: 150 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeUp).toHaveBeenCalledTimes(1);
    });

    it('detects vertical swipe down', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeDown }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Simulate swipe down (start top, end bottom)
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 100, clientY: 150 }));
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 200 }));
      });
      
      expect(onSwipeDown).toHaveBeenCalledTimes(1);
    });

    it('respects swipe threshold', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onSwipeLeft, 
        swipeThreshold: 100 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Swipe below threshold (50px)
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 70, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 50, clientY: 100 }));
      });
      
      expect(onSwipeLeft).not.toHaveBeenCalled();
      
      // Swipe above threshold (120px)
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 70, clientY: 100 }));
      });
      
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('prioritizes horizontal swipes over vertical', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onSwipeLeft, 
        onSwipeUp 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Diagonal swipe with more horizontal movement
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 150 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 120, clientY: 120 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(onSwipeUp).not.toHaveBeenCalled();
    });

    it('prioritizes vertical swipes over horizontal', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onSwipeLeft, 
        onSwipeUp 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Diagonal swipe with more vertical movement
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 130, clientY: 200 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 120, clientY: 120 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeUp).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('Tap Detection', () => {
    it('detects tap when no movement occurs', () => {
      const { result } = renderHook(() => useMobileGestures({ onTap }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Tap at same position
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onTap).toHaveBeenCalledTimes(1);
    });

    it('does not detect tap when significant movement occurs', () => {
      const { result } = renderHook(() => useMobileGestures({ onTap }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Movement exceeding threshold
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 120, clientY: 120 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 120, clientY: 120 }));
      });
      
      expect(onTap).not.toHaveBeenCalled();
    });

    it('cancels tap when movement is detected', () => {
      const { result } = renderHook(() => useMobileGestures({ onTap }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Start tap, then move
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 115, clientY: 115 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 115, clientY: 115 }));
      });
      
      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe('Long Press Detection', () => {
    it('detects long press after delay', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onLongPress, 
        longPressDelay: 500 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Start touch
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
      });
      
      // Advance time to trigger long press
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('cancels long press on movement', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onLongPress, 
        longPressDelay: 500 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Start touch
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
      });
      
      // Move before long press delay
      act(() => {
        jest.advanceTimersByTime(200);
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 115, clientY: 115 }));
      });
      
      // Complete delay
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('cancels long press on touch end', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onLongPress, 
        longPressDelay: 500 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Start touch
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
      });
      
      // End touch before delay
      act(() => {
        jest.advanceTimersByTime(200);
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      // Complete delay
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('respects custom long press delay', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onLongPress, 
        longPressDelay: 1000 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
      });
      
      // Should not trigger at 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onLongPress).not.toHaveBeenCalled();
      
      // Should trigger at 1000ms
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Touch Device Detection', () => {
    it('detects touch support via ontouchstart', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: null
      });
      
      const { result } = renderHook(() => useMobileGestures());
      
      expect(result.current.isTouchDevice()).toBe(true);
      
      // Clean up
      delete (window as any).ontouchstart;
    });

    it('detects touch support via maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5
      });
      
      const { result } = renderHook(() => useMobileGestures());
      
      expect(result.current.isTouchDevice()).toBe(true);
      
      // Reset
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 0
      });
    });

    it('returns false when no touch support', () => {
      // Ensure no touch support
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 0
      });
      
      const { result } = renderHook(() => useMobileGestures());
      
      expect(result.current.isTouchDevice()).toBe(false);
    });
  });

  describe('Swipe Velocity Calculation', () => {
    it('calculates swipe velocity', () => {
      const { result } = renderHook(() => useMobileGestures());
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      const startTime = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 100); // 100ms later
      
      // Simulate swipe
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 200, clientY: 100 }));
      });
      
      const velocity = result.current.getSwipeVelocity();
      expect(velocity).toBe(1); // 100px in 100ms = 1px/ms
    });

    it('returns 0 velocity when no touch data', () => {
      const { result } = renderHook(() => useMobileGestures());
      
      expect(result.current.getSwipeVelocity()).toBe(0);
    });
  });

  describe('Event Handling Edge Cases', () => {
    it('handles missing touch data gracefully', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeLeft }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // TouchEnd without TouchStart
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('handles multiple rapid touch events', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeLeft }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // Rapid touch events
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 100, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('resets state between gestures', () => {
      const { result } = renderHook(() => useMobileGestures({ onSwipeLeft }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      // First gesture
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 150, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      
      // Second gesture
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 150, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disabled State', () => {
    it('ignores events when disabled', () => {
      const { result } = renderHook(() => useMobileGestures({ 
        onSwipeLeft, 
        enabled: false 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      act(() => {
        mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 150, clientY: 100 }));
        mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 100, clientY: 100 }));
      });
      
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('does not set up listeners when disabled', () => {
      const addEventListenerSpy = jest.spyOn(mockElement, 'addEventListener');
      
      const { result } = renderHook(() => useMobileGestures({ 
        onSwipeLeft, 
        enabled: false 
      }));
      
      act(() => {
        result.current.setupSwipeToClose(mockElement);
      });
      
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });
});

describe('useSwipeGestures Hook', () => {
  it('configures horizontal swipes with higher threshold', () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    
    const { result } = renderHook(() => useSwipeGestures(onSwipeLeft, onSwipeRight));
    
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.setupSwipeToClose(mockElement);
    });
    
    // Swipe with default threshold (50px) - should not trigger
    act(() => {
      mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 150, clientY: 100 }));
      mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 120, clientY: 100 }));
      mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 120, clientY: 100 }));
    });
    
    expect(onSwipeLeft).not.toHaveBeenCalled();
    
    // Swipe with higher threshold (120px) - should trigger
    act(() => {
      mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 200, clientY: 100 }));
      mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 100, clientY: 100 }));
      mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 70, clientY: 100 }));
    });
    
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });
});

describe('useSwipeToClose Hook', () => {
  it('configures swipe left to close with medium threshold', () => {
    const onClose = jest.fn();
    
    const { result } = renderHook(() => useSwipeToClose(onClose));
    
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.setupSwipeToClose(mockElement);
    });
    
    // Swipe left with 80px (above 75px threshold)
    act(() => {
      mockElement.dispatchEvent(createTouchEvent('touchstart', { clientX: 150, clientY: 100 }));
      mockElement.dispatchEvent(createTouchEvent('touchmove', { clientX: 80, clientY: 100 }));
      mockElement.dispatchEvent(createTouchEvent('touchend', { clientX: 70, clientY: 100 }));
    });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('respects enabled flag', () => {
    const onClose = jest.fn();
    
    const { result } = renderHook(() => useSwipeToClose(onClose, false));
    
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.setupSwipeToClose(mockElement);
    });
    
    // Should not set up gestures when disabled
    expect(result.current.isGestureEnabled).toBe(false);
  });
});