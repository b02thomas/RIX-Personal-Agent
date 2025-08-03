// /src/store/__tests__/preferences-store.test.ts
// Comprehensive test suite for preferences state management
// Tests theme management, user preferences, persistence, and state updates
// RELEVANT FILES: preferences-store.ts, theme-toggle.tsx, settings page components

import { renderHook, act } from '@testing-library/react';
import { usePreferencesStore } from '../preferences-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (fn: any, config: any) => {
    // Return the function directly but store the config for testing
    const store = fn;
    store._persistConfig = config;
    return store;
  },
}));

describe('usePreferencesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => usePreferencesStore());
    act(() => {
      result.current.resetPreferences();
    });
  });

  describe('Initial State', () => {
    it('has correct default preferences', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const { preferences } = result.current;
      
      expect(preferences.theme).toBe('dark');
      expect(preferences.language).toBe('de');
      expect(preferences.cognitiveMode).toBe('ambient');
      
      expect(preferences.notifications.push).toBe(true);
      expect(preferences.notifications.email).toBe(true);
      expect(preferences.notifications.voice).toBe(true);
      expect(preferences.notifications.sound).toBe(true);
      
      expect(preferences.voice.enabled).toBe(true);
      expect(preferences.voice.autoTranscribe).toBe(true);
      expect(preferences.voice.language).toBe('de');
      
      expect(preferences.privacy.dataCollection).toBe(true);
      expect(preferences.privacy.analytics).toBe(true);
      expect(preferences.privacy.crashReporting).toBe(false);
      
      expect(preferences.performance.autoSync).toBe(true);
      expect(preferences.performance.backgroundSync).toBe(true);
      expect(preferences.performance.cacheStrategy).toBe('balanced');
    });

    it('has correct initial loading and error state', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Theme Management', () => {
    it('sets theme to light', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(result.current.preferences.theme).toBe('light');
    });

    it('sets theme to dark', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.preferences.theme).toBe('dark');
    });

    it('sets theme to system', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setTheme('system');
      });
      
      expect(result.current.preferences.theme).toBe('system');
    });

    it('preserves other preferences when setting theme', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalPreferences = { ...result.current.preferences };
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(result.current.preferences.language).toBe(originalPreferences.language);
      expect(result.current.preferences.cognitiveMode).toBe(originalPreferences.cognitiveMode);
      expect(result.current.preferences.notifications).toEqual(originalPreferences.notifications);
    });
  });

  describe('Language Management', () => {
    it('sets language to English', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setLanguage('en');
      });
      
      expect(result.current.preferences.language).toBe('en');
    });

    it('sets language to German', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setLanguage('de');
      });
      
      expect(result.current.preferences.language).toBe('de');
    });

    it('preserves other preferences when setting language', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalTheme = result.current.preferences.theme;
      
      act(() => {
        result.current.setLanguage('en');
      });
      
      expect(result.current.preferences.theme).toBe(originalTheme);
    });
  });

  describe('Cognitive Mode Management', () => {
    it('sets cognitive mode to focus', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setCognitiveMode('focus');
      });
      
      expect(result.current.preferences.cognitiveMode).toBe('focus');
    });

    it('sets cognitive mode to ambient', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setCognitiveMode('ambient');
      });
      
      expect(result.current.preferences.cognitiveMode).toBe('ambient');
    });

    it('sets cognitive mode to discovery', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setCognitiveMode('discovery');
      });
      
      expect(result.current.preferences.cognitiveMode).toBe('discovery');
    });
  });

  describe('Notification Settings', () => {
    it('toggles push notifications', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const initialPushState = result.current.preferences.notifications.push;
      
      act(() => {
        result.current.toggleNotification('push');
      });
      
      expect(result.current.preferences.notifications.push).toBe(!initialPushState);
    });

    it('toggles email notifications', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const initialEmailState = result.current.preferences.notifications.email;
      
      act(() => {
        result.current.toggleNotification('email');
      });
      
      expect(result.current.preferences.notifications.email).toBe(!initialEmailState);
    });

    it('toggles voice notifications', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const initialVoiceState = result.current.preferences.notifications.voice;
      
      act(() => {
        result.current.toggleNotification('voice');
      });
      
      expect(result.current.preferences.notifications.voice).toBe(!initialVoiceState);
    });

    it('toggles sound notifications', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const initialSoundState = result.current.preferences.notifications.sound;
      
      act(() => {
        result.current.toggleNotification('sound');
      });
      
      expect(result.current.preferences.notifications.sound).toBe(!initialSoundState);
    });

    it('preserves other notification settings when toggling one', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalNotifications = { ...result.current.preferences.notifications };
      
      act(() => {
        result.current.toggleNotification('push');
      });
      
      expect(result.current.preferences.notifications.email).toBe(originalNotifications.email);
      expect(result.current.preferences.notifications.voice).toBe(originalNotifications.voice);
      expect(result.current.preferences.notifications.sound).toBe(originalNotifications.sound);
    });
  });

  describe('Voice Settings', () => {
    it('updates voice enabled setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setVoiceSettings({ enabled: false });
      });
      
      expect(result.current.preferences.voice.enabled).toBe(false);
    });

    it('updates auto transcribe setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setVoiceSettings({ autoTranscribe: false });
      });
      
      expect(result.current.preferences.voice.autoTranscribe).toBe(false);
    });

    it('updates voice language setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setVoiceSettings({ language: 'en' });
      });
      
      expect(result.current.preferences.voice.language).toBe('en');
    });

    it('updates multiple voice settings at once', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setVoiceSettings({
          enabled: false,
          autoTranscribe: false,
          language: 'en'
        });
      });
      
      expect(result.current.preferences.voice.enabled).toBe(false);
      expect(result.current.preferences.voice.autoTranscribe).toBe(false);
      expect(result.current.preferences.voice.language).toBe('en');
    });

    it('preserves unchanged voice settings', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalEnabled = result.current.preferences.voice.enabled;
      
      act(() => {
        result.current.setVoiceSettings({ language: 'en' });
      });
      
      expect(result.current.preferences.voice.enabled).toBe(originalEnabled);
    });
  });

  describe('Privacy Settings', () => {
    it('updates data collection setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPrivacySettings({ dataCollection: false });
      });
      
      expect(result.current.preferences.privacy.dataCollection).toBe(false);
    });

    it('updates analytics setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPrivacySettings({ analytics: false });
      });
      
      expect(result.current.preferences.privacy.analytics).toBe(false);
    });

    it('updates crash reporting setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPrivacySettings({ crashReporting: true });
      });
      
      expect(result.current.preferences.privacy.crashReporting).toBe(true);
    });

    it('updates multiple privacy settings at once', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPrivacySettings({
          dataCollection: false,
          analytics: false,
          crashReporting: true
        });
      });
      
      expect(result.current.preferences.privacy.dataCollection).toBe(false);
      expect(result.current.preferences.privacy.analytics).toBe(false);
      expect(result.current.preferences.privacy.crashReporting).toBe(true);
    });

    it('preserves unchanged privacy settings', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalAnalytics = result.current.preferences.privacy.analytics;
      
      act(() => {
        result.current.setPrivacySettings({ dataCollection: false });
      });
      
      expect(result.current.preferences.privacy.analytics).toBe(originalAnalytics);
    });
  });

  describe('Performance Settings', () => {
    it('updates auto sync setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPerformanceSettings({ autoSync: false });
      });
      
      expect(result.current.preferences.performance.autoSync).toBe(false);
    });

    it('updates background sync setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPerformanceSettings({ backgroundSync: false });
      });
      
      expect(result.current.preferences.performance.backgroundSync).toBe(false);
    });

    it('updates cache strategy setting', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPerformanceSettings({ cacheStrategy: 'aggressive' });
      });
      
      expect(result.current.preferences.performance.cacheStrategy).toBe('aggressive');
    });

    it('updates multiple performance settings at once', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setPerformanceSettings({
          autoSync: false,
          backgroundSync: false,
          cacheStrategy: 'minimal'
        });
      });
      
      expect(result.current.preferences.performance.autoSync).toBe(false);
      expect(result.current.preferences.performance.backgroundSync).toBe(false);
      expect(result.current.preferences.performance.cacheStrategy).toBe('minimal');
    });

    it('preserves unchanged performance settings', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalAutoSync = result.current.preferences.performance.autoSync;
      
      act(() => {
        result.current.setPerformanceSettings({ cacheStrategy: 'aggressive' });
      });
      
      expect(result.current.preferences.performance.autoSync).toBe(originalAutoSync);
    });
  });

  describe('Bulk Preference Updates', () => {
    it('updates multiple preference categories at once', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.updatePreferences({
          theme: 'light',
          language: 'en',
          cognitiveMode: 'focus',
          notifications: {
            push: false,
            email: false,
            voice: true,
            sound: true
          }
        });
      });
      
      expect(result.current.preferences.theme).toBe('light');
      expect(result.current.preferences.language).toBe('en');
      expect(result.current.preferences.cognitiveMode).toBe('focus');
      expect(result.current.preferences.notifications.push).toBe(false);
      expect(result.current.preferences.notifications.email).toBe(false);
    });

    it('preserves unspecified preferences during bulk update', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalVoice = { ...result.current.preferences.voice };
      const originalPrivacy = { ...result.current.preferences.privacy };
      
      act(() => {
        result.current.updatePreferences({
          theme: 'light',
          performance: {
            autoSync: false,
            backgroundSync: true,
            cacheStrategy: 'aggressive'
          }
        });
      });
      
      expect(result.current.preferences.voice).toEqual(originalVoice);
      expect(result.current.preferences.privacy).toEqual(originalPrivacy);
      expect(result.current.preferences.performance.autoSync).toBe(false);
    });

    it('performs deep merge for nested objects', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalNotificationEmail = result.current.preferences.notifications.email;
      
      act(() => {
        result.current.updatePreferences({
          notifications: {
            push: false,
            voice: false
          }
        });
      });
      
      // Should preserve email setting while updating push and voice
      expect(result.current.preferences.notifications.email).toBe(originalNotificationEmail);
      expect(result.current.preferences.notifications.push).toBe(false);
      expect(result.current.preferences.notifications.voice).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('resets all preferences to defaults', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      // Change some preferences
      act(() => {
        result.current.setTheme('light');
        result.current.setLanguage('en');
        result.current.setCognitiveMode('focus');
        result.current.toggleNotification('push');
      });
      
      // Verify changes
      expect(result.current.preferences.theme).toBe('light');
      expect(result.current.preferences.language).toBe('en');
      expect(result.current.preferences.cognitiveMode).toBe('focus');
      expect(result.current.preferences.notifications.push).toBe(false);
      
      // Reset
      act(() => {
        result.current.resetPreferences();
      });
      
      // Verify reset to defaults
      expect(result.current.preferences.theme).toBe('dark');
      expect(result.current.preferences.language).toBe('de');
      expect(result.current.preferences.cognitiveMode).toBe('ambient');
      expect(result.current.preferences.notifications.push).toBe(true);
    });

    it('resets all nested objects to defaults', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      // Change nested preferences
      act(() => {
        result.current.setVoiceSettings({ enabled: false, language: 'en' });
        result.current.setPrivacySettings({ dataCollection: false, analytics: false });
        result.current.setPerformanceSettings({ cacheStrategy: 'minimal' });
      });
      
      // Reset
      act(() => {
        result.current.resetPreferences();
      });
      
      // Verify nested objects are reset
      expect(result.current.preferences.voice.enabled).toBe(true);
      expect(result.current.preferences.voice.language).toBe('de');
      expect(result.current.preferences.privacy.dataCollection).toBe(true);
      expect(result.current.preferences.privacy.analytics).toBe(true);
      expect(result.current.preferences.performance.cacheStrategy).toBe('balanced');
    });
  });

  describe('State Consistency', () => {
    it('maintains preference object immutability', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalPreferences = result.current.preferences;
      
      act(() => {
        result.current.setTheme('light');
      });
      
      // Should be a new object reference
      expect(result.current.preferences).not.toBe(originalPreferences);
    });

    it('maintains nested object immutability', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalNotifications = result.current.preferences.notifications;
      
      act(() => {
        result.current.toggleNotification('push');
      });
      
      // Should be a new notifications object
      expect(result.current.preferences.notifications).not.toBe(originalNotifications);
    });

    it('does not mutate original state objects', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalVoice = { ...result.current.preferences.voice };
      
      act(() => {
        result.current.setVoiceSettings({ enabled: false });
      });
      
      // Original object should be unchanged
      expect(originalVoice.enabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty objects in partial updates', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      const originalPreferences = { ...result.current.preferences };
      
      act(() => {
        result.current.setVoiceSettings({});
        result.current.setPrivacySettings({});
        result.current.setPerformanceSettings({});
      });
      
      // Preferences should remain unchanged
      expect(result.current.preferences).toEqual(originalPreferences);
    });

    it('handles undefined values gracefully', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.updatePreferences({
          theme: undefined as any,
          language: 'en'
        });
      });
      
      // Should update language but keep original theme
      expect(result.current.preferences.language).toBe('en');
      expect(result.current.preferences.theme).toBe('dark'); // Original default
    });

    it('handles invalid enum values gracefully', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      // This would typically be caught by TypeScript, but testing runtime behavior
      act(() => {
        result.current.updatePreferences({
          theme: 'invalid-theme' as any,
          cognitiveMode: 'invalid-mode' as any
        });
      });
      
      // Store should accept the values (validation would be external)
      expect(result.current.preferences.theme).toBe('invalid-theme');
      expect(result.current.preferences.cognitiveMode).toBe('invalid-mode');
    });
  });

  describe('Complex State Transitions', () => {
    it('handles rapid sequential updates correctly', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.setTheme('light');
        result.current.setTheme('dark');
        result.current.setTheme('system');
        result.current.setLanguage('en');
        result.current.setLanguage('de');
      });
      
      expect(result.current.preferences.theme).toBe('system');
      expect(result.current.preferences.language).toBe('de');
    });

    it('maintains consistency during complex nested updates', () => {
      const { result } = renderHook(() => usePreferencesStore());
      
      act(() => {
        result.current.updatePreferences({
          notifications: {
            push: false,
            email: false,
            voice: false,
            sound: false
          },
          voice: {
            enabled: false,
            autoTranscribe: false,
            language: 'en'
          }
        });
      });
      
      // All notification types should be false
      Object.values(result.current.preferences.notifications).forEach(value => {
        expect(value).toBe(false);
      });
      
      // Voice settings should be updated
      expect(result.current.preferences.voice.enabled).toBe(false);
      expect(result.current.preferences.voice.language).toBe('en');
    });
  });
});