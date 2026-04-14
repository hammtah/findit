import { create } from 'zustand';

import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { LoginResponse, User } from '../types/auth';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => Promise<void>;
  logout: (skipApiCall?: boolean) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (data) => {
    await setTokens(data.access_token, data.refresh_token);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async (skipApiCall = false) => {
    if (!skipApiCall) {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try { await authApi.logout(refreshToken); } catch {}
      }
    }

    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (partial) => {
    const currentUser = get().user;
    if (!currentUser) return;
    set({ user: { ...currentUser, ...partial } });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        set({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      const user = await usersApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('Missing refresh token');

        const refreshed = await authApi.refresh(refreshToken);
        await setTokens(refreshed.access_token, refreshed.refresh_token);
        const user = await usersApi.me();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        await get().logout(true);
        set({ isLoading: false });
      }
    }
  },
}));
