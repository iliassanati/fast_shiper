// client/src/stores/useNotificationStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiHelpers } from '@/lib/api';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
  read: boolean;
  title?: string;
  actionUrl?: string;
  relatedId?: string;
  relatedModel?: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Getters
  getUnreadCount: () => number;
  getUnreadNotifications: () => Notification[];

  // Actions
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => void;
  fetchNotifications: (filters?: {
    read?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  devtools((set, get) => ({
    notifications: [],
    loading: false,
    error: null,

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

    markAsRead: async (id) => {
      set({ loading: true, error: null });
      try {
        await apiHelpers.put(`/notifications/${id}/read`, {});

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          loading: false,
        }));
      } catch (error: any) {
        set({
          error: error.message || 'Failed to mark notification as read',
          loading: false,
        });
        throw error;
      }
    },

    markAllAsRead: async () => {
      set({ loading: true, error: null });
      try {
        await apiHelpers.put('/notifications/read-all', {});

        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          loading: false,
        }));
      } catch (error: any) {
        set({
          error: error.message || 'Failed to mark all notifications as read',
          loading: false,
        });
        throw error;
      }
    },

    clearAll: () => set({ notifications: [] }),

    fetchNotifications: async (filters) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{
          notifications: any[];
          unreadCount: number;
          pagination: any;
        }>('/notifications', filters);

        // Transform API notifications to match store format
        const notifications: Notification[] = response.notifications.map(
          (n) => ({
            id: n.id || n._id,
            message: n.message,
            type: mapNotificationType(n.type),
            timestamp: new Date(n.createdAt).getTime(),
            read: n.read,
            title: n.title,
            actionUrl: n.actionUrl,
            relatedId: n.relatedId,
            relatedModel: n.relatedModel,
          })
        );

        set({
          notifications,
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to fetch notifications',
          loading: false,
        });
        throw error;
      }
    },

    deleteNotification: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await apiHelpers.delete(`/notifications/${id}`);

        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          loading: false,
        }));
      } catch (error: any) {
        set({
          error: error.message || 'Failed to delete notification',
          loading: false,
        });
        throw error;
      }
    },
  }))
);

// Helper function to map API notification types to store types
function mapNotificationType(apiType: string): Notification['type'] {
  const typeMap: Record<string, Notification['type']> = {
    package_received: 'info',
    shipment_update: 'info',
    consolidation_complete: 'success',
    photo_request_complete: 'success',
    payment_received: 'success',
    storage_warning: 'warning',
  };

  return typeMap[apiType] || 'info';
}
