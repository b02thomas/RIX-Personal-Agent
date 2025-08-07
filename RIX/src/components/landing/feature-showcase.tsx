// /Users/benediktthomas/RIX Personal Agent/RIX/src/components/landing/feature-showcase.tsx
// Feature showcase section highlighting RIX's key capabilities and competitive advantages
// Displays features with icons, descriptions, and interactive elements
// RELEVANT FILES: /src/app/page.tsx, /src/components/landing/hero-section.tsx, /src/components/ui/card.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  Calendar,
  BarChart3,
  Brain,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  Workflow,
  Target,
  Users,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface Feature {
  id: string;
  icon: any;
  title: string;
  description: string;
  longDescription: string;
  benefits: string[];
  color: string;
  bgColor: string;
  category: 'core' | 'intelligence' | 'integration';
  isNew?: boolean;
  isPopular?: boolean;
}

export function FeatureShowcase() {
  const [selectedFeature, setSelectedFeature] = useState<string>('voice-ai');

  const features: Feature[] = [
    {
      id: 'voice-ai',
      icon: Mic,
      title: 'Voice Intelligence Hub',
      description: 'Natürliche deutsche Sprachbefehle für komplexe Workflows',
      longDescription: 'RIX versteht deutsche Geschäftssprache perfekt und führt komplexe Aufgaben durch einfache Sprachbefehle aus. Von Terminplanung bis Projektmanagement - alles durch natürliche Kommunikation.',
      benefits: [
        'Deutsche Spracherkennung optimiert',
        'Kontext-bewusste Befehlsausführung',
        'Hands-free Produktivität',
        'Lernfähige Sprachmodelle'
      ],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      category: 'core',
      isPopular: true
    },
    {
      id: 'cross-domain',
      icon: Brain,
      title: 'Cross-Domain Intelligence',
      description: 'AI verbindet Kalender, Tasks, Goals und Knowledge automatisch',
      longDescription: 'Einzigartige AI-Architektur, die alle Ihre Arbeitsbereiche intelligent verknüpft. Tasks werden automatisch mit Kalenderterminen synchronisiert, Goals mit Projekten abgeglichen, und Knowledge mit aktuellen Aufgaben verknüpft.',
      benefits: [
        'Automatische Kontext-Verknüpfung',
        'Intelligente Prioritätserkennung',
        'Proaktive Optimierungsvorschläge',
        'Nahtlose Workflow-Integration'
      ],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      category: 'intelligence',
      isNew: true
    },
    {
      id: 'calendar-optimization',
      icon: Calendar,
      title: 'Calendar Optimization',
      description: 'AI-gestützte Terminplanung mit deutscher Arbeitskultur',
      longDescription: 'Intelligente Kalenderverwaltung, die deutsche Geschäftsgewohnheiten versteht. Automatische Pufferzeiten, kulturell angepasste Meeting-Zeiten, und proaktive Terminoptimierung.',
      benefits: [
        'Deutsche Arbeitszeiten berücksichtigt',
        'Automatische Pufferzeit-Planung',
        'Meeting-Effizienz Optimierung',
        'Deadline-Management'
      ],
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      category: 'core'
    },
    {
      id: 'project-intelligence',
      icon: Target,
      title: 'Project Health Analytics',
      description: 'AI bewertet Projektstatus und gibt proaktive Empfehlungen',
      longDescription: 'Fortschrittliche AI analysiert kontinuierlich Ihre Projekte und erkennt Risiken bevor sie auftreten. Health-Scores, Ressourcenoptimierung und automatische Anpassungsvorschläge.',
      benefits: [
        'Automatische Health-Score Berechnung',
        'Risiko-Früherkennung',
        'Ressourcenoptimierung',
        'Performance Tracking'
      ],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      category: 'intelligence'
    },
    {
      id: 'routine-coaching',
      icon: TrendingUp,
      title: 'Routine Coaching',
      description: 'Personalisierte Gewohnheits-Optimierung mit AI-Coaching',
      longDescription: 'Ihr persönlicher AI-Coach analysiert Ihre Routinen und gibt maßgeschneiderte Verbesserungsvorschläge. Verhaltensanalyse, Habit-Tracking und motivierende Empfehlungen.',
      benefits: [
        'Personalisierte Coaching-Tipps',
        'Verhaltensanalyse',
        'Streak-Management',
        'Motivierende Insights'
      ],
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      category: 'intelligence',
      isNew: true
    },
    {
      id: 'n8n-integration',
      icon: Workflow,
      title: 'N8N Workflow Integration',
      description: 'Nahtlose Automatisierung mit 400+ Service-Integrationen',
      longDescription: 'Powerful integration platform mit N8N ermöglicht Verbindungen zu über 400 Services. Von CRM-Systemen bis Social Media - alles automatisch synchronisiert.',
      benefits: [
        '400+ Service-Integrationen',
        'Visual Workflow Builder',
        'Automatische Synchronisation',
        'Custom Automations'
      ],
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      category: 'integration'
    }
  ];

  const selectedFeatureData = features.find(f => f.id === selectedFeature) || features[0];

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            <span className="text-gray-900 dark:text-white">Warum RIX anders ist</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Die einzige AI-Plattform, die deutsche Geschäftskultur versteht und 
            alle Ihre Produktivitäts-Tools intelligent miteinander verbindet.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feature List */}
          <div className="lg:col-span-1 space-y-4">
            {features.map((feature) => (
              <Card 
                key={feature.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedFeature === feature.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedFeature(feature.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {feature.title}
                          {feature.isNew && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Neu
                            </Badge>
                          )}
                          {feature.isPopular && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Beliebt
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    {selectedFeature === feature.id && (
                      <ArrowRight className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Feature Detail */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 rounded-2xl ${selectedFeatureData.bgColor}`}>
                    <selectedFeatureData.icon className={`h-8 w-8 ${selectedFeatureData.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      {selectedFeatureData.title}
                      {selectedFeatureData.isNew && (
                        <Badge className="bg-green-100 text-green-800">Neu</Badge>
                      )}
                      {selectedFeatureData.isPopular && (
                        <Badge className="bg-blue-100 text-blue-800">Beliebt</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      {selectedFeatureData.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedFeatureData.longDescription}
                  </p>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Key Benefits:
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selectedFeatureData.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${selectedFeatureData.color.replace('text-', 'bg-')}`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Interface Preview */}
                  <div className={`rounded-lg p-6 ${selectedFeatureData.bgColor} border border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Live Preview
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-md p-4 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <selectedFeatureData.icon className={`h-4 w-4 ${selectedFeatureData.color}`} />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedFeatureData.title} Active
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedFeatureData.benefits[0]} ✓
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Competitive Advantages */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            RIX vs. Competition
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">Notion/Motion</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Englisch-fokussiert, statische Templates, keine Voice-Integration
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white">ChatGPT/Claude</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nur Chat, keine Integration, keine deutsche Business-Logic
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  RIX
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Deutsche AI, Voice-First, Cross-Domain Intelligence, 400+ Integrationen
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}