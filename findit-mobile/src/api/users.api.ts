import { User } from '../types/auth';
import { apiClient } from './client';

export const usersApi = {
  me: async (): Promise<User> => (await apiClient.get<User>('/users/me')).data,
  updateMe: async (data: Partial<User>): Promise<User> => (await apiClient.patch<User>('/users/me', data)).data,
  getHistory: async (type: 'lost' | 'found' | 'all') => (await apiClient.get('/users/me/history', { params: { type } })).data,
  getReviews: async (userId: string) => (await apiClient.get(`/reviews/user/${userId}`)).data,
  deleteMe: async () => { await apiClient.delete('/users/me'); },
};
