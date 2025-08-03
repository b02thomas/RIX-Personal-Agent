'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading components for different sections
const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-muted rounded-lg mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
    </div>
  </div>
);

const LoadingPage = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  </div>
);

// Dynamic loaders for dashboard pages with optimized loading states
export const LazyCalendarPage = dynamic(
  () => import('@/app/dashboard/calendar/page'),
  {
    loading: () => <LoadingPage />,
    ssr: false
  }
);

export const LazyIntelligencePage = dynamic(
  () => import('@/app/dashboard/intelligence/page'),
  {
    loading: () => <LoadingPage />,
    ssr: false
  }
);

export const LazyNewsPage = dynamic(
  () => import('@/app/dashboard/news/page'),
  {
    loading: () => <LoadingPage />,
    ssr: false
  }
);

export const LazySettingsPage = dynamic(
  () => import('@/app/dashboard/settings/page'),
  {
    loading: () => <LoadingPage />,
    ssr: false
  }
);

export const LazyVoicePage = dynamic(
  () => import('@/app/dashboard/voice/page'),
  {
    loading: () => <LoadingPage />,
    ssr: false
  }
);

// Dynamic component loader for heavy UI components
export const LazyComponent = <T extends {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  FallbackComponent: ComponentType = () => <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
) => {
  return dynamic(importFn, {
    loading: () => <FallbackComponent />,
    ssr: false
  });
};

export { LoadingCard, LoadingPage };