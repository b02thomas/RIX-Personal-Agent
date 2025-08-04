// /frontend-fixes/components/RIXChatInterface.tsx
// Complete chat interface with voice integration, message handling, and German language support
// Features real-time messaging, voice transcription, and integration with Main Agent
// RELEVANT FILES: VoiceDashboard.tsx, chat-container.tsx, message-bubble.tsx, voice-recorder.tsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance optimization
const Icons = {
  Send: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Send })), { ssr: false }),
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  MicOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MicOff })), { ssr: false }),
  Volume2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Volume2 })), { ssr: false }),
  VolumeX: dynamic(() => import('lucide-react').then(mod => ({ default: mod.VolumeX })), { ssr: false }),
  Bot: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Bot })), { ssr: false }),
  User: dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })), { ssr: false }),
  Copy: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Copy })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Trash2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trash2 })), { ssr: false }),
  Loader2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Loader2 })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false })
};

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'voice';
  language?: 'de' | 'en';
  metadata?: {
    voiceTranscript?: string;
    processingTime?: number;
    confidence?: number;
  };
}

interface RIXChatInterfaceProps {
  className?: string;
  voiceEnabled?: boolean;
  initialLanguage?: 'de' | 'en';
  onLanguageChange?: (language: 'de' | 'en') => void;
  maxMessages?: number;
}

