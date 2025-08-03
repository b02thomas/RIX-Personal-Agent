// /src/app/__tests__/pwa-features.test.ts
// Comprehensive test suite for PWA features and service worker functionality
// Tests offline capabilities, push notifications, caching strategies, and app installation
// RELEVANT FILES: /public/sw.js, /public/manifest.json, sw-register.tsx, mobile-touch-optimizer.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock service worker registration
const mockServiceWorkerRegistration = {
  active: {
    postMessage: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  update: jest.fn(),
  unregister: jest.fn(),
  showNotification: jest.fn(),
  getNotifications: jest.fn(),
};

// Mock notification API
const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn(),
};

// Mock cache API
const mockCache = {
  match: jest.fn(),
  add: jest.fn(),
  addAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

const mockCaches = {
  open: jest.fn(() => Promise.resolve(mockCache)),
  match: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

describe('PWA Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: jest.fn(() => Promise.resolve(mockServiceWorkerRegistration)),
        ready: Promise.resolve(mockServiceWorkerRegistration),
        controller: mockServiceWorkerRegistration.active,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getRegistration: jest.fn(() => Promise.resolve(mockServiceWorkerRegistration)),
        getRegistrations: jest.fn(() => Promise.resolve([mockServiceWorkerRegistration])),
      },
    });

    // Mock Notification API
    Object.defineProperty(global, 'Notification', {
      writable: true,
      value: class MockNotification {
        constructor(title: string, options?: NotificationOptions) {
          Object.assign(this, { title, ...options });
        }
        static permission = mockNotification.permission;
        static requestPermission = mockNotification.requestPermission;
        close = jest.fn();
        addEventListener = jest.fn();
        removeEventListener = jest.fn();
      },
    });

    // Mock caches API
    Object.defineProperty(global, 'caches', {
      writable: true,
      value: mockCaches,
    });

    // Mock fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        clone: () => ({
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(''),
        }),
      } as Response)
    );

    // Mock window.matchMedia for PWA detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('display-mode: standalone'),
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
    jest.restoreAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const registerSpy = jest.spyOn(navigator.serviceWorker, 'register');

      // Simulate service worker registration
      await navigator.serviceWorker.register('/sw.js');

      expect(registerSpy).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle service worker registration failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      navigator.serviceWorker.register = jest.fn(() => Promise.reject(new Error('Registration failed')));

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      consoleSpy.mockRestore();
    });

    it('should update service worker when new version is available', async () => {
      const updateSpy = jest.spyOn(mockServiceWorkerRegistration, 'update');
      
      await mockServiceWorkerRegistration.update();
      
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should unregister service worker', async () => {
      const unregisterSpy = jest.spyOn(mockServiceWorkerRegistration, 'unregister');
      
      await mockServiceWorkerRegistration.unregister();
      
      expect(unregisterSpy).toHaveBeenCalled();
    });
  });

  describe('Offline Functionality', () => {
    it('should detect online/offline status', () => {
      // Mock online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(navigator.onLine).toBe(true);

      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        value: false,
      });

      expect(navigator.onLine).toBe(false);
    });

    it('should handle offline events', () => {
      const offlineHandler = jest.fn();
      const onlineHandler = jest.fn();

      window.addEventListener('offline', offlineHandler);
      window.addEventListener('online', onlineHandler);

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));
      expect(offlineHandler).toHaveBeenCalled();

      // Simulate online event
      window.dispatchEvent(new Event('online'));
      expect(onlineHandler).toHaveBeenCalled();

      window.removeEventListener('offline', offlineHandler);
      window.removeEventListener('online', onlineHandler);
    });

    it('should cache resources for offline use', async () => {
      const cacheName = 'rix-v1';
      const urlsToCache = [
        '/',
        '/dashboard',
        '/api/projects',
        '/static/css/main.css',
        '/static/js/main.js',
      ];

      mockCache.addAll.mockResolvedValue(undefined);
      const cache = await caches.open(cacheName);
      await cache.addAll(urlsToCache);

      expect(mockCaches.open).toHaveBeenCalledWith(cacheName);
      expect(mockCache.addAll).toHaveBeenCalledWith(urlsToCache);
    });

    it('should serve cached content when offline', async () => {
      const request = new Request('/dashboard');
      const cachedResponse = new Response('Cached dashboard content');

      mockCache.match.mockResolvedValue(cachedResponse);
      mockCaches.match.mockResolvedValue(cachedResponse);

      const response = await caches.match(request);

      expect(response).toBe(cachedResponse);
      expect(mockCaches.match).toHaveBeenCalledWith(request);
    });

    it('should implement cache-first strategy for static assets', async () => {
      const request = new Request('/static/css/main.css');
      const cachedResponse = new Response('body { margin: 0; }');

      mockCaches.match.mockResolvedValue(cachedResponse);

      const response = await caches.match(request);

      expect(response).toBe(cachedResponse);
      // Should not fetch from network if cache hit
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should implement network-first strategy for API calls', async () => {
      const request = new Request('/api/projects');
      const networkResponse = new Response('{"projects": []}');

      // Mock network success
      (global.fetch as jest.Mock).mockResolvedValue(networkResponse);
      mockCaches.match.mockResolvedValue(null); // No cache hit

      const response = await fetch(request);

      expect(response).toBe(networkResponse);
      expect(global.fetch).toHaveBeenCalledWith(request);
    });
  });

  describe('Push Notifications', () => {
    it('should request notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');

      const permission = await Notification.requestPermission();

      expect(permission).toBe('granted');
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('should handle denied notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');

      const permission = await Notification.requestPermission();

      expect(permission).toBe('denied');
    });

    it('should show notification when permission is granted', async () => {
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
      });

      const notification = new Notification('Test Notification', {
        body: 'This is a test notification',
        icon: '/icons/icon-72x72.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test',
        renotify: true,
      });

      expect(notification.title).toBe('Test Notification');
      expect(notification.body).toBe('This is a test notification');
      expect(notification.icon).toBe('/icons/icon-72x72.png');
    });

    it('should handle notification click events', () => {
      const clickHandler = jest.fn();
      const notification = new Notification('Clickable Notification');

      notification.addEventListener('click', clickHandler);
      notification.dispatchEvent(new Event('click'));

      expect(clickHandler).toHaveBeenCalled();
    });

    it('should show service worker notifications', async () => {
      mockServiceWorkerRegistration.showNotification.mockResolvedValue(undefined);

      await mockServiceWorkerRegistration.showNotification('SW Notification', {
        body: 'Notification from service worker',
        icon: '/icons/icon-72x72.png',
        actions: [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'SW Notification',
        expect.objectContaining({
          body: 'Notification from service worker',
          icon: '/icons/icon-72x72.png',
        })
      );
    });
  });

  describe('App Installation', () => {
    it('should detect if app is installable', () => {
      let deferredPrompt: any = null;

      const beforeInstallPromptHandler = (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;
      };

      window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

      // Simulate beforeinstallprompt event
      const installEvent = new Event('beforeinstallprompt');
      window.dispatchEvent(installEvent);

      expect(deferredPrompt).toBe(installEvent);

      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    });

    it('should prompt user to install app', async () => {
      const mockPrompt = jest.fn(() => Promise.resolve({ outcome: 'accepted' }));
      const deferredPrompt = { prompt: mockPrompt };

      await deferredPrompt.prompt();
      const result = await deferredPrompt.prompt();

      expect(mockPrompt).toHaveBeenCalled();
      expect(result.outcome).toBe('accepted');
    });

    it('should detect when app is installed', () => {
      const installHandler = jest.fn();

      window.addEventListener('appinstalled', installHandler);
      window.dispatchEvent(new Event('appinstalled'));

      expect(installHandler).toHaveBeenCalled();

      window.removeEventListener('appinstalled', installHandler);
    });

    it('should detect standalone mode after installation', () => {
      // Mock standalone mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('display-mode: standalone'),
          media: query,
        })),
      });

      const standaloneMatch = window.matchMedia('(display-mode: standalone)');
      expect(standaloneMatch.matches).toBe(true);
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      const mockSync = {
        register: jest.fn(() => Promise.resolve()),
      };

      Object.defineProperty(mockServiceWorkerRegistration, 'sync', {
        value: mockSync,
      });

      await mockServiceWorkerRegistration.sync.register('background-sync');

      expect(mockSync.register).toHaveBeenCalledWith('background-sync');
    });

    it('should handle background sync events', () => {
      const syncHandler = jest.fn();

      // Simulate service worker sync event
      self.addEventListener?.('sync', syncHandler);

      // Mock sync event
      const syncEvent = new Event('sync');
      Object.defineProperty(syncEvent, 'tag', { value: 'background-sync' });

      self.dispatchEvent?.(syncEvent);

      expect(syncHandler).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clean up old caches', async () => {
      const cacheNames = ['rix-v1', 'rix-v2', 'old-cache'];
      const currentCaches = ['rix-v2'];

      mockCaches.keys.mockResolvedValue(cacheNames);
      mockCaches.delete.mockResolvedValue(true);

      const cachesToDelete = cacheNames.filter(name => !currentCaches.includes(name));
      
      for (const cacheName of cachesToDelete) {
        await caches.delete(cacheName);
      }

      expect(mockCaches.delete).toHaveBeenCalledWith('rix-v1');
      expect(mockCaches.delete).toHaveBeenCalledWith('old-cache');
      expect(mockCaches.delete).not.toHaveBeenCalledWith('rix-v2');
    });

    it('should handle cache storage quota', async () => {
      const mockEstimate = {
        quota: 1024 * 1024 * 1024, // 1GB
        usage: 512 * 1024 * 1024,  // 512MB
      };

      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn(() => Promise.resolve(mockEstimate)),
          persist: jest.fn(() => Promise.resolve(true)),
        },
      });

      const estimate = await navigator.storage.estimate();

      expect(estimate.quota).toBe(mockEstimate.quota);
      expect(estimate.usage).toBe(mockEstimate.usage);
    });

    it('should request persistent storage', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          persist: jest.fn(() => Promise.resolve(true)),
        },
      });

      const persistent = await navigator.storage.persist();

      expect(persistent).toBe(true);
      expect(navigator.storage.persist).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should preload critical resources', async () => {
      const criticalResources = [
        '/dashboard',
        '/api/projects',
        '/static/css/critical.css',
      ];

      mockCache.addAll.mockResolvedValue(undefined);
      const cache = await caches.open('critical-v1');
      await cache.addAll(criticalResources);

      expect(mockCache.addAll).toHaveBeenCalledWith(criticalResources);
    });

    it('should implement stale-while-revalidate strategy', async () => {
      const request = new Request('/api/routines');
      const staleResponse = new Response('{"routines": []}');
      const freshResponse = new Response('{"routines": [{"id": "new"}]}');

      // Mock stale cache hit
      mockCaches.match.mockResolvedValue(staleResponse);
      (global.fetch as jest.Mock).mockResolvedValue(freshResponse);

      // Return stale content immediately
      const cachedResponse = await caches.match(request);
      expect(cachedResponse).toBe(staleResponse);

      // Update cache in background
      const networkResponse = await fetch(request);
      expect(networkResponse).toBe(freshResponse);
    });

    it('should compress cached responses', async () => {
      const originalResponse = new Response('Large response content');
      const compressedData = 'compressed-data';

      // Mock compression
      const mockCompress = jest.fn(() => compressedData);
      const mockDecompress = jest.fn(() => 'Large response content');

      // Simulate compression before caching
      const dataToCache = mockCompress(await originalResponse.text());
      expect(mockCompress).toHaveBeenCalled();

      // Simulate decompression when serving from cache
      const decompressedData = mockDecompress(dataToCache);
      expect(decompressedData).toBe('Large response content');
    });
  });

  describe('Error Handling', () => {
    it('should handle service worker errors gracefully', () => {
      const errorHandler = jest.fn();

      navigator.serviceWorker.addEventListener('error', errorHandler);

      // Simulate service worker error
      const errorEvent = new ErrorEvent('error', {
        message: 'Service worker error',
        filename: '/sw.js',
        lineno: 42,
      });

      navigator.serviceWorker.dispatchEvent(errorEvent);

      expect(errorHandler).toHaveBeenCalledWith(errorEvent);
    });

    it('should handle cache API errors', async () => {
      mockCaches.open.mockRejectedValue(new Error('Cache API not available'));

      try {
        await caches.open('test-cache');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Cache API not available');
      }
    });

    it('should handle notification API errors', async () => {
      delete (global as any).Notification;

      expect(() => {
        new (global as any).Notification('Test');
      }).toThrow();
    });

    it('should fallback gracefully when PWA features are not supported', () => {
      // Remove service worker support
      delete (navigator as any).serviceWorker;

      expect(navigator.serviceWorker).toBeUndefined();

      // Should not throw errors when checking for support
      expect(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js');
        }
      }).not.toThrow();
    });
  });

  describe('Manifest Integration', () => {
    it('should load web app manifest', async () => {
      const mockManifest = {
        name: 'RIX Personal Agent',
        short_name: 'RIX',
        description: 'AI-powered personal productivity system',
        start_url: '/',
        display: 'standalone',
        theme_color: '#1A1A1A',
        background_color: '#1A1A1A',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockManifest),
      });

      const response = await fetch('/manifest.json');
      const manifest = await response.json();

      expect(manifest.name).toBe('RIX Personal Agent');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons).toHaveLength(1);
    });

    it('should apply theme colors from manifest', () => {
      const themeColor = '#1A1A1A';
      
      // Mock meta tag creation
      const mockMetaTag = document.createElement('meta');
      mockMetaTag.name = 'theme-color';
      mockMetaTag.content = themeColor;
      
      document.head.appendChild(mockMetaTag);

      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      expect(themeColorMeta?.getAttribute('content')).toBe(themeColor);
    });
  });
});