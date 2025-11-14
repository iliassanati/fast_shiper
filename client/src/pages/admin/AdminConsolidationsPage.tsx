// client/src/pages/admin/AdminConsolidationsPage.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface Consolidation {
  _id: string;
  userId: {
    name: string;
    email: string;
    suiteNumber: string;
  };
  packageIds: any[];
  status: string;
  cost: {
    total: number;
    currency: string;
  };
  estimatedCompletion: string;
  preferences: {
    removePackaging: boolean;
    addProtection: boolean;
    requestUnpackedPhotos: boolean;
  };
  createdAt: string;
}

interface Statistics {
  total: number;
  byStatus: Record<string, number>;
  avgProcessingDays: number;
  completedToday: number;
}

export default function AdminConsolidationsPage() {
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedConsolidation, setSelectedConsolidation] =
    useState<Consolidation | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchConsolidations();
    fetchStatistics();
  }, [page, statusFilter]);

  const fetchConsolidations = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await apiHelpers.get('/admin/consolidations', params);
      setConsolidations(response.consolidations);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching consolidations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiHelpers.get('/admin/consolidations/statistics');
      setStatistics(response.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiHelpers.put(`/admin/consolidations/${id}/status`, { status });
      fetchConsolidations();
      fetchStatistics();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-5 h-5 text-yellow-600' />;
      case 'processing':
        return <Package className='w-5 h-5 text-blue-600' />;
      case 'completed':
        return <CheckCircle className='w-5 h-5 text-green-600' />;
      case 'cancelled':
        return <AlertCircle className='w-5 h-5 text-red-600' />;
      default:
        return <Box className='w-5 h-5 text-slate-600' />;
    }
  };

  if (loading && consolidations.length === 0) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>
              Loading consolidations...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>
            Consolidation Processing
          </h1>
          <p className='text-slate-600'>
            Manage and process package consolidations
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Total Requests</p>
                <Box className='w-5 h-5 text-blue-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {statistics.total}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-yellow-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Pending</p>
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
                <p className='text-sm text-slate-600'>Avg Processing Time</p>
                <Clock className='w-5 h-5 text-purple-600' />
              </div>
              <p className='text-3xl font-bold text-slate-900'>
                {statistics.avgProcessingDays} days
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-green-100'
            >
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-slate-600'>Completed Today</p>
                <CheckCircle className='w-5 h-5 text-green-600' />
              </div>
              <p className='text-3xl font-bold text-green-600'>
                {statistics.completedToday}
              </p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='pending'>Pending</option>
              <option value='processing'>Processing</option>
              <option value='completed'>Completed</option>
              <option value='cancelled'>Cancelled</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Consolidations Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {consolidations.map((consolidation, index) => (
            <motion.div
              key={consolidation._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow'
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  {getStatusIcon(consolidation.status)}
                  <div>
                    <h3 className='font-bold text-slate-900'>
                      {consolidation.userId.name}
                    </h3>
                    <p className='text-sm text-slate-500'>
                      {consolidation.userId.suiteNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    consolidation.status
                  )}`}
                >
                  {consolidation.status.toUpperCase()}
                </span>
              </div>

              {/* Details */}
              <div className='space-y-3 mb-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>Packages</span>
                  <span className='font-semibold text-slate-900'>
                    {consolidation.packageIds.length} items
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>Total Cost</span>
                  <span className='font-bold text-green-600'>
                    {consolidation.cost.total} {consolidation.cost.currency}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>
                    Est. Completion
                  </span>
                  <span className='font-semibold text-slate-900'>
                    {new Date(
                      consolidation.estimatedCompletion
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Preferences */}
              <div className='flex flex-wrap gap-2 mb-4'>
                {consolidation.preferences.removePackaging && (
                  <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium'>
                    Remove Packaging
                  </span>
                )}
                {consolidation.preferences.addProtection && (
                  <span className='px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium'>
                    Extra Protection
                  </span>
                )}
                {consolidation.preferences.requestUnpackedPhotos && (
                  <span className='px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium'>
                    Unpacked Photos
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className='flex gap-2'>
                {consolidation.status === 'pending' && (
                  <button
                    onClick={() =>
                      updateStatus(consolidation._id, 'processing')
                    }
                    className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
                  >
                    Start Processing
                  </button>
                )}

                {consolidation.status === 'processing' && (
                  <button
                    onClick={() => updateStatus(consolidation._id, 'completed')}
                    className='flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors'
                  >
                    Mark Complete
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedConsolidation(consolidation);
                    setShowModal(true);
                  }}
                  className='px-4 py-2 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-center gap-4'>
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

        {/* Details Modal */}
        {showModal && selectedConsolidation && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'
            >
              <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                Consolidation Details
              </h2>

              <div className='space-y-4'>
                <div>
                  <h3 className='font-semibold text-slate-700 mb-2'>
                    Client Information
                  </h3>
                  <p className='text-slate-900'>
                    {selectedConsolidation.userId.name}
                  </p>
                  <p className='text-sm text-slate-500'>
                    {selectedConsolidation.userId.email}
                  </p>
                  <p className='text-sm text-slate-500'>
                    Suite: {selectedConsolidation.userId.suiteNumber}
                  </p>
                </div>

                <div>
                  <h3 className='font-semibold text-slate-700 mb-2'>
                    Status & Timeline
                  </h3>
                  <p className='text-slate-900'>
                    Status: {selectedConsolidation.status}
                  </p>
                  <p className='text-sm text-slate-500'>
                    Created:{' '}
                    {new Date(selectedConsolidation.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className='font-semibold text-slate-700 mb-2'>
                    Packages
                  </h3>
                  <p className='text-slate-900'>
                    {selectedConsolidation.packageIds.length} packages to
                    consolidate
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className='mt-6 w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors'
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
