import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config/api';
import { navigateToLogin } from '../navigation/navigationRef';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type QueueItem = { resolve: (token: string) => void; reject: (error: unknown) => void };

let isRefreshing = false;
let failedQueue: QueueItem[] = [];
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((item) => (error ? item.reject(error) : item.resolve(token ?? '')));
  failedQueue = [];
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest as AxiosRequestConfig));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('Missing refresh token');

      const refreshed = (
        await refreshClient.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
          refresh_token: refreshToken,
        })
      ).data;
      await setTokens(refreshed.access_token, refreshed.refresh_token);
      processQueue(null, refreshed.access_token);

      originalRequest.headers.Authorization = `Bearer ${refreshed.access_token}`;
      return apiClient(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      navigateToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { apiClient };
