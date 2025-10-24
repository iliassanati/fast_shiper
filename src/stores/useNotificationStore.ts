// src/stores/useNotificationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];

  // Getters
  getUnreadCount: () => number;
  getUnreadNotifications: () => Notification[];

  // Actions
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set, get) => ({
    notifications: [],

    // Getters
    getUnreadCount: () => {
      return get().notifications.filter((n) => !n.read).length;
    },

    getUnreadNotifications: () => {
      return get().notifications.filter((n) => !n.read);
    },

    // Actions
    addNotification: (message, type = 'info') => {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        message,
        type,
        timestamp: Date.now(),
        read: false,
      };

      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));

      // Auto-remove after 5 seconds for success/info
      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, 5000);
      }
    },

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      })),

    clearAll: () => set({ notifications: [] }),
  }))
);
