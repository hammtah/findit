import { apiClient } from './client';

export const conversationsApi = {
  createConversation: async (reportId: string): Promise<{ id: string }> => (await apiClient.post<{ id: string }>('/conversations', { report_id: reportId })).data,
};
