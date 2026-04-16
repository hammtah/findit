import { apiClient } from './client';

export const reportsApi = {
  getReports: async <T = unknown>(params?: Record<string, unknown>): Promise<T> =>
    (await apiClient.get<T>('/reports', { params })).data,
  getReport: async <T = unknown>(id: string): Promise<T> =>
    (await apiClient.get<T>(`/reports/${id}`)).data,
  updateReportStatus: async <T = unknown>(
    id: string,
    data: { statut: 'resolu' | 'rendu' },
  ): Promise<T> => (await apiClient.patch<T>(`/reports/${id}/status`, data)).data,
  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },
};
