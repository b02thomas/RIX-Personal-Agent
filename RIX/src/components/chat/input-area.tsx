'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  onSendMessage: (content: string, messageType?: 'text' | 'voice') => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  disabled?: boolean;
}

export function InputArea({ 
  onSendMessage, 
  onStartRecording, 
  onStopRecording, 
  isRecording = false,
  disabled = false 
}: InputAreaProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      onStopRecording?.();
    } else {
      onStartRecording?.();
    }
  };

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex gap-3 p-4 border-t bg-background/95 backdrop-blur-sm safe-area-inset-bottom"
    >
      {/* Voice Recording Button - Enhanced for touch */}
      <Button
        type="button"
        variant={isRecording ? 'destructive' : 'outline'}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled}
        className={cn(
          'flex-shrink-0 touch-manipulation',
          'min-h-[48px] min-w-[48px]',
          'active:scale-95 transition-transform',
          isRecording && 'animate-pulse'
        )}
      >
        {isRecording ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {/* Message Input - Mobile optimized */}
      <Input
        ref={inputRef}
        type="text"
        placeholder="Nachricht eingeben..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled || isRecording}
        className={cn(
          'flex-1 min-h-[48px] text-base',
          'touch-manipulation',
          'focus:ring-2 focus:ring-primary/20'
        )}
        style={{ fontSize: '16px' }} // Prevents iOS zoom on input focus
      />

      {/* Send Button - Enhanced for touch */}
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !message.trim() || isRecording}
        className={cn(
          'flex-shrink-0 touch-manipulation',
          'min-h-[48px] min-w-[48px]',
          'active:scale-95 transition-transform',
          !message.trim() && 'opacity-50'
        )}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
} 