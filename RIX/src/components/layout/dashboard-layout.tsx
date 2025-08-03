'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from './navigation';
import { useAuthStore } from '@/store/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {/* Mobile top padding - Safe area aware */}
          <div className="lg:hidden h-16 safe-area-inset-top" />
          
          {/* Content - Mobile optimized padding */}
          <div className="px-4 py-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
          
          {/* Mobile bottom padding - Safe area aware */}
          <div className="lg:hidden h-20 safe-area-inset-bottom" />
        </main>
      </div>
    </div>
  );
} 