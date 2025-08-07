// /src/components/auth/login-form.tsx
// Professional theme-aware login form component with RIX branding
// Provides smooth theme transitions, mobile optimization, and professional appearance
// RELEVANT FILES: signin/page.tsx, RixLogo.tsx, theme-provider.tsx, auth-store.ts

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RixLogo } from '@/components/ui/RixLogo';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { setUser, setError: setAuthError } = useAuthStore();
  const { effectiveTheme, mounted } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Anmeldung fehlgeschlagen');
      }

      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className={cn('w-full max-w-md animate-pulse', className)} data-testid="login-form-loading">
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'w-full max-w-md shadow-2xl transition-all duration-300',
      'border-0 backdrop-blur-sm',
      effectiveTheme === 'dark' 
        ? 'bg-gray-900/80 shadow-blue-500/10' 
        : 'bg-white/80 shadow-gray-900/10',
      className
    )}>
      <CardHeader className="space-y-6 text-center pb-8">
        {/* RIX Logo */}
        <div className="flex justify-center">
          <RixLogo 
            variant="standalone" 
            size={64} 
            showLabel={false} 
            priority={true}
            className="drop-shadow-lg"
          />
        </div>
        
        {/* Welcome Text */}
        <div className="space-y-2">
          <CardTitle className={cn(
            'text-3xl font-bold tracking-tight',
            'bg-gradient-to-r bg-clip-text text-transparent',
            effectiveTheme === 'dark'
              ? 'from-blue-400 via-cyan-400 to-blue-500'
              : 'from-blue-600 via-indigo-600 to-blue-700'
          )}>
            Willkommen zurück
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Melden Sie sich in Ihrem RIX Konto an
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="text-sm font-medium text-foreground"
            >
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="ihre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                'h-12 text-base transition-all duration-200',
                'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                'dark:focus:ring-blue-400/20 dark:focus:border-blue-400'
              )}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="text-sm font-medium text-foreground"
            >
              Passwort
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ihr Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(
                  'h-12 text-base pr-12 transition-all duration-200',
                  'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                  'dark:focus:ring-blue-400/20 dark:focus:border-blue-400'
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  'p-1 rounded-md transition-colors duration-200',
                  'text-muted-foreground hover:text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                )}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={cn(
              'p-4 rounded-lg text-sm font-medium',
              'bg-red-50 text-red-700 border border-red-200',
              'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30',
              'animate-in fade-in-0 slide-in-from-top-1 duration-200'
            )}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className={cn(
              'w-full h-12 text-base font-semibold',
              'bg-gradient-to-r transition-all duration-300',
              'focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              effectiveTheme === 'dark'
                ? 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25'
                : 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25'
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Anmeldung...
              </div>
            ) : (
              'Anmelden'
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="pt-4 text-center text-sm border-t border-border">
          <span className="text-muted-foreground">Noch kein Konto? </span>
          <Link 
            href="/auth/signup" 
            className={cn(
              'font-semibold transition-colors duration-200',
              'hover:underline focus:outline-none focus:underline',
              effectiveTheme === 'dark'
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-500'
            )}
          >
            Registrieren
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;