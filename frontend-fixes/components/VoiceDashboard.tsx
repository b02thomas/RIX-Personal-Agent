// /frontend-fixes/components/VoiceDashboard.tsx
// Voice-enhanced dashboard component with mode switching (overview/chat/voice)
// Features Web Speech API integration, fallback handling, and German language support
// RELEVANT FILES: RIXChatInterface.tsx, voice-recorder.tsx, useAuthPersistence.ts

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { RIXChatInterface } from './RIXChatInterface';

// Dynamic icon imports for performance optimization
const Icons = {
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  MicOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MicOff })), { ssr: false }),
  Volume2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Volume2 })), { ssr: false }),
  VolumeX: dynamic(() => import('lucide-react').then(mod => ({ default: mod.VolumeX })), { ssr: false }),
  MessageSquare: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MessageSquare })), { ssr: false }),
  BarChart3: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 })), { ssr: false }),
  Brain: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Brain })), { ssr: false }),
  Waveform: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Waveform })), { ssr: false }),
  Play: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Play })), { ssr: false }),
  Square: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Square })), { ssr: false }),
  RotateCcw: dynamic(() => import('lucide-react').then(mod => ({ default: mod.RotateCcw })), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Settings })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false })
};

type DashboardMode = 'overview' | 'chat' | 'voice';

interface VoiceSession {
  id: string;
  transcript: string;
  response?: string;
  timestamp: Date;
  duration?: number;
  language: 'de' | 'en';
}

interface VoiceDashboardProps {
  className?: string;
  initialMode?: DashboardMode;
  onModeChange?: (mode: DashboardMode) => void;
}

