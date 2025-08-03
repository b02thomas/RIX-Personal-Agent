'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useChatStore, Message } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Dynamic imports for chat components
const MessageList = dynamic(() => import('./message-list').then(mod => ({ default: mod.MessageList })), {
  loading: () => <div className="flex-1 flex items-center justify-center"><div className="text-sm text-muted-foreground">Nachrichten werden geladen...</div></div>,
  ssr: false
});

const InputArea = dynamic(() => import('./input-area').then(mod => ({ default: mod.InputArea })), {
  loading: () => <div className="h-12 bg-muted animate-pulse rounded"></div>,
  ssr: false
});

const VoiceRecorder = dynamic(() => import('./voice-recorder').then(mod => ({ default: mod.VoiceRecorder })), {
  loading: () => <div className="w-10 h-10 bg-muted animate-pulse rounded-full"></div>,
  ssr: false
});

// Dynamic icon imports
const Icons = {
  Plus: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Plus })), { ssr: false }),
  Trash2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trash2 })), { ssr: false })
};

interface ChatContainerProps {
  conversationId?: string;
  className?: string;
}

export function ChatContainer({ conversationId, className }: ChatContainerProps) {
  const { user } = useAuthStore();
  const {
    messages,
    isTyping,
    isLoading,
    setMessages,
    addMessage,
    setTyping,
    setLoading,
    setError,
    clearMessages
  } = useChatStore();

  const [isRecording, setIsRecording] = useState(false);

  // Wrap loadConversation with useCallback to prevent unnecessary re-renders
  const loadConversation = useCallback(async (convId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${convId}`);
      
      if (!response.ok) {
        throw new Error('Konversation konnte nicht geladen werden');
      }

      const data = await response.json();
      
      // Transform database messages to store format
      const transformedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.message_type,
        isFromAi: msg.is_from_ai,
        createdAt: new Date(msg.created_at),
        firstName: msg.first_name,
        lastName: msg.last_name,
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Fehler beim Laden der Konversation');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setMessages, setError]);

  // Load conversation messages
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      clearMessages();
    }
  }, [conversationId, loadConversation, clearMessages]);

  const sendMessage = async (content: string, messageType: 'text' | 'voice' = 'text') => {
    if (!conversationId) {
      // Create new conversation
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: content.substring(0, 50) + '...' }),
        });

        if (!response.ok) {
          throw new Error('Konversation konnte nicht erstellt werden');
        }

        const data = await response.json();
        // TODO: Update conversation ID in store
        // setCurrentConversation(data.conversation.id);
      } catch (error) {
        console.error('Error creating conversation:', error);
        setError('Fehler beim Erstellen der Konversation');
        return;
      }
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      messageType,
      isFromAi: false,
      createdAt: new Date(),
      firstName: user?.firstName,
      lastName: user?.lastName,
    };

    addMessage(userMessage);

    // Send to API
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType }),
      });

      if (!response.ok) {
        throw new Error('Nachricht konnte nicht gesendet werden');
      }

      // Show typing indicator
      setTyping(true);

      // TODO: Handle AI response via WebSocket or polling
      // For now, simulate AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Ich verstehe Ihre Anfrage. Lassen Sie mich das für Sie bearbeiten...',
          messageType: 'text',
          isFromAi: true,
          createdAt: new Date(),
        };
        addMessage(aiMessage);
        setTyping(false);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Fehler beim Senden der Nachricht');
      setTyping(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64 for API
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result as string;
        sendMessage(base64Audio, 'voice');
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing voice recording:', error);
      setError('Fehler bei der Sprachverarbeitung');
    }
  };

  const handleVoiceError = (error: string) => {
    setError(error);
  };

  const createNewConversation = () => {
    clearMessages();
    // TODO: Create new conversation and update ID
  };

  const deleteConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Konversation konnte nicht gelöscht werden');
      }

      clearMessages();
      // TODO: Update conversation list
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Fehler beim Löschen der Konversation');
    }
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chat mit RIX</CardTitle>
            <CardDescription>
              Ihr persönlicher AI Assistent
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={createNewConversation}
              title="Neue Konversation"
            >
              <Icons.Plus className="h-4 w-4" />
            </Button>
            {conversationId && (
              <Button
                variant="outline"
                size="icon"
                onClick={deleteConversation}
                title="Konversation löschen"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <MessageList messages={messages} isTyping={isTyping} />
        
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center gap-2">
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecording}
              onRecordingError={handleVoiceError}
              disabled={isLoading}
            />
            <InputArea
              onSendMessage={sendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 