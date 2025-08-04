// /02-implementation/mobile-optimization/mobile-chat-interface.tsx
// Mobile-optimized chat interface with touch gestures and enhanced UX
// Provides full-screen mobile chat experience with voice input, haptic feedback, and keyboard optimization
// RELEVANT FILES: responsive-breakpoints.css, touch-optimizations.css, FloatingAISphere.tsx, mobile-navigation.tsx

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';

// Dynamic icon imports for performance
const Icons = {
  Send: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Send })), { ssr: false }),
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  MicOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MicOff })), { ssr: false }),
  Paperclip: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Paperclip })), { ssr: false }),
  MoreHorizontal: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MoreHorizontal })), { ssr: false }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), { ssr: false }),
  ArrowDown: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ArrowDown })), { ssr: false }),
  Copy: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Copy })), { ssr: false }),
  RefreshCw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RefreshCw })), { ssr: false }),
  Edit: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Edit })), { ssr: false }),
  Trash2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trash2 })), { ssr: false }),
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  Bot: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Bot })), { ssr: false })
};

interface MobileChatInterfaceProps {
  className?: string;
  conversationId?: string;
  isFullScreen?: boolean;
  onFullScreenToggle?: () => void;
}

// Haptic feedback utility
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
};

// Voice recognition hook
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      triggerHapticFeedback('medium');
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      triggerHapticFeedback('light');
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!recognitionRef.current
  };
};

