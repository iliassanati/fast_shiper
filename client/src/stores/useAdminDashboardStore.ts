// client/src/stores/useAdminDashboardStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface DashboardStats {
  users: {
    total: number;
  };
  packages: {
    total: number;
    inStorage: number;
    today: number;
  };
  shipments: {
    active: number;
    today: number;
  };
  consolidations: {
    pending: number;
  };
  revenue: {
    today: number;
    month: number;
  };
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  action: string;
  link: string;
}

interface Activity {
  type: 'package' | 'shipment' | 'transaction';
  id: string;
  timestamp: Date;
  data: any;
}

interface AnalyticsData {
  period: string;
  startDate: Date;
  endDate: Date;
  packages: Array<{ _id: string; count: number }>;
  shipments: Array<{ _id: string; count: number }>;
  revenue: Array<{ _id: string; total: number; count: number }>;
}

interface AdminDashboardState {
  stats: DashboardStats | null;
  alerts: Alert[];
  activities: Activity[];
  analytics: AnalyticsData | null;
  loading: boolean;
  error: string | null;

  fetchStats: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchActivities: (limit?: number) => Promise<void>;
  fetchAnalytics: (period?: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

export const useAdminDashboardStore = create<AdminDashboardState>()(
  devtools((set, get) => ({
    stats: null,
    alerts: [],
    activities: [],
    analytics: null,
    loading: false,
    error: null,

    fetchStats: async () => {
      set({ loading: true, error: null });
      try {
        const response = await api.get('/admin/dashboard/stats');
        set({
          stats: response.data.data.stats,
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to fetch statistics',
          loading: false,
        });
      }
    },

    fetchAlerts: async () => {
      try {
        const response = await api.get('/admin/dashboard/alerts');
        set({ alerts: response.data.data.alerts });
      } catch (error: any) {
        console.error('Failed to fetch alerts:', error);
      }
    },

    fetchActivities: async (limit = 20) => {
      try {
        const response = await api.get('/admin/dashboard/activities', {
          params: { limit },
        });
        set({ activities: response.data.data.activities });
      } catch (error: any) {
        console.error('Failed to fetch activities:', error);
      }
    },

    fetchAnalytics: async (period = '7d') => {
      try {
        const response = await api.get('/admin/dashboard/analytics', {
          params: { period },
        });
        set({ analytics: response.data.data.analytics });
      } catch (error: any) {
        console.error('Failed to fetch analytics:', error);
      }
    },

    refreshDashboard: async () => {
      await Promise.all([
        get().fetchStats(),
        get().fetchAlerts(),
        get().fetchActivities(),
        get().fetchAnalytics(),
      ]);
    },
  }))
);
