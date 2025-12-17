// src/pages/client/ShipmentsPage.tsx
import DashboardLayout from '@/layouts/DashboardLayout';
import { useNotificationStore, useShipmentStore } from '@/stores';
import type { ShipmentStatus } from '@/types/client.types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  Download,
  Filter,
  MapPin,
  Package,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const { shipments } = useShipmentStore();
  const { addNotification } = useNotificationStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Status filter options
  const statusOptions: Array<{
    label: string;
    value: ShipmentStatus | 'all';
    count: number;
    color: string;
  }> = [
    {
      label: 'All Shipments',
      value: 'all',
      count: shipments.length,
      color: 'blue',
    },
    {
      label: 'In Transit',
      value: 'in_transit',
      count: shipments.filter((s) => s.status === 'in_transit').length,
      color: 'blue',
    },
    {
      label: 'Delivered',
      value: 'delivered',
      count: shipments.filter((s) => s.status === 'delivered').length,
      color: 'green',
    },
    {
      label: 'Pending',
      value: 'pending',
      count: shipments.filter((s) => s.status === 'pending').length,
      color: 'yellow',
    },
  ];

  // Filtered and sorted shipments
  const filteredShipments = useMemo(() => {
    let filtered = shipments;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Apply search filter
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

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (
            new Date(b.shippedDate).getTime() -
            new Date(a.shippedDate).getTime()
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

  // Get status badge classes
  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'in_transit':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Get status label
  const getStatusLabel = (status: ShipmentStatus) => {
    switch (status) {
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  // Quick actions
  const handleTrackShipment = (trackingNumber: string) => {
    addNotification(`Opening tracking for ${trackingNumber}`, 'info');
    // In production, this would open carrier's tracking page
    window.open(
      `https://www.dhl.com/tracking?tracking-id=${trackingNumber}`,
      '_blank'
    );
  };

  const handleDownloadInvoice = (shipmentId: string) => {
    addNotification('Downloading invoice...', 'success');
    // In production, this would download actual invoice
  };

  return (
    <DashboardLayout activeSection='shipments'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>My Shipments</h1>
            <p className='text-slate-600'>
              {filteredShipments.length} of {shipments.length} shipments
            </p>
          </div>

          {/* Quick Stats */}
          <div className='flex gap-3'>
            <div className='px-4 py-2 bg-blue-50 rounded-lg border border-blue-200'>
              <p className='text-xs text-blue-600 font-semibold'>In Transit</p>
              <p className='text-2xl font-bold text-blue-700'>
                {shipments.filter((s) => s.status === 'in_transit').length}
              </p>
            </div>
            <div className='px-4 py-2 bg-green-50 rounded-lg border border-green-200'>
              <p className='text-xs text-green-600 font-semibold'>Delivered</p>
              <p className='text-2xl font-bold text-green-700'>
                {shipments.filter((s) => s.status === 'delivered').length}
              </p>
            </div>
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
                placeholder='Search by tracking number, carrier, or destination...'
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
                      <option value='date'>Shipped Date (Newest)</option>
                      <option value='cost'>Cost (Highest)</option>
                    </select>
                  </div>

                  {/* Status Filter */}
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
                  ? `bg-${option.color}-600 text-white shadow-lg`
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {option.label}
              <span className='ml-2 text-sm opacity-75'>({option.count})</span>
            </button>
          ))}
        </div>

        {/* Shipments List */}
        {filteredShipments.length > 0 ? (
          <div className='space-y-4'>
            {filteredShipments.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow cursor-pointer'
                onClick={() => navigate(`/shipments/${shipment.id}`)}
              >
                <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
                  {/* Icon & Status */}
                  <div className='flex items-center gap-4'>
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                        shipment.status === 'delivered'
                          ? 'bg-green-100'
                          : shipment.status === 'in_transit'
                          ? 'bg-blue-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      {shipment.status === 'delivered' ? (
                        <Check className='w-8 h-8 text-green-600' />
                      ) : (
                        <Truck className='w-8 h-8 text-blue-600' />
                      )}
                    </div>

                    {/* Main Info */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='font-bold text-slate-900 text-lg'>
                          {shipment.carrier}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            shipment.status
                          )}`}
                        >
                          {getStatusLabel(shipment.status)}
                        </span>
                      </div>
                      <p className='text-sm text-slate-600 font-mono mb-2'>
                        {shipment.trackingNumber}
                      </p>
                      <div className='flex items-center gap-2 text-sm text-slate-600'>
                        <MapPin className='w-4 h-4' />
                        <span>{shipment.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className='flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div>
                      <p className='text-xs text-slate-500 mb-1'>Shipped</p>
                      <p className='font-semibold text-slate-900'>
                        {shipment.shippedDate}
                      </p>
                    </div>

                    {shipment.status === 'delivered' ? (
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Delivered</p>
                        <p className='font-semibold text-green-600'>
                          {shipment.deliveredDate}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>
                          Est. Delivery
                        </p>
                        <p className='font-semibold text-blue-600'>
                          {shipment.estimatedDelivery}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className='text-xs text-slate-500 mb-1'>Packages</p>
                      <p className='font-semibold text-slate-900'>
                        {shipment.packages}
                      </p>
                    </div>

                    <div>
                      <p className='text-xs text-slate-500 mb-1'>Cost</p>
                      <p className='font-semibold text-slate-900'>
                        {shipment.cost}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex lg:flex-col gap-2'>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackShipment(shipment.trackingNumber);
                      }}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 text-sm'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Truck className='w-4 h-4' />
                      Track
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadInvoice(shipment.id);
                      }}
                      className='px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 flex items-center gap-2 text-sm'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className='w-4 h-4' />
                      Invoice
                    </motion.button>
                  </div>
                </div>
              </motion.div>
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
                <Truck className='w-12 h-12 text-slate-400' />
              )}
            </div>
            <h3 className='text-2xl font-bold text-slate-900 mb-2'>
              {searchQuery ? 'No shipments found' : 'No shipments yet'}
            </h3>
            <p className='text-slate-600 mb-8 max-w-md mx-auto'>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Ship your packages to start tracking them here'}
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

        {/* Summary Stats */}
        {shipments.length > 0 && (
          <div className='grid md:grid-cols-4 gap-4'>
            <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                  <Truck className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Total Shipments</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {shipments.length}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                  <Calendar className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>In Transit</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {shipments.filter((s) => s.status === 'in_transit').length}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center'>
                  <Check className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Delivered</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {shipments.filter((s) => s.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center'>
                  <Package className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='text-xs text-slate-600'>Total Packages</p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {shipments.reduce((sum, s) => sum + s.packages, 0)}
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