export const MobileChatInterface: React.FC<MobileChatInterfaceProps> = ({
  className,
  conversationId,
  isFullScreen = false,
  onFullScreenToggle
}) => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    conversations, 
    currentConversationId,
    setCurrentConversation
  } = useChatStore();

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialViewportHeight = useRef<number>(0);

  // Voice recognition
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceRecognition();

  // Handle mount and initial setup
  useEffect(() => {
    setMounted(true);
    initialViewportHeight.current = window.visualViewport?.height || window.innerHeight;

    // Handle visual viewport changes (keyboard)
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialViewportHeight.current - currentHeight;
      setKeyboardHeight(Math.max(0, heightDiff));
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
    }
  }, []);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [transcript, isListening]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  }, []);

  // Handle scroll to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom && messages.length > 0);
  }, [messages.length]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsTyping(value.length > 0);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsTyping(false);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    triggerHapticFeedback('light');

    try {
      await sendMessage(message, currentConversationId || conversationId);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      triggerHapticFeedback('heavy');
    }
  }, [inputValue, isLoading, sendMessage, currentConversationId, conversationId, scrollToBottom]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle message actions
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    triggerHapticFeedback('light');
    setSelectedMessage(null);
  }, []);

  const handleRegenerateMessage = useCallback((messageId: string) => {
    // TODO: Implement message regeneration
    console.log('Regenerate message:', messageId);
    triggerHapticFeedback('medium');
    setSelectedMessage(null);
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    // TODO: Implement message deletion
    console.log('Delete message:', messageId);
    triggerHapticFeedback('heavy');
    setSelectedMessage(null);
  }, []);

  // Get current conversation messages
  const currentMessages = useMemo(() => {
    const convId = currentConversationId || conversationId;
    return messages.filter(msg => msg.conversationId === convId);
  }, [messages, currentConversationId, conversationId]);

  if (!mounted) {
    return null;
  }

  return (
    <div 
      className={cn(
        'mobile-chat-interface',
        isFullScreen && 'mobile-chat-interface--fullscreen',
        className
      )}
      style={{ 
        paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined 
      }}
    >
      {/* Chat Header */}
      <div className="mobile-chat-header mobile-safe-top">
        <div className="mobile-chat-header__content">
          <div className="mobile-chat-header__info">
            <h2 className="mobile-chat-header__title">
              RIX Assistant
            </h2>
            <p className="mobile-chat-header__subtitle">
              {isListening ? 'Höre zu...' : 'Bereit zu helfen'}
            </p>
          </div>
          
          <div className="mobile-chat-header__actions">
            {onFullScreenToggle && (
              <button
                onClick={onFullScreenToggle}
                className="mobile-touch-target mobile-chat-header__action"
                aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullScreen ? (
                  <Icons.X className="w-5 h-5" />
                ) : (
                  <Icons.MoreHorizontal className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="mobile-chat-messages"
        onScroll={handleScroll}
      >
        <div className="mobile-chat-messages__content">
          {currentMessages.length === 0 ? (
            // Empty state
            <div className="mobile-chat-empty">
              <div className="mobile-chat-empty__icon">
                <Icons.Bot className="w-12 h-12" />
              </div>
              <h3 className="mobile-chat-empty__title">
                Willkommen bei RIX
              </h3>
              <p className="mobile-chat-empty__description">
                Ich bin Ihr persönlicher AI-Assistent. Stellen Sie mir eine Frage oder bitten Sie um Hilfe bei Ihren Aufgaben.
              </p>
              <div className="mobile-chat-empty__suggestions">
                <button 
                  className="mobile-chat-suggestion-chip"
                  onClick={() => setInputValue('Zeige mir meine heutigen Aufgaben')}
                >
                  Heutige Aufgaben anzeigen
                </button>
                <button 
                  className="mobile-chat-suggestion-chip"
                  onClick={() => setInputValue('Erstelle eine neue Aufgabe')}
                >
                  Neue Aufgabe erstellen
                </button>
                <button 
                  className="mobile-chat-suggestion-chip"
                  onClick={() => setInputValue('Wie ist mein Tagesplan?')}
                >
                  Tagesplan prüfen
                </button>
              </div>
            </div>
          ) : (
            // Messages list
            currentMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'mobile-chat-message',
                  message.role === 'user' ? 'mobile-chat-message--user' : 'mobile-chat-message--assistant'
                )}
              >
                {/* Message Avatar */}
                <div className="mobile-chat-message__avatar">
                  {message.role === 'user' ? (
                    user?.firstName ? (
                      user.firstName.charAt(0).toUpperCase()
                    ) : (
                      <Icons.User className="w-4 h-4" />
                    )
                  ) : (
                    <Icons.Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content */}
                <div className="mobile-chat-message__content">
                  <div 
                    className="mobile-chat-message__bubble"
                    onLongPress={() => setSelectedMessage(message.id)}
                  >
                    <p className="mobile-chat-message__text">
                      {message.content}
                    </p>
                  </div>
                  
                  <div className="mobile-chat-message__meta">
                    <span className="mobile-chat-message__time">
                      {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Message Actions */}
                {selectedMessage === message.id && (
                  <div className="mobile-chat-message-actions">
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="mobile-touch-target mobile-chat-message-action"
                      aria-label="Copy message"
                    >
                      <Icons.Copy className="w-4 h-4" />
                    </button>
                    
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleRegenerateMessage(message.id)}
                        className="mobile-touch-target mobile-chat-message-action"
                        aria-label="Regenerate response"
                      >
                        <Icons.RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="mobile-touch-target mobile-chat-message-action mobile-chat-message-action--danger"
                      aria-label="Delete message"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="mobile-touch-target mobile-chat-message-action"
                      aria-label="Close actions"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="mobile-chat-message mobile-chat-message--assistant">
              <div className="mobile-chat-message__avatar">
                <Icons.Bot className="w-4 h-4" />
              </div>
              <div className="mobile-chat-message__content">
                <div className="mobile-chat-message__bubble">
                  <div className="mobile-chat-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="mobile-chat-scroll-to-bottom mobile-touch-target"
          aria-label="Scroll to bottom"
        >
          <Icons.ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Chat Input */}
      <div className="mobile-chat-input mobile-safe-bottom">
        <div className="mobile-chat-input__container">
          {/* Attachment Button */}
          <button
            className="mobile-touch-target mobile-chat-input__action"
            aria-label="Attach file"
            disabled={isLoading}
          >
            <Icons.Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="mobile-chat-input__field">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht eingeben..."
              className="mobile-chat-input__textarea"
              disabled={isLoading}
              rows={1}
            />
          </div>

          {/* Voice/Send Button */}
          <div className="mobile-chat-input__actions">
            {isSupported && inputValue.trim() === '' && (
              <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                className={cn(
                  'mobile-touch-target mobile-chat-input__voice',
                  isListening && 'mobile-chat-input__voice--active'
                )}
                aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
                disabled={isLoading}
              >
                {isListening ? (
                  <Icons.MicOff className="w-5 h-5" />
                ) : (
                  <Icons.Mic className="w-5 h-5" />
                )}
              </button>
            )}

            {(inputValue.trim() !== '' || !isSupported) && (
              <button
                onClick={handleSendMessage}
                className={cn(
                  'mobile-touch-target mobile-chat-input__send',
                  (!inputValue.trim() || isLoading) && 'mobile-chat-input__send--disabled'
                )}
                aria-label="Send message"
                disabled={!inputValue.trim() || isLoading}
              >
                <Icons.Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Voice Recording Indicator */}
        {isListening && (
          <div className="mobile-chat-voice-indicator">
            <div className="mobile-chat-voice-indicator__animation" />
            <span className="mobile-chat-voice-indicator__text">
              Sprechen Sie jetzt... (Loslassen zum Stoppen)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Long press hook
const useLongPress = (callback: () => void, delay = 500) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();
    }, delay);
  }, [callback, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
};

// Add long press to div props
declare module 'react' {
  interface HTMLAttributes<T> {
    onLongPress?: () => void;
  }
}

export default MobileChatInterface;