export const VoiceDashboard: React.FC<VoiceDashboardProps> = ({
  className,
  initialMode = 'overview',
  onModeChange
}) => {
  const [currentMode, setCurrentMode] = useState<DashboardMode>(initialMode);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [mounted, setMounted] = useState(false);

  // Voice API references
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // Check for Web Speech API support
  const isVoiceSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  useEffect(() => {
    setMounted(true);
    
    if (isVoiceSupported) {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'de' ? 'de-DE' : 'en-US';

      // Initialize Speech Synthesis
      synthRef.current = window.speechSynthesis;

      // Setup recognition event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        sessionStartRef.current = new Date();
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
          handleVoiceInput(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setError(`Spracherkennung Fehler: ${event.error}`);
      };
    }

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language, transcript]);

  const handleModeChange = useCallback((mode: DashboardMode) => {
    setCurrentMode(mode);
    onModeChange?.(mode);
    
    // Reset voice states when switching modes
    if (mode !== 'voice') {
      stopListening();
      stopSpeaking();
    }
  }, [onModeChange]);

  const startListening = useCallback(() => {
    if (!isVoiceSupported || !recognitionRef.current) {
      setError('Spracherkennung wird nicht unterstützt');
      return;
    }

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      setError('Fehler beim Starten der Spracherkennung');
    }
  }, [isVoiceSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const handleVoiceInput = useCallback(async (voiceText: string) => {
    if (!voiceText.trim()) return;

    setIsProcessing(true);
    
    try {
      // Send voice input to Main Agent
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: voiceText,
          type: 'voice',
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Sprachverarbeitung');
      }

      const data = await response.json();
      
      // Create voice session
      const session: VoiceSession = {
        id: `voice-${Date.now()}`,
        transcript: voiceText,
        response: data.message,
        timestamp: new Date(),
        duration: sessionStartRef.current ? 
          Math.round((Date.now() - sessionStartRef.current.getTime()) / 1000) : undefined,
        language
      };

      setVoiceSessions(prev => [session, ...prev.slice(0, 9)]); // Keep last 10 sessions
      
      // Speak the response
      if (data.message) {
        speakText(data.message);
      }
    } catch (error) {
      setError('Fehler bei der Sprachverarbeitung');
      console.error('Voice processing error:', error);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  }, [language]);

  const speakText = useCallback((text: string) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
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
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const clearSessions = useCallback(() => {
    setVoiceSessions([]);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-rix-bg-secondary rounded w-1/3 mb-2" />
          <div className="h-4 bg-rix-bg-secondary rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-rix-text-primary">Voice Dashboard</h1>
          <p className="text-rix-text-secondary">
            Sprachgesteuerte Interaktion mit RIX
          </p>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex bg-rix-surface border border-rix-border-primary rounded-lg p-1">
          <Button
            variant={currentMode === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('overview')}
            className="flex items-center gap-2"
          >
            <Icons.BarChart3 className="w-4 h-4" />
            Übersicht
          </Button>
          <Button
            variant={currentMode === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('chat')}
            className="flex items-center gap-2"
          >
            <Icons.MessageSquare className="w-4 h-4" />
            Chat
          </Button>
          <Button
            variant={currentMode === 'voice' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleModeChange('voice')}
            className="flex items-center gap-2"
          >
            <Icons.Mic className="w-4 h-4" />
            Voice
          </Button>
        </div>
      </div>

      {/* Voice Not Supported Warning */}
      {!isVoiceSupported && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-amber-800 dark:text-amber-200">
                Spracherkennung wird in diesem Browser nicht unterstützt. 
                Bitte verwenden Sie Chrome, Edge oder Safari für die beste Erfahrung.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Content */}
      {currentMode === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Voice Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.Brain className="w-5 h-5" />
                Voice Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Spracherkennung</span>
                  <Badge 
                    variant={isVoiceSupported ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {isVoiceSupported ? 'Verfügbar' : 'Nicht verfügbar'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sprache</span>
                  <Badge variant="outline" className="text-xs">
                    {language === 'de' ? 'Deutsch' : 'English'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sessions</span>
                  <Badge variant="secondary" className="text-xs">
                    {voiceSessions.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Voice Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.Mic className="w-5 h-5" />
                Schnellaktionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={!isVoiceSupported || isProcessing}
                className={cn(
                  'w-full justify-start',
                  isListening && 'bg-red-500 hover:bg-red-600'
                )}
              >
                {isListening ? (
                  <>
                    <Icons.Square className="w-4 h-4 mr-2" />
                    Stoppen
                  </>
                ) : (
                  <>
                    <Icons.Mic className="w-4 h-4 mr-2" />
                    Sprechen starten
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLanguage(lang => lang === 'de' ? 'en' : 'de')}
                className="w-full justify-start"
              >
                <Icons.Settings className="w-4 h-4 mr-2" />
                Sprache wechseln
              </Button>
              
              <Button
                variant="outline"
                onClick={clearSessions}
                disabled={voiceSessions.length === 0}
                className="w-full justify-start"
              >
                <Icons.RotateCcw className="w-4 h-4 mr-2" />
                Sessions löschen
              </Button>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.Waveform className="w-5 h-5" />
                Letzte Sessions
              </CardTitle>
              <CardDescription>
                Ihre letzten Voice-Interaktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voiceSessions.length === 0 ? (
                <p className="text-rix-text-secondary text-sm">
                  Noch keine Voice-Sessions verfügbar
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {voiceSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border border-rix-border-primary rounded-lg bg-rix-bg-secondary"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {session.language.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-rix-text-tertiary">
                          {session.timestamp.toLocaleTimeString('de-DE')}
                        </span>
                      </div>
                      <p className="text-sm text-rix-text-primary mb-2">
                        "{session.transcript}"
                      </p>
                      {session.response && (
                        <p className="text-xs text-rix-text-secondary">
                          → {session.response}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentMode === 'chat' && (
        <RIXChatInterface 
          voiceEnabled={isVoiceSupported}
          initialLanguage={language}
          onLanguageChange={setLanguage}
        />
      )}

      {currentMode === 'voice' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Icons.Mic className="w-6 h-6" />
                Voice Interface
              </CardTitle>
              <CardDescription>
                Sprechen Sie mit RIX - drücken Sie den Button zum Starten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Voice Controls */}
              <div className="flex flex-col items-center space-y-4">
                {/* Main Voice Button */}
                <Button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!isVoiceSupported || isProcessing}
                  size="lg"
                  className={cn(
                    'w-32 h-32 rounded-full text-lg font-medium',
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-rix-accent-primary hover:bg-blue-700',
                    isProcessing && 'animate-spin'
                  )}
                >
                  {isProcessing ? (
                    <Icons.RotateCcw className="w-8 h-8" />
                  ) : isListening ? (
                    <Icons.Square className="w-8 h-8" />
                  ) : (
                    <Icons.Mic className="w-8 h-8" />
                  )}
                </Button>

                {/* Status Text */}
                <div className="text-center">
                  {isProcessing ? (
                    <p className="text-rix-accent-primary font-medium">Verarbeitung...</p>
                  ) : isListening ? (
                    <p className="text-red-500 font-medium">Hört zu... Sprechen Sie jetzt!</p>
                  ) : isSpeaking ? (
                    <p className="text-green-500 font-medium">RIX spricht...</p>
                  ) : (
                    <p className="text-rix-text-secondary">Bereit zum Zuhören</p>
                  )}
                </div>

                {/* Current Transcript */}
                {transcript && (
                  <div className="w-full p-4 border border-rix-border-primary rounded-lg bg-rix-bg-secondary">
                    <p className="text-sm text-rix-text-secondary mb-1">Sie sagen:</p>
                    <p className="text-rix-text-primary">{transcript}</p>
                  </div>
                )}

                {/* Speaker Controls */}
                {isSpeaking && (
                  <Button
                    onClick={stopSpeaking}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Icons.VolumeX className="w-4 h-4" />
                    Sprechen stoppen
                  </Button>
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-rix-text-secondary">Sprache:</span>
                <div className="flex bg-rix-bg-secondary rounded-lg p-1">
                  <Button
                    variant={language === 'de' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('de')}
                  >
                    Deutsch
                  </Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VoiceDashboard;