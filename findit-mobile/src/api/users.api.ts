import { User } from '../types/auth';
import { apiClient } from './client';

export const usersApi = {
  me: async (): Promise<User> => (await apiClient.get<User>('/users/me')).data,
};
