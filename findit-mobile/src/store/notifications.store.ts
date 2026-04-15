import { create } from 'zustand';

export interface NotificationsState {
  hasPermission: boolean | null;
  expoPushToken: string | null;
}

export interface NotificationsActions {
  requestPermission: () => Promise<void>;
  registerToken: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState & NotificationsActions>((set) => ({
  hasPermission: null,
  expoPushToken: null,

  // Actions (to be implemented on Day 6)
  requestPermission: async () => {
    // TODO: Implement on Day 6
  },
  registerToken: async () => {
    // TODO: Implement on Day 6
  },
}));
