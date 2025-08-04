// /01-implementation/ai-sphere/VoiceInput.tsx
// Web Speech API integration component for voice recognition
// Provides real-time voice input with visual feedback and error handling
// RELEVANT FILES: FloatingAISphere.tsx, AIBubbleInterface.tsx, sphere-animations.css

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic icon imports for performance
const Icons = {
  Mic: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mic })), { ssr: false }),
  MicOff: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MicOff })), { ssr: false }),
  Volume2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Volume2 })), { ssr: false }),
  AlertCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle })), { ssr: false })
};

interface VoiceInputProps {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
  language?: string;
  continuous?: boolean;
  className?: string;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

// Extended window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(
    type: 'start',
    listener: (event: Event) => void
  ): void;
  addEventListener(
    type: 'end',
    listener: (event: Event) => void
  ): void;
  addEventListener(
    type: 'result',
    listener: (event: SpeechRecognitionEvent) => void
  ): void;
  addEventListener(
    type: 'error',
    listener: (event: SpeechRecognitionErrorEvent) => void
  ): void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onStart,
  onEnd,
  onResult,
  onError,
  isActive = false,
  language = 'en-US',
  continuous = false,
  className
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Check for Web Speech API support
  useEffect(() => {
    setMounted(true);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      // Event handlers
      recognition.addEventListener('start', handleStart);
      recognition.addEventListener('end', handleEnd);
      recognition.addEventListener('result', handleResult);
      recognition.addEventListener('error', handleError);
    } else {
      setError('Speech recognition not supported in this browser');
      onError?.('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.removeEventListener('start', handleStart);
        recognitionRef.current.removeEventListener('end', handleEnd);
        recognitionRef.current.removeEventListener('result', handleResult);
        recognitionRef.current.removeEventListener('error', handleError);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, continuous, onError]);

  // Handle recognition start
  const handleStart = useCallback(() => {
    setIsListening(true);
    setError(null);
    setTranscript('');
    onStart?.();
  }, [onStart]);

  // Handle recognition end
  const handleEnd = useCallback(() => {
    setIsListening(false);
    onEnd?.();
  }, [onEnd]);

  // Handle recognition result
  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    const fullTranscript = finalTranscript || interimTranscript;
    setTranscript(fullTranscript);
    
    if (onResult) {
      onResult(fullTranscript, !!finalTranscript);
    }

    // Auto-stop after silence (for non-continuous mode)
    if (!continuous && interimTranscript) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 2000); // Stop after 2 seconds of silence
    }
  }, [onResult, continuous]);

  // Handle recognition error
  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    const errorMessage = `Speech recognition error: ${event.error} - ${event.message}`;
    setError(errorMessage);
    setIsListening(false);
    onError?.(errorMessage);
  }, [onError]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      const errorMessage = 'Failed to start speech recognition';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [isSupported, isListening, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    recognitionRef.current.stop();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isListening]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Auto-start when isActive prop changes
  useEffect(() => {
    if (mounted && isSupported) {
      if (isActive && !isListening) {
        startListening();
      } else if (!isActive && isListening) {
        stopListening();
      }
    }
  }, [isActive, isListening, isSupported, mounted, startListening, stopListening]);

  // Don't render until mounted
  if (!mounted) {
    return null;
  }

  // Render error state
  if (!isSupported || error) {
    return (
      <div className={cn('voice-input voice-input--error', className)}>
        <div className="voice-input__error">
          <Icons.AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">
            {error || 'Voice input not available'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('voice-input', isListening && 'voice-input--active', className)}>
      {/* Voice Control Button */}
      <button
        onClick={toggleListening}
        className={cn(
          'voice-input__button',
          isListening && 'voice-input__button--active'
        )}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        title={isListening ? 'Click to stop listening' : 'Click to start voice input'}
      >
        <div className="voice-input__button-background" />
        
        <div className="voice-input__button-icon">
          {isListening ? (
            <Icons.MicOff className="w-5 h-5" />
          ) : (
            <Icons.Mic className="w-5 h-5" />
          )}
        </div>

        {/* Voice Visualizer - Audio Wave Animation */}
        {isListening && (
          <div className="voice-input__visualizer">
            <div className="voice-wave" />
            <div className="voice-wave" />
            <div className="voice-wave" />
            <div className="voice-wave" />
            <div className="voice-wave" />
          </div>
        )}
      </button>

      {/* Transcript Display */}
      {transcript && (
        <div className="voice-input__transcript">
          <div className="voice-input__transcript-content">
            <Icons.Volume2 className="w-3 h-3 text-primary" />
            <span className="text-xs">{transcript}</span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="voice-input__status">
        <div 
          className={cn(
            'voice-input__status-indicator',
            isListening && 'voice-input__status-indicator--active'
          )} 
        />
        <span className="text-xs text-muted">
          {isListening ? 'Listening...' : 'Voice ready'}
        </span>
      </div>
    </div>
  );
};

export default VoiceInput;