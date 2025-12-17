// client/src/pages/admin/AdminShipmentsPage.enhanced.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Search,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Eye,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface Transaction {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  amount: { value: number; currency: string };
  paymentMethod: string;
  completedAt?: string;
}

interface Shipment {
  _id: string;
  trackingNumber: string;
  userId: {
    name: string;
    email: string;
    suiteNumber: string;
  };
  carrier: string;
  serviceLevel: string;
  status: string;
  packageIds: any[];
  destination: {
    city: string;
    country: string;
  };
  estimatedDelivery: string;
  cost: {
    total: number;
    currency: string;
  };
  transaction: Transaction | null;
  createdAt: string;
}

interface Statistics {
  total: number;
  byStatus: Record<string, number>;
  byCarrier: Array<{ carrier: string; count: number }>;
  deliveredToday: number;
  avgDeliveryDays: number;
  totalRevenue: number;
  payments: Record<string, { count: number; total: number }>;
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchShipments();
    fetchStatistics();
  }, [page, statusFilter, searchTerm]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await apiHelpers.get('/admin/shipments', params);
      setShipments(response.shipments);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiHelpers.get('/admin/shipments/statistics');
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300',
      in_transit: 'bg-purple-100 text-purple-700 border-purple-300',
      delivered: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getPaymentStatusBadge = (transaction: Transaction | null) => {
    if (!transaction) {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 flex items-center gap-1'>
          <AlertCircle className='w-3 h-3' />
          No Payment
        </span>
      );
    }

    const statusConfig: Record<
      string,
      { color: string; icon: any; label: string }
    > = {
      pending: {
        color: 'bg-yellow-100 text-yellow-700',
        icon: Clock,
        label: 'Pending',
      },
      completed: {
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle,
        label: 'Paid',
      },
      failed: {
        color: 'bg-red-100 text-red-700',
        icon: XCircle,
        label: 'Failed',
      },
      refunded: {
        color: 'bg-purple-100 text-purple-700',
        icon: DollarSign,
        label: 'Refunded',
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-700',
        icon: XCircle,
        label: 'Cancelled',
      },
    };

    const config = statusConfig[transaction.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color} flex items-center gap-1`}
      >
        <Icon className='w-3 h-3' />
        {config.label}
      </span>
    );
  };

  const getActionButtons = (shipment: Shipment) => {
    const isPending = shipment.status === 'pending';
    const isPaid =
      shipment.transaction?.status === 'completed' ||
      shipment.transaction?.paymentMethod === 'cash_on_delivery';

    return (
      <div className='flex items-center gap-2'>
        <button
          onClick={() =>
            (window.location.href = `/admin/shipments/${shipment._id}`)
          }
          className='px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1'
        >
          <Eye className='w-3 h-3' />
          View
        </button>

        {isPending && (
          <>
            <button
              onClick={() => handleApprove(shipment._id)}
              disabled={!isPaid}
              className='px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
              title={!isPaid ? 'Payment must be confirmed first' : 'Approve'}
            >
              <CheckCircle className='w-3 h-3' />
              Approve
            </button>
            <button
              onClick={() => handleReject(shipment._id)}
              className='px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1'
            >
              <XCircle className='w-3 h-3' />
              Reject
            </button>
          </>
        )}
      </div>
    );
  };

  const handleApprove = async (shipmentId: string) => {
    const notes = prompt('Add approval notes (optional):');
    if (notes === null) return; // User cancelled

    try {
      await apiHelpers.post(`/admin/shipments/${shipmentId}/approve`, {
        notes,
      });
      alert('Shipment approved successfully!');
      await fetchShipments();
    } catch (error: any) {
      alert(error.message || 'Failed to approve shipment');
    }
  };

  const handleReject = async (shipmentId: string) => {
    const reason = prompt('Enter rejection reason (required):');
    if (!reason) {
      alert('Rejection reason is required');
      return;
    }

    if (
      !confirm(
        'Are you sure you want to reject this shipment? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await apiHelpers.post(`/admin/shipments/${shipmentId}/reject`, {
        reason,
      });
      alert('Shipment rejected successfully');
      await fetchShipments();
    } catch (error: any) {
      alert(error.message || 'Failed to reject shipment');
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    if (paymentFilter && shipment.transaction) {
      return shipment.transaction.status === paymentFilter;
    }
    return true;
  });

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
              Track and manage all outgoing shipments
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Pending Approval</p>
                <Clock className='w-5 h-5 text-yellow-600' />
              </div>
              <p className='text-3xl font-bold text-yellow-600'>
                {statistics.byStatus.pending || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Active Shipments</p>
                <Package className='w-5 h-5 text-purple-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {(statistics.byStatus.processing || 0) +
                  (statistics.byStatus.in_transit || 0)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Payments Pending</p>
                <CreditCard className='w-5 h-5 text-orange-600' />
              </div>
              <p className='text-3xl font-bold text-orange-600'>
                {statistics.payments?.pending?.count || 0}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Total Revenue</p>
                <DollarSign className='w-5 h-5 text-green-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {statistics.totalRevenue.toLocaleString()} MAD
              </p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search tracking number...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='pending'>Pending</option>
              <option value='processing'>Processing</option>
              <option value='in_transit'>In Transit</option>
              <option value='delivered'>Delivered</option>
              <option value='cancelled'>Cancelled</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            >
              <option value=''>All Payments</option>
              <option value='pending'>Payment Pending</option>
              <option value='completed'>Paid</option>
              <option value='failed'>Payment Failed</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPaymentFilter('');
                setPage(1);
              }}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Shipments Table */}
        <div className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Tracking
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Client
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Payment
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Destination
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Packages
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Cost
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {filteredShipments.map((shipment, index) => (
                  <motion.tr
                    key={shipment._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className='hover:bg-slate-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-semibold text-slate-900'>
                          {shipment.trackingNumber}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {shipment.carrier} - {shipment.serviceLevel}
                        </p>
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(
                          shipment.status
                        )}`}
                      >
                        {shipment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      {getPaymentStatusBadge(shipment.transaction)}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <MapPin className='w-4 h-4 text-slate-400' />
                        <span className='text-sm text-slate-700'>
                          {shipment.destination.city},{' '}
                          {shipment.destination.country}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm font-semibold text-slate-900'>
                        {shipment.packageIds.length}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm font-bold text-green-600'>
                        {shipment.cost.total} {shipment.cost.currency}
                      </span>
                    </td>
                    <td className='px-6 py-4'>{getActionButtons(shipment)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredShipments.length === 0 && (
            <div className='text-center py-12'>
              <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600 font-semibold'>No shipments found</p>
              <p className='text-slate-500 text-sm'>
                Try adjusting your filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className='px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                Previous
              </button>
              <span className='text-sm text-slate-600'>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
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
