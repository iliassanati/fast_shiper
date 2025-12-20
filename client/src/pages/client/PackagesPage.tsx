// client/src/pages/client/PackagesPage.tsx - OPTIMIZED UI/UX VERSION
import PackageCard from '@/components/dashboard/PackageCard';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  useDashboardStore,
  useNotificationStore,
  usePackageStore,
} from '@/stores';
import type { PackageStatus } from '@/types/client.types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Box,
  Camera,
  Check,
  Filter,
  Loader2,
  Package as PackageIcon,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  } = usePackageStore();

  const { updateStatsFromPackages } = useDashboardStore();
  const { showToast } = useNotificationStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'weight' | 'storage'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Clear selection when leaving page (except for workflow pages)
  useEffect(() => {
    return () => {
      const workflowPaths = ['/consolidation', '/shipping', '/request-info'];
      const newPath = window.location.pathname;

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

  // Calculate stats for filter options
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

  // Filter options with dynamic counts
  const statusOptions: Array<{
    label: string;
    value: PackageStatus | 'all' | 'consolidating';
    count: number;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }> = [
    {
      label: 'All Packages',
      value: 'all',
      count: packageStats.all,
      icon: <PackageIcon className='w-4 h-4' />,
      color: 'text-slate-700',
      bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100',
    },
    {
      label: 'In Storage',
      value: 'received',
      count: packageStats.received,
      icon: <Archive className='w-4 h-4' />,
      color: 'text-green-700',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    },
    {
      label: 'Consolidating',
      value: 'consolidating',
      count: packageStats.consolidating,
      icon: <RefreshCw className='w-4 h-4' />,
      color: 'text-purple-700',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    },
    {
      label: 'Consolidated',
      value: 'consolidated',
      count: packageStats.consolidated,
      icon: <Box className='w-4 h-4' />,
      color: 'text-blue-700',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    },
    {
      label: 'Shipped',
      value: 'shipped',
      count: packageStats.shipped,
      icon: <Truck className='w-4 h-4' />,
      color: 'text-orange-700',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
    },
  ];

  // Filtered and sorted packages
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'consolidating') {
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

  // Get packages available for consolidation
  const shippablePackages = useMemo(() => {
    return packages.filter((p) => p.status === 'received');
  }, [packages]);

  // Get selected packages that are shippable
  const selectedShippable = useMemo(() => {
    return packages.filter(
      (pkg) => selectedPackageIds.includes(pkg.id) && pkg.status === 'received'
    );
  }, [packages, selectedPackageIds]);

  // Bulk actions
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

    if (selectedShippable.length !== selectedPackageIds.length) {
      selectMultiplePackages(selectedShippable.map((p) => p.id));
      showToast(`${selectedShippable.length} package(s) ready to ship`, 'info');
    }

    navigate('/shipping');
  };

  const handleBulkConsolidate = () => {
    const consolidatableSelected = packages.filter(
      (pkg) => selectedPackageIds.includes(pkg.id) && pkg.status === 'received'
    );

    if (consolidatableSelected.length === 0) {
      if (shippablePackages.length < 2) {
        showToast(
          'You need at least 2 packages in storage to consolidate',
          'warning'
        );
        return;
      }
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

    selectMultiplePackages(consolidatableSelected.map((p) => p.id));
    navigate('/consolidation');
  };

  const handleRequestPhotos = () => {
    if (selectedPackageIds.length === 0) {
      if (shippablePackages.length === 0) {
        showToast('No packages in storage to request photos for', 'warning');
        return;
      }
      showToast('Select a package to request photos', 'info');
      return;
    }

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

    selectMultiplePackages([validPackages[0].id]);
    navigate('/request-info');
  };

  // Loading state
  if (loading && packages.length === 0) {
    return (
      <DashboardLayout activeSection='packages'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600 font-medium'>Loading packages...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeSection='packages'>
      <div className='space-y-6'>
        {/* ========== ENHANCED HEADER ========== */}
        <div className='flex flex-col gap-6'>
          {/* Title Row */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='space-y-1'>
              <h1 className='text-4xl font-bold text-slate-900 tracking-tight text-left'>
                My Packages
              </h1>
              <div className='flex items-center gap-3 text-slate-600'>
                <span className='flex items-center gap-2'>
                  <div className='w-2 h-2 rounded-full bg-blue-500' />
                  <span className='font-medium'>
                    {filteredPackages.length} of {packages.length} packages
                  </span>
                </span>
                {filterStatus !== 'all' && (
                  <>
                    <span className='text-slate-300'>•</span>
                    <span className='text-sm capitalize'>
                      filtered by {filterStatus.replace('_', ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap items-center gap-3'>
              {/* View Mode Toggle */}
              <div className='flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title='Grid view'
                >
                  <LayoutGrid className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title='List view'
                >
                  <List className='w-4 h-4' />
                </button>
              </div>

              {/* Refresh Button */}
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className='px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm disabled:opacity-50 transition-all'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className='hidden sm:inline'>Refresh</span>
              </motion.button>

              {/* Ship Button */}
              <motion.button
                onClick={handleBulkShip}
                className={`px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${
                  selectedShippable.length > 0
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl hover:scale-105'
                    : 'bg-slate-200 text-slate-500 cursor-help'
                }`}
                whileHover={selectedShippable.length > 0 ? { scale: 1.05 } : {}}
                whileTap={selectedShippable.length > 0 ? { scale: 0.95 } : {}}
                title={
                  selectedShippable.length > 0
                    ? `Ship ${selectedShippable.length} package(s)`
                    : 'Select packages in storage to ship'
                }
              >
                <Truck className='w-4 h-4' />
                <span>Ship</span>
                {selectedShippable.length > 0 && (
                  <span className='bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold'>
                    {selectedShippable.length}
                  </span>
                )}
              </motion.button>

              {/* Consolidate Button */}
              <motion.button
                onClick={handleBulkConsolidate}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
                  selectedShippable.length >= 2
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-slate-200 text-slate-500 cursor-help'
                }`}
                whileHover={
                  selectedShippable.length >= 2 ? { scale: 1.05 } : {}
                }
                whileTap={selectedShippable.length >= 2 ? { scale: 0.95 } : {}}
                title={
                  selectedShippable.length >= 2
                    ? `Consolidate ${selectedShippable.length} packages`
                    : 'Select 2+ packages in storage to consolidate'
                }
              >
                <Box className='w-4 h-4' />
                <span className='hidden sm:inline'>Consolidate</span>
                {selectedShippable.length >= 2 && (
                  <span className='bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold'>
                    {selectedShippable.length}
                  </span>
                )}
              </motion.button>

              {/* Request Photos Button */}
              <motion.button
                onClick={handleRequestPhotos}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
                  selectedShippable.length === 1
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-slate-200 text-slate-500 cursor-help'
                }`}
                whileHover={
                  selectedShippable.length === 1 ? { scale: 1.05 } : {}
                }
                whileTap={selectedShippable.length === 1 ? { scale: 0.95 } : {}}
                title={
                  selectedShippable.length === 1
                    ? 'Request photos for selected package'
                    : 'Select one package to request photos'
                }
              >
                <Camera className='w-4 h-4' />
                <span className='hidden sm:inline'>Photos</span>
              </motion.button>
            </div>
          </div>

          {/* Consolidating Packages Alert */}
          {packageStats.consolidating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 shadow-sm'
            >
              <div className='flex items-start gap-4'>
                <div className='w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg'>
                  <Loader2 className='w-7 h-7 text-white animate-spin' />
                </div>
                <div className='flex-1 text-left'>
                  <h3 className='text-xl font-bold text-purple-900 mb-2 flex items-center gap-2'>
                    📦 Consolidation in Progress
                    <span className='px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full'>
                      {packageStats.consolidating}
                    </span>
                  </h3>
                  <p className='text-purple-800 leading-relaxed'>
                    Your packages are being consolidated. You'll receive a
                    notification when ready (typically 2-4 business days).
                  </p>
                </div>
                <button
                  onClick={() => setFilterStatus('consolidating')}
                  className='px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors shadow-sm'
                >
                  View Details
                </button>
              </div>
            </motion.div>
          )}

          {/* Helper hint when no selection */}
          {selectedPackageIds.length === 0 && shippablePackages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm'
            >
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md'>
                  <Sparkles className='w-6 h-6 text-white' />
                </div>
                <div className='flex-1 text-left'>
                  <p className='font-bold text-blue-900 text-lg mb-1'>
                    💡 Quick Tip: Select packages to take action
                  </p>
                  <p className='text-blue-700 leading-relaxed'>
                    Click on packages to select them, then use the action
                    buttons above to ship, consolidate, or request photos.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ========== ENHANCED SEARCH & FILTERS ========== */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search by name, retailer, or tracking number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900 placeholder:text-slate-400'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${
                showFilters
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SlidersHorizontal className='w-5 h-5' />
              <span>Filters</span>
              {showFilters ? (
                <ChevronDown className='w-4 h-4' />
              ) : (
                <Filter className='w-4 h-4' />
              )}
            </motion.button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-6 pt-6 border-t border-slate-200'
              >
                <div className='grid md:grid-cols-2 gap-6'>
                  {/* Sort By */}
                  <div>
                    <label className='block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2'>
                      <TrendingUp className='w-4 h-4' />
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as typeof sortBy)
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none font-medium text-slate-900 bg-white'
                    >
                      <option value='date'>📅 Received Date (Newest)</option>
                      <option value='weight'>⚖️ Weight (Heaviest)</option>
                      <option value='storage'>⏱️ Storage Days (Most)</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className='block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2'>
                      <Filter className='w-4 h-4' />
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as typeof filterStatus)
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none font-medium text-slate-900 bg-white'
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

        {/* ========== ENHANCED STATS CARDS ========== */}
        {packages.length > 0 && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {/* In Storage Card */}
            <motion.button
              onClick={() => setFilterStatus('received')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 transition-all text-left ${
                filterStatus === 'received'
                  ? 'border-green-400 shadow-lg ring-4 ring-green-100'
                  : 'border-green-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-sm'>
                  <Archive className='w-6 h-6 text-white' />
                </div>
                <span className='px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full'>
                  {packageStats.received}
                </span>
              </div>
              <p className='text-sm text-slate-600 font-medium mb-2'>
                In Storage
              </p>
              <div className='flex items-center gap-2'>
                <div className='w-full h-2 bg-green-200/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-green-500 transition-all'
                    style={{
                      width: `${
                        packages.length > 0
                          ? (packageStats.received / packages.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.button>

            {/* Consolidating Card */}
            <motion.button
              onClick={() => setFilterStatus('consolidating')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 transition-all text-left ${
                filterStatus === 'consolidating'
                  ? 'border-purple-400 shadow-lg ring-4 ring-purple-100'
                  : 'border-purple-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm'>
                  <RefreshCw className='w-6 h-6 text-white' />
                </div>
                <span className='px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full'>
                  {packageStats.consolidating}
                </span>
              </div>
              <p className='text-sm text-slate-600 font-medium mb-2'>
                Consolidating
              </p>
              <div className='flex items-center gap-2'>
                <div className='w-full h-2 bg-purple-200/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-purple-500 transition-all'
                    style={{
                      width: `${
                        packages.length > 0
                          ? (packageStats.consolidating / packages.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.button>

            {/* Consolidated Card */}
            <motion.button
              onClick={() => setFilterStatus('consolidated')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 transition-all text-left ${
                filterStatus === 'consolidated'
                  ? 'border-blue-400 shadow-lg ring-4 ring-blue-100'
                  : 'border-blue-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm'>
                  <Box className='w-6 h-6 text-white' />
                </div>
                <span className='px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full'>
                  {packageStats.consolidated}
                </span>
              </div>
              <p className='text-sm text-slate-600 font-medium mb-2'>
                Consolidated
              </p>
              <div className='flex items-center gap-2'>
                <div className='w-full h-2 bg-blue-200/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-blue-500 transition-all'
                    style={{
                      width: `${
                        packages.length > 0
                          ? (packageStats.consolidated / packages.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.button>

            {/* Shipped Card */}
            <motion.button
              onClick={() => setFilterStatus('shipped')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 transition-all text-left ${
                filterStatus === 'shipped'
                  ? 'border-orange-400 shadow-lg ring-4 ring-orange-100'
                  : 'border-orange-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm'>
                  <Truck className='w-6 h-6 text-white' />
                </div>
                <span className='px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full'>
                  {packageStats.shipped}
                </span>
              </div>
              <p className='text-sm text-slate-600 font-medium mb-2'>Shipped</p>
              <div className='flex items-center gap-2'>
                <div className='w-full h-2 bg-orange-200/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-orange-500 transition-all'
                    style={{
                      width: `${
                        packages.length > 0
                          ? (packageStats.shipped / packages.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </motion.button>
          </div>
        )}

        {/* ========== BULK SELECTION BAR ========== */}
        <AnimatePresence>
          {selectedPackageIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='sticky top-20 z-30 bg-gradient-to-r from-blue-600 to-cyan-600 border-2 border-blue-500 rounded-2xl p-5 shadow-2xl'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-3'>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className='w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-black text-lg shadow-md'
                    >
                      {selectedPackageIds.length}
                    </motion.div>
                    <div className='text-white'>
                      <span className='font-bold text-lg block'>
                        {selectedPackageIds.length} package
                        {selectedPackageIds.length !== 1 ? 's' : ''} selected
                      </span>
                      {selectedShippable.length !==
                        selectedPackageIds.length && (
                        <p className='text-sm text-blue-100'>
                          {selectedShippable.length} available for
                          shipping/consolidation
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className='px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition-colors backdrop-blur-sm'
                  >
                    {selectedPackageIds.length === filteredPackages.length
                      ? '✓ Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <button
                  onClick={clearSelection}
                  className='p-3 hover:bg-white/20 rounded-xl transition-colors'
                >
                  <X className='w-6 h-6 text-white' />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== PACKAGES GRID/LIST ========== */}
        {filteredPackages.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredPackages.map((pkg, i) => (
              <div key={pkg.id} className='relative'>
                {/* Selection Checkbox */}
                <div className='absolute top-4 left-4 z-10'>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePackageSelection(pkg.id);
                    }}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shadow-md ${
                      selectedPackageIds.includes(pkg.id)
                        ? 'bg-blue-600 border-blue-600 scale-110'
                        : 'bg-white border-slate-300 hover:border-blue-400 hover:scale-105'
                    }`}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedPackageIds.includes(pkg.id) && (
                      <Check className='w-5 h-5 text-white' />
                    )}
                  </motion.button>
                </div>

                {/* Consolidated Result Badge */}
                {pkg.isConsolidatedResult && (
                  <div className='absolute top-4 right-4 z-10'>
                    <span className='px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-full shadow-lg'>
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
          // ========== ENHANCED EMPTY STATE ==========
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='text-center py-20'
          >
            <div className='w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              {searchQuery ? (
                <Search className='w-16 h-16 text-slate-400' />
              ) : (
                <PackageIcon className='w-16 h-16 text-slate-400' />
              )}
            </div>
            <h3 className='text-3xl font-bold text-slate-900 mb-3'>
              {searchQuery ? 'No packages found' : 'No packages yet'}
            </h3>
            <p className='text-slate-600 text-lg mb-8 max-w-md mx-auto leading-relaxed'>
              {searchQuery
                ? "Try adjusting your search or filters to find what you're looking for"
                : 'Start shopping from US stores and your packages will appear here'}
            </p>
            {searchQuery && (
              <motion.button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className='px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Filters
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
