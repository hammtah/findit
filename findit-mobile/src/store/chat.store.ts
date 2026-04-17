// src/store/chat.store.ts
import { create } from 'zustand';
import { ConversationSummary, Message } from '../types/api.types';
import { useAuthStore } from './auth.store';

interface ChatState {
  conversations: ConversationSummary[];
  messages: Record<string, Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: Record<string, boolean>;
}

interface ChatActions {
  setConversations: (convs: ConversationSummary[]) => void;
  setConversation: (conv: ConversationSummary) => void;
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

  setConversation: (conv) =>
    set((s) => {
      const exists = s.conversations.some((item) => item.id === conv.id);
      if (exists) {
        return {
          conversations: s.conversations.map((item) => (item.id === conv.id ? { ...item, ...conv } : item)),
        };
      }

      return { conversations: [conv, ...s.conversations] };
    }),

  setMessages: (conversationId, msgs) =>
    set((s) => ({
      messages: { ...s.messages, [conversationId]: msgs },
    })),

  addMessage: (message) =>
    set((s) => {
      const existing = s.messages[message.conversation_id] ?? [];
      const currentUserId = useAuthStore.getState().user?.id;
      const isMine = currentUserId != null && message.sender_id === currentUserId;
      const filtered = existing.filter((m) => m.id !== message.id && !m.id.startsWith('temp_'));

      return {
        messages: {
          ...s.messages,
          [message.conversation_id]: [...filtered, message],
        },

        conversations: s.conversations.map((c) =>
          c.id === message.conversation_id
            ? {
                ...c,
                last_message: {
                  contenu: message.contenu,
                  created_at: message.created_at,
                  is_read: message.is_read,
                },
                unread_count: isMine ? c.unread_count : c.unread_count + 1,
              }
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
        c.id === conversationId
          ? {
              ...c,
              unread_count: 0,
              last_message: c.last_message ? { ...c.last_message, is_read: true } : null,
            }
          : c
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