// /src/utils/mobile-performance-optimizer.ts
// Mobile performance optimization utilities for PWA with frame rate monitoring
// Provides performance metrics tracking, animation optimization, and memory management
// RELEVANT FILES: mobile-touch-optimizer.tsx, use-mobile-gestures.ts, service-worker.js

import { useState, useEffect } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  touchLatency: number;
  renderTime: number;
  bundleSize?: number;
}

interface OptimizationSettings {
  enableFpsMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  enableTouchLatencyTracking: boolean;
  targetFps: number;
  maxMemoryThreshold: number; // MB
  enableAutoOptimization: boolean;
}

class MobilePerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    touchLatency: 0,
    renderTime: 0
  };

  private settings: OptimizationSettings = {
    enableFpsMonitoring: true,
    enableMemoryMonitoring: true,
    enableTouchLatencyTracking: true,
    targetFps: 60,
    maxMemoryThreshold: 150, // MB
    enableAutoOptimization: true
  };

  private fpsCounter = 0;
  private lastFpsCheck = 0;
  private animationId: number | null = null;
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private touchStartTime = 0;

  constructor(settings?: Partial<OptimizationSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Start FPS monitoring
    if (this.settings.enableFpsMonitoring) {
      this.startFpsMonitoring();
    }

    // Start memory monitoring
    if (this.settings.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }

    // Setup touch latency tracking
    if (this.settings.enableTouchLatencyTracking) {
      this.setupTouchLatencyTracking();
    }

    // Optimize animations and rendering
    this.optimizeAnimations();

    // Load time tracking
    this.trackLoadTime();
  }

  private startFpsMonitoring() {
    const measureFps = (timestamp: number) => {
      if (this.lastFpsCheck === 0) {
        this.lastFpsCheck = timestamp;
      }

      this.fpsCounter++;

      if (timestamp - this.lastFpsCheck >= 1000) {
        this.metrics.fps = Math.round((this.fpsCounter * 1000) / (timestamp - this.lastFpsCheck));
        this.fpsCounter = 0;
        this.lastFpsCheck = timestamp;

        // Auto-optimization if FPS drops below target
        if (this.settings.enableAutoOptimization && this.metrics.fps < this.settings.targetFps) {
          this.optimizeForLowFps();
        }

        this.notifyObservers();
      }

      this.animationId = requestAnimationFrame(measureFps);
    };

    this.animationId = requestAnimationFrame(measureFps);
  }

  private startMemoryMonitoring() {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);

        // Auto-optimization if memory usage is high
        if (this.settings.enableAutoOptimization && this.metrics.memoryUsage > this.settings.maxMemoryThreshold) {
          this.optimizeForHighMemory();
        }
      }
    };

    // Check memory usage every 5 seconds
    setInterval(measureMemory, 5000);
    measureMemory(); // Initial check
  }

  private setupTouchLatencyTracking() {
    const measureTouchLatency = () => {
      document.addEventListener('touchstart', (e) => {
        this.touchStartTime = performance.now();
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        if (this.touchStartTime > 0) {
          this.metrics.touchLatency = performance.now() - this.touchStartTime;
          this.touchStartTime = 0;
        }
      }, { passive: true });
    };

    measureTouchLatency();
  }

  private optimizeAnimations() {
    // Add CSS optimizations for smooth animations
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile performance optimizations */
      .rix-mobile-optimized {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      
      .rix-smooth-animation {
        animation-fill-mode: both;
        animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
      }
      
      .rix-gpu-accelerated {
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
      
      /* Reduce motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        .rix-mobile-optimized,
        .rix-smooth-animation,
        .rix-gpu-accelerated {
          animation: none !important;
          transition: none !important;
          will-change: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private trackLoadTime() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.metrics.loadTime = loadTime;
    }
  }

  private optimizeForLowFps() {
    console.log('🔧 Optimizing for low FPS:', this.metrics.fps);
    
    // Reduce animation quality
    const elements = document.querySelectorAll('.rix-interactive');
    elements.forEach(el => {
      (el as HTMLElement).style.transition = 'transform 0.1s ease-out';
    });

    // Disable non-essential animations
    document.body.classList.add('rix-performance-mode');
  }

  private optimizeForHighMemory() {
    console.log('🔧 Optimizing for high memory usage:', this.metrics.memoryUsage, 'MB');
    
    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Remove unused event listeners
    this.cleanupEventListeners();
  }

  private cleanupEventListeners() {
    // Remove passive event listeners that might be accumulating
    const elements = document.querySelectorAll('[data-touch-optimized]');
    elements.forEach(el => {
      el.removeAttribute('data-touch-optimized');
    });
  }

  private notifyObservers() {
    this.observers.forEach(observer => observer(this.metrics));
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  public updateSettings(newSettings: Partial<OptimizationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public enablePerformanceMode() {
    document.body.classList.add('rix-performance-mode');
    this.updateSettings({
      enableAutoOptimization: true,
      targetFps: 30, // Lower target for better battery life
      maxMemoryThreshold: 100
    });
  }

  public disablePerformanceMode() {
    document.body.classList.remove('rix-performance-mode');
    this.updateSettings({
      targetFps: 60,
      maxMemoryThreshold: 150
    });
  }

  public measureRenderTime(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`📊 ${componentName} render time:`, renderTime.toFixed(2), 'ms');
    this.metrics.renderTime = renderTime;
    
    return renderTime;
  }

  public optimizeImages() {
    // Lazy load images that are not in viewport
    const images = document.querySelectorAll('img[src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.loading = 'lazy';
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  public destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.observers = [];
  }
}

// Create singleton instance
let performanceOptimizer: MobilePerformanceOptimizer | null = null;

export const getMobilePerformanceOptimizer = (settings?: Partial<OptimizationSettings>) => {
  if (!performanceOptimizer) {
    performanceOptimizer = new MobilePerformanceOptimizer(settings);
  }
  return performanceOptimizer;
};

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    touchLatency: 0,
    renderTime: 0
  });

  useEffect(() => {
    const optimizer = getMobilePerformanceOptimizer();
    const unsubscribe = optimizer.subscribe(setMetrics);
    
    return () => {
      unsubscribe();
    };
  }, []);

  return metrics;
};

// Performance testing utilities
export const runPerformanceTest = async (): Promise<PerformanceMetrics> => {
  const optimizer = getMobilePerformanceOptimizer();
  
  // Wait for a few seconds to get accurate metrics
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const metrics = optimizer.getMetrics();
  
  console.log('📊 Performance Test Results:', {
    '🎯 FPS': metrics.fps,
    '🧠 Memory': `${metrics.memoryUsage}MB`,
    '⚡ Load Time': `${metrics.loadTime}ms`,
    '👆 Touch Latency': `${metrics.touchLatency.toFixed(2)}ms`,
    '🎨 Render Time': `${metrics.renderTime.toFixed(2)}ms`
  });
  
  return metrics;
};

// Bundle size analyzer
export const analyzeBundleSize = async (): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  
  try {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0) {
      const entry = entries[0];
      const bundleSize = entry.transferSize || 0;
      console.log('📦 Bundle Size:', (bundleSize / 1024).toFixed(2), 'KB');
      return bundleSize;
    }
  } catch (error) {
    console.warn('Could not analyze bundle size:', error);
  }
  
  return 0;
};

export default MobilePerformanceOptimizer;