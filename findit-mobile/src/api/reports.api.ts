import { apiClient } from './client';

export const reportsApi = {
  getReports: async <T = unknown>(params?: Record<string, unknown>): Promise<T> => (await apiClient.get<T>('/reports', { params })).data,
};
