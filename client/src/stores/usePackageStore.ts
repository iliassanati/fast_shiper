// client/src/stores/usePackageStore.ts - FIXED VERSION
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Package, PackageStatus } from '@/types/client.types';
import { apiHelpers } from '@/lib/api';

interface PackageState {
  packages: Package[];
  selectedPackageIds: string[];
  loading: boolean;
  error: string | null;
  filterStatus: PackageStatus | 'all';
  initialized: boolean;

  // Getters
  getPackageById: (id: string) => Package | undefined;
  getSelectedPackages: () => Package[];
  getPackagesByStatus: (status: PackageStatus) => Package[];

  // Actions
  setPackages: (packages: Package[]) => void;
  addPackage: (pkg: Package) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  removePackage: (id: string) => void;
  togglePackageSelection: (id: string) => void;
  selectMultiplePackages: (ids: string[]) => void;
  clearSelection: () => void;
  setFilterStatus: (status: PackageStatus | 'all') => void;
  fetchPackages: (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchPackageById: (id: string) => Promise<Package>;
  deletePackage: (id: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  packages: [],
  selectedPackageIds: [],
  loading: false,
  error: null,
  filterStatus: 'all' as PackageStatus | 'all',
  initialized: false,
};

export const usePackageStore = create<PackageState>()(
  devtools((set, get) => ({
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

    // Actions
    setPackages: (packages) => set({ packages, initialized: true }),

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

    togglePackageSelection: (id) =>
      set((state) => ({
        selectedPackageIds: state.selectedPackageIds.includes(id)
          ? state.selectedPackageIds.filter((pkgId) => pkgId !== id)
          : [...state.selectedPackageIds, id],
      })),

    selectMultiplePackages: (ids) => set({ selectedPackageIds: ids }),

    clearSelection: () => set({ selectedPackageIds: [] }),

    setFilterStatus: (status) => set({ filterStatus: status }),

    fetchPackages: async (filters) => {
      set({ loading: true, error: null });

      try {
        console.log('🔍 Fetching packages with filters:', filters);
        console.log(
          '🔑 Token in localStorage:',
          !!localStorage.getItem('auth-token')
        );

        const response = await apiHelpers.get<{
          packages: any[];
          pagination: any;
        }>('/packages', filters);

        console.log('📦 API Response received');
        console.log('📦 Response structure:', {
          hasPackages: !!response.packages,
          packagesCount: response.packages?.length || 0,
          hasPagination: !!response.pagination,
        });

        // Handle empty response
        if (!response.packages) {
          console.warn('⚠️ No packages array in response');
          set({ packages: [], loading: false, initialized: true });
          return;
        }

        // Handle empty packages array (valid response, just no packages yet)
        if (response.packages.length === 0) {
          console.log('ℹ️ User has no packages yet');
          set({ packages: [], loading: false, initialized: true, error: null });
          return;
        }

        // Transform backend data to frontend format
        const packages = response.packages.map((pkg: any, index: number) => {
          console.log(
            `🔄 Transforming package ${index + 1}/${response.packages.length}:`,
            {
              id: pkg._id || pkg.id,
              description: pkg.description,
              retailer: pkg.retailer,
              status: pkg.status,
            }
          );

          return {
            id: pkg._id || pkg.id,
            description: pkg.description || 'No description',
            retailer: pkg.retailer || 'Unknown',
            trackingNumber: pkg.trackingNumber || 'N/A',
            weight: `${pkg.weight?.value || 0}`,
            dimensions: `${pkg.dimensions?.length || 0}x${
              pkg.dimensions?.width || 0
            }x${pkg.dimensions?.height || 0}`,
            photo: getEmojiForRetailer(pkg.retailer || 'Unknown'),
            receivedDate: pkg.receivedDate
              ? new Date(pkg.receivedDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            storageDay: pkg.storageDay || 0,
            status: pkg.status || 'received',
            estimatedValue: `$${pkg.estimatedValue?.amount || 0}`,
          };
        });

        console.log('✅ Successfully transformed packages:', packages.length);
        if (packages.length > 0) {
          console.log('📊 Sample package:', packages[0]);
        }

        set({ packages, loading: false, initialized: true, error: null });
      } catch (error: any) {
        console.error('❌ Error fetching packages:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);

        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          'Failed to fetch packages';

        set({
          error: errorMessage,
          loading: false,
          initialized: true,
          packages: [],
        });

        // Don't throw error, just log it
        console.error('❌ Package fetch failed with message:', errorMessage);
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
        const transformedPkg: Package = {
          id: pkg._id || pkg.id,
          description: pkg.description || 'No description',
          retailer: pkg.retailer || 'Unknown',
          trackingNumber: pkg.trackingNumber || 'N/A',
          weight: `${pkg.weight?.value || 0}`,
          dimensions: `${pkg.dimensions?.length || 0}x${
            pkg.dimensions?.width || 0
          }x${pkg.dimensions?.height || 0}`,
          photo: getEmojiForRetailer(pkg.retailer || 'Unknown'),
          receivedDate: pkg.receivedDate
            ? new Date(pkg.receivedDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          storageDay: pkg.storageDay || 0,
          status: pkg.status || 'received',
          estimatedValue: `$${pkg.estimatedValue?.amount || 0}`,
        };

        // Update the package in the store
        get().updatePackage(id, transformedPkg);
        set({ loading: false });

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
  }))
);

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
  };

  return emojiMap[retailer] || '📦';
}
