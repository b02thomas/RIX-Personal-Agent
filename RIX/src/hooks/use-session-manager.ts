// /src/hooks/use-session-manager.ts
// Session management hook for automatic token refresh and session persistence
// Handles session initialization, token refresh timers, and cross-tab synchronization
// RELEVANT FILES: auth-store.ts, jwt.ts, enhanced-dashboard-layout.tsx, middleware.ts

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getTokenExpirationTime } from '@/lib/auth';

export const useSessionManager = () => {
  const {
    isAuthenticated,
    user,
    tokenExpiresAt,
    isRefreshing,
    refreshToken,
    startTokenRefreshTimer,
    stopTokenRefreshTimer,
    logout,
    checkTokenExpiration,
    setUser,
    setAuthenticated,
    setTokenExpiration,
  } = useAuthStore();
  
  const initializedRef = useRef(false);

  // Initialize session on mount
  const initializeSession = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      // Check if we have valid cookies
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        const store = useAuthStore.getState();
        store.setUser(userData.user);
        store.setAuthenticated(true);

        // Set token expiration from response
        if (userData.tokenExpiresAt) {
          store.setTokenExpiration(userData.tokenExpiresAt);
        }

        // Try to extract token from response headers for timer setup
        const accessToken = response.headers.get('X-Access-Token');
        if (accessToken) {
          store.startTokenRefreshTimer(accessToken);
        } else if (userData.tokenExpiresAt) {
          // Create a dummy token for timer calculation if we have expiration
          const dummyToken = `header.${btoa(JSON.stringify({ exp: Math.floor(userData.tokenExpiresAt / 1000) }))}.signature`;
          store.startTokenRefreshTimer(dummyToken);
        }
      } else if (response.status === 401) {
        // Try to refresh token
        const store = useAuthStore.getState();
        const refreshSuccess = await store.refreshToken();
        if (!refreshSuccess) {
          // Clear any stale state and redirect to login
          store.setUser(null);
          store.setAuthenticated(false);
          store.setTokenExpiration(null);
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
        }
      }
    } catch (error) {
      console.error('Session initialization failed:', error);
      // On network errors, don't force logout but check if we have persistent state
      const store = useAuthStore.getState();
      if (!store.isAuthenticated || !store.user) {
        console.warn('No valid session found, user may need to login');
      }
    }
  }, []);  // No dependencies to prevent loops

  // Session recovery for browser refresh
  const recoverSession = useCallback(async () => {
    const store = useAuthStore.getState();
    // If we have persisted auth state but no token expiration, try to recover
    if (store.isAuthenticated && store.user && !store.tokenExpiresAt && !initializedRef.current) {
      await initializeSession();
    }
  }, [initializeSession]);

  // Check session validity
  const validateSession = useCallback(() => {
    const store = useAuthStore.getState();
    if (!store.isAuthenticated || !store.tokenExpiresAt) return;

    const now = Date.now();
    const timeUntilExpiry = store.tokenExpiresAt - now;

    // If token expires in less than 4 minutes and we're not already refreshing
    if (timeUntilExpiry < 4 * 60 * 1000 && !store.isRefreshing) {
      store.refreshToken();
    }
  }, []);

  // Handle tab visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      const store = useAuthStore.getState();
      if (store.isAuthenticated) {
        store.checkTokenExpiration();
        validateSession();
      }
    }
  }, [validateSession]);

  // Handle network status changes
  const handleOnline = useCallback(() => {
    const store = useAuthStore.getState();
    if (store.isAuthenticated && !store.isRefreshing) {
      // When back online, validate session
      validateSession();
    }
  }, [validateSession]);

  // Initialize session manager - run once on mount
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (isMounted) {
        await initializeSession();
        await recoverSession();
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, [initializeSession, recoverSession]); // Include required dependencies
  
  // Set up event listeners separately
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // Periodic session validation (every 30 seconds)
    const validationInterval = setInterval(validateSession, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      clearInterval(validationInterval);
    };
  }, [handleVisibilityChange, handleOnline, validateSession]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      stopTokenRefreshTimer();
    };
  }, [stopTokenRefreshTimer]);

  return {
    isAuthenticated,
    user,
    isRefreshing,
    tokenExpiresAt,
    refreshToken,
    logout,
    validateSession,
  };
};

// Hook for components that need session status
export const useSessionStatus = () => {
  const { isAuthenticated, user, isRefreshing, tokenExpiresAt } = useAuthStore();

  const isSessionExpiringSoon = tokenExpiresAt 
    ? Date.now() + (5 * 60 * 1000) >= tokenExpiresAt // 5 minutes warning
    : false;

  const sessionTimeRemaining = tokenExpiresAt 
    ? Math.max(0, tokenExpiresAt - Date.now())
    : 0;

  return {
    isAuthenticated,
    user,
    isRefreshing,
    tokenExpiresAt,
    isSessionExpiringSoon,
    sessionTimeRemaining,
  };
};

// Hook for handling authentication errors
export const useAuthErrorHandler = () => {
  const { logout } = useAuthStore();

  const handleAuthError = useCallback(async (error: any, response?: Response) => {
    // If we get a 401 error, the token is invalid
    if (response?.status === 401) {
      console.warn('Authentication failed, logging out...');
      await logout();
      
      // Redirect to signin page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  }, [logout]);

  return { handleAuthError };
};