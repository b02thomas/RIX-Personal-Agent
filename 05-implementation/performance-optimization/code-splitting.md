# Code Splitting Implementation Guide

## Overview

This guide details the implementation of advanced code splitting techniques for RIX Personal Agent, focusing on reducing bundle size and improving loading performance through strategic component and feature splitting.

## Current State Analysis

### Large Components Identified
1. **MobileNavigation** (540 lines) - Navigation, drawer, and bottom nav
2. **MobileChatInterface** (580 lines) - Chat UI, voice recognition, gestures
3. **Dashboard** (300+ lines) - Module grid, stats, navigation
4. **ProjectManagement** - Complex UI with filtering and animations
5. **CalendarInterface** - Date handling and time-blocking visualization

### Splitting Opportunities
- **Feature-based splitting**: Voice, file upload, advanced gestures
- **Component-based splitting**: Navigation parts, chat features
- **Route-based splitting**: Dashboard modules, settings panels
- **Device-based splitting**: Mobile vs desktop components

## Implementation Strategy

### 1. Icon Optimization (Immediate Win)

#### Current Problem
```typescript
// 30+ individual dynamic imports per component
const Icons = {
  Menu: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Menu }))),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X }))),
  Home: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Home }))),
  // ... 30+ more icons
};
```

#### Optimized Solution
```typescript
// Single optimized icon component with tree shaking
interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const OptimizedIcon: React.FC<IconProps> = ({ name, size = 20, className }) => {
  // Dynamic import with tree shaking
  const IconComponent = useMemo(() => {
    return lazy(() => 
      import('lucide-react').then(mod => ({
        default: mod[name as keyof typeof mod] || mod.HelpCircle
      }))
    );
  }, [name]);

  return (
    <Suspense fallback={<div className={`w-5 h-5 ${className}`} />}>
      <IconComponent size={size} className={className} />
    </Suspense>
  );
};

// Usage
<OptimizedIcon name="Menu" className="w-6 h-6" />
```

### 2. Component-Based Splitting

#### Mobile Navigation Splitting

**Before: Monolithic Component (540 lines)**
```typescript
export const MobileNavigation = () => {
  // 540 lines of mixed functionality
  return (
    <>
      {/* Header */}
      {/* Drawer */} 
      {/* Bottom Navigation */}
      {/* Pull to Refresh */}
    </>
  );
};
```

**After: Split Components**
```typescript
// Main navigation coordinator (50 lines)
export const MobileNavigation = lazy(() => import('./MobileNavigationCoordinator'));

// Individual components (100-150 lines each)
const MobileHeader = lazy(() => import('./components/MobileHeader'));
const MobileDrawer = lazy(() => import('./components/MobileDrawer'));
const BottomNavigation = lazy(() => import('./components/BottomNavigation'));
const PullToRefresh = lazy(() => import('./components/PullToRefresh'));

// Usage with progressive loading
const MobileNavigationCoordinator = () => {
  const [loadedComponents, setLoadedComponents] = useState(new Set(['header']));
  
  const loadComponent = useCallback((component: string) => {
    setLoadedComponents(prev => new Set([...prev, component]));
  }, []);

  return (
    <div className="mobile-navigation">
      <Suspense fallback={<HeaderSkeleton />}>
        <MobileHeader onDrawerToggle={() => loadComponent('drawer')} />
      </Suspense>
      
      {loadedComponents.has('drawer') && (
        <Suspense fallback={<DrawerSkeleton />}>
          <MobileDrawer onBottomNavLoad={() => loadComponent('bottomNav')} />
        </Suspense>
      )}
      
      {loadedComponents.has('bottomNav') && (
        <Suspense fallback={<div className="h-16" />}>
          <BottomNavigation />
        </Suspense>
      )}
    </div>
  );
};
```

#### Chat Interface Splitting

**Before: Large Chat Component (580 lines)**
```typescript
export const MobileChatInterface = () => {
  // Voice recognition logic
  // Gesture handling
  // Message rendering
  // Input handling
  // File upload
  // All in one component
};
```

