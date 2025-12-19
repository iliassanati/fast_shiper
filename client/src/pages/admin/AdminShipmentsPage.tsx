// client/src/pages/admin/AdminShipmentsPage.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { useAdminShipmentStore } from '@/stores/useAdminShipmentStore';
import { useNavigate } from 'react-router-dom';

export default function AdminShipmentsPage() {
  const navigate = useNavigate();
  const {
    shipments,
    statistics,
    loading,
    filters,
    pagination,
    fetchShipments,
    fetchStatistics,
    setFilters,
    clearFilters,
  } = useAdminShipmentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShipments();
    fetchStatistics();
  }, [fetchShipments, fetchStatistics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchShipments(), fetchStatistics()]);
    setRefreshing(false);
  };

  const handleSearch = () => {
    fetchShipments({
      search: searchTerm,
      status: statusFilter || undefined,
      carrier: carrierFilter || undefined,
      paymentStatus: paymentFilter || undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCarrierFilter('');
    setPaymentFilter('');
    clearFilters();
    fetchShipments();
  };

  const handlePageChange = (newPage: number) => {
    fetchShipments({ page: newPage });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'in_transit':
        return <Truck className='w-4 h-4' />;
      case 'delivered':
        return <CheckCircle className='w-4 h-4' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4' />;
      default:
        return <Package className='w-4 h-4' />;
    }
  };

  if (loading && shipments.length === 0) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>Loading shipments...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              Shipment Management
            </h1>
            <p className='text-slate-600'>
              Track and manage all shipments and deliveries
            </p>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            className='px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </motion.button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Total Shipments</p>
                <Truck className='w-5 h-5 text-blue-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {statistics.total}
              </p>
              <p className='text-sm text-green-600 mt-1 flex items-center gap-1'>
                <TrendingUp className='w-3 h-3' />
                {statistics.deliveredToday} delivered today
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>In Transit</p>
                <Package className='w-5 h-5 text-orange-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {statistics.byStatus.in_transit || 0}
              </p>
              <p className='text-sm text-slate-500 mt-1'>
                {statistics.byStatus.pending || 0} pending
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Avg Delivery</p>
                <Calendar className='w-5 h-5 text-purple-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {statistics.avgDeliveryDays}
              </p>
              <p className='text-sm text-slate-500 mt-1'>days</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Total Revenue</p>
                <DollarSign className='w-5 h-5 text-green-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                ${statistics.totalRevenue.toLocaleString()}
              </p>
              <p className='text-sm text-yellow-600 mt-1'>
                {statistics.pendingPayments} pending
              </p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <div className='grid md:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search tracking, recipient...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>

            {/* Status Filter */}
            <div className='relative'>
              <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchShipments({ status: e.target.value || undefined });
                }}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none appearance-none bg-white'
              >
                <option value=''>All Statuses</option>
                <option value='pending'>Pending</option>
                <option value='in_transit'>In Transit</option>
                <option value='delivered'>Delivered</option>
                <option value='cancelled'>Cancelled</option>
              </select>
            </div>

            {/* Carrier Filter */}
            <select
              value={carrierFilter}
              onChange={(e) => {
                setCarrierFilter(e.target.value);
                fetchShipments({ carrier: e.target.value || undefined });
              }}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
            >
              <option value=''>All Carriers</option>
              <option value='DHL'>DHL</option>
              <option value='FedEx'>FedEx</option>
              <option value='UPS'>UPS</option>
              <option value='Aramex'>Aramex</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                fetchShipments({ paymentStatus: e.target.value || undefined });
              }}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
            >
              <option value=''>All Payment Status</option>
              <option value='pending'>Pending</option>
              <option value='paid'>Paid</option>
              <option value='refunded'>Refunded</option>
            </select>
          </div>

          <div className='flex gap-2 mt-4'>
            <button
              onClick={handleSearch}
              className='px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className='px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors'
            >
              Clear
            </button>
          </div>
        </div>

        {/* Shipments Table */}
        <div className='bg-white rounded-2xl shadow-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Tracking
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Customer
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Carrier
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Destination
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Payment
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Total Cost
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Date
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {shipments.map((shipment, index) => (
                  <motion.tr
                    key={shipment._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className='hover:bg-slate-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Truck className='w-5 h-5 text-blue-600' />
                        <div>
                          <p className='font-semibold text-slate-900'>
                            {shipment.trackingNumber}
                          </p>
                          <p className='text-xs text-slate-500'>
                            {shipment.packages.length} package(s)
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-slate-900'>
                          {shipment.userId.name}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {shipment.userId.suiteNumber}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='font-semibold text-slate-700'>
                        {shipment.carrier}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <MapPin className='w-4 h-4 text-slate-400' />
                        <span className='text-sm text-slate-700'>
                          {shipment.recipientInfo.city},{' '}
                          {shipment.recipientInfo.country}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                            shipment.status
                          )}`}
                        >
                          {getStatusIcon(shipment.status)}
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                          shipment.paymentStatus
                        )}`}
                      >
                        {shipment.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='font-bold text-green-600'>
                        ${shipment.totalCost}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-slate-600'>
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() =>
                          navigate(`/admin/shipments/${shipment._id}`)
                        }
                        className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
                      >
                        Details →
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {shipments.length === 0 && (
            <div className='text-center py-12'>
              <Truck className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600 font-semibold'>No shipments found</p>
              <p className='text-slate-500 text-sm'>
                Try adjusting your filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className='px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between'>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className='px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Previous
              </button>
              <span className='text-sm text-slate-600'>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className='px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
