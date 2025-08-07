// /Users/benediktthomas/RIX Personal Agent/RIX/src/components/landing/demo-section.tsx
// Demo section showcasing RIX capabilities with interactive elements and testimonials
// Features video placeholder, feature highlights, and social proof elements
// RELEVANT FILES: /src/components/landing/hero-section.tsx, /src/components/landing/feature-showcase.tsx, /src/components/ui/card.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Users,
  Star,
  Quote,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

interface Stat {
  value: string;
  label: string;
  icon: any;
  color: string;
}

export function DemoSection() {
  const [activeDemo, setActiveDemo] = useState('voice');

  const testimonials: Testimonial[] = [
    {
      name: 'Marcus Weber',
      role: 'Geschäftsführer',
      company: 'Weber & Associates',
      content: 'RIX hat meine Produktivität um 40% gesteigert. Die deutsche Spracherkennung funktioniert perfekt für Business-Termine.',
      rating: 5,
      avatar: 'MW'
    },
    {
      name: 'Sarah Müller',
      role: 'Projektleiterin',
      company: 'Tech Innovation GmbH',
      content: 'Endlich ein AI-Assistant der deutsche Geschäftskultur versteht. Automatische Pufferzeiten sind genial!',
      rating: 5,
      avatar: 'SM'
    },
    {
      name: 'Dr. Thomas Klein',
      role: 'Berater',
      company: 'Klein Consulting',
      content: 'Die Cross-Domain Intelligence ist revolutionär. RIX verbindet meine Tasks automatisch mit Kalenderterminen.',
      rating: 5,
      avatar: 'TK'
    }
  ];

  const stats: Stat[] = [
    {
      value: '40%',
      label: 'Produktivitätssteigerung',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      value: '2h',
      label: 'Täglich gesparte Zeit',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      value: '95%',
      label: 'Benutzer-Zufriedenheit',
      icon: Target,
      color: 'text-purple-600'
    },
    {
      value: '400+',
      label: 'Integrationen',
      icon: Zap,
      color: 'text-orange-600'
    }
  ];

  const demoFeatures = [
    {
      id: 'voice',
      title: 'Voice Commands',
      description: 'Sprechen Sie natürlich mit RIX auf Deutsch',
      preview: '&ldquo;Erstelle einen Termin mit Weber für nächste Woche Dienstag 14 Uhr&rdquo;'
    },
    {
      id: 'calendar',
      title: 'Smart Calendar',
      description: 'AI optimiert Ihre Termine automatisch',
      preview: 'Termin erstellt ✓ Pufferzeit hinzugefügt ✓ Reminder gesetzt ✓'
    },
    {
      id: 'integration',
      title: 'Workflow Integration',
      description: 'Verbindet alle Ihre Tools nahtlos',
      preview: 'Slack benachrichtigt ✓ CRM aktualisiert ✓ Email versendet ✓'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">Sehen Sie RIX in Aktion</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Erleben Sie, wie RIX Ihren Arbeitsalltag revolutioniert. 
            Von Voice-Commands bis zur intelligenten Workflow-Automatisierung.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg">
            <Play className="h-6 w-6 mr-2" />
            Demo Video starten
          </Button>
        </div>

        {/* Demo Video & Feature Tabs */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Video/Preview Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 h-64 lg:h-96 flex items-center justify-center">
                  {/* Video Placeholder */}
                  <div className="text-center">
                    <div className="inline-flex p-4 bg-white/10 rounded-full mb-4 backdrop-blur-sm">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      RIX Demo Video
                    </h3>
                    <p className="text-blue-200">
                      {activeDemo === 'voice' && 'Deutsche Sprachbefehle in Aktion'}
                      {activeDemo === 'calendar' && 'Intelligente Terminplanung'}
                      {activeDemo === 'integration' && 'Nahtlose Tool-Integration'}
                    </p>
                  </div>

                  {/* Floating UI Elements */}
                  <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Live Demo
                    </div>
                  </div>

                  {/* Demo Preview */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {demoFeatures.find(f => f.id === activeDemo)?.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {demoFeatures.find(f => f.id === activeDemo)?.preview}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Tabs */}
          <div className="space-y-4">
            {demoFeatures.map((feature) => (
              <Card 
                key={feature.id}
                className={`cursor-pointer transition-all duration-300 ${
                  activeDemo === feature.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setActiveDemo(feature.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activeDemo === feature.id ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                    {activeDemo === feature.id && (
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Was unsere Nutzer sagen
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-blue-500 mb-4 opacity-50" />
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 lg:p-12 shadow-xl">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Bereit für Ihre eigene Demo?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Starten Sie noch heute kostenlos und erleben Sie die Zukunft 
            der deutschen Business-Produktivität mit RIX.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <CheckCircle className="h-6 w-6 mr-2" />
              Kostenlos starten
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg font-semibold"
            >
              <Users className="h-6 w-6 mr-2" />
              Demo buchen
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Keine Kreditkarte erforderlich
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              30 Tage kostenlos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              GDPR-konform
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}