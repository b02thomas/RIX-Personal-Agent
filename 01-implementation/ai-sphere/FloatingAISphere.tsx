// /01-implementation/ai-sphere/FloatingAISphere.tsx
// Main floating AI sphere component with voice input and quick actions
// Provides non-intrusive AI assistance with context-aware functionality and smooth animations
// RELEVANT FILES: AIBubbleInterface.tsx, VoiceInput.tsx, sphere-animations.css, layout.tsx

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { AIBubbleInterface } from './AIBubbleInterface';
import { VoiceInput } from './VoiceInput';

// Dynamic icon imports for performance
const Icons = {
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  MicOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MicOff })), { ssr: false }),
  MessageCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MessageCircle })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false })
};

interface FloatingAISphereProps {
  className?: string;
  disabled?: boolean;
}

export const FloatingAISphere: React.FC<FloatingAISphereProps> = ({ 
  className, 
  disabled = false 
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sphereRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Mount detection for proper hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close after inactivity
  useEffect(() => {
    if (isOpen) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 30000); // Close after 30 seconds of inactivity
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // Get context-aware quick actions based on current page
  const getContextActions = useCallback(() => {
    const baseActions = [
      { id: 'quick-task', label: 'Quick Task', icon: 'CheckSquare' },
      { id: 'schedule', label: 'Schedule', icon: 'Calendar' },
      { id: 'note', label: 'Add Note', icon: 'FileText' }
    ];

    if (pathname.startsWith('/dashboard')) {
      return [
        { id: 'daily-briefing', label: 'Daily Briefing', icon: 'BarChart3' },
        ...baseActions
      ];
    } else if (pathname.startsWith('/projects')) {
      return [
        { id: 'project-status', label: 'Project Status', icon: 'FolderOpen' },
        { id: 'new-project', label: 'New Project', icon: 'Plus' },
        ...baseActions
      ];
    } else if (pathname.startsWith('/routines')) {
      return [
        { id: 'habit-check', label: 'Check Habits', icon: 'RotateCcw' },
        { id: 'routine-coach', label: 'Routine Coach', icon: 'User' },
        ...baseActions
      ];
    } else if (pathname.startsWith('/calendar')) {
      return [
        { id: 'time-block', label: 'Time Block', icon: 'Clock' },
        { id: 'meeting-prep', label: 'Meeting Prep', icon: 'Users' },
        ...baseActions
      ];
    }

    return baseActions;
  }, [pathname]);

  // Handle sphere click - toggle interface
  const handleSphereClick = useCallback(() => {
    if (disabled) return;
    setIsOpen(!isOpen);
  }, [isOpen, disabled]);

  // Handle voice input start
  const handleVoiceStart = useCallback(() => {
    setIsListening(true);
    setIsProcessing(false);
  }, []);

  // Handle voice input end
  const handleVoiceEnd = useCallback(() => {
    setIsListening(false);
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  }, []);

  // Handle voice input result
  const handleVoiceResult = useCallback((transcript: string) => {
    console.log('Voice input received:', transcript);
    // TODO: Send to AI processing endpoint
  }, []);

  // Handle quick action
  const handleQuickAction = useCallback((actionId: string) => {
    console.log('Quick action triggered:', actionId);
    // TODO: Implement quick action handlers
    setIsOpen(false);
  }, []);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sphereRef.current && !sphereRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={sphereRef}
      className={cn(
        'floating-ai-sphere-container',
        isOpen && 'floating-ai-sphere-container--open',
        className
      )}
    >
      {/* Main Sphere Button */}
      <button
        onClick={handleSphereClick}
        disabled={disabled}
        className={cn(
          'floating-ai-sphere',
          isListening && 'floating-ai-sphere--listening',
          isProcessing && 'floating-ai-sphere--processing',
          disabled && 'floating-ai-sphere--disabled'
        )}
        aria-label="AI Assistant"
        title="Click to open AI assistant"
      >
        {/* Sphere Background with Animated Glow */}
        <div className="floating-ai-sphere__background" />
        
        {/* Sphere Icon */}
        <div className="floating-ai-sphere__icon">
          {isListening ? (
            <Icons.Mic className="w-6 h-6" />
          ) : isProcessing ? (
            <div className="processing-spinner" />
          ) : (
            <Icons.MessageCircle className="w-6 h-6" />
          )}
        </div>

        {/* Pulsing Ring Animation */}
        <div 
          className={cn(
            'floating-ai-sphere__pulse-ring',
            (isListening || isProcessing) && 'floating-ai-sphere__pulse-ring--active'
          )} 
        />
      </button>

      {/* Voice Input Overlay */}
      {isOpen && (
        <VoiceInput
          onStart={handleVoiceStart}
          onEnd={handleVoiceEnd}
          onResult={handleVoiceResult}
          isActive={isListening}
          className="floating-ai-sphere__voice-input"
        />
      )}

      {/* AI Bubble Interface */}
      {isOpen && (
        <AIBubbleInterface
          onClose={() => setIsOpen(false)}
          onQuickAction={handleQuickAction}
          contextActions={getContextActions()}
          isProcessing={isProcessing}
          className="floating-ai-sphere__interface"
        />
      )}
    </div>
  );
};

export default FloatingAISphere;