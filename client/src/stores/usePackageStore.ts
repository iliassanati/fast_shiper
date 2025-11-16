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

        const response = await apiHelpers.get<{
          packages: any[];
          pagination: any;
        }>('/packages', filters);

        if (!response.packages) {
          set({ packages: [], loading: false, initialized: true });
          return;
        }

        // Transform backend data
        const allPackages = response.packages.map((pkg: any) => ({
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
          // NEW: Consolidated package fields
          isConsolidatedResult: pkg.isConsolidatedResult || false,
          originalPackageIds: pkg.originalPackageIds || [],
          consolidationId: pkg.consolidationId || null,
          notes: pkg.notes || '',
        }));

        // 🔥 FILTER: Hide packages with status 'consolidated' (old packages)
        const visiblePackages = allPackages.filter(
          (pkg: any) => pkg.status !== 'consolidated'
        );

        console.log(
          `✅ Showing ${visiblePackages.length} packages (filtered out ${
            allPackages.length - visiblePackages.length
          } consolidated)`
        );

        set({
          packages: visiblePackages,
          loading: false,
          initialized: true,
          error: null,
        });
      } catch (error: any) {
        console.error('❌ Error fetching packages:', error);
        set({
          error: error.message || 'Failed to fetch packages',
          loading: false,
          initialized: true,
          packages: [],
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
