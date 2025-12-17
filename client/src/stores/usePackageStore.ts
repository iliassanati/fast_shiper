// client/src/stores/usePackageStore.ts - UPDATED: Show consolidating packages
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Package, PackageStatus } from '@/types/client.types';
import { apiHelpers } from '@/lib/api';

interface PackageState {
  packages: Package[];
  allPackages: Package[]; // Keep all packages for reference
  selectedPackageIds: string[];
  loading: boolean;
  error: string | null;
  filterStatus: PackageStatus | 'all';
  lastFetchTime: number | null;
  initialized: boolean;

  // Getters
  getPackageById: (id: string) => Package | undefined;
  getSelectedPackages: () => Package[];
  getPackagesByStatus: (status: PackageStatus) => Package[];
  getAvailableForConsolidation: () => Package[];
  getVisiblePackages: () => Package[];

  // Stats getters
  getStats: () => {
    totalPackages: number;
    inStorage: number;
    consolidated: number;
    shipped: number;
    delivered: number;
  };

  // Actions
  setPackages: (packages: Package[]) => void;
  addPackage: (pkg: Package) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  removePackage: (id: string) => void;
  removePackages: (ids: string[]) => void;
  togglePackageSelection: (id: string) => void;
  selectMultiplePackages: (ids: string[]) => void;
  clearSelection: () => void;
  setFilterStatus: (status: PackageStatus | 'all') => void;
  fetchPackages: (filters?: {
    status?: string;
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
  }) => Promise<void>;
  fetchPackageById: (id: string) => Promise<Package>;
  deletePackage: (id: string) => Promise<void>;
  invalidateCache: () => void;
  reset: () => void;
}

const CACHE_DURATION = 30000; // 30 seconds cache

const initialState = {
  packages: [],
  allPackages: [],
  selectedPackageIds: [],
  loading: false,
  error: null,
  filterStatus: 'all' as PackageStatus | 'all',
  lastFetchTime: null as number | null,
  initialized: false,
};

export const usePackageStore = create<PackageState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Getters
      getPackageById: (id) => {
        return get().packages.find((pkg) => pkg.id === id);
      },

      getSelectedPackages: () => {
        const { packages, selectedPackageIds } = get();
        return packages.filter((pkg) => selectedPackageIds.includes(pkg.id));
      },

      getPackagesByStatus: (status) => {
        return get().packages.filter((pkg) => pkg.status === status);
      },

      // Get packages available for consolidation (only 'received' status, not already consolidated results)
      getAvailableForConsolidation: () => {
        return get().packages.filter(
          (pkg) => pkg.status === 'received' && !pkg.isConsolidatedResult
        );
      },

      // Get visible packages (filtered based on current filter)
      getVisiblePackages: () => {
        const { packages, filterStatus } = get();
        if (filterStatus === 'all') {
          return packages;
        }
        return packages.filter((pkg) => pkg.status === filterStatus);
      },

      // Calculate real stats from packages
      getStats: () => {
        const { packages } = get();
        return {
          totalPackages: packages.length,
          inStorage: packages.filter((p) => p.status === 'received').length,
          consolidated: packages.filter((p) => p.isConsolidatedResult).length,
          shipped: packages.filter(
            (p) => p.status === 'shipped' || p.status === 'in_transit'
          ).length,
          delivered: packages.filter((p) => p.status === 'delivered').length,
        };
      },

      // Actions
      setPackages: (packages) =>
        set({ packages, lastFetchTime: Date.now(), initialized: true }),

      addPackage: (pkg) =>
        set((state) => ({
          packages: [pkg, ...state.packages],
        })),

      updatePackage: (id, updates) =>
        set((state) => ({
          packages: state.packages.map((pkg) =>
            pkg.id === id ? { ...pkg, ...updates } : pkg
          ),
        })),

      removePackage: (id) =>
        set((state) => ({
          packages: state.packages.filter((pkg) => pkg.id !== id),
          selectedPackageIds: state.selectedPackageIds.filter(
            (pkgId) => pkgId !== id
          ),
        })),

      // Remove multiple packages at once (for consolidation)
      removePackages: (ids) =>
        set((state) => ({
          packages: state.packages.filter((pkg) => !ids.includes(pkg.id)),
          selectedPackageIds: state.selectedPackageIds.filter(
            (pkgId) => !ids.includes(pkgId)
          ),
        })),

      togglePackageSelection: (id) =>
        set((state) => ({
          selectedPackageIds: state.selectedPackageIds.includes(id)
            ? state.selectedPackageIds.filter((pkgId) => pkgId !== id)
            : [...state.selectedPackageIds, id],
        })),

      selectMultiplePackages: (ids) => set({ selectedPackageIds: ids }),

      clearSelection: () => set({ selectedPackageIds: [] }),

      setFilterStatus: (status) => set({ filterStatus: status }),

      invalidateCache: () => set({ lastFetchTime: null, initialized: false }),

      fetchPackages: async (filters) => {
        const { lastFetchTime, loading } = get();
        const forceRefresh = filters?.forceRefresh ?? false;

        // Prevent duplicate fetches
        if (loading) {
          console.log('⏳ Already fetching packages, skipping...');
          return;
        }

        // Check cache validity (unless force refresh)
        if (
          !forceRefresh &&
          lastFetchTime &&
          Date.now() - lastFetchTime < CACHE_DURATION
        ) {
          console.log('📦 Using cached packages data');
          return;
        }

        set({ loading: true, error: null });

        try {
          console.log('🔍 Fetching packages with filters:', filters);

          const response = await apiHelpers.get<{
            packages: any[];
            pagination: any;
          }>('/packages', {
            status: filters?.status,
            page: filters?.page,
            limit: filters?.limit,
          });

          if (!response.packages) {
            set({
              packages: [],
              allPackages: [],
              loading: false,
              lastFetchTime: Date.now(),
              initialized: true,
            });
            return;
          }

          const allPackages = response.packages.map((pkg: any) =>
            transformPackage(pkg)
          );

          // SMART FILTER: Hide only packages whose consolidation is COMPLETED
          const visiblePackages = allPackages.filter((pkg) => {
            // If this is a consolidated result, always show it
            if (pkg.isConsolidatedResult) {
              return true;
            }

            // If package has status 'consolidated'
            if (pkg.status === 'consolidated') {
              // Check if there's a result package that includes this package
              // If yes, the consolidation is COMPLETE, so hide this package
              const hasResultPackage = allPackages.some(
                (p) =>
                  p.isConsolidatedResult &&
                  p.originalPackageIds?.includes(pkg.id)
              );

              // Hide if consolidation is complete (result exists)
              // Show if consolidation is pending (no result yet)
              return !hasResultPackage;
            }

            // Show all other packages (received, shipped, etc.)
            return true;
          });

          console.log(
            `✅ Loaded ${allPackages.length} total packages, showing ${visiblePackages.length} visible packages`
          );

          set({
            packages: visiblePackages,
            allPackages: allPackages,
            loading: false,
            lastFetchTime: Date.now(),
            error: null,
            initialized: true,
          });
        } catch (error: any) {
          console.error('❌ Error fetching packages:', error);
          set({
            error: error.message || 'Failed to fetch packages',
            loading: false,
            lastFetchTime: null,
            packages: [],
            allPackages: [],
            initialized: true,
          });
        }
      },

      fetchPackageById: async (id: string) => {
        set({ loading: true, error: null });
        try {
          console.log('🔍 Fetching package by ID:', id);

          const response = await apiHelpers.get<{ package: any }>(
            `/packages/${id}`
          );

          console.log('📦 Package response:', response.package);

          const pkg = response.package;
          const transformedPkg = transformPackage(pkg);

          // Update the package in the store
          set((state) => {
            const existingIndex = state.packages.findIndex((p) => p.id === id);
            if (existingIndex >= 0) {
              // Update existing
              const newPackages = [...state.packages];
              newPackages[existingIndex] = transformedPkg;
              return { packages: newPackages, loading: false, error: null };
            } else {
              // Add new
              return {
                packages: [transformedPkg, ...state.packages],
                loading: false,
                error: null,
              };
            }
          });

          console.log('✅ Package fetched successfully');
          return transformedPkg;
        } catch (error: any) {
          console.error('❌ Error fetching package:', error);

          const errorMessage =
            error.response?.data?.error ||
            error.message ||
            'Failed to fetch package';

          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      deletePackage: async (id: string) => {
        set({ loading: true, error: null });
        try {
          console.log('🗑️ Deleting package:', id);

          await apiHelpers.delete(`/packages/${id}`);
          get().removePackage(id);
          set({ loading: false });

          console.log('✅ Package deleted successfully');
        } catch (error: any) {
          console.error('❌ Error deleting package:', error);

          const errorMessage =
            error.response?.data?.error ||
            error.message ||
            'Failed to delete package';

          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      reset: () => set(initialState),
    }),
    { name: 'package-store' }
  )
);

