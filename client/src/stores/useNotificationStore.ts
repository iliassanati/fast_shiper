// client/src/stores/useNotificationStore.ts - NEW FILE
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
    | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'normal' | 'high';
  actionUrl?: string;
  relatedId?: string;
  relatedModel?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (filters?: { limit?: number }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,

    fetchNotifications: async (filters) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{
          notifications: any[];
        }>('/notifications', filters);

        const notifications = response.notifications.map((n: any) => ({
          id: n._id || n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
          priority: n.priority,
          actionUrl: n.actionUrl,
          relatedId: n.relatedId,
          relatedModel: n.relatedModel,
        }));

        set({
          notifications,
          unreadCount: notifications.filter((n: Notification) => !n.read)
            .length,
          loading: false,
        });
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        // Don't fail silently - set empty array but log error
        set({
          notifications: [],
          unreadCount: 0,
          error: error.response?.data?.error || 'Failed to fetch notifications',
          loading: false,
        });
      }
    },

    markAsRead: async (id: string) => {
      try {
        await apiHelpers.put(`/notifications/${id}/read`, {});

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      } catch (error: any) {
        console.error('Error marking notification as read:', error);
        // Still update UI optimistically
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
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

    addNotification: (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning'
    ) => {
      const typeMap: Record<typeof type, Notification['type']> = {
        success: 'package_received',
        error: 'general',
        info: 'general',
        warning: 'general',
      };

      const notification: Notification = {
        id: `local-${Date.now()}`,
        type: typeMap[type],
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message,
        read: false,
        createdAt: new Date().toISOString(),
        priority: type === 'error' ? 'high' : 'normal',
      };

      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));

      // Auto-remove local notifications after 5 seconds
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n.id !== notification.id
          ),
          unreadCount: state.notifications.filter((n) => !n.read).length,
        }));
      }, 5000);
    },

    clearNotifications: () => {
      set({
        notifications: [],
        unreadCount: 0,
        error: null,
      });
    },
  }))
);
