import PackageCard from '@/components/dashboard/PackageCard';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useNotificationStore, usePackageStore } from '@/stores';
import type { PackageStatus } from '@/types/client.types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Box,
  Camera,
  Check,
  Filter,
  Package,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PackagesPage() {
  const navigate = useNavigate();
  const {
    packages,
    selectedPackageIds,
    togglePackageSelection,
    clearSelection,
  } = usePackageStore();
  const { addNotification } = useNotificationStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'all'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date' | 'weight' | 'storage'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const statusOptions: Array<{
    label: string;
    value: PackageStatus | 'all';
    count: number;
  }> = [
    {
      label: 'All Packages',
      value: 'all',
      count: packages.length,
    },
    {
      label: 'In Storage',
      value: 'received',
      count: packages.filter((p) => p.status === 'received').length,
    },
    {
      label: 'Consolidated',
      value: 'consolidated',
      count: packages.filter((p) => p.status === 'consolidated').length,
    },
    {
      label: 'Shipped',
      value: 'shipped',
      count: packages.filter((p) => p.status === 'shipped').length,
    },
  ];

  // Filtered and sorted packages
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((pkg) => pkg.status === statusFilter);
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
  }, [packages, statusFilter, searchQuery, sortBy]);

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedPackageIds.length === filteredPackages.length) {
      clearSelection();
    } else {
      filteredPackages.forEach((pkg) => {
        if (!selectedPackageIds.includes(pkg.id)) {
          togglePackageSelection(pkg.id);
        }
      });
    }
  };

  const handleBulkShip = () => {
    if (selectedPackageIds.length === 0) {
      addNotification('Please select packages to ship', 'warning');
      return;
    }
    navigate('/shipping');
  };

  const handleBulkConsolidate = () => {
    if (selectedPackageIds.length < 2) {
      addNotification('Select at least 2 packages to consolidate', 'warning');
      return;
    }
    navigate('/consolidation');
  };

  const handleRequestPhotos = () => {
    if (selectedPackageIds.length === 0) {
      addNotification('Please select a package', 'warning');
      return;
    }
    navigate('/request-info');
  };

  return (
    <DashboardLayout activeSection='packages'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>My Packages</h1>
            <p className='text-slate-600'>
              {filteredPackages.length} of {packages.length} packages
            </p>
          </div>

          {/* Quick Actions */}
          <div className='flex flex-wrap gap-3'>
            <motion.button
              onClick={handleBulkShip}
              className='px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold shadow-lg flex items-center gap-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Truck className='w-4 h-4' />
              Ship ({selectedPackageIds.length})
            </motion.button>

            <motion.button
              onClick={handleBulkConsolidate}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Box className='w-4 h-4' />
              Consolidate
            </motion.button>

            <motion.button
              onClick={handleRequestPhotos}
              className='px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera className='w-4 h-4' />
              Request Photos
            </motion.button>
          </div>
        </div>

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

                  {/* Status Filter (alternative display) */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as typeof statusFilter)
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

        {/* Status Filter Tabs */}
        <div className='flex gap-3 flex-wrap'>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                statusFilter === option.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {option.label}
              <span className='ml-2 text-sm opacity-75'>({option.count})</span>
            </button>
          ))}
        </div>

        {/* Bulk Selection Bar */}
        {selectedPackageIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-blue-50 border-2 border-blue-200 rounded-2xl p-4'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold'>
                    {selectedPackageIds.length}
                  </div>
                  <span className='font-semibold text-slate-900'>
                    {selectedPackageIds.length} package(s) selected
                  </span>
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
                <Package className='w-12 h-12 text-slate-400' />
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
                  setStatusFilter('all');
                }}
                className='px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors'
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {/* Stats Summary */}
        {packages.length > 0 && (
          <div className='grid md:grid-cols-4 gap-4'>
            <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                  <Package className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Total Packages</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {packages.length}
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
                    {packages.filter((p) => p.status === 'received').length}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center'>
                  <Box className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Consolidated</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {packages.filter((p) => p.status === 'consolidated').length}
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
                    {packages.filter((p) => p.status === 'shipped').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
