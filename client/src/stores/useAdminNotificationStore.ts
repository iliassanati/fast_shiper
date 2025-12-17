// client/src/stores/useAdminNotificationStore.ts - UPDATED WITH PHOTO REQUESTS
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface AdminNotification {
  id: string;
  type:
    | 'package_received'
    | 'shipment_created'
    | 'consolidation_request'
    | 'photo_request'
    | 'storage_warning'
    | 'payment_received'
    | 'user_registered'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  relatedId?: string;
  relatedModel?: string;
  metadata?: any;
}

export interface AdminToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface AdminNotificationState {
  // Backend notifications
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isModalOpen: boolean;

  // Toast notifications (local)
  toasts: AdminToast[];

  // Storage warnings
  storageWarnings: {
    total: number;
    critical: number;
    packages: any[];
  };

  // 🔥 NEW: Photo request counts
  photoRequestCounts: {
    pending: number;
    processing: number;
    total: number;
  };

  consolidationCounts: {
    pending: number;
    processing: number;
    total: number;
  };

  fetchConsolidationCounts: () => Promise<void>;

  // Actions for backend notifications
  fetchNotifications: () => Promise<void>;
  fetchStorageWarnings: () => Promise<void>;
  fetchPhotoRequestCounts: () => Promise<void>; // 🔥 NEW
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

export const useAdminNotificationStore = create<AdminNotificationState>()(
  devtools((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isModalOpen: false,
    toasts: [],
    storageWarnings: {
      total: 0,
      critical: 0,
      packages: [],
    },
    photoRequestCounts: {
      pending: 0,
      processing: 0,
      total: 0,
    },
    consolidationCounts: {
      pending: 0,
      processing: 0,
      total: 0,
    },

    fetchNotifications: async () => {
      set({ loading: true, error: null });
      try {
        const [alertsResponse, activitiesResponse, photoRequestsResponse] =
          await Promise.all([
            api.get('/admin/dashboard/alerts'),
            api.get('/admin/dashboard/activities', { params: { limit: 20 } }),
            // ✅ FETCH PENDING & PROCESSING PHOTO REQUESTS
            api.get('/admin/photo-requests', {
              params: { limit: 20 },
            }),
          ]);

        const alerts = alertsResponse.data.data.alerts || [];
        const activities = activitiesResponse.data.data.activities || [];
        const allPhotoRequests =
          photoRequestsResponse.data.data.photoRequests || [];

        // Filter for pending and processing only
        const photoRequests = allPhotoRequests.filter(
          (req: any) => req.status === 'pending' || req.status === 'processing'
        );

        const notifications: AdminNotification[] = [];

        // Add alerts as notifications
        alerts.forEach((alert: any, index: number) => {
          notifications.push({
            id: `alert-${index}`,
            type: alert.type === 'warning' ? 'storage_warning' : 'system',
            title: alert.message,
            message: `${alert.action} →`,
            read: false,
            createdAt: new Date().toISOString(),
            priority: alert.priority as any,
            actionUrl: alert.link,
          });
        });

        // ✅ ADD PHOTO REQUESTS AS HIGH-PRIORITY NOTIFICATIONS
        photoRequests.forEach((request: any) => {
          const isPending = request.status === 'pending';
          notifications.push({
            id: `photo-request-${request._id}`,
            type: 'photo_request',
            title: isPending
              ? '📸 New Photo Request'
              : '🔄 Photo Request In Progress',
            message: `${request.userId.name} - ${
              request.requestType === 'both'
                ? 'Photos + Info'
                : request.requestType
            } for ${request.packageId.trackingNumber}`,
            read: false,
            createdAt: request.createdAt,
            priority: isPending ? 'high' : 'normal',
            actionUrl: `/admin/photo-requests`,
            relatedId: request._id,
            relatedModel: 'PhotoRequest',
          });
        });

        // Add activities
        activities.slice(0, 10).forEach((activity: any) => {
          let type: AdminNotification['type'] = 'system';
          if (activity.type === 'package') type = 'package_received';
          if (activity.type === 'shipment') type = 'shipment_created';
          if (activity.type === 'transaction') type = 'payment_received';

          notifications.push({
            id: activity.id,
            type,
            title: getActivityTitle(activity),
            message: getActivityMessage(activity),
            read: true,
            createdAt: activity.timestamp,
            priority: 'normal',
            relatedId: activity.id,
          });
        });

        // Sort by priority and date
        notifications.sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;

          if (aPriority !== bPriority) return aPriority - bPriority;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
          loading: false,
        });
      } catch (error: any) {
        console.error('Error fetching admin notifications:', error);
        set({
          error: error.message || 'Failed to fetch notifications',
          loading: false,
        });
      }
    },

    fetchStorageWarnings: async () => {
      try {
        const response = await api.get('/admin/packages', {
          params: { storageWarning: 'true' },
        });

        const packages = response.data.data.packages || [];
        const critical = packages.filter((pkg: any) => {
          const daysRemaining = 30 - pkg.storageDay;
          return daysRemaining <= 3;
        });

        set({
          storageWarnings: {
            total: packages.length,
            critical: critical.length,
            packages,
          },
        });
      } catch (error) {
        console.error('Error fetching storage warnings:', error);
      }
    },

    // 🔥 NEW: Fetch photo request counts
    fetchPhotoRequestCounts: async () => {
      try {
        const response = await api.get('/admin/photo-requests', {
          params: { limit: 100 }, // Get all for counting
        });

        const photoRequests = response.data.data.photoRequests || [];

        const counts = {
          pending: photoRequests.filter((r: any) => r.status === 'pending')
            .length,
          processing: photoRequests.filter(
            (r: any) => r.status === 'processing'
          ).length,
          total: photoRequests.filter(
            (r: any) => r.status === 'pending' || r.status === 'processing'
          ).length,
        };

        set({ photoRequestCounts: counts });
      } catch (error) {
        console.error('Error fetching photo request counts:', error);
      }
    },

    fetchConsolidationCounts: async () => {
      try {
        const response = await api.get('/admin/consolidations', {
          params: { limit: 100 },
        });

        const consolidations = response.data.data.consolidations || [];

        const counts = {
          pending: consolidations.filter((c: any) => c.status === 'pending')
            .length,
          processing: consolidations.filter(
            (c: any) => c.status === 'processing'
          ).length,
          total: consolidations.filter(
            (c: any) => c.status === 'pending' || c.status === 'processing'
          ).length,
        };

        set({ consolidationCounts: counts });
      } catch (error) {
        console.error('Error fetching consolidation counts:', error);
      }
    },

    markAsRead: async (id: string) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    },

    markAllAsRead: async () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    },

    deleteNotification: async (id: string) => {
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

      const toast: AdminToast = {
        id,
        type,
        message,
        duration,
      };

      set((state) => ({
        toasts: [...state.toasts, toast],
      }));

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

    addNotification: (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning'
    ) => {
      get().showToast(message, type);
    },
  }))
);

// Helper functions
function getActivityTitle(activity: any): string {
  switch (activity.type) {
    case 'package':
      return 'New Package Received';
    case 'shipment':
      return 'New Shipment Created';
    case 'transaction':
      return 'Transaction Completed';
    default:
      return 'Activity';
  }
}

function getActivityMessage(activity: any): string {
  switch (activity.type) {
    case 'package':
      return `Package ${activity.data.trackingNumber} from ${activity.data.retailer}`;
    case 'shipment':
      return `Shipment ${activity.data.trackingNumber} via ${activity.data.carrier}`;
    case 'transaction':
      return `${activity.data.type}: ${activity.data.amount} ${activity.data.currency}`;
    default:
      return 'Activity recorded';
  }
}
