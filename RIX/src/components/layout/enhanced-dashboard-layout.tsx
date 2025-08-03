// /src/components/layout/enhanced-dashboard-layout.tsx
// Enhanced dashboard layout integrating new sidebar navigation and mobile components
// Replaces the basic dashboard layout with responsive navigation and theme integration
// RELEVANT FILES: dashboard-layout.tsx, enhanced-sidebar.tsx, mobile-navigation.tsx, navigation-store.ts

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useNavigationStore, useResponsiveNavigation } from '@/store/navigation-store';
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { SafeAreaWrapper, useMobileOptimization } from '@/components/mobile/mobile-touch-optimizer';

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const EnhancedDashboardLayout: React.FC<EnhancedDashboardLayoutProps> = ({
  children,
  className
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const { isMobile, updateBreakpoint } = useResponsiveNavigation();
  const { isCollapsed, closeMobileDrawer } = useNavigationStore();
  const { isStandalone, orientation } = useMobileOptimization();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  // Initialize responsive behavior
  useEffect(() => {
    const handleResize = () => {
      updateBreakpoint(window.innerWidth);
    };
    
    // Set initial breakpoint
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBreakpoint]);

  // Close mobile drawer on route changes (handled by navigation store)
  useEffect(() => {
    closeMobileDrawer();
  }, [router, closeMobileDrawer]);

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Desktop Sidebar Navigation */}
      <EnhancedSidebar />
      
      {/* Enhanced Mobile Navigation with gesture support */}
      <MobileNavigation 
        enableGestures={true}
        enableHaptics={true}
        enableSwipeToClose={true}
      />
      
      {/* Main Content Area */}
      <div 
        className={cn(
          // Desktop: adjust for sidebar
          'rix-main-content',
          isCollapsed && 'rix-main-content--sidebar-collapsed',
          
          // Mobile: adjust for bottom navigation
          isMobile && 'rix-main-content--mobile'
        )}
      >
        <main className={cn(
          'min-h-screen',
          isMobile && 'mobile-vh',
          isStandalone && 'pwa-standalone'
        )}>
          {/* Enhanced mobile safe area handling */}
          {isMobile && (
            <SafeAreaWrapper className="lg:hidden">
              <div className="h-2" />
            </SafeAreaWrapper>
          )}
          
          {/* Content container with enhanced responsive padding */}
          <div className={cn(
            'max-w-7xl mx-auto',
            // Mobile padding: optimized for touch interaction
            'px-4 py-4',
            // Tablet padding: balanced for hybrid interaction
            'md:px-6 md:py-6',
            // Desktop padding: spacious for mouse interaction
            'lg:px-8 lg:py-8',
            // Additional mobile optimizations
            isMobile && 'touch-optimization',
            orientation === 'landscape' && isMobile && 'landscape-optimized'
          )}>
            {/* Page Content */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
          
          {/* Mobile bottom padding for safe area + navigation */}
          <div className="lg:hidden h-20 safe-area-inset-bottom" />
        </main>
      </div>
    </div>
  );
};

// Loading component for authentication checks
const AuthenticationLoader: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">
        Authenticating...
      </p>
    </div>
  </div>
);

// Error boundary for layout errors
export class EnhancedDashboardLayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard layout error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground">
              There was an error loading the dashboard. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for layout with error boundary
export const withEnhancedDashboardLayout = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedDashboardLayoutErrorBoundary>
      <EnhancedDashboardLayout>
        <Component {...props} />
      </EnhancedDashboardLayout>
    </EnhancedDashboardLayoutErrorBoundary>
  );
  
  WrappedComponent.displayName = `withEnhancedDashboardLayout(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Layout context for child components to access layout state
export const EnhancedLayoutContext = React.createContext<{
  isSidebarCollapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
} | null>(null);

export const useEnhancedLayout = () => {
  const context = React.useContext(EnhancedLayoutContext);
  if (!context) {
    throw new Error('useEnhancedLayout must be used within EnhancedDashboardLayout');
  }
  return context;
};

// Layout with context provider
export const EnhancedDashboardLayoutWithContext: React.FC<EnhancedDashboardLayoutProps> = ({
  children,
  ...props
}) => {
  const { isCollapsed } = useNavigationStore();
  const { isMobile, isTablet } = useResponsiveNavigation();

  return (
    <EnhancedLayoutContext.Provider 
      value={{ 
        isSidebarCollapsed: isCollapsed, 
        isMobile, 
        isTablet 
      }}
    >
      <EnhancedDashboardLayout {...props}>
        {children}
      </EnhancedDashboardLayout>
    </EnhancedLayoutContext.Provider>
  );
};