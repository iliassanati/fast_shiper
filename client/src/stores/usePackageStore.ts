// client/src/stores/usePackageStore.ts
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
        const response = await apiHelpers.get<{
          packages: Package[];
          pagination: any;
        }>('/packages', filters);

        // Transform backend data to frontend format
        const packages = response.packages.map((pkg: any) => ({
          id: pkg._id || pkg.id,
          description: pkg.description,
          retailer: pkg.retailer,
          trackingNumber: pkg.trackingNumber,
          weight: `${pkg.weight.value}`,
          dimensions: `${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height}`,
          photo: getEmojiForRetailer(pkg.retailer),
          receivedDate: new Date(pkg.receivedDate).toISOString().split('T')[0],
          storageDay: pkg.storageDay,
          status: pkg.status,
          estimatedValue: `$${pkg.estimatedValue.amount}`,
        }));

        set({ packages, loading: false, initialized: true });
      } catch (error: any) {
        console.error('Error fetching packages:', error);
        set({
          error: error.response?.data?.error || 'Failed to fetch packages',
          loading: false,
          initialized: true,
        });
      }
    },

    fetchPackageById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{ package: any }>(
          `/packages/${id}`
        );

        const pkg = response.package;
        const transformedPkg: Package = {
          id: pkg._id || pkg.id,
          description: pkg.description,
          retailer: pkg.retailer,
          trackingNumber: pkg.trackingNumber,
          weight: `${pkg.weight.value}`,
          dimensions: `${pkg.dimensions.length}x${pkg.dimensions.width}x${pkg.dimensions.height}`,
          photo: getEmojiForRetailer(pkg.retailer),
          receivedDate: new Date(pkg.receivedDate).toISOString().split('T')[0],
          storageDay: pkg.storageDay,
          status: pkg.status,
          estimatedValue: `$${pkg.estimatedValue.amount}`,
        };

        // Update the package in the store
        get().updatePackage(id, transformedPkg);
        set({ loading: false });
        return transformedPkg;
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to fetch package',
          loading: false,
        });
        throw error;
      }
    },

    deletePackage: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await apiHelpers.delete(`/packages/${id}`);
        get().removePackage(id);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to delete package',
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
