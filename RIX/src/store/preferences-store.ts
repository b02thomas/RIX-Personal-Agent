import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'de' | 'en';
  cognitiveMode: 'focus' | 'ambient' | 'discovery';
  notifications: {
    push: boolean;
    email: boolean;
    voice: boolean;
    sound: boolean;
  };
  voice: {
    enabled: boolean;
    autoTranscribe: boolean;
    language: 'de' | 'en';
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  performance: {
    autoSync: boolean;
    backgroundSync: boolean;
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
  };
}

interface PreferencesState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTheme: (theme: UserPreferences['theme']) => void;
  setLanguage: (language: UserPreferences['language']) => void;
  setCognitiveMode: (mode: UserPreferences['cognitiveMode']) => void;
  toggleNotification: (type: keyof UserPreferences['notifications']) => void;
  setVoiceSettings: (settings: Partial<UserPreferences['voice']>) => void;
  setPrivacySettings: (settings: Partial<UserPreferences['privacy']>) => void;
  setPerformanceSettings: (settings: Partial<UserPreferences['performance']>) => void;
  resetPreferences: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark', // Default to dark theme per RIX design system
  language: 'de',
  cognitiveMode: 'ambient',
  notifications: {
    push: true,
    email: true,
    voice: true,
    sound: true,
  },
  voice: {
    enabled: true,
    autoTranscribe: true,
    language: 'de',
  },
  privacy: {
    dataCollection: true,
    analytics: true,
    crashReporting: false,
  },
  performance: {
    autoSync: true,
    backgroundSync: true,
    cacheStrategy: 'balanced',
  },
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      setTheme: (theme) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            theme,
          },
        }));
      },

      setLanguage: (language) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            language,
          },
        }));
      },

      setCognitiveMode: (cognitiveMode) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            cognitiveMode,
          },
        }));
      },

      toggleNotification: (type) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            notifications: {
              ...state.preferences.notifications,
              [type]: !state.preferences.notifications[type],
            },
          },
        }));
      },

      setVoiceSettings: (settings) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            voice: {
              ...state.preferences.voice,
              ...settings,
            },
          },
        }));
      },

      setPrivacySettings: (settings) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            privacy: {
              ...state.preferences.privacy,
              ...settings,
            },
          },
        }));
      },

      setPerformanceSettings: (settings) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            performance: {
              ...state.preferences.performance,
              ...settings,
            },
          },
        }));
      },

      resetPreferences: () => {
        set({
          preferences: defaultPreferences,
        });
      },

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },
    }),
    {
      name: 'rix-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
); 