// /src/utils/mobile-performance-tester.ts
// Mobile performance testing utilities for RIX PWA
// Provides Core Web Vitals monitoring and mobile-specific performance metrics
// RELEVANT FILES: mobile-touch-optimizer.tsx, service-worker.js, use-haptic-feedback.ts

import React from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Mobile-specific metrics
  touchLatency?: number;
  scrollPerformance?: number;
  batteryLevel?: number;
  networkType?: string;
  
  // PWA metrics
  swActivated?: boolean;
  swControlling?: boolean;
  cacheHitRatio?: number;
  
  // Navigation metrics
  navigationTiming?: PerformanceNavigationTiming;
  
  timestamp: number;
}

class MobilePerformanceTester {
  private metrics: PerformanceMetrics[] = [];
  private observer?: PerformanceObserver;
  private touchStartTime?: number;
  private isMonitoring = false;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Initialize Core Web Vitals monitoring
    this.initCoreWebVitals();
    
    // Initialize mobile-specific monitoring
    this.initMobileMetrics();
    
    // Initialize PWA-specific monitoring
    this.initPWAMetrics();
  }

  private initCoreWebVitals() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.updateMetric('lcp', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.debug('LCP observer not supported');
      }

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.updateMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.debug('FID observer not supported');
      }

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.updateMetric('cls', clsValue);
          }
        });
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.debug('CLS observer not supported');
      }
    }

    // FCP - First Contentful Paint
    if ('PerformancePaintTiming' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('fcp', entry.startTime);
          }
        });
      });
      
      try {
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.debug('Paint observer not supported');
      }
    }
  }

  private initMobileMetrics() {
    // Touch latency measurement
    const measureTouchLatency = () => {
      document.addEventListener('touchstart', () => {
        this.touchStartTime = performance.now();
      }, { passive: true });

      document.addEventListener('touchend', () => {
        if (this.touchStartTime) {
          const latency = performance.now() - this.touchStartTime;
          this.updateMetric('touchLatency', latency);
          this.touchStartTime = undefined;
        }
      }, { passive: true });
    };

    // Scroll performance measurement
    const measureScrollPerformance = () => {
      let scrollStart: number;
      let frameCount = 0;
      
      const onScroll = () => {
        if (!scrollStart) {
          scrollStart = performance.now();
          frameCount = 0;
        }
        
        requestAnimationFrame(() => {
          frameCount++;
          const elapsed = performance.now() - scrollStart;
          
          if (elapsed >= 1000) { // Measure for 1 second
            const fps = (frameCount * 1000) / elapsed;
            this.updateMetric('scrollPerformance', fps);
            scrollStart = 0;
          }
        });
      };

      document.addEventListener('scroll', onScroll, { passive: true });
    };

    // Battery level monitoring (if available)
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          this.updateMetric('batteryLevel', battery.level * 100);
          
          battery.addEventListener('levelchange', () => {
            this.updateMetric('batteryLevel', battery.level * 100);
          });
        } catch (e) {
          console.debug('Battery API not available');
        }
      }
    };

    // Network type detection
    const monitorNetwork = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.updateMetric('networkType', connection.effectiveType || 'unknown');
        
        connection.addEventListener('change', () => {
          this.updateMetric('networkType', connection.effectiveType || 'unknown');
        });
      }
    };

    measureTouchLatency();
    measureScrollPerformance();
    monitorBattery();
    monitorNetwork();
  }

  private initPWAMetrics() {
    // Service Worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        this.updateMetric('swActivated', true);
        
        if (navigator.serviceWorker.controller) {
          this.updateMetric('swControlling', true);
        }
      });
    }

    // Cache hit ratio (simplified measurement)
    const originalFetch = window.fetch;
    let totalRequests = 0;
    let cacheHits = 0;

    window.fetch = async (...args) => {
      totalRequests++;
      const response = await originalFetch(...args);
      
      // Check if response came from cache
      if (response.headers.get('x-cache') === 'HIT' || 
          (response as any).fromCache === true) {
        cacheHits++;
      }
      
      if (totalRequests > 0) {
        this.updateMetric('cacheHitRatio', (cacheHits / totalRequests) * 100);
      }
      
      return response;
    };
  }

  private updateMetric(key: keyof PerformanceMetrics, value: any) {
    const now = performance.now();
    const currentMetrics = this.getCurrentMetrics();
    
    (currentMetrics as any)[key] = value;
    currentMetrics.timestamp = now;
    
    // Keep only last 100 measurements
    if (this.metrics.length >= 100) {
      this.metrics.shift();
    }
    
    this.metrics.push({ ...currentMetrics });
  }

  private getCurrentMetrics(): PerformanceMetrics {
    return this.metrics.length > 0 
      ? { ...this.metrics[this.metrics.length - 1] }
      : { timestamp: performance.now() };
  }

  // Public API
  public startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🚀 RIX Mobile Performance Monitoring Started');
    
    // Report initial navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      const navigationStart = timing.navigationStart;
      
      this.updateMetric('ttfb', timing.responseStart - navigationStart);
      this.updateMetric('navigationTiming', performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming);
    }
  }

  public stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.observer) {
      this.observer.disconnect();
    }
    
    console.log('⏹️ RIX Mobile Performance Monitoring Stopped');
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getCoreWebVitalsScore(): { lcp: string; fid: string; cls: string; score: number } {
    const latest = this.getLatestMetrics();
    if (!latest) {
      return { lcp: 'unknown', fid: 'unknown', cls: 'unknown', score: 0 };
    }

    // Score based on Google's thresholds
    const lcpScore = !latest.lcp ? 'unknown' : 
                    latest.lcp <= 2500 ? 'good' :
                    latest.lcp <= 4000 ? 'needs-improvement' : 'poor';
    
    const fidScore = !latest.fid ? 'unknown' :
                    latest.fid <= 100 ? 'good' :
                    latest.fid <= 300 ? 'needs-improvement' : 'poor';
    
    const clsScore = !latest.cls ? 'unknown' :
                    latest.cls <= 0.1 ? 'good' :
                    latest.cls <= 0.25 ? 'needs-improvement' : 'poor';

    // Calculate overall score
    const scores = [lcpScore, fidScore, clsScore];
    const goodCount = scores.filter(s => s === 'good').length;
    const score = (goodCount / 3) * 100;

    return { lcp: lcpScore, fid: fidScore, cls: clsScore, score };
  }

  public reportPerformance(): string {
    const latest = this.getLatestMetrics();
    const coreVitals = this.getCoreWebVitalsScore();
    
    if (!latest) {
      return 'No performance data available';
    }

    return `
🎯 RIX Mobile Performance Report
═══════════════════════════════════

📊 Core Web Vitals (Score: ${coreVitals.score.toFixed(1)}%)
├── LCP: ${latest.lcp?.toFixed(0)}ms (${coreVitals.lcp})
├── FID: ${latest.fid?.toFixed(0)}ms (${coreVitals.fid})
└── CLS: ${latest.cls?.toFixed(3)} (${coreVitals.cls})

📱 Mobile Metrics
├── Touch Latency: ${latest.touchLatency?.toFixed(0)}ms
├── Scroll Performance: ${latest.scrollPerformance?.toFixed(1)}fps
├── Battery Level: ${latest.batteryLevel?.toFixed(0)}%
└── Network: ${latest.networkType || 'unknown'}

⚡ PWA Performance
├── Service Worker: ${latest.swActivated ? '✅' : '❌'}
├── SW Controlling: ${latest.swControlling ? '✅' : '❌'}
└── Cache Hit Ratio: ${latest.cacheHitRatio?.toFixed(1)}%

🚀 Navigation
├── FCP: ${latest.fcp?.toFixed(0)}ms
└── TTFB: ${latest.ttfb?.toFixed(0)}ms
    `;
  }
}

// Global performance tester instance
let performanceTester: MobilePerformanceTester | null = null;

export const getMobilePerformanceTester = (): MobilePerformanceTester => {
  if (!performanceTester) {
    performanceTester = new MobilePerformanceTester();
  }
  return performanceTester;
};

// React hook for performance monitoring
export const useMobilePerformance = () => {
  const tester = getMobilePerformanceTester();
  
  React.useEffect(() => {
    tester.startMonitoring();
    
    return () => {
      tester.stopMonitoring();
    };
  }, [tester]);

  return {
    getMetrics: () => tester.getMetrics(),
    getLatestMetrics: () => tester.getLatestMetrics(),
    getCoreWebVitalsScore: () => tester.getCoreWebVitalsScore(),
    reportPerformance: () => tester.reportPerformance()
  };
};

// Development helper to log performance
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__RIX_PERFORMANCE__ = getMobilePerformanceTester();
  console.log('🎯 RIX Performance Tester available at window.__RIX_PERFORMANCE__');
}