**After: Feature-Based Splitting**
```typescript
// Core chat component (200 lines)
const ChatCore = lazy(() => import('./chat/ChatCore'));

// Feature modules (lazy loaded)
const VoiceRecognition = lazy(() => import('./chat/features/VoiceRecognition'));
const FileUpload = lazy(() => import('./chat/features/FileUpload'));
const AdvancedGestures = lazy(() => import('./chat/features/AdvancedGestures'));
const MessageActions = lazy(() => import('./chat/features/MessageActions'));

// Progressive feature loading
const useChatFeatures = () => {
  const [enabledFeatures, setEnabledFeatures] = useState(new Set(['core']));
  
  const enableFeature = useCallback((feature: string) => {
    setEnabledFeatures(prev => new Set([...prev, feature]));
  }, []);

  // Auto-enable features based on user interaction
  const enableVoiceOnTouch = useCallback(() => {
    enableFeature('voice');
  }, [enableFeature]);

  const enableFileUploadOnDrag = useCallback(() => {
    enableFeature('fileUpload');
  }, [enableFeature]);

  return {
    enabledFeatures,
    enableVoiceOnTouch,
    enableFileUploadOnDrag
  };
};
```

### 3. Route-Based Dynamic Imports

#### Dashboard Module Splitting
```typescript
// Before: All dashboard modules loaded upfront
import ProjectsPage from './projects/page';
import TasksPage from './tasks/page';
import CalendarPage from './calendar/page';
import IntelligencePage from './intelligence/page';

// After: Dynamic route-based imports
const DashboardRoutes = {
  projects: () => import('./projects/page'),
  tasks: () => import('./tasks/page'),
  calendar: () => import('./calendar/page'),
  intelligence: () => import('./intelligence/page'),
  routines: () => import('./routines/page'),
  settings: () => import('./settings/page')
};

// Preloading strategy
const useDashboardPreloader = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Preload likely next routes based on current route
    const preloadMap = {
      '/dashboard': ['projects', 'tasks'], // Most common next routes
      '/dashboard/projects': ['tasks', 'calendar'],
      '/dashboard/tasks': ['projects', 'routines']
    };
    
    const currentRoute = router.pathname;
    const toPreload = preloadMap[currentRoute] || [];
    
    toPreload.forEach(route => {
      // Preload after a delay
      setTimeout(() => {
        DashboardRoutes[route]?.();
      }, 2000);
    });
  }, [router.pathname]);
};
```

### 4. Feature-Based Conditional Loading

#### Voice Recognition Module
```typescript
// Load voice recognition only when needed
const useVoiceRecognition = () => {
  const [voiceModule, setVoiceModule] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const loadVoiceModule = useCallback(async () => {
    if (voiceModule) return voiceModule;

    // Check support first
    const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(hasSupport);

    if (!hasSupport) return null;

    // Load module only if supported
    const module = await import('./features/VoiceRecognition');
    setVoiceModule(module);
    return module;
  }, [voiceModule]);

  return {
    loadVoiceModule,
    isSupported,
    isLoaded: !!voiceModule
  };
};

// Usage
const ChatInput = () => {
  const { loadVoiceModule, isSupported } = useVoiceRecognition();
  const [voiceComponent, setVoiceComponent] = useState(null);

  const handleVoiceButtonClick = useCallback(async () => {
    if (!voiceComponent) {
      const module = await loadVoiceModule();
      if (module) {
        setVoiceComponent(() => module.VoiceRecognition);
      }
    }
  }, [loadVoiceModule, voiceComponent]);

  return (
    <div className="chat-input">
      <textarea />
      {isSupported && (
        <button onClick={handleVoiceButtonClick}>
          🎤
        </button>
      )}
      {voiceComponent && (
        <Suspense fallback={<div>Loading voice...</div>}>
          {React.createElement(voiceComponent)}
        </Suspense>
      )}
    </div>
  );
};
```

### 5. Progressive Component Loading

