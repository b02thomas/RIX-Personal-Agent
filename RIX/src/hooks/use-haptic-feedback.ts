// /src/hooks/use-haptic-feedback.ts
// Custom hook for haptic feedback integration in mobile PWA environments
// Provides tactile feedback for user interactions with fallback for unsupported devices
// RELEVANT FILES: mobile-navigation.tsx, use-mobile-gestures.ts, service-worker.js

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';

// Haptic feedback types supported by most mobile browsers
type HapticType = 'impact' | 'notification' | 'selection';
type HapticIntensity = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

interface HapticOptions {
  enabled?: boolean;
  fallbackToVibration?: boolean;
  respectSystemSettings?: boolean;
}

interface VibrationHapticEngine {
  impact: (intensity: HapticIntensity) => void;
  notification: (type: NotificationType) => void;
  selection: () => void;
}

export const useHapticFeedback = (enabled = true, options: HapticOptions = {}) => {
  const {
    fallbackToVibration = true,
    respectSystemSettings = true
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isVibrationSupported, setIsVibrationSupported] = useState(false);
  const lastHapticTime = useRef<number>(0);
  const hapticThrottleMs = 50; // Prevent haptic spam

  // Check for haptic and vibration support
  useEffect(() => {
    // Check for haptic feedback support (iOS Safari and some Android browsers)
    const hasHapticFeedback = !!(
      window.navigator &&
      ('vibrate' in window.navigator || 
       'hapticFeedback' in window.navigator ||
       // iOS devices
       /iPad|iPhone|iPod/.test(navigator.userAgent))
    );

    // Check for vibration API support
    const hasVibration = !!(
      window.navigator && 
      'vibrate' in window.navigator
    );

    setIsSupported(hasHapticFeedback);
    setIsVibrationSupported(hasVibration);
  }, []);

  // Create vibration fallback patterns
  const vibrationPatterns: VibrationHapticEngine = useMemo(() => ({
    impact: (intensity: HapticIntensity) => {
      switch (intensity) {
        case 'light':
          return navigator.vibrate?.(10);
        case 'medium':
          return navigator.vibrate?.(25);
        case 'heavy':
          return navigator.vibrate?.(50);
      }
    },
    notification: (type: NotificationType) => {
      switch (type) {
        case 'success':
          return navigator.vibrate?.([50, 50, 50]);
        case 'warning':
          return navigator.vibrate?.(100);
        case 'error':
          return navigator.vibrate?.([100, 50, 100]);
      }
    },
    selection: () => navigator.vibrate?.(15)
  }), []);

  // Check if we should respect system haptic settings
  const shouldTriggerHaptic = useCallback(() => {
    if (!enabled) return false;
    
    // Throttle haptic feedback to prevent spam
    const now = Date.now();
    if (now - lastHapticTime.current < hapticThrottleMs) {
      return false;
    }
    lastHapticTime.current = now;

    // Respect system settings if requested
    if (respectSystemSettings) {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return false;
    }

    return true;
  }, [enabled, respectSystemSettings]);

  // Primary haptic feedback function
  const triggerHaptic = useCallback((
    type: HapticType,
    intensity: HapticIntensity = 'medium',
    notificationType: NotificationType = 'success'
  ) => {
    if (!shouldTriggerHaptic()) return;

    try {
      // Try native haptic feedback first (iOS)
      if (isSupported && window.navigator) {
        // iOS haptic feedback
        if ('vibrate' in window.navigator) {
          switch (type) {
            case 'impact':
              // Try iOS-specific haptic feedback
              if ((window as any).DeviceMotionEvent && (window as any).DeviceMotionEvent.requestPermission) {
                // Modern iOS - use lighter vibration for impact
                vibrationPatterns.impact(intensity);
              } else {
                // Fallback to vibration
                vibrationPatterns.impact(intensity);
              }
              break;
            case 'notification':
              vibrationPatterns.notification(notificationType);
              break;
            case 'selection':
              vibrationPatterns.selection();
              break;
          }
        }
      } else if (fallbackToVibration && isVibrationSupported) {
        // Fallback to vibration API
        switch (type) {
          case 'impact':
            vibrationPatterns.impact(intensity);
            break;
          case 'notification':
            vibrationPatterns.notification(notificationType);
            break;
          case 'selection':
            vibrationPatterns.selection();
            break;
        }
      }
    } catch (error) {
      // Silently fail if haptic feedback is not available
      console.debug('Haptic feedback not available:', error);
    }
  }, [shouldTriggerHaptic, isSupported, isVibrationSupported, fallbackToVibration, vibrationPatterns]);

  // Specific haptic patterns for common UI interactions
  const patterns = {
    // Button press feedback
    buttonPress: () => triggerHaptic('impact', 'light'),
    
    // Navigation feedback
    navigationTap: () => triggerHaptic('selection'),
    
    // Success feedback
    success: () => triggerHaptic('notification', 'medium', 'success'),
    
    // Error feedback
    error: () => triggerHaptic('notification', 'heavy', 'error'),
    
    // Warning feedback
    warning: () => triggerHaptic('notification', 'medium', 'warning'),
    
    // Drawer/modal open/close
    drawerToggle: () => triggerHaptic('impact', 'medium'),
    
    // Long press feedback
    longPress: () => triggerHaptic('impact', 'heavy'),
    
    // Scroll boundary reached
    scrollBoundary: () => triggerHaptic('impact', 'light'),
    
    // Toggle switch
    toggle: () => triggerHaptic('selection'),
    
    // Swipe gesture
    swipe: () => triggerHaptic('impact', 'light')
  };

  // Utility to enable/disable haptics based on user preference
  const setHapticEnabled = useCallback((enable: boolean) => {
    // This could be connected to a user preference store
    // For now, we'll just store in localStorage
    try {
      localStorage.setItem('rix-haptics-enabled', enable.toString());
    } catch (error) {
      console.debug('Could not save haptic preference:', error);
    }
  }, []);

  // Check stored user preference
  const getHapticEnabled = useCallback(() => {
    try {
      const stored = localStorage.getItem('rix-haptics-enabled');
      return stored !== null ? stored === 'true' : enabled;
    } catch (error) {
      return enabled;
    }
  }, [enabled]);

  return {
    triggerHaptic,
    patterns,
    isSupported: isSupported || isVibrationSupported,
    isHapticSupported: isSupported,
    isVibrationSupported,
    setHapticEnabled,
    getHapticEnabled,
    shouldTriggerHaptic
  };
};

// Simplified hook for basic haptic feedback
export const useSimpleHaptics = () => {
  const { patterns } = useHapticFeedback();
  
  return {
    tap: patterns.buttonPress,
    success: patterns.success,
    error: patterns.error,
    navigation: patterns.navigationTap
  };
};

// Hook for specific component haptic needs
export const useComponentHaptics = (componentType: 'button' | 'navigation' | 'toggle' | 'drawer') => {
  const { patterns, triggerHaptic } = useHapticFeedback();
  
  const getComponentPattern = useCallback(() => {
    switch (componentType) {
      case 'button':
        return patterns.buttonPress;
      case 'navigation':
        return patterns.navigationTap;
      case 'toggle':
        return patterns.toggle;
      case 'drawer':
        return patterns.drawerToggle;
      default:
        return patterns.buttonPress;
    }
  }, [componentType, patterns]);
  
  return {
    trigger: getComponentPattern(),
    triggerCustom: triggerHaptic,
    patterns
  };
};