// Helper function to transform package from backend to frontend format
function transformPackage(pkg: any): Package {
  return {
    id: pkg._id || pkg.id,
    description: pkg.description || 'No description',
    retailer: pkg.retailer || 'Unknown',
    trackingNumber: pkg.trackingNumber || 'N/A',
    weight: `${pkg.weight?.value || 0}`,
    dimensions: `${pkg.dimensions?.length || 0}x${pkg.dimensions?.width || 0}x${
      pkg.dimensions?.height || 0
    }`,
    photo: getEmojiForRetailer(pkg.retailer || 'Unknown'),
    receivedDate: pkg.receivedDate
      ? new Date(pkg.receivedDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    storageDay: pkg.storageDay || 0,
    status: pkg.status || 'received',
    estimatedValue: `$${pkg.estimatedValue?.amount || 0}`,
    isConsolidatedResult: pkg.isConsolidatedResult || false,
    originalPackageIds: pkg.originalPackageIds || [],
    consolidationId: pkg.consolidationId || null,
    notes: pkg.notes || '',
    // Include photos array for package details
    photos: pkg.photos || [],
    // Include raw data for detailed views
    rawWeight: pkg.weight,
    rawDimensions: pkg.dimensions,
    rawEstimatedValue: pkg.estimatedValue,
  };
}

// Helper function to get emoji for retailer
function getEmojiForRetailer(retailer: string): string {
  const emojiMap: Record<string, string> = {
    Amazon: '📦',
    eBay: '🛒',
    'Best Buy': '🖥️',
    Walmart: '🏪',
    Target: '🎯',
    Nike: '👟',
    Adidas: '👟',
    Apple: '🍎',
    Shein: '👗',
    Zara: '👔',
    'H&M': '👕',
    ASOS: '👠',
    Alibaba: '🏭',
    AliExpress: '🛍️',
  };

  const lowerRetailer = retailer.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerRetailer.includes(key.toLowerCase())) {
      return emoji;
    }
  }
  return '📦';
}
