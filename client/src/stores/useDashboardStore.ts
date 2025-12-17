// client/src/stores/useDashboardStore.ts - UPDATED WITH 30 DAYS STORAGE
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DashboardStats } from '@/types/client.types';
import { apiHelpers } from '@/lib/api';
import { STORAGE } from '@/data/client/constants';

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // Actions
  setStats: (stats: DashboardStats) => void;
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateStatsFromPackages: (packages: any[]) => void;
}

const CACHE_DURATION = 30000; // 30 seconds

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => ({
    stats: {
      totalPackages: 0,
      inStorage: 0,
      shipped: 0,
      storageDaysLeft: STORAGE.FREE_DAYS, // Use constant (30 days)
    },
    loading: false,
    error: null,
    lastFetchTime: null,

    setStats: (stats) => set({ stats }),

    fetchStats: async () => {
      const { lastFetchTime, loading } = get();

      // Prevent duplicate fetches
      if (loading) {
        console.log('⏳ Already fetching stats, skipping...');
        return;
      }

      // Check cache validity
      if (lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
        console.log('📊 Using cached stats data');
        return;
      }

      set({ loading: true, error: null });
      try {
        console.log('📊 Fetching dashboard stats from API...');

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

        console.log('✅ Stats received:', packageStats.stats);

        set({
          stats: {
            totalPackages: packageStats.stats.total,
            inStorage: packageStats.stats.inStorage,
            shipped: packageStats.stats.shipped,
            storageDaysLeft:
              packageStats.stats.storageDaysLeft || STORAGE.FREE_DAYS,
          },
          loading: false,
          lastFetchTime: Date.now(),
        });
      } catch (error: any) {
        console.error('❌ Error fetching stats:', error);
        set({
          error: error.message || 'Failed to fetch dashboard stats',
          loading: false,
          lastFetchTime: null,
        });
        throw error;
      }
    },

    refreshStats: async () => {
      // Force refresh by clearing cache
      set({ lastFetchTime: null });
      await get().fetchStats();
    },

    // Update stats directly from packages array (for immediate UI updates)
    updateStatsFromPackages: (packages) => {
      // Filter out source packages that were consolidated
      const visiblePackages = packages.filter((pkg: any) => {
        // Hide packages with status 'consolidated' that are NOT the result
        if (pkg.status === 'consolidated' && !pkg.isConsolidatedResult) {
          return false;
        }
        return true;
      });

      const inStorage = visiblePackages.filter(
        (p: any) => p.status === 'received'
      ).length;
      const shipped = visiblePackages.filter(
        (p: any) =>
          p.status === 'shipped' ||
          p.status === 'in_transit' ||
          p.status === 'delivered'
      ).length;

      // Calculate minimum storage days left (using 30 days limit)
      const packagesInStorage = visiblePackages.filter(
        (p: any) => p.status === 'received'
      );
      const storageDaysLeft =
        packagesInStorage.length > 0
          ? Math.min(
              ...packagesInStorage.map(
                (p: any) => STORAGE.FREE_DAYS - (p.storageDay || 0)
              )
            )
          : STORAGE.FREE_DAYS;

      set({
        stats: {
          totalPackages: visiblePackages.length,
          inStorage,
          shipped,
          storageDaysLeft: Math.max(0, storageDaysLeft),
        },
      });

      console.log('📊 Stats updated from packages:', {
        total: visiblePackages.length,
        inStorage,
        shipped,
        storageDaysLeft,
      });
    },
  }))
);
