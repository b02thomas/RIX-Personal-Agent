// /Users/benediktthomas/RIX Personal Agent/RIX/src/app/components/SphereWidget.tsx
// Floating AI sphere widget with voice input and quick actions
// Provides contextual AI assistance and voice interaction capabilities
// RELEVANT FILES: FloatingAISphere.tsx, voice-recorder.tsx, sphere-animations.css, dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Brain, 
  Zap, 
  MessageCircle,
  Settings
} from 'lucide-react';

interface SphereWidgetProps {
  className?: string;
}

export function SphereWidget({ className }: SphereWidgetProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<string>('');

  // Voice recognition state
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)) {
      const SpeechRecognitionClass = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognitionInstance = new SpeechRecognitionClass();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'de-DE';

        recognitionInstance.onstart = () => {
          setIsListening(true);
        };

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleVoiceInput(transcript);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const handleVoiceInput = async (transcript: string) => {
    setIsProcessing(true);
    setLastInteraction(`Spracheingabe: "${transcript}"`);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setLastInteraction('Befehl verarbeitet');
    }, 2000);
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white tracking-wide">RIX Assistant</h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Aktiv</span>
        </div>
      </div>

      {/* AI Sphere */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          {/* Main Sphere */}
          <div className={`
            w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 
            flex items-center justify-center shadow-2xl cursor-pointer transition-all duration-300
            ${isListening ? 'scale-110 shadow-blue-500/50' : 'hover:scale-105'}
            ${isProcessing ? 'animate-pulse' : ''}
          `} onClick={toggleListening}>
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
            
            {/* Ripple Effect */}
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
            )}
          </div>
          
          {/* Processing Indicator */}
          {isProcessing && (
            <div className="absolute -inset-2 rounded-full border-2 border-cyan-400 animate-spin" />
          )}
        </div>
        
        {/* Status Text */}
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-white">
            {isListening ? 'Ich höre...' : 
             isProcessing ? 'Verarbeite...' : 
             'Tippen Sie zum Sprechen'}
          </p>
          {lastInteraction && (
            <p className="text-xs text-gray-400 mt-1">{lastInteraction}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200">
          <Brain className="w-4 h-4 text-blue-400" />
          Intelligente Analyse
        </button>
        
        <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200">
          <MessageCircle className="w-4 h-4 text-green-400" />
          Chat starten
        </button>
        
        <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200">
          <Zap className="w-4 h-4 text-purple-400" />
          Schnellbefehl
        </button>
        
        <button className="w-full flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg text-white text-sm transition-all duration-200">
          <Settings className="w-4 h-4 text-gray-400" />
          Einstellungen
        </button>
      </div>
      
      {/* Voice Recognition Notice */}
      {!recognition && (
        <div className="mt-4 p-2 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            Spracherkennung in diesem Browser nicht verfügbar
          </p>
        </div>
      )}
    </div>
  );
}