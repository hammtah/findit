import { apiClient } from './client';

export const flagsApi = {
  createFlag: async (data: {
    target_type: 'report' | 'user' | 'message';
    target_id: string;
    motif:
      | 'faux_signalement'
      | 'contenu_inapproprie'
      | 'arnaque'
      | 'autre';
    description?: string;
  }): Promise<void> => {
    await apiClient.post('/flags', data);
  },
};
