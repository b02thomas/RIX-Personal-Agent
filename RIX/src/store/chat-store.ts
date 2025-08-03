import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  messageType: 'text' | 'voice' | 'image';
  isFromAi: boolean;
  createdAt: Date;
  firstName?: string;
  lastName?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessageAt?: Date;
}

interface ChatState {
  // Current conversation
  currentConversationId: string | null;
  conversations: Conversation[];
  messages: Message[];
  
  // UI State
  isLoading: boolean;
  isTyping: boolean;
  isRecording: boolean;
  error: string | null;
  
  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  deleteConversation: (conversationId: string) => void;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  currentConversationId: null,
  conversations: [],
  messages: [],
  isLoading: false,
  isTyping: false,
  isRecording: false,
  error: null,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentConversation: (conversationId) => 
        set({ currentConversationId: conversationId }),

      setConversations: (conversations) => 
        set({ conversations }),

      addConversation: (conversation) => 
        set((state) => ({
          conversations: [conversation, ...state.conversations]
        })),

      updateConversation: (conversationId, updates) =>
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          )
        })),

      deleteConversation: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.filter(conv => conv.id !== conversationId),
          currentConversationId: state.currentConversationId === conversationId ? null : state.currentConversationId
        })),

      setMessages: (messages) => 
        set({ messages }),

      addMessage: (message) => 
        set((state) => ({
          messages: [...state.messages, message]
        })),

      updateMessage: (messageId, updates) =>
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        })),

      clearMessages: () => 
        set({ messages: [] }),

      setLoading: (isLoading) => 
        set({ isLoading }),

      setTyping: (isTyping) => 
        set({ isTyping }),

      setRecording: (isRecording) => 
        set({ isRecording }),

      setError: (error) => 
        set({ error }),

      reset: () => 
        set(initialState),
    }),
    {
      name: 'rix-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
); 