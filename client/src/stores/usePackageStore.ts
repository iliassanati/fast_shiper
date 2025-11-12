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

  // Getters (computed values)
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
}

export const usePackageStore = create<PackageState>()(
  devtools((set, get) => ({
    packages: [],
    selectedPackageIds: [],
    loading: false,
    error: null,
    filterStatus: 'all',

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
    setPackages: (packages) => set({ packages }),

    addPackage: (pkg) =>
      set((state) => ({
        packages: [...state.packages, pkg],
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

        set({ packages: response.packages, loading: false });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to fetch packages',
          loading: false,
        });
        throw error;
      }
    },

    fetchPackageById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{ package: Package }>(
          `/packages/${id}`
        );

        // Update the package in the store
        get().updatePackage(id, response.package);
        set({ loading: false });
        return response.package;
      } catch (error: any) {
        set({
          error: error.message || 'Failed to fetch package',
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
          error: error.message || 'Failed to delete package',
          loading: false,
        });
        throw error;
      }
    },
  }))
);
