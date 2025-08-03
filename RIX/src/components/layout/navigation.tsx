'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Dynamic icon imports for better performance
const Icons = {
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  Newspaper: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Newspaper })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  Menu: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Menu })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false })
};

const navigationItems = [
  {
    name: 'Voice/Chat Hub',
    href: '/dashboard/voice',
    icon: Icons.Mic,
    description: 'Primäre Konversationsschnittstelle'
  },
  {
    name: 'Smart Calendar',
    href: '/dashboard/calendar',
    icon: Icons.Calendar,
    description: 'Tägliches Management-System'
  },
  {
    name: 'Intelligence Overview',
    href: '/dashboard/intelligence',
    icon: Icons.BarChart3,
    description: 'AI Insights Dashboard'
  },
  {
    name: 'News Intelligence',
    href: '/dashboard/news',
    icon: Icons.Newspaper,
    description: 'Personalisierter News Feed'
  },
  {
    name: 'Settings & Integrations',
    href: '/dashboard/settings',
    icon: Icons.Settings,
    description: 'Konfigurationspanel'
  }
];

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button - Enhanced for touch */}
      <div className="lg:hidden fixed top-4 left-4 z-50 safe-area-inset-top">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            'bg-background/90 backdrop-blur-sm border shadow-lg',
            'min-h-[48px] min-w-[48px] touch-manipulation',
            'active:scale-95 transition-transform',
            'hover:bg-accent/80'
          )}
        >
          {isMobileMenuOpen ? <Icons.X className="h-5 w-5" /> : <Icons.Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile navigation - Enhanced overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm safe-area-inset">
          <div className="flex flex-col h-full pt-20 pb-6">
            <nav className="flex-1 px-6 space-y-3">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-4 px-6 py-4 rounded-xl text-base font-medium transition-all duration-200',
                      'min-h-[60px] touch-manipulation select-none',
                      'active:scale-95 active:bg-accent/50',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-foreground hover:text-foreground hover:bg-accent/80'
                    )}
                  >
                    <item.icon className="h-6 w-6 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm opacity-70 mt-1">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Close overlay when tapping outside navigation items */}
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-background lg:border-r">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-6 border-b">
            <h1 className="text-xl font-bold">RIX</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom navigation for mobile - Enhanced for touch */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t safe-area-inset-bottom">
        <nav className="flex justify-around min-h-[64px]">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 text-xs transition-all duration-200',
                  'min-h-[60px] min-w-[60px] rounded-lg mx-1 my-1',
                  'touch-manipulation select-none',
                  'active:scale-95 active:bg-accent/50',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                )}
              >
                <item.icon className={cn(
                  'h-6 w-6 mb-1 transition-transform',
                  isActive ? 'scale-110' : 'scale-100'
                )} />
                <span className="text-center leading-tight font-medium">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
} 