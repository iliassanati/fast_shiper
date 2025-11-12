// src/stores/usePackageStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Package, PackageStatus } from '@/types/client.types';

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
  fetchPackages: () => Promise<void>;
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

    fetchPackages: async () => {
      set({ loading: true, error: null });
      try {
        // TODO: Replace with API call
        // const response = await packageAPI.getPackages();

        // Mock data for now (using your existing mockPackages)
        const { mockPackages } = await import('@/data/client/mockPackages');
        set({ packages: mockPackages, loading: false });
      } catch (error) {
        set({
          error: 'Failed to fetch packages',
          loading: false,
        });
        throw error;
      }
    },
  }))
);
