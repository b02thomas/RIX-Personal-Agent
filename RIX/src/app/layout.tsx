import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from './sw-register';
import { MobileTouchOptimizer } from '@/components/mobile/mobile-touch-optimizer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RIX - Personal AI Second Brain',
  description: 'Ihr persönlicher AI Assistent für intelligente Automatisierung und Vorhersageanalysen',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RIX',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <body className={`${inter.className} h-full bg-background text-foreground`}>
        <ServiceWorkerRegistration />
        <MobileTouchOptimizer
          enablePullToRefresh={false}
          enableSwipeNavigation={true}
          optimizeScrolling={true}
        >
          {children}
        </MobileTouchOptimizer>
      </body>
    </html>
  );
} 