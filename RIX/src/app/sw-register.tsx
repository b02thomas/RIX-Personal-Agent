'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New version available
                    if (confirm('Eine neue Version von RIX ist verfügbar. Jetzt aktualisieren?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Online/Offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial online state
    setIsOnline(navigator.onLine);

    // PWA Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setShowInstallPrompt(true);
      
      // Store the event for later use
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA install outcome:', outcome);
      setShowInstallPrompt(false);
      (window as any).deferredPrompt = null;
    }
  };

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white text-center py-2 text-sm">
          <span>📱 Sie sind offline. Einige Funktionen sind möglicherweise nicht verfügbar.</span>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-[9998] bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">RIX App installieren</h3>
            <p className="text-sm opacity-90">
              Installieren Sie RIX für eine bessere mobile Erfahrung mit Offline-Zugriff.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleInstallApp}
                className="flex-1 bg-white text-primary px-3 py-2 rounded text-sm font-medium"
              >
                Installieren
              </button>
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="px-3 py-2 text-sm opacity-70 hover:opacity-100"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 