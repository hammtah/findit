import { create } from 'zustand';
import { ConversationSummary, Message } from '../types/api.types';

export interface ChatState {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: { [conversationId: string]: Message[] };
  loading: boolean;
  error: string | null;
}

export interface ChatActions {
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  // State
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,
  error: null,


  fetchConversations: async () => {
    // TODO: Implement on Day 2
  },
  fetchMessages: async (conversationId: string) => {
    // TODO: Implement on Day 2
  },
  sendMessage: async (conversationId: string, content: string) => {
    // TODO: Implement on Day 2
  },
  setActiveConversation: (conversationId: string | null) => {
    // TODO: Implement on Day 2
  },
}));
