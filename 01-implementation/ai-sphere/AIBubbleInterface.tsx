// /01-implementation/ai-sphere/AIBubbleInterface.tsx
// Quick actions popup interface for the floating AI sphere
// Provides context-aware actions, smooth animations, and touch-friendly interactions
// RELEVANT FILES: FloatingAISphere.tsx, VoiceInput.tsx, sphere-animations.css, tech-stack-config.md

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance
const Icons = {
  // Action icons
  CheckSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckSquare })), { ssr: false }),
  Calendar: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Calendar })), { ssr: false }),
  FileText: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FileText })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  FolderOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.FolderOpen })), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false }),
  Users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), { ssr: false }),
  
  // UI icons
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  Send: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Send })), { ssr: false }),
  Sparkles: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sparkles })), { ssr: false })
};

// Icon mapping for quick actions
const iconMap: Record<string, React.ComponentType<any>> = {
  CheckSquare: Icons.CheckSquare,
  Calendar: Icons.Calendar,
  FileText: Icons.FileText,
  BarChart3: Icons.BarChart3,
  FolderOpen: Icons.FolderOpen,
  Plus: Icons.Plus,
  RotateCcw: Icons.RotateCcw,
  User: Icons.User,
  Clock: Icons.Clock,
  Users: Icons.Users
};

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

interface AIBubbleInterfaceProps {
  onClose: () => void;
  onQuickAction: (actionId: string) => void;
  contextActions: QuickAction[];
  isProcessing?: boolean;
  className?: string;
}

export const AIBubbleInterface: React.FC<AIBubbleInterfaceProps> = ({
  onClose,
  onQuickAction,
  contextActions,
  isProcessing = false,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount detection for proper hydration
  useEffect(() => {
    setMounted(true);
    // Auto-expand after mount
    const timer = setTimeout(() => setIsExpanded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle text input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      console.log('Text input submitted:', inputValue);
      // TODO: Send to AI processing endpoint
      setInputValue('');
    }
  }, [inputValue]);

  // Handle quick action click
  const handleActionClick = useCallback((action: QuickAction) => {
    onQuickAction(action.id);
  }, [onQuickAction]);

  // Don't render until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'ai-bubble-interface',
        isExpanded && 'ai-bubble-interface--expanded',
        isProcessing && 'ai-bubble-interface--processing',
        className
      )}
    >
      {/* Interface Header */}
      <div className="ai-bubble-interface__header">
        <div className="ai-bubble-interface__title">
          <Icons.Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">RIX Assistant</span>
        </div>
        
        <button
          onClick={onClose}
          className="ai-bubble-interface__close"
          aria-label="Close AI assistant"
          title="Close"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="ai-bubble-interface__actions">
        <div className="ai-bubble-interface__actions-title">
          <span className="text-xs font-medium text-secondary">Quick Actions</span>
        </div>
        
        <div className="ai-bubble-interface__actions-grid">
          {contextActions.map((action) => {
            const IconComponent = iconMap[action.icon] || Icons.CheckSquare;
            
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className="ai-bubble-action-button"
                title={action.description || action.label}
                aria-label={action.label}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-xs">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Input Section */}
      <div className="ai-bubble-interface__input">
        <form onSubmit={handleSubmit} className="ai-bubble-interface__form">
          <div className="ai-bubble-interface__input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask RIX anything..."
              className="ai-bubble-interface__text-input"
              disabled={isProcessing}
            />
            
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="ai-bubble-interface__send-button"
              aria-label="Send message"
            >
              <Icons.Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Voice Input Hint */}
      <div className="ai-bubble-interface__hint">
        <Icons.Mic className="w-3 h-3 text-muted" />
        <span className="text-xs text-muted">Or use voice input</span>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="ai-bubble-interface__processing">
          <div className="processing-dots">
            <div className="processing-dot" />
            <div className="processing-dot" />
            <div className="processing-dot" />
          </div>
          <span className="text-xs text-muted">Processing...</span>
        </div>
      )}
    </div>
  );
};

export default AIBubbleInterface;