// /frontend-fixes/hooks/useAuthPersistence.ts
// Authentication persistence hook for maintaining login state across tabs and page refreshes
// Handles JWT token refresh, session management, and automatic re-authentication
// RELEVANT FILES: auth-store.ts, api/auth/refresh/route.ts, FixedSidebar.tsx

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface AuthPersistenceOptions {
  refreshInterval?: number; // in milliseconds, default: 4 minutes
  storageKey?: string;
  onSessionExpired?: () => void;
  enableAutoRefresh?: boolean;
}

export const useAuthPersistence = (options: AuthPersistenceOptions = {}) => {
  const {
    refreshInterval = 4 * 60 * 1000, // 4 minutes
    storageKey = 'rix-auth-timestamp',
    onSessionExpired,
    enableAutoRefresh = true
  } = options;

  const { user, isAuthenticated, setUser, setAuthenticated, setLoading, setError, logout } = useAuthStore();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Clear any existing refresh timeout
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Verify current session
  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setAuthenticated(true);
          return true;
        }
      }

      // Session invalid, clear auth state
      logout();
      return false;
    } catch (error) {
      console.error('Session verification failed:', error);
      logout();
      return false;
    }
  }, [setUser, setAuthenticated, logout]);

  // Refresh authentication token
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
          setAuthenticated(true);
          setError(null);
          
          // Update last refresh timestamp
          localStorage.setItem(storageKey, Date.now().toString());
          return true;
        }
      }

      // Refresh failed, handle session expiry
      if (response.status === 401 || response.status === 403) {
        logout();
        onSessionExpired?.();
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      setError('Authentication refresh failed');
      return false;
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  }, [setUser, setAuthenticated, setLoading, setError, logout, onSessionExpired, storageKey]);

  // Schedule next token refresh
  const scheduleRefresh = useCallback(() => {
    if (!enableAutoRefresh || !isAuthenticated) {
      return;
    }

    clearRefreshTimeout();
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await refreshAuth();
      scheduleRefresh(); // Schedule next refresh
    }, refreshInterval);
  }, [enableAutoRefresh, isAuthenticated, refreshInterval, refreshAuth, clearRefreshTimeout]);

  // Handle storage events (for cross-tab synchronization)
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'rix-auth-storage') {
      // Auth state changed in another tab
      const newState = event.newValue ? JSON.parse(event.newValue) : null;
      
      if (newState?.state?.isAuthenticated && newState?.state?.user) {
        // User logged in in another tab
        setUser(newState.state.user);
        setAuthenticated(true);
        scheduleRefresh();
      } else if (!newState?.state?.isAuthenticated) {
        // User logged out in another tab
        logout();
        clearRefreshTimeout();
      }
    }
  }, [setUser, setAuthenticated, logout, scheduleRefresh, clearRefreshTimeout]);

  // Handle visibility change (tab focus/blur)
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible' && isAuthenticated) {
      // Tab became visible, verify session is still valid
      const lastRefresh = localStorage.getItem(storageKey);
      const now = Date.now();
      
      // If more than 2 minutes since last refresh, verify session
      if (!lastRefresh || (now - parseInt(lastRefresh, 10)) > 2 * 60 * 1000) {
        const isValid = await verifySession();
        if (isValid) {
          scheduleRefresh();
        }
      }
    }
  }, [isAuthenticated, storageKey, verifySession, scheduleRefresh]);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    if (!isAuthenticated && !isRefreshingRef.current) {
      // Try to restore session on app load
      const isValid = await verifySession();
      if (isValid) {
        scheduleRefresh();
      }
    } else if (isAuthenticated) {
      // Already authenticated, just schedule refresh
      scheduleRefresh();
    }
  }, [isAuthenticated, verifySession, scheduleRefresh]);

  // Setup event listeners and initialization
  useEffect(() => {
    // Initialize authentication
    initializeAuth();

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearRefreshTimeout();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initializeAuth, handleStorageChange, handleVisibilityChange, clearRefreshTimeout]);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    return await refreshAuth();
  }, [refreshAuth]);

  // Force logout function
  const forceLogout = useCallback(() => {
    clearRefreshTimeout();
    logout();
  }, [logout, clearRefreshTimeout]);

  return {
    // State
    user,
    isAuthenticated,
    isRefreshing: isRefreshingRef.current,
    
    // Actions
    refreshAuth: manualRefresh,
    verifySession,
    forceLogout,
    
    // Status
    lastRefreshTime: localStorage.getItem(storageKey),
  };
};

export default useAuthPersistence;