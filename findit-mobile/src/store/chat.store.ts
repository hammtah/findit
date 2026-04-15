// src/store/chat.store.ts
import { create } from 'zustand';
import { ConversationSummary, Message } from '../types/api.types';

interface ChatState {
  conversations: ConversationSummary[];
  messages: Record<string, Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: Record<string, boolean>;
}

interface ChatActions {
  setConversations: (convs: ConversationSummary[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateConversation: (conv: Partial<ConversationSummary> & { id: string }) => void;
  markConversationRead: (conversationId: string, readerId: string) => void;
  getTotalUnread: () => number;
  reset: () => void;
}

const initialState: ChatState = {
  conversations: [],
  messages: {},
  isLoadingConversations: false,
  isLoadingMessages: {},
};

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  ...initialState,

  setConversations: (convs) => set({ conversations: convs }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({
      messages: { ...s.messages, [conversationId]: msgs },
    })),

  addMessage: (message) =>
    set((s) => {
      const existing = s.messages[message.conversationId] ?? [];
      // Remplacer le message temporaire (temp_xxx) s'il existe
      const filtered = existing.filter(
        (m) => m.id !== message.id && !m.id.startsWith('temp_')
      );
      return {
        messages: {
          ...s.messages,
          [message.conversationId]: [...filtered, message],
        },

        conversations: s.conversations.map((c) =>
          c.id === message.conversationId
            ? { ...c, last_message: { contenu: message.content, created_at: message.createdAt, is_read: false }, unread_count: (c.unread_count ?? 0) + 1 }
            : c
        ),
      };
    }),

  updateConversation: (conv) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conv.id ? { ...c, ...conv } : c
      ),
    })),

  markConversationRead: (conversationId, _readerId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) => ({
          ...m,
          is_read: true,
        })),
      },
    })),

  getTotalUnread: () =>
    get()
      .conversations.filter((c) => c.statut === 'active')
      .reduce((sum, c) => sum + (c.unread_count ?? 0), 0),

  reset: () => set(initialState),
}));