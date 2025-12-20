// client/src/pages/client/ShipmentsPage_OPTIMIZED.tsx
import DashboardLayout from '@/layouts/DashboardLayout';
import { useNotificationStore, useShipmentStore } from '@/stores';
import type { ShipmentStatus } from '@/types/client.types';
import { formatShipmentDate } from '@/utils/formattingDate';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ShipmentsPageOptimized() {
  const navigate = useNavigate();
  const { shipments, loading, fetchShipments } = useShipmentStore();
  const { showToast } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Fetch shipments on mount
  useEffect(() => {
    const loadShipments = async () => {
      try {
        await fetchShipments({ limit: 100 });
      } catch (error) {
        console.error('❌ Error loading shipments:', error);
        showToast('Failed to load shipments', 'error');
      }
    };
    loadShipments();
  }, [fetchShipments, showToast]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchShipments({ limit: 100 });
      showToast('Shipments refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh shipments', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate stats
  const shipmentStats = useMemo(() => {
    return {
      all: shipments.length,
      in_transit: shipments.filter((s) => s.status === 'in_transit').length,
      delivered: shipments.filter((s) => s.status === 'delivered').length,
      pending: shipments.filter((s) => s.status === 'pending').length,
    };
  }, [shipments]);

  // Status options with enhanced styling
  const statusOptions: Array<{
    label: string;
    value: ShipmentStatus | 'all';
    count: number;
    gradient: string;
    bgGradient: string;
    icon: React.ReactNode;
  }> = [
    {
      label: 'All Shipments',
      value: 'all',
      count: shipmentStats.all,
      gradient: 'from-blue-600 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      icon: <Package className='w-5 h-5' />,
    },
    {
      label: 'In Transit',
      value: 'in_transit',
      count: shipmentStats.in_transit,
      gradient: 'from-orange-600 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      icon: <Truck className='w-5 h-5' />,
    },
    {
      label: 'Delivered',
      value: 'delivered',
      count: shipmentStats.delivered,
      gradient: 'from-green-600 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      icon: <CheckCircle className='w-5 h-5' />,
    },
    {
      label: 'Pending',
      value: 'pending',
      count: shipmentStats.pending,
      gradient: 'from-yellow-600 to-orange-600',
      bgGradient: 'from-yellow-50 to-orange-50',
      icon: <Clock className='w-5 h-5' />,
    },
  ];

  // Filtered and sorted shipments
  const filteredShipments = useMemo(() => {
    let filtered = shipments;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(query) ||
          s.carrier.toLowerCase().includes(query) ||
          s.destination.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (
            new Date(b.shippedDate || b.estimatedDelivery).getTime() -
            new Date(a.shippedDate || a.estimatedDelivery).getTime()
          );
        case 'cost':
          return (
            parseInt(b.cost.replace(/[^\d]/g, '')) -
            parseInt(a.cost.replace(/[^\d]/g, ''))
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [shipments, statusFilter, searchQuery, sortBy]);

  // Status badge helper
  const getStatusBadge = (status: ShipmentStatus) => {
    const configs = {
      in_transit: {
        bg: 'bg-gradient-to-r from-orange-100 to-red-100',
        text: 'text-orange-800',
        border: 'border-orange-300',
        label: 'In Transit',
        icon: Truck,
      },
      delivered: {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Delivered',
        icon: CheckCircle,
      },
      pending: {
        bg: 'bg-gradient-to-r from-yellow-100 to-orange-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Pending',
        icon: Clock,
      },
      cancelled: {
        bg: 'bg-gradient-to-r from-red-100 to-pink-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'Cancelled',
        icon: X,
      },
    };
    return configs[status] || configs.pending;
  };

  // Track shipment externally
  const handleTrackShipment = (trackingNumber: string, carrier: string) => {
    const trackingUrls: Record<string, string> = {
      DHL: `https://www.dhl.com/tracking?tracking-id=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      Aramex: `https://www.aramex.com/track/results?q=${trackingNumber}`,
    };
    const url =
      trackingUrls[carrier] ||
      `https://www.google.com/search?q=${trackingNumber}`;
    window.open(url, '_blank');
    showToast(`Opening ${carrier} tracking`, 'info');
  };

  // Loading state
  if (loading && shipments.length === 0) {
    return (
      <DashboardLayout activeSection='shipments'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600 font-medium'>Loading shipments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeSection='shipments'>
      <div className='space-y-6'>
        {/* ========== ENHANCED HEADER ========== */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='text-4xl font-bold text-slate-900 tracking-tight text-left'>
              My Shipments
            </h1>
            <div className='flex items-center gap-3 text-slate-600'>
              <span className='flex items-center gap-2'>
                <div className='w-2 h-2 rounded-full bg-blue-500' />
                <span className='font-medium'>
                  {filteredShipments.length} of {shipments.length} shipments
                </span>
              </span>
              {statusFilter !== 'all' && (
                <>
                  <span className='text-slate-300'>•</span>
                  <span className='text-sm capitalize'>
                    filtered by {statusFilter.replace('_', ' ')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className='flex items-center gap-3'>
            {/* View Toggle */}
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
          </div>
        </div>

        {/* ========== ENHANCED SEARCH & FILTERS ========== */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search by tracking number, carrier, or destination...'
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
              <Filter className='w-5 h-5' />
              <span>Filters</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
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
                      <option value='date'>📅 Shipped Date (Newest)</option>
                      <option value='cost'>💰 Cost (Highest)</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className='block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2'>
                      <Filter className='w-4 h-4' />
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as typeof statusFilter)
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
        {shipments.length > 0 && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {statusOptions.map((option, idx) => (
              <motion.button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-white rounded-2xl p-5 border-2 transition-all text-left ${
                  statusFilter === option.value
                    ? 'border-blue-400 shadow-lg ring-4 ring-blue-100'
                    : 'border-slate-100 shadow-md hover:shadow-lg hover:border-blue-200'
                }`}
              >
                <div className='flex items-start justify-between mb-3'>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${option.gradient} rounded-xl flex items-center justify-center shadow-md`}
                  >
                    <div className='text-white'>{option.icon}</div>
                  </div>
                  <span className='px-3 py-1 bg-slate-100 text-slate-700 text-sm font-bold rounded-full'>
                    {option.count}
                  </span>
                </div>
                <p className='text-sm text-slate-600 font-medium mb-2'>
                  {option.label}
                </p>
                <div className='flex items-center gap-2'>
                  <div className='w-full h-2 bg-slate-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-full bg-gradient-to-r ${option.gradient} transition-all`}
                      style={{
                        width: `${
                          shipments.length > 0
                            ? (option.count / shipments.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* ========== SHIPMENTS LIST/GRID ========== */}
        {filteredShipments.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredShipments.map((shipment, i) => {
              const statusBadge = getStatusBadge(shipment.status);
              const StatusIcon = statusBadge.icon;

              return (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/shipments/${shipment.id}`)}
                  className='bg-white rounded-2xl shadow-lg border-2 border-slate-100 hover:border-blue-300 hover:shadow-2xl transition-all cursor-pointer overflow-hidden'
                >
                  <div className='p-6'>
                    {/* Header */}
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-4 flex-1 min-w-0'>
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                            shipment.status === 'delivered'
                              ? 'from-green-500 to-emerald-500'
                              : shipment.status === 'in_transit'
                              ? 'from-orange-500 to-red-500'
                              : 'from-yellow-500 to-orange-500'
                          } flex items-center justify-center shadow-lg flex-shrink-0`}
                        >
                          <StatusIcon className='w-8 h-8 text-white' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-black text-slate-900 text-xl mb-1 truncate'>
                            {shipment.carrier}
                          </h3>
                          <p className='text-sm text-slate-600 font-mono font-semibold truncate'>
                            {shipment.trackingNumber}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} shadow-sm flex-shrink-0 ml-2`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className='grid grid-cols-2 gap-4 mb-4'>
                      <div className='p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl'>
                        <p className='text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1'>
                          <Calendar className='w-3 h-3' />
                          Shipped
                        </p>
                        <p className='font-bold text-slate-900 text-sm'>
                          {shipment.shippedDate || 'Pending'}
                        </p>
                      </div>

                      {shipment.status === 'delivered' ? (
                        <div className='p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200'>
                          <p className='text-xs text-green-700 font-semibold mb-1 flex items-center gap-1'>
                            <Check className='w-3 h-3' />
                            Delivered
                          </p>
                          <p className='font-bold text-green-900 text-sm'>
                            {shipment.deliveredDate}
                          </p>
                        </div>
                      ) : (
                        <div className='p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200'>
                          <p className='text-xs text-blue-700 font-semibold mb-1 flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            Est. Delivery
                          </p>
                          <p className='font-bold text-blue-900 text-sm'>
                            {formatShipmentDate(shipment.estimatedDelivery)}
                          </p>
                        </div>
                      )}

                      <div className='p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200'>
                        <p className='text-xs text-purple-700 font-semibold mb-1 flex items-center gap-1'>
                          <Package className='w-3 h-3' />
                          Packages
                        </p>
                        <p className='font-bold text-purple-900 text-sm'>
                          {shipment.packages}
                        </p>
                      </div>

                      <div className='p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200'>
                        <p className='text-xs text-orange-700 font-semibold mb-1 flex items-center gap-1'>
                          <Sparkles className='w-3 h-3' />
                          Cost
                        </p>
                        <p className='font-bold text-orange-900 text-sm'>
                          {shipment.cost}
                        </p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className='flex items-center gap-2 text-sm text-slate-600 mb-4 p-3 bg-slate-50 rounded-xl'>
                      <MapPin className='w-4 h-4 flex-shrink-0' />
                      <span className='font-medium truncate'>
                        {shipment.destination}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2'>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackShipment(
                            shipment.trackingNumber,
                            shipment.carrier
                          );
                        }}
                        className='flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ExternalLink className='w-4 h-4' />
                        Track
                      </motion.button>

                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('Invoice download coming soon', 'info');
                        }}
                        className='px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className='w-4 h-4' />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
                <Truck className='w-16 h-16 text-slate-400' />
              )}
            </div>
            <h3 className='text-3xl font-bold text-slate-900 mb-3'>
              {searchQuery ? 'No shipments found' : 'No shipments yet'}
            </h3>
            <p className='text-slate-600 text-lg mb-8 max-w-md mx-auto leading-relaxed'>
              {searchQuery
                ? "Try adjusting your search or filters to find what you're looking for"
                : 'Ship your packages to start tracking them here'}
            </p>
            {searchQuery && (
              <motion.button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
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
