// /Users/benediktthomas/RIX Personal Agent/RIX/src/app/components/ChatInterface.tsx
// Modern chat interface with RIX branding and glassmorphism design
// Provides seamless conversation experience with AI assistant
// RELEVANT FILES: chat-container.tsx, message-list.tsx, input-area.tsx, voice-recorder.tsx

'use client';

import React, { useState } from 'react';
import { ChatContainer } from '@/components/chat/chat-container';

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string>('demo-conversation');

  return (
    <div className={`h-full bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/40 overflow-hidden ${className || ''}`}>
      <div className="h-full flex flex-col">
        {/* Chat Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-700/30 bg-gray-800/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* RIX AI Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" className="text-white">
                <path d="M13 3 L8 12 H11 L10 21 L15 12 H12 L13 3 Z" fill="currentColor" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-white tracking-wide">RIX Assistant</h2>
              <p className="text-sm text-gray-400">Bereit für Ihre Anfragen</p>
            </div>
            
            {/* Status Indicator */}
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden">
          <ChatContainer 
            conversationId={currentConversationId}
            className="h-full border-0 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}