export const RIXChatInterface: React.FC<RIXChatInterfaceProps> = ({
  className,
  voiceEnabled = false,
  initialLanguage = 'de',
  onLanguageChange,
  maxMessages = 50
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState<'de' | 'en'>(initialLanguage);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [mounted, setMounted] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice support check
  const isVoiceSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  // Initialize voice services
  useEffect(() => {
    setMounted(true);
    
    if (isVoiceSupported && voiceEnabled) {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'de' ? 'de-DE' : 'en-US';

      // Initialize Speech Synthesis
      synthRef.current = window.speechSynthesis;

      // Setup recognition handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleSendMessage(transcript, 'voice');
          setTranscript('');
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setError(`Spracherkennung Fehler: ${event.error}`);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language, voiceEnabled, transcript]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage: 'de' | 'en') => {
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
    
    // Update recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLanguage === 'de' ? 'de-DE' : 'en-US';
    }
  }, [onLanguageChange]);

  // Send message to Main Agent
  const handleSendMessage = useCallback(async (
    content: string, 
    type: 'text' | 'voice' = 'text'
  ) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      type,
      language,
      metadata: type === 'voice' ? { voiceTranscript: content } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          type,
          language,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`Server Fehler: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.message || 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
        language,
        metadata: {
          processingTime,
          confidence: data.confidence
        }
      };

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // Limit message history
        return newMessages.length > maxMessages 
          ? newMessages.slice(-maxMessages) 
          : newMessages;
      });

      // Speak response if voice input was used
      if (type === 'voice' && data.message) {
        speakText(data.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(`Fehler beim Senden der Nachricht: ${errorMessage}`);
      
      const errorResponse: Message = {
        id: `error-${Date.now()}`,
        content: `Entschuldigung, es gab einen Fehler: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
        language
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, language, messages, maxMessages]);

  // Handle text input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue, 'text');
  }, [inputValue, handleSendMessage]);

  // Start voice recognition
  const startListening = useCallback(() => {
    if (!isVoiceSupported || !voiceEnabled || !recognitionRef.current) {
      setError('Spracherkennung nicht verfügbar');
      return;
    }

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      setError('Fehler beim Starten der Spracherkennung');
    }
  }, [isVoiceSupported, voiceEnabled]);

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Speak text using TTS
  const speakText = useCallback((text: string) => {
    if (!synthRef.current || !text || !voiceEnabled) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'de' ? 'de-DE' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError('Fehler bei der Sprachausgabe');
    };

    synthRef.current.speak(utterance);
  }, [language, voiceEnabled]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Copy message content
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-96 bg-rix-bg-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full max-h-[600px]', className)}>
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Bot className="w-5 h-5 text-rix-accent-primary" />
              <span className="font-medium text-rix-text-primary">RIX Chat</span>
              <Badge variant="outline" className="text-xs">
                {language.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex bg-rix-bg-secondary rounded-lg p-1">
                <Button
                  variant={language === 'de' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleLanguageChange('de')}
                  className="text-xs px-2 py-1"
                >
                  DE
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleLanguageChange('en')}
                  className="text-xs px-2 py-1"
                >
                  EN
                </Button>
              </div>
              
              {/* Clear Messages */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
                className="text-xs"
              >
                <Icons.Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages Container */}
        <CardContent className="flex-1 overflow-y-auto min-h-0 pb-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Icons.AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Voice Transcript */}
          {transcript && (
            <div className="mb-4 p-3 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <span className="font-medium">Sie sprechen:</span> {transcript}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-rix-text-secondary">
                <Icons.Bot className="w-12 h-12 mx-auto mb-4 text-rix-text-tertiary" />
                <p className="text-lg font-medium mb-2">Willkommen bei RIX!</p>
                <p className="text-sm">
                  Stellen Sie mir eine Frage oder verwenden Sie die Spracherkennung.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user' 
                      ? 'bg-rix-accent-primary order-2' 
                      : 'bg-rix-bg-secondary border border-rix-border-primary'
                  )}>
                    {message.role === 'user' ? (
                      <Icons.User className="w-4 h-4 text-white" />
                    ) : (
                      <Icons.Bot className="w-4 h-4 text-rix-accent-primary" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={cn(
                    'flex-1 max-w-[80%]',
                    message.role === 'user' && 'order-1'
                  )}>
                    <div className={cn(
                      'rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-rix-accent-primary text-white ml-auto'
                        : 'bg-rix-bg-secondary border border-rix-border-primary'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Message Metadata */}
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <div className="flex items-center gap-2">
                          <span>{message.timestamp.toLocaleTimeString('de-DE')}</span>
                          {message.type === 'voice' && (
                            <Badge variant="outline" className="text-xs">
                              Voice
                            </Badge>
                          )}
                          {message.metadata?.processingTime && (
                            <span>{message.metadata.processingTime}ms</span>
                          )}
                        </div>
                        
                        {/* Message Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="h-6 w-6 p-0 hover:bg-white/20"
                          >
                            <Icons.Copy className="w-3 h-3" />
                          </Button>
                          
                          {message.role === 'assistant' && voiceEnabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => speakText(message.content)}
                              disabled={isSpeaking}
                              className="h-6 w-6 p-0 hover:bg-white/20"
                            >
                              <Icons.Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-rix-bg-secondary border border-rix-border-primary flex items-center justify-center">
                  <Icons.Bot className="w-4 h-4 text-rix-accent-primary" />
                </div>
                <div className="bg-rix-bg-secondary border border-rix-border-primary rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-rix-text-secondary">RIX denkt nach...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="mt-4 p-4 border-t border-rix-border-primary bg-rix-surface rounded-lg">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={language === 'de' 
                ? "Schreiben Sie eine Nachricht..." 
                : "Type your message..."
              }
              disabled={isLoading || isListening}
              className="w-full"
            />
          </div>
          
          {/* Voice Button */}
          {voiceEnabled && isVoiceSupported && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={cn(
                'px-3',
                isListening && 'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              {isListening ? (
                <Icons.MicOff className="w-4 h-4" />
              ) : (
                <Icons.Mic className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Stop Speaking Button */}
          {isSpeaking && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopSpeaking}
              className="px-3"
            >
              <Icons.VolumeX className="w-4 h-4" />
            </Button>
          )}
          
          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isListening}
            size="sm"
            className="px-4"
          >
            {isLoading ? (
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Icons.Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RIXChatInterface;