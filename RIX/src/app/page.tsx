'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mic,
  Calendar,
  BarChart3,
  Newspaper,
  Settings,
  Download,
  Brain,
  Zap,
  Shield,
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

  const features = [
    {
      icon: Mic,
      title: 'Voice/Chat Hub',
      description: 'Natürliche Sprachinteraktion mit Ihrem AI Assistenten',
      color: 'text-blue-600',
    },
    {
      icon: Calendar,
      title: 'Smart Calendar',
      description: 'Intelligente Terminverwaltung und Zeitplanung',
      color: 'text-green-600',
    },
    {
      icon: BarChart3,
      title: 'Intelligence Overview',
      description: 'AI-gestützte Einblicke und Produktivitätsanalyse',
      color: 'text-purple-600',
    },
    {
      icon: Newspaper,
      title: 'News Intelligence',
      description: 'Personalisierte Nachrichten und Trendanalyse',
      color: 'text-orange-600',
    },
    {
      icon: Settings,
      title: 'Settings & Integrations',
      description: 'Umfassende Konfiguration und Drittanbieter-Integrationen',
      color: 'text-gray-600',
    },
  ];

  const benefits = [
    {
      icon: Brain,
      title: 'KI-gestützt',
      description: 'Lernfähiger Assistent, der sich an Ihre Bedürfnisse anpasst',
    },
    {
      icon: Zap,
      title: 'Schnell & Effizient',
      description: 'Optimierte Workflows für maximale Produktivität',
    },
    {
      icon: Shield,
      title: 'Sicher & Privat',
      description: 'Ende-zu-Ende Verschlüsselung und Datenschutz',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">RIX</h1>
          </div>
          <div className="flex items-center gap-4">
            {showInstallPrompt && (
              <Button onClick={handleInstallClick} className="flex items-center gap-2">
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
            <Link href="/auth/signup">
              <Button>Registrieren</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl lg:text-6xl font-bold mb-6">
          Ihr persönlicher{' '}
          <span className="text-primary">AI Second Brain</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          RIX ist Ihr intelligenter Assistent für Automatisierung, Vorhersageanalysen
          und eine nahtlose Sprachinteraktion. Optimieren Sie Ihre Produktivität
          mit KI-gestützten Einblicken.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Jetzt testen
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg">
              Registrieren
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Fünf intelligente Module
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className={`h-8 w-8 ${feature.color} mb-2`} />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">
          Warum RIX?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Bereit für die Zukunft?</CardTitle>
            <CardDescription>
              Testen Sie RIX jetzt kostenlos und erleben Sie die Kraft
              eines persönlichen AI Second Brain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Dashboard öffnen
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Registrieren
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 RIX. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
} 