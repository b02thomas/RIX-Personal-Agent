import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTokenExpiringSoon, getTokenExpirationTime } from '@/lib/auth';

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    tokenExpiresAt: number | null;
    isRefreshing: boolean;
    refreshTimer: NodeJS.Timeout | null;

    // Actions
    setUser: (user: User | null) => void;
    setAuthenticated: (authenticated: boolean) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setTokenExpiration: (expiresAt: number | null) => void;
    setRefreshing: (refreshing: boolean) => void;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
    startTokenRefreshTimer: (accessToken: string) => void;
    stopTokenRefreshTimer: () => void;
    checkTokenExpiration: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tokenExpiresAt: null,
            isRefreshing: false,
            refreshTimer: null,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            setTokenExpiration: (expiresAt) => set({ tokenExpiresAt: expiresAt }),
            setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
            
            logout: async () => {
                const state = get();
                
                // Clear refresh timer
                if (state.refreshTimer) {
                    clearTimeout(state.refreshTimer);
                }
                
                // Call logout API
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include',
                    });
                } catch (error) {
                    console.warn('Logout API call failed:', error);
                }
                
                // Clear state
                set({ 
                    user: null, 
                    isAuthenticated: false, 
                    error: null,
                    tokenExpiresAt: null,
                    isRefreshing: false,
                    refreshTimer: null,
                });
                
                // Broadcast logout event for cross-tab synchronization
                if (typeof window !== 'undefined') {
                    // Use a more reliable method for cross-tab logout notification
                    const logoutEvent = new CustomEvent('auth-logout', {
                        detail: { timestamp: Date.now() }
                    });
                    window.dispatchEvent(logoutEvent);
                    
                    // Also use localStorage as fallback
                    window.localStorage.setItem('auth-logout-event', Date.now().toString());
                    window.localStorage.removeItem('auth-logout-event');
                }
            },
            
            refreshToken: async () => {
                const state = get();
                if (state.isRefreshing) {
                    return false; // Already refreshing
                }
                
                set({ isRefreshing: true, error: null });
                
                try {
                    const response = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                    });
                    
                    if (!response.ok) {
                        throw new Error('Token refresh failed');
                    }
                    
                    const data = await response.json();
                    
                    // Extract token expiration from the new access token
                    const expiresAt = getTokenExpirationTime(data.accessToken);
                    
                    set({ 
                        isRefreshing: false,
                        tokenExpiresAt: expiresAt,
                        error: null 
                    });
                    
                    // Start new refresh timer
                    if (data.accessToken) {
                        get().startTokenRefreshTimer(data.accessToken);
                    }
                    
                    return true;
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    set({ isRefreshing: false, error: 'Session expired' });
                    
                    // Auto logout on refresh failure
                    await get().logout();
                    return false;
                }
            },
            
            startTokenRefreshTimer: (accessToken: string) => {
                const state = get();
                
                // Clear existing timer
                if (state.refreshTimer) {
                    clearTimeout(state.refreshTimer);
                }
                
                const expirationTime = getTokenExpirationTime(accessToken);
                if (!expirationTime) return;
                
                // Calculate when to refresh (4 minutes before expiration for reliability)
                const refreshTime = expirationTime - Date.now() - (4 * 60 * 1000);
                
                if (refreshTime > 0) {
                    const timer = setTimeout(() => {
                        get().refreshToken();
                    }, refreshTime);
                    
                    set({ refreshTimer: timer, tokenExpiresAt: expirationTime });
                } else {
                    // Token is already expired or expires very soon, refresh immediately
                    get().refreshToken();
                }
            },
            
            stopTokenRefreshTimer: () => {
                const state = get();
                if (state.refreshTimer) {
                    clearTimeout(state.refreshTimer);
                    set({ refreshTimer: null });
                }
            },
            
            checkTokenExpiration: () => {
                const state = get();
                if (state.tokenExpiresAt) {
                    const now = Date.now();
                    const timeUntilExpiry = state.tokenExpiresAt - now;
                    
                    // Refresh if token expires within 4 minutes or is already expired
                    if (timeUntilExpiry <= (4 * 60 * 1000)) {
                        get().refreshToken();
                    }
                }
            },
        }),
        {
            name: 'rix-auth-storage',
            partialize: (state) => ({ 
                user: state.user, 
                isAuthenticated: state.isAuthenticated,
                tokenExpiresAt: state.tokenExpiresAt
            }),
            
            // Custom storage to handle cross-tab synchronization
            storage: {
                getItem: (name) => {
                    const item = localStorage.getItem(name);
                    return item ? JSON.parse(item) : null;
                },
                setItem: (name, value) => {
                    localStorage.setItem(name, JSON.stringify(value));
                    // Broadcast storage event for cross-tab sync
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: name,
                        newValue: JSON.stringify(value),
                    }));
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: name,
                        newValue: null,
                    }));
                },
            },
        }
    )
);

// Enhanced cross-tab session synchronization and session recovery
if (typeof window !== 'undefined') {
    let isInitialized = false;
    
    // Initialize session recovery on page load
    const initializeSession = async () => {
        if (isInitialized) return;
        isInitialized = true;
        
        const store = useAuthStore.getState();
        
        // If we have persisted auth but no token expiration, try to recover
        if (store.isAuthenticated && store.user && !store.tokenExpiresAt) {
            try {
                const response = await fetch('/api/auth/me', {
                    credentials: 'include',
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.tokenExpiresAt) {
                        store.setTokenExpiration(data.tokenExpiresAt);
                        
                        // If token needs refresh, get new token from headers
                        const newToken = response.headers.get('X-Access-Token');
                        if (newToken) {
                            store.startTokenRefreshTimer(newToken);
                        }
                    }
                } else if (response.status === 401) {
                    // Try refresh token
                    const refreshSuccess = await store.refreshToken();
                    if (!refreshSuccess) {
                        console.warn('Session recovery failed, requiring re-login');
                    }
                }
            } catch (error) {
                console.warn('Session recovery failed:', error);
            }
        }
    };
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
        const store = useAuthStore.getState();
        
        if (e.key === 'auth-logout-event') {
            // Another tab logged out
            store.logout();
        } else if (e.key === 'rix-auth-storage' && e.newValue) {
            // Another tab updated auth state
            try {
                const newState = JSON.parse(e.newValue);
                if (newState.state && newState.state.user && newState.state.isAuthenticated) {
                    // Sync user state from other tab
                    if (!store.isAuthenticated || store.user?.id !== newState.state.user.id) {
                        store.setUser(newState.state.user);
                        store.setAuthenticated(true);
                        if (newState.state.tokenExpiresAt) {
                            store.setTokenExpiration(newState.state.tokenExpiresAt);
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to parse auth state from other tab:', error);
            }
        }
    });
    
    // Check token expiration when tab becomes visible
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const store = useAuthStore.getState();
            if (store.isAuthenticated) {
                store.checkTokenExpiration();
            }
        }
    });
    
    // Check token expiration when window gains focus
    window.addEventListener('focus', () => {
        const store = useAuthStore.getState();
        if (store.isAuthenticated) {
            store.checkTokenExpiration();
        }
    });
    
    // Periodic token expiration check
    setInterval(() => {
        const store = useAuthStore.getState();
        if (store.isAuthenticated && !store.isRefreshing) {
            store.checkTokenExpiration();
        }
    }, 30000); // Check every 30 seconds
    
    // Initialize session recovery after a short delay
    setTimeout(initializeSession, 100);
} 