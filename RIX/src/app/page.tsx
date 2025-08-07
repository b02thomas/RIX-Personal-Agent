// /Users/benediktthomas/RIX Personal Agent/RIX/src/app/page.tsx
// Professional RIX landing page with hero, features, and demo sections
// Serves as marketing entry point and conversion funnel for RIX Personal Agent
// RELEVANT FILES: /src/components/landing/*, /src/components/ui/*, /src/app/auth/signin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/landing/hero-section';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { DemoSection } from '@/components/landing/demo-section';
import {
  Download,
  Brain,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RIX</h1>
            </div>
            <div className="flex items-center gap-4">
              {showInstallPrompt && (
                <Button onClick={handleInstallClick} variant="outline" className="hidden sm:flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  App installieren
                </Button>
              )}
              <Link href="/dashboard">
                <Button className="flex items-center gap-2">
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline">Anmelden</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeatureShowcase />
        <DemoSection />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="h-8 w-8 text-blue-400" />
                <h3 className="text-2xl font-bold">RIX</h3>
              </div>
              <p className="text-gray-400 max-w-md">
                Ihr persönlicher AI Second Brain. Made in Germany für deutsche Business-Kultur.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Anmelden</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Registrieren</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RIX Personal Agent. Made with ❤️ in Germany. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}