#### Intersection Observer Loading
```typescript
const useIntersectionLoader = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isIntersecting };
};

// Usage for heavy components
const HeavyDashboardSection = () => {
  const { ref, isIntersecting } = useIntersectionLoader();
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    if (isIntersecting && !Component) {
      import('./HeavyComponent').then(module => {
        setComponent(() => module.default);
      });
    }
  }, [isIntersecting, Component]);

  return (
    <div ref={ref} className="min-h-[200px]">
      {Component ? (
        <Suspense fallback={<ComponentSkeleton />}>
          <Component />
        </Suspense>
      ) : (
        <div>Loading section...</div>
      )}
    </div>
  );
};
```

### 6. Vendor Bundle Optimization

#### Strategic Vendor Splitting
```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Framework code (critical, load immediately)
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            priority: 40,
            enforce: true
          },
          
          // UI libraries (important, preload)
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            name: 'ui-libs',
            priority: 30,
            reuseExistingChunk: true
          },
          
          // Icons (lazy load by category)
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|@heroicons)[\\/]/,
            name: 'icons',
            priority: 20,
            chunks: 'async' // Only load when requested
          },
          
          // Animation libraries (lazy load)
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|react-spring)[\\/]/,
            name: 'animations',
            priority: 10,
            chunks: 'async',
            enforce: true
          },
          
          // Common vendor code
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      };
    }
    return config;
  }
};
```

## Loading Strategies

### 1. Skeleton Loading
```typescript
const ComponentSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-full"></div>
  </div>
);

// Usage
<Suspense fallback={<ComponentSkeleton />}>
  <LazyComponent />
</Suspense>
```

### 2. Progressive Enhancement
```typescript
const ProgressiveFeature = ({ fallback, children }) => {
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    // Load enhanced version after initial render
    const timer = setTimeout(() => {
      setIsEnhanced(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isEnhanced ? children : fallback;
};

// Usage
<ProgressiveFeature 
  fallback={<BasicComponent />}
>
  <Suspense fallback={<BasicComponent />}>
    <EnhancedComponent />
  </Suspense>
</ProgressiveFeature>
```

### 3. Preloading Optimization
```typescript
const usePreloader = () => {
  const preloadComponent = useCallback((importFunction: () => Promise<any>) => {
    // Preload on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunction();
      });
    } else {
      setTimeout(() => {
        importFunction();
      }, 100);
    }
  }, []);

  const preloadOnHover = useCallback((importFunction: () => Promise<any>) => {
    return {
      onMouseEnter: () => preloadComponent(importFunction),
      onFocus: () => preloadComponent(importFunction)
    };
  }, [preloadComponent]);

  return { preloadComponent, preloadOnHover };
};
```

## Performance Monitoring

### Bundle Analysis Integration
```typescript
// Bundle size monitoring
const bundleMonitor = {
  trackChunkLoad: (chunkName: string, loadTime: number) => {
    if (typeof window !== 'undefined') {
      console.log(`Chunk ${chunkName} loaded in ${loadTime}ms`);
      
      // Track in analytics
      if (window.gtag) {
        window.gtag('event', 'chunk_load', {
          chunk_name: chunkName,
          load_time: loadTime
        });
      }
    }
  },

  trackComponentMount: (componentName: string, mountTime: number) => {
    console.log(`Component ${componentName} mounted in ${mountTime}ms`);
  }
};

// Usage in components
const LazyComponentWrapper = ({ importFunction, name }) => {
  const [startTime] = useState(Date.now());
  
  useEffect(() => {
    const mountTime = Date.now() - startTime;
    bundleMonitor.trackComponentMount(name, mountTime);
  }, [name, startTime]);

  // ... component logic
};
```

## Expected Results

### Bundle Size Improvements
- **Icon optimization**: -15 kB (reduced redundant imports)
- **Component splitting**: -20 kB (lazy loading of large components)
- **Feature splitting**: -25 kB (conditional loading of heavy features)
- **Vendor optimization**: -30 kB (strategic chunking)

### Performance Improvements
- **Initial load time**: 40-50% reduction
- **Time to Interactive**: 30-40% improvement
- **Memory usage**: 25-35% reduction
- **Mobile performance**: 50-60% improvement on 3G networks

### Loading Experience
- **Progressive loading**: Users see content immediately
- **Skeleton states**: Smooth loading transitions
- **Preloading**: Anticipated content loads proactively
- **Fallbacks**: Graceful degradation for loading failures