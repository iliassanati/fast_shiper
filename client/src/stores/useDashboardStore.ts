// client/src/stores/useDashboardStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DashboardStats } from '@/types/client.types';
import { apiHelpers } from '@/lib/api';

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;

  // Actions
  setStats: (stats: DashboardStats) => void;
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => ({
    stats: {
      totalPackages: 0,
      inStorage: 0,
      shipped: 0,
      storageDaysLeft: 45,
    },
    loading: false,
    error: null,

    setStats: (stats) => set({ stats }),

    fetchStats: async () => {
      set({ loading: true, error: null });
      try {
        // Fetch stats from packages endpoint
        const packageStats = await apiHelpers.get<{
          stats: {
            total: number;
            inStorage: number;
            consolidated: number;
            shipped: number;
            avgStorageDays: number;
            storageDaysLeft: number;
          };
        }>('/packages/stats');

        set({
          stats: {
            totalPackages: packageStats.stats.total,
            inStorage: packageStats.stats.inStorage,
            shipped: packageStats.stats.shipped,
            storageDaysLeft: packageStats.stats.storageDaysLeft,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to fetch dashboard stats',
          loading: false,
        });
        throw error;
      }
    },

    refreshStats: async () => {
      await get().fetchStats();
    },
  }))
);
