// /src/components/mobile/mobile-touch-optimizer.tsx
// Mobile touch optimization component for enhancing PWA mobile experience
// Handles viewport meta tags, touch interactions, and performance optimizations
// RELEVANT FILES: mobile-navigation.tsx, use-haptic-feedback.ts, service-worker.js

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface MobileTouchOptimizerProps {
  children: React.ReactNode;
  enablePullToRefresh?: boolean;
  enableSwipeNavigation?: boolean;
  optimizeScrolling?: boolean;
}

export const MobileTouchOptimizer: React.FC<MobileTouchOptimizerProps> = ({
  children,
  enablePullToRefresh = false,
  enableSwipeNavigation = true,
  optimizeScrolling = true
}) => {
  const pathname = usePathname();
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>();

  useEffect(() => {
    // Detect PWA standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone ||
                     document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Set initial viewport height for dynamic viewport units
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // Optimize touch interactions
  useEffect(() => {
    const optimizeTouchBehavior = () => {
      // Prevent default touch behaviors that interfere with PWA
      if (!enablePullToRefresh) {
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';
      }

      // Optimize scrolling performance
      if (optimizeScrolling) {
        (document.body.style as any).webkitOverflowScrolling = 'touch';
        document.body.style.touchAction = enableSwipeNavigation ? 'pan-x pan-y' : 'pan-y';
      }

      // Prevent zoom on double tap for iOS
      if (isIOS) {
        document.addEventListener('touchstart', (e) => {
          if (e.touches.length > 1) {
            e.preventDefault();
          }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
          const now = Date.now();
          if (now - lastTouchEnd <= 300) {
            e.preventDefault();
          }
          lastTouchEnd = now;
        }, { passive: false });
      }
    };

    optimizeTouchBehavior();
  }, [enablePullToRefresh, enableSwipeNavigation, optimizeScrolling, isIOS]);

  // Handle page transitions for smooth mobile experience
  useEffect(() => {
    const handlePageTransition = () => {
      // Scroll to top on page change for mobile
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    handlePageTransition();
  }, [pathname]);

  // Add mobile-specific CSS classes
  useEffect(() => {
    const classes: string[] = [];
    
    if (isStandalone) classes.push('rix-pwa-standalone');
    if (isIOS) classes.push('rix-ios');
    if (window.innerWidth <= 768) classes.push('rix-mobile');

    classes.forEach(className => {
      document.documentElement.classList.add(className);
    });

    return () => {
      classes.forEach(className => {
        document.documentElement.classList.remove(className);
      });
    };
  }, [isStandalone, isIOS]);

  return (
    <>
      {/* Dynamic viewport meta tag for mobile */}
      {typeof window !== 'undefined' && (
        <style jsx global>{`
          :root {
            --vh: ${viewportHeight ? `${viewportHeight * 0.01}px` : '1vh'};
          }
          
          /* Mobile-specific optimizations */
          .rix-mobile {
            /* Prevent text size adjustment on orientation change */
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }
          
          .rix-pwa-standalone {
            /* Hide address bar simulation */
            padding-top: env(safe-area-inset-top);
          }
          
          .rix-ios {
            /* iOS-specific touch optimizations */
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
          
          /* Optimize for mobile viewport units */
          .mobile-vh {
            height: calc(var(--vh, 1vh) * 100);
          }
          
          /* Enhanced touch targets */
          .rix-mobile .rix-interactive {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Optimize scrolling */
          .rix-mobile .rix-scroll-container {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }
        `}</style>
      )}
      
      {children}
    </>
  );
};

// Hook for mobile-specific behaviors
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone;
      setIsStandalone(standalone);
    };

    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkMobile();
    checkStandalone();
    checkOrientation();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return {
    isMobile,
    isStandalone,
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
};

// Component for safe area handling
export const SafeAreaWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div 
      className={`
        safe-area-wrapper
        pl-[env(safe-area-inset-left)]
        pr-[env(safe-area-inset-right)]
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};