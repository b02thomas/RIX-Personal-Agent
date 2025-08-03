'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamic imports for better code splitting
const ChatContainer = dynamic(() => import('@/components/chat/chat-container').then(mod => ({ default: mod.ChatContainer })), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="text-sm text-muted-foreground">Chat wird geladen...</div></div>,
  ssr: false
});

const ConversationList = dynamic(() => import('@/components/chat/conversation-list').then(mod => ({ default: mod.ConversationList })), {
  loading: () => <div className="text-sm text-muted-foreground">Konversationen werden geladen...</div>,
  ssr: false
});

export default function VoiceChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(undefined);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="lg:block">
        <h1 className="text-2xl lg:text-3xl font-bold">Voice/Chat Hub</h1>
        <p className="text-sm lg:text-base text-muted-foreground mt-1">
          Ihre primäre Konversationsschnittstelle mit RIX
        </p>
      </div>

      {/* Mobile: Show conversation list as drawer/modal when needed */}
      {/* Desktop: Side-by-side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
        {/* Conversation List - Desktop only for now */}
        <div className="hidden lg:block">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            selectedConversationId={selectedConversationId}
          />
        </div>

        {/* Chat Container - Full width on mobile */}
        <div className="lg:col-span-3 h-full">
          <ChatContainer 
            conversationId={selectedConversationId}
            className="h-full"
          />
        </div>
      </div>

      {/* Mobile: Quick action for new conversation */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button
          onClick={handleNewConversation}
          className={cn(
            'bg-primary text-primary-foreground',
            'w-14 h-14 rounded-full shadow-lg',
            'flex items-center justify-center',
            'touch-manipulation active:scale-95',
            'transition-transform duration-200'
          )}
        >
          <span className="text-2xl">+</span>
        </button>
      </div>
    </div>
  );
} 