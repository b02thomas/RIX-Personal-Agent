'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { Message } from '@/store/chat-store';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl mb-2">👋</div>
            <p className="text-lg font-medium">Willkommen bei RIX!</p>
            <p className="text-sm">Starten Sie eine Konversation mit Ihrem AI Assistenten.</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLastMessage={index === messages.length - 1}
            />
          ))}
          <TypingIndicator isVisible={isTyping} />
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
} 