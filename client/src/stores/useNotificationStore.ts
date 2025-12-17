// client/src/stores/useNotificationStore.ts - UPDATED VERSION
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiHelpers } from '@/lib/api';

export interface Notification {
  id: string;
  type:
    | 'package_received'
    | 'shipment_update'
    | 'consolidation_complete'
    | 'photo_request_complete'
    | 'payment_received'
    | 'storage_warning'
    | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  relatedId?: string;
  relatedModel?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationState {
  // Backend notifications
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;

  // Toast notifications (local, temporary)
  toasts: ToastNotification[];

  // Actions for backend notifications
  fetchNotifications: (filters?: { limit?: number }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: () => void;
  setModalOpen: (open: boolean) => void;

  // Actions for toast notifications
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    duration?: number
  ) => void;
  dismissToast: (id: string) => void;

  // Legacy support
  addNotification: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isModalOpen: false,
    toasts: [],

    fetchNotifications: async (filters) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{
          notifications: any[];
          unreadCount: number;
        }>('/notifications', { limit: filters?.limit || 50 });

        const notifications: Notification[] = response.notifications.map(
          (n: any) => ({
            id: n._id || n.id,
            type: n.type || 'general',
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt,
            priority: n.priority || 'normal',
            actionUrl: n.actionUrl,
            relatedId: n.relatedId,
            relatedModel: n.relatedModel,
          })
        );

        set({
          notifications,
          unreadCount:
            response.unreadCount || notifications.filter((n) => !n.read).length,
          loading: false,
        });
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        set({
          error: error.message || 'Failed to fetch notifications',
          loading: false,
        });
      }
    },

    markAsRead: async (id: string) => {
      try {
        await apiHelpers.put(`/notifications/${id}/read`, {});

        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: wasUnread
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      } catch (error: any) {
        console.error('Error marking notification as read:', error);
        // Still update UI optimistically
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      }
    },

    markAllAsRead: async () => {
      try {
        await apiHelpers.put('/notifications/read-all', {});

        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        // Still update UI optimistically
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      }
    },

    deleteNotification: async (id: string) => {
      try {
        await apiHelpers.delete(`/notifications/${id}`);

        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      } catch (error: any) {
        console.error('Error deleting notification:', error);
      }
    },

    clearNotifications: () => {
      set({
        notifications: [],
        unreadCount: 0,
        error: null,
      });
    },

    setModalOpen: (open: boolean) => {
      set({ isModalOpen: open });
    },

    // Toast notifications
    showToast: (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      duration: number = 5000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const toast: ToastNotification = {
        id,
        type,
        message,
        duration,
      };

      set((state) => ({
        toasts: [...state.toasts, toast],
      }));

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          get().dismissToast(id);
        }, duration);
      }
    },

    dismissToast: (id: string) => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    // Legacy support - maps to showToast
    addNotification: (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning'
    ) => {
      get().showToast(message, type);
    },
  }))
);
