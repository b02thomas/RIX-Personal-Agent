// /src/hooks/use-mobile-gestures.ts
// Custom hook for mobile gesture handling including swipe, tap, and long press detection
// Provides optimized touch interactions for mobile PWA with configurable gesture recognition
// RELEVANT FILES: mobile-navigation.tsx, use-haptic-feedback.ts, design-system.css

import { useCallback, useRef } from 'react';

interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  enabled?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useMobileGestures = (config: GestureConfig = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    enabled = true,
    swipeThreshold = 50,
    longPressDelay = 500
  } = config;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    touchEnd.current = null;
    hasMoved.current = false;

    // Setup long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (!hasMoved.current && touchStart.current) {
          onLongPress();
        }
      }, longPressDelay);
    }
  }, [enabled, onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStart.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.current.x);
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);
    
    // If movement is detected, cancel long press
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  }, [enabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStart.current) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If no movement was detected and we have a tap handler, trigger tap
    if (!hasMoved.current && onTap) {
      onTap();
      return;
    }

    // Handle swipe gestures
    if (touchEnd.current && hasMoved.current) {
      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if this is a horizontal or vertical swipe
      if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > swipeThreshold) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // Reset tracking
    touchStart.current = null;
    touchEnd.current = null;
    hasMoved.current = false;
  }, [enabled, onTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold]);

  const setupSwipeToClose = useCallback((element: HTMLElement) => {
    if (!enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const setupGestures = useCallback((element: HTMLElement) => {
    return setupSwipeToClose(element);
  }, [setupSwipeToClose]);

  // Utility function to detect if device supports touch
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Utility function to detect swipe velocity for more responsive gestures
  const getSwipeVelocity = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return 0;
    
    const deltaTime = touchEnd.current.timestamp - touchStart.current.timestamp;
    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    return distance / deltaTime; // pixels per millisecond
  }, []);

  return {
    setupSwipeToClose,
    setupGestures,
    isTouchDevice,
    getSwipeVelocity,
    isGestureEnabled: enabled
  };
};

// Simplified hook for common swipe patterns
export const useSwipeGestures = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  return useMobileGestures({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: 100 // Higher threshold for more intentional swipes
  });
};

// Hook specifically for drawer/modal swipe to close
export const useSwipeToClose = (onClose: () => void, enabled = true) => {
  return useMobileGestures({
    onSwipeLeft: onClose,
    enabled,
    swipeThreshold: 75 // Medium threshold for drawer closing
  });
};