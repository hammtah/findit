import { apiClient } from './client';

export const conversationsApi = {
  createConversation: async (
    data: { report_lost_id: string; report_found_id: string },
  ): Promise<{ id: string }> =>
    (await apiClient.post<{ id: string }>('/conversations', data)).data,
};
