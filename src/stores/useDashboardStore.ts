// src/stores/useDashboardStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DashboardStats } from '@/types/client.types';

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
        // TODO: API call
        // const response = await dashboardAPI.getStats();

        const { mockDashboardStats } = await import(
          '@/data/client/mockUserData'
        );
        set({ stats: mockDashboardStats, loading: false });
      } catch (error) {
        set({
          error: 'Failed to fetch dashboard stats',
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
