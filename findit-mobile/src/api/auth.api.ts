import { LoginResponse, Tokens } from '../types/auth';
import { apiClient } from './client';

export interface RegisterPayload { nom: string; email: string; password: string }
export interface LoginPayload { email: string; password: string }
export interface OAuthPayload { id_token: string }

export const authApi = {
  register: async (data: RegisterPayload): Promise<void> => { await apiClient.post('/auth/register', data); },
  login: async (data: LoginPayload): Promise<LoginResponse> => (await apiClient.post<LoginResponse>('/auth/login', data)).data,
  refresh: async (refreshToken: string): Promise<Tokens> => (await apiClient.post<Tokens>('/auth/refresh', { refresh_token: refreshToken })).data,
  logout: async (refreshToken: string): Promise<void> => { await apiClient.post('/auth/logout', { refresh_token: refreshToken }); },
  googleCallback: async (data: OAuthPayload): Promise<LoginResponse> =>
    (await apiClient.post<LoginResponse>('/auth/google/callback', data)).data,
  appleCallback: async (data: OAuthPayload): Promise<LoginResponse> =>
    (await apiClient.post<LoginResponse>('/auth/apple/callback', data)).data,
};
