import { apiClient } from './client';

import { ConversationSummary, Message } from '../types/api.types';

const unwrap = <T>(raw: unknown): T => (raw && typeof raw === 'object' && (raw as any).data ? (raw as any).data : raw) as T;

export const conversationsApi = {

  createConversation: async (reportId: string): Promise<{ id: string }> =>
    (await apiClient.post<{ id: string }>('/conversations', { report_id: reportId })).data,

  getAll: async (): Promise<ConversationSummary[]> => {
    const res = await apiClient.get('/conversations');
    return unwrap<ConversationSummary[]>(res.data);
  },

  getById: async (id: string): Promise<ConversationSummary> => {
    const res = await apiClient.get(`/conversations/${id}`);
    return unwrap<ConversationSummary>(res.data);
  },

  getMessages: async (id: string): Promise<Message[]> => {
    const res = await apiClient.get(`/conversations/${id}/messages`);
    return unwrap<Message[]>(res.data);
  },

  respond: async (id: string, action: 'accept' | 'refuse'): Promise<ConversationSummary> => {
    const res = await apiClient.patch(`/conversations/${id}/respond`, { action });
    return unwrap<ConversationSummary>(res.data);
  },
};
