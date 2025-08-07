// /src/app/auth/signin/page.tsx
// Professional RIX signin page with theme-aware gradients and branding
// Features smooth theme transitions, mobile optimization, and beautiful design
// RELEVANT FILES: login-form.tsx, theme-provider.tsx, RixLogo.tsx, design-system.css

'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

export default function SignInPage() {
  const { effectiveTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" data-testid="signin-loading" />
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4 transition-all duration-500',
      // Professional theme-aware gradient backgrounds
      effectiveTheme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    )}>
      {/* Background Pattern */}
      <div className={cn(
        'absolute inset-0 transition-opacity duration-500',
        effectiveTheme === 'dark'
          ? 'bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),rgba(0,0,0,0))]'
          : 'bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),rgba(255,255,255,0))]'
      )} />
      
      {/* Floating Elements for Visual Interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-all duration-1000',
          effectiveTheme === 'dark'
            ? 'bg-blue-500/10'
            : 'bg-blue-400/20'
        )} />
        <div className={cn(
          'absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-all duration-1000 delay-300',
          effectiveTheme === 'dark'
            ? 'bg-cyan-500/10'
            : 'bg-indigo-400/20'
        )} />
      </div>
      
      {/* Login Form */}
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700" />
      </div>
    </div>
  );
} 