// client/src/pages/client/PackagesPage.tsx - UPDATED with Consolidating Packages
import PackageCard from '@/components/dashboard/PackageCard';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  useNotificationStore,
  usePackageStore,
  useDashboardStore,
} from '@/stores';
import type { PackageStatus, Package } from '@/types/client.types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Box,
  Camera,
  Check,
  Filter,
  Package as PackageIcon,
  RefreshCw,
  Search,
  Truck,
  X,
  Info,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PackagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    packages,
    selectedPackageIds,
    togglePackageSelection,
    clearSelection,
    selectMultiplePackages,
    fetchPackages,
    loading,
    filterStatus,
    setFilterStatus,
    getAvailableForConsolidation,
  } = usePackageStore();

  const { updateStatsFromPackages } = useDashboardStore();
  const { showToast } = useNotificationStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'weight' | 'storage'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch packages on mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        console.log('📦 Loading packages...');
        await fetchPackages({ limit: 100 });
      } catch (error) {
        console.error('❌ Error loading packages:', error);
        showToast('Failed to load packages', 'error');
      }
    };

    loadPackages();
  }, [fetchPackages, showToast]);

  // Update dashboard stats when packages change
  useEffect(() => {
    if (packages.length > 0) {
      updateStatsFromPackages(packages);
    }
  }, [packages, updateStatsFromPackages]);

  // FIX: Clear selection when leaving page (except for workflow pages)
  useEffect(() => {
    // Store the current path when component mounts
    const currentPath = location.pathname;

    return () => {
      // Get the NEW path we're navigating TO
      const workflowPaths = ['/consolidation', '/shipping', '/request-info'];
      const newPath = window.location.pathname;

      // Only clear if NOT navigating to a workflow page
      if (!workflowPaths.some((path) => newPath.startsWith(path))) {
        console.log('📦 Clearing package selection - leaving packages page');
        clearSelection();
      } else {
        console.log('📦 Keeping selection - navigating to workflow:', newPath);
      }
    };
  }, [clearSelection, location.pathname]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPackages({ forceRefresh: true });
      showToast('Packages refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh packages', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPackages, showToast]);

  // Calculate stats for filter options - UPDATED: Added consolidating
  const packageStats = useMemo(() => {
    return {
      all: packages.length,
      received: packages.filter((p) => p.status === 'received').length,
      consolidating: packages.filter(
        (p) => p.status === 'consolidated' && !p.isConsolidatedResult
      ).length,
      consolidated: packages.filter((p) => p.isConsolidatedResult).length,
      shipped: packages.filter(
        (p) =>
          p.status === 'shipped' ||
          p.status === 'in_transit' ||
          p.status === 'delivered'
      ).length,
    };
  }, [packages]);

  // Filter options with dynamic counts - UPDATED: Added consolidating option
  const statusOptions: Array<{
    label: string;
    value: PackageStatus | 'all' | 'consolidating';
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      label: 'All Packages',
      value: 'all',
      count: packageStats.all,
      icon: <PackageIcon className='w-4 h-4' />,
    },
    {
      label: 'In Storage',
      value: 'received',
      count: packageStats.received,
      icon: <Archive className='w-4 h-4' />,
    },
    {
      label: 'Consolidating',
      value: 'consolidating',
      count: packageStats.consolidating,
      icon: <RefreshCw className='w-4 h-4' />,
    },
    {
      label: 'Consolidated',
      value: 'consolidated',
      count: packageStats.consolidated,
      icon: <Box className='w-4 h-4' />,
    },
    {
      label: 'Shipped',
      value: 'shipped',
      count: packageStats.shipped,
      icon: <Truck className='w-4 h-4' />,
    },
  ];

  // Filtered and sorted packages - UPDATED: Added consolidating filter
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'consolidating') {
        // Show packages being consolidated (not results)
        filtered = filtered.filter(
          (pkg) => pkg.status === 'consolidated' && !pkg.isConsolidatedResult
        );
      } else if (filterStatus === 'consolidated') {
        filtered = filtered.filter((pkg) => pkg.isConsolidatedResult);
      } else if (filterStatus === 'shipped') {
        filtered = filtered.filter(
          (pkg) =>
            pkg.status === 'shipped' ||
            pkg.status === 'in_transit' ||
            pkg.status === 'delivered'
        );
      } else {
        filtered = filtered.filter((pkg) => pkg.status === filterStatus);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.description.toLowerCase().includes(query) ||
          pkg.retailer.toLowerCase().includes(query) ||
          pkg.trackingNumber.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (
            new Date(b.receivedDate).getTime() -
            new Date(a.receivedDate).getTime()
          );
        case 'weight':
          return parseFloat(b.weight) - parseFloat(a.weight);
        case 'storage':
          return b.storageDay - a.storageDay;
        default:
          return 0;
      }
    });

    return filtered;
  }, [packages, filterStatus, searchQuery, sortBy]);

  // Get packages available for consolidation (status: received)
  const shippablePackages = useMemo(() => {
    return packages.filter((p) => p.status === 'received');
  }, [packages]);

  // Get selected packages that are shippable
  const selectedShippable = useMemo(() => {
    return packages.filter(
      (pkg) => selectedPackageIds.includes(pkg.id) && pkg.status === 'received'
    );
  }, [packages, selectedPackageIds]);

  // Bulk actions with better UX
  const handleSelectAll = () => {
    if (selectedPackageIds.length === filteredPackages.length) {
      clearSelection();
    } else {
      const allIds = filteredPackages.map((pkg) => pkg.id);
      selectMultiplePackages(allIds);
    }
  };

  const handleBulkShip = () => {
    if (selectedPackageIds.length === 0) {
      showToast('Please select at least one package to ship', 'warning');
      return;
    }

    if (selectedShippable.length === 0) {
      showToast(
        'Selected packages cannot be shipped. Only packages in storage can be shipped.',
        'warning'
      );
      return;
    }

    // Update selection to only include shippable packages
    if (selectedShippable.length !== selectedPackageIds.length) {
      selectMultiplePackages(selectedShippable.map((p) => p.id));
      showToast(`${selectedShippable.length} package(s) ready to ship`, 'info');
    }

    navigate('/shipping');
  };

  const handleBulkConsolidate = () => {
    // Get packages that can be consolidated
    const consolidatableSelected = packages.filter(
      (pkg) => selectedPackageIds.includes(pkg.id) && pkg.status === 'received'
    );

    if (consolidatableSelected.length === 0) {
      // No packages selected or selected packages not eligible
      if (shippablePackages.length < 2) {
        showToast(
          'You need at least 2 packages in storage to consolidate',
          'warning'
        );
        return;
      }
      // Guide user to select packages
      showToast('Select 2 or more packages in storage to consolidate', 'info');
      return;
    }

    if (consolidatableSelected.length === 1) {
      showToast(
        'Select at least one more package to consolidate together',
        'info'
      );
      return;
    }

    // Update selection to only include consolidatable packages
    selectMultiplePackages(consolidatableSelected.map((p) => p.id));
    navigate('/consolidation');
  };

  const handleRequestPhotos = () => {
    if (selectedPackageIds.length === 0) {
      // Guide user to select a package
      if (shippablePackages.length === 0) {
        showToast('No packages in storage to request photos for', 'warning');
        return;
      }
      showToast('Select a package to request photos', 'info');
      return;
    }

    // Only one package at a time for photo requests
    const validPackages = packages.filter(
      (pkg) => selectedPackageIds.includes(pkg.id) && pkg.status === 'received'
    );

    if (validPackages.length === 0) {
      showToast(
        'Photo requests can only be made for packages in storage',
        'warning'
      );
      return;
    }

    // Use first selected package
    selectMultiplePackages([validPackages[0].id]);
    navigate('/request-info');
  };

  // Show loading state
  if (loading && packages.length === 0) {
    return (
      <DashboardLayout activeSection='packages'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600'>Loading packages...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeSection='packages'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>My Packages</h1>
            <p className='text-slate-600'>
              {filteredPackages.length} of {packages.length} packages
              {filterStatus !== 'all' && ` (filtered by ${filterStatus})`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className='flex flex-wrap gap-3'>
            {/* Refresh Button */}
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className='px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-200 disabled:opacity-50'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </motion.button>

            {/* Ship Button */}
            <motion.button
              onClick={handleBulkShip}
              className={`px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 transition-all ${
                selectedShippable.length > 0
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'bg-slate-200 text-slate-500 cursor-help'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={
                selectedShippable.length > 0
                  ? `Ship ${selectedShippable.length} package(s)`
                  : 'Select packages in storage to ship'
              }
            >
              <Truck className='w-4 h-4' />
              Ship
              {selectedShippable.length > 0 && (
                <span className='bg-white/30 px-1.5 py-0.5 rounded text-xs'>
                  {selectedShippable.length}
                </span>
              )}
            </motion.button>

            {/* Consolidate Button */}
            <motion.button
              onClick={handleBulkConsolidate}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                selectedShippable.length >= 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-500 cursor-help'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={
                selectedShippable.length >= 2
                  ? `Consolidate ${selectedShippable.length} packages`
                  : 'Select 2+ packages in storage to consolidate'
              }
            >
              <Box className='w-4 h-4' />
              Consolidate
              {selectedShippable.length >= 2 && (
                <span className='bg-white/30 px-1.5 py-0.5 rounded text-xs'>
                  {selectedShippable.length}
                </span>
              )}
            </motion.button>

            {/* Request Photos Button */}
            <motion.button
              onClick={handleRequestPhotos}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                selectedShippable.length === 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 text-slate-500 cursor-help'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={
                selectedShippable.length === 1
                  ? 'Request photos for selected package'
                  : 'Select one package to request photos'
              }
            >
              <Camera className='w-4 h-4' />
              Photos
            </motion.button>
          </div>
        </div>

        {/* NEW: Consolidating Packages Alert */}
        {packageStats.consolidating > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-purple-50 border-2 border-purple-200 rounded-2xl p-4'
          >
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <Loader2 className='w-6 h-6 text-purple-600 animate-spin' />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-bold text-purple-900 mb-1'>
                  📦 Consolidation in Progress
                </h3>
                <p className='text-purple-700'>
                  You have <strong>{packageStats.consolidating}</strong> package
                  {packageStats.consolidating !== 1 ? 's' : ''} currently being
                  consolidated. We'll notify you when ready (typically 2-4
                  business days).
                </p>
              </div>
              <button
                onClick={() => setFilterStatus('consolidating')}
                className='px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors'
              >
                View
              </button>
            </div>
          </motion.div>
        )}

        {/* Helper hint when no selection */}
        {selectedPackageIds.length === 0 && shippablePackages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4'
          >
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                <Sparkles className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <p className='font-semibold text-blue-900'>
                  Quick Tip: Select packages to take action
                </p>
                <p className='text-sm text-blue-700'>
                  Click on packages to select them, then use the buttons above
                  to ship, consolidate, or request photos.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search & Filters Bar */}
        <div className='bg-white rounded-2xl p-4 shadow-lg border border-slate-100'>
          <div className='flex flex-col md:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search packages by name, retailer, or tracking number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  <X className='w-5 h-5' />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className='w-5 h-5' />
              Filters
            </motion.button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-4 pt-4 border-t border-slate-200'
              >
                <div className='grid md:grid-cols-2 gap-4'>
                  {/* Sort By */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as typeof sortBy)
                      }
                      className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                    >
                      <option value='date'>Received Date (Newest)</option>
                      <option value='weight'>Weight (Heaviest)</option>
                      <option value='storage'>Storage Days (Most)</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as typeof filterStatus)
                      }
                      className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.count})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Summary - UPDATED: Added Consolidating stat */}
        {packages.length > 0 && (
          <div className='grid md:grid-cols-4 gap-4'>
            <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                  <PackageIcon className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Total Packages</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {packageStats.all}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center'>
                  <Archive className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>In Storage</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {packageStats.received}
                  </p>
                </div>
              </div>
            </div>

            {/* NEW: Consolidating stat card */}
            <div className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center'>
                  <RefreshCw className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Consolidating</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {packageStats.consolidating}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center'>
                  <Truck className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Shipped</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {packageStats.shipped}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className='flex gap-3 flex-wrap'>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                filterStatus === option.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {option.icon}
              {option.label}
              <span
                className={`text-sm ${
                  filterStatus === option.value
                    ? 'text-blue-200'
                    : 'text-slate-500'
                }`}
              >
                ({option.count})
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Selection Bar */}
        <AnimatePresence>
          {selectedPackageIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='bg-blue-50 border-2 border-blue-200 rounded-2xl p-4'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold'>
                      {selectedPackageIds.length}
                    </div>
                    <div>
                      <span className='font-semibold text-slate-900'>
                        {selectedPackageIds.length} package(s) selected
                      </span>
                      {selectedShippable.length !==
                        selectedPackageIds.length && (
                        <p className='text-xs text-blue-700'>
                          {selectedShippable.length} available for
                          shipping/consolidation
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className='text-sm text-blue-600 hover:text-blue-700 font-semibold'
                  >
                    {selectedPackageIds.length === filteredPackages.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <button
                  onClick={clearSelection}
                  className='p-2 hover:bg-blue-100 rounded-lg transition-colors'
                >
                  <X className='w-5 h-5 text-slate-600' />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Packages Grid */}
        {filteredPackages.length > 0 ? (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredPackages.map((pkg, i) => (
              <div key={pkg.id} className='relative'>
                {/* Selection Checkbox */}
                <div className='absolute top-4 left-4 z-10'>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePackageSelection(pkg.id);
                    }}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedPackageIds.includes(pkg.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-slate-300 hover:border-blue-400'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {selectedPackageIds.includes(pkg.id) && (
                      <Check className='w-4 h-4 text-white' />
                    )}
                  </motion.button>
                </div>

                {/* Consolidated Result Badge */}
                {pkg.isConsolidatedResult && (
                  <div className='absolute top-4 right-4 z-10'>
                    <span className='px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded-full'>
                      Consolidated
                    </span>
                  </div>
                )}

                <PackageCard
                  package={pkg}
                  onClick={() => navigate(`/packages/${pkg.id}`)}
                  delay={i * 0.05}
                />
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='text-center py-20'
          >
            <div className='w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6'>
              {searchQuery ? (
                <Search className='w-12 h-12 text-slate-400' />
              ) : (
                <PackageIcon className='w-12 h-12 text-slate-400' />
              )}
            </div>
            <h3 className='text-2xl font-bold text-slate-900 mb-2'>
              {searchQuery ? 'No packages found' : 'No packages yet'}
            </h3>
            <p className='text-slate-600 mb-8 max-w-md mx-auto'>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start shopping from US stores and your packages will appear here'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className='px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors'
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
