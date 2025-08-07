// /Users/benediktthomas/RIX Personal Agent/RIX/src/components/landing/hero-section.tsx
// Professional hero section for RIX landing page with theme-aware gradients
// Features RIX cube logo, compelling value proposition, and clear CTAs
// RELEVANT FILES: /src/app/page.tsx, /src/components/ui/RixLogo.tsx, /src/components/ui/button.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  ArrowRight, 
  Mic, 
  Brain, 
  Globe,
  CheckCircle 
} from 'lucide-react';

export function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);

  const keyFeatures = [
    'Voice-First AI Assistant',
    'German Business Intelligence', 
    'Cross-Domain Automation',
    'Secure & Private'
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Theme-aware gradient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-transparent dark:to-transparent" />
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Logo and Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="relative">
                <Image
                  src="/logos/rix-cube-isometric.svg"
                  alt="RIX Cube Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                🇩🇪 Made in Germany
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block text-gray-900 dark:text-white">
                RIX Personal Agent
              </span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Your AI Second Brain
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
              The only AI assistant that <strong>thinks in German</strong>, 
              speaks your language, and connects everything you do.
            </p>

            {/* Key Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Brain className="h-6 w-6 mr-2" />
                  Start Free Trial
                  <ArrowRight className="h-6 w-6 ml-2" />
                </Button>
              </Link>
              
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setShowDemo(true)}
                className="w-full sm:w-auto border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 text-lg font-semibold transition-all duration-300"
              >
                <Play className="h-6 w-6 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="text-center lg:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Trusted by German professionals and businesses
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-6 opacity-60">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span className="text-xs font-medium">Voice-First</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="text-xs font-medium">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual/Demo */}
          <div className="relative">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              {/* Mock Dashboard Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">RIX Dashboard</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">AI-powered productivity</div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Mic className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        &ldquo;Erstelle einen Termin für morgen 14 Uhr&rdquo;
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Voice command processed ✓
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Brain className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Meeting scheduled & calendar optimized
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        AI suggestion applied ✓
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-60 animate-bounce"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full blur-xl opacity-60 animate-bounce delay-1000"></div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                RIX Demo Video
              </h3>
              <Button 
                variant="ghost" 
                onClick={() => setShowDemo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Demo video coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}