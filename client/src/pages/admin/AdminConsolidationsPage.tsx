// client/src/pages/admin/AdminConsolidationsPage.tsx - FIXED VERSION
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Search,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  Save,
  Truck,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { api } from '@/lib/api';

interface ConsolidationPackage {
  _id: string;
  trackingNumber: string;
  retailer: string;
  description: string;
  status: string;
  weight: { value: number; unit: string };
  dimensions: { length: number; width: number; height: number; unit: string };
}

interface Consolidation {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    suiteNumber: string;
    phone?: string;
  };
  packageIds: ConsolidationPackage[];
  status: string;
  cost: {
    total: number;
    currency: string;
  };
  estimatedCompletion: string;
  actualCompletion?: string;
  preferences: {
    removePackaging: boolean;
    addProtection: boolean;
    requestUnpackedPhotos: boolean;
  };
  beforeConsolidation: {
    totalWeight: number;
    totalVolume: number;
  };
  afterConsolidation?: {
    weight: number | null;
    dimensions: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
  };
  photos: Array<{
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  notes?: string;
  createdAt: string;
  resultingPackageId?: {
    _id: string;
    trackingNumber: string;
    status: string;
  };
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
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Complete consolidation form state
  const [completeForm, setCompleteForm] = useState({
    weight: '',
    length: '',
    width: '',
    height: '',
    notes: '',
  });

  useEffect(() => {
    fetchConsolidations();
    fetchStatistics();
  }, [page, statusFilter]);

  const fetchConsolidations = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      console.log('📦 Fetching consolidations...');

      const response = await api.get('/admin/consolidations', { params });

      if (response.data.success) {
        setConsolidations(response.data.data.consolidations);
        setTotalPages(response.data.data.pagination.pages);
        console.log(
          `✅ Loaded ${response.data.data.consolidations.length} consolidations`
        );
      } else {
        throw new Error('Failed to fetch consolidations');
      }
    } catch (error: any) {
      console.error('❌ Error fetching consolidations:', error);
      setError(error.response?.data?.error || 'Failed to fetch consolidations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('📊 Fetching statistics...');
      const response = await api.get('/admin/consolidations/statistics');

      if (response.data.success) {
        setStatistics(response.data.data.statistics);
        console.log('✅ Statistics loaded');
      }
    } catch (error: any) {
      console.error('❌ Error fetching statistics:', error);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setError('');
      console.log(`🔄 Updating status to ${newStatus} for ${id}`);

      const response = await api.put(`/admin/consolidations/${id}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        console.log('✅ Status updated successfully');
        await fetchConsolidations();
        await fetchStatistics();
        setShowModal(false);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      setError(error.response?.data?.error || 'Failed to update status');
      alert(
        'Failed to update status: ' +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const handleCompleteConsolidation = async () => {
    if (!selectedConsolidation) return;

    try {
      setUploading(true);
      setError('');

      console.log('✅ Completing consolidation...');

      const response = await api.post(
        `/admin/consolidations/${selectedConsolidation._id}/complete`,
        {
          weight: parseFloat(completeForm.weight),
          dimensions: {
            length: parseFloat(completeForm.length),
            width: parseFloat(completeForm.width),
            height: parseFloat(completeForm.height),
          },
          notes: completeForm.notes,
        }
      );

      if (response.data.success) {
        console.log('✅ Consolidation completed successfully');
        alert('Consolidation completed successfully!');
        setShowCompleteModal(false);
        setSelectedConsolidation(null);
        setCompleteForm({
          weight: '',
          length: '',
          width: '',
          height: '',
          notes: '',
        });
        await fetchConsolidations();
        await fetchStatistics();
      } else {
        throw new Error('Failed to complete consolidation');
      }
    } catch (error: any) {
      console.error('❌ Error completing consolidation:', error);
      setError(
        error.response?.data?.error || 'Failed to complete consolidation'
      );
      alert(
        'Failed to complete: ' + (error.response?.data?.error || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !selectedConsolidation) return;

    setUploading(true);
    setError('');

    try {
      console.log(`📸 Uploading ${files.length} photos...`);

      // You would upload to Cloudinary here
      const CLOUDINARY_CLOUD_NAME =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djwape6g1';
      const CLOUDINARY_UPLOAD_PRESET =
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fast-shipper-preset';

      const uploadedPhotos: { url: string; type: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append(
          'folder',
          `fast-shipper/consolidations/${selectedConsolidation._id}`
        );

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();

        if (data.secure_url) {
          uploadedPhotos.push({
            url: data.secure_url,
            type: 'after',
          });
        }
      }

      // Save photos to backend
      const saveResponse = await api.post(
        `/admin/consolidations/${selectedConsolidation._id}/photos`,
        { photos: uploadedPhotos }
      );

      if (saveResponse.data.success) {
        console.log('✅ Photos uploaded successfully');
        alert(`${uploadedPhotos.length} photo(s) uploaded successfully!`);
        setShowPhotoModal(false);
        setSelectedConsolidation(null);
        await fetchConsolidations();
      } else {
        throw new Error('Failed to save photos');
      }
    } catch (error: any) {
      console.error('❌ Error uploading photos:', error);
      setError(error.response?.data?.error || 'Failed to upload photos');
      alert(
        'Failed to upload photos: ' +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setUploading(false);
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

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3'
          >
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold text-red-900'>Error</p>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className='ml-auto text-red-600 hover:text-red-700'
            >
              <X className='w-5 h-5' />
            </button>
          </motion.div>
        )}

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
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            >
              <option value=''>All Statuses</option>
              <option value='pending'>Pending</option>
              <option value='processing'>Processing</option>
              <option value='completed'>Completed</option>
              <option value='cancelled'>Cancelled</option>
            </select>

            <input
              type='text'
              placeholder='Search by user name or email...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
            />

            <button
              onClick={() => {
                setStatusFilter('');
                setSearchTerm('');
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
          {consolidations
            .filter((con) => {
              if (!searchTerm) return true;
              const search = searchTerm.toLowerCase();
              return (
                con.userId.name.toLowerCase().includes(search) ||
                con.userId.email.toLowerCase().includes(search)
              );
            })
            .map((consolidation, index) => (
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

                  {consolidation.resultingPackageId && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-slate-600'>
                        Resulting Package
                      </span>
                      <span className='font-mono text-sm text-blue-600'>
                        {consolidation.resultingPackageId.trackingNumber}
                      </span>
                    </div>
                  )}
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
                <div className='flex gap-2 flex-wrap'>
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
                    <>
                      <button
                        onClick={() => {
                          setSelectedConsolidation(consolidation);
                          setShowCompleteModal(true);
                        }}
                        className='flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors'
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConsolidation(consolidation);
                          setShowPhotoModal(true);
                        }}
                        className='px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors'
                      >
                        <Upload className='w-5 h-5' />
                      </button>
                    </>
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

        {/* Empty State */}
        {consolidations.length === 0 && !loading && (
          <div className='bg-white rounded-2xl p-12 shadow-lg border border-slate-100 text-center'>
            <Box className='w-16 h-16 text-slate-300 mx-auto mb-4' />
            <h3 className='text-xl font-bold text-slate-900 mb-2'>
              No Consolidations Found
            </h3>
            <p className='text-slate-600'>Try adjusting your filters</p>
          </div>
        )}

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
        <AnimatePresence>
          {showModal && selectedConsolidation && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'
              >
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold text-slate-900'>
                    Consolidation Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <X className='w-6 h-6' />
                  </button>
                </div>

                <div className='space-y-6'>
                  {/* Client Info */}
                  <div>
                    <h3 className='font-semibold text-slate-700 mb-3'>
                      Client Information
                    </h3>
                    <div className='bg-slate-50 rounded-xl p-4 space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-slate-600'>Name:</span>
                        <span className='font-semibold'>
                          {selectedConsolidation.userId.name}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-600'>Email:</span>
                        <span className='font-semibold'>
                          {selectedConsolidation.userId.email}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-600'>Suite:</span>
                        <span className='font-mono font-semibold'>
                          {selectedConsolidation.userId.suiteNumber}
                        </span>
                      </div>
                      {selectedConsolidation.userId.phone && (
                        <div className='flex justify-between'>
                          <span className='text-slate-600'>Phone:</span>
                          <span className='font-semibold'>
                            {selectedConsolidation.userId.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Packages */}
                  <div>
                    <h3 className='font-semibold text-slate-700 mb-3'>
                      Packages ({selectedConsolidation.packageIds.length})
                    </h3>
                    <div className='space-y-2'>
                      {selectedConsolidation.packageIds.map((pkg) => (
                        <div
                          key={pkg._id}
                          className='bg-slate-50 rounded-xl p-4 flex items-center justify-between'
                        >
                          <div>
                            <p className='font-mono font-semibold text-slate-900'>
                              {pkg.trackingNumber}
                            </p>
                            <p className='text-sm text-slate-600'>
                              {pkg.retailer} • {pkg.description}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm font-semibold'>
                              {pkg.weight.value} {pkg.weight.unit}
                            </p>
                            <p className='text-xs text-slate-500'>
                              {pkg.dimensions.length}×{pkg.dimensions.width}×
                              {pkg.dimensions.height} {pkg.dimensions.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Before/After Measurements */}
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <h3 className='font-semibold text-slate-700 mb-3'>
                        Before Consolidation
                      </h3>
                      <div className='bg-blue-50 rounded-xl p-4 space-y-2'>
                        <div className='flex justify-between'>
                          <span className='text-slate-600'>Total Weight:</span>
                          <span className='font-semibold'>
                            {selectedConsolidation.beforeConsolidation.totalWeight.toFixed(
                              2
                            )}{' '}
                            kg
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-600'>Total Volume:</span>
                          <span className='font-semibold'>
                            {selectedConsolidation.beforeConsolidation.totalVolume.toFixed(
                              2
                            )}{' '}
                            cm³
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedConsolidation.afterConsolidation?.weight && (
                      <div>
                        <h3 className='font-semibold text-slate-700 mb-3'>
                          After Consolidation
                        </h3>
                        <div className='bg-green-50 rounded-xl p-4 space-y-2'>
                          <div className='flex justify-between'>
                            <span className='text-slate-600'>Weight:</span>
                            <span className='font-semibold'>
                              {selectedConsolidation.afterConsolidation.weight}{' '}
                              kg
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-slate-600'>Dimensions:</span>
                            <span className='font-semibold'>
                              {
                                selectedConsolidation.afterConsolidation
                                  .dimensions.length
                              }
                              ×
                              {
                                selectedConsolidation.afterConsolidation
                                  .dimensions.width
                              }
                              ×
                              {
                                selectedConsolidation.afterConsolidation
                                  .dimensions.height
                              }{' '}
                              cm
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  {selectedConsolidation.photos.length > 0 && (
                    <div>
                      <h3 className='font-semibold text-slate-700 mb-3'>
                        Photos
                      </h3>
                      <div className='grid grid-cols-3 gap-4'>
                        {selectedConsolidation.photos.map((photo, idx) => (
                          <div key={idx} className='relative group'>
                            <img
                              src={photo.url}
                              alt={`Photo ${idx + 1}`}
                              className='w-full h-32 object-cover rounded-xl border-2 border-slate-200'
                            />
                            <span className='absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-60 rounded text-xs text-white font-medium'>
                              {photo.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedConsolidation.notes && (
                    <div>
                      <h3 className='font-semibold text-slate-700 mb-3'>
                        Notes
                      </h3>
                      <div className='bg-slate-50 rounded-xl p-4'>
                        <p className='text-slate-700 whitespace-pre-wrap'>
                          {selectedConsolidation.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className='flex gap-3 mt-6'>
                  {selectedConsolidation.status === 'pending' && (
                    <button
                      onClick={() =>
                        updateStatus(selectedConsolidation._id, 'processing')
                      }
                      className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
                    >
                      Start Processing
                    </button>
                  )}

                  {selectedConsolidation.status === 'processing' && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setShowCompleteModal(true);
                      }}
                      className='flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors'
                    >
                      Complete Consolidation
                    </button>
                  )}

                  {(selectedConsolidation.status === 'pending' ||
                    selectedConsolidation.status === 'processing') && (
                    <button
                      onClick={() =>
                        updateStatus(selectedConsolidation._id, 'cancelled')
                      }
                      className='px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors'
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    onClick={() => setShowModal(false)}
                    className='px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Complete Modal */}
        <AnimatePresence>
          {showCompleteModal && selectedConsolidation && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-2xl w-full mx-4'
              >
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold text-slate-900'>
                    Complete Consolidation
                  </h2>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <X className='w-6 h-6' />
                  </button>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Final Weight (kg)
                    </label>
                    <input
                      type='number'
                      step='0.01'
                      value={completeForm.weight}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          weight: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      placeholder='Enter weight'
                    />
                  </div>

                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Length (cm)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={completeForm.length}
                        onChange={(e) =>
                          setCompleteForm({
                            ...completeForm,
                            length: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='L'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Width (cm)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={completeForm.width}
                        onChange={(e) =>
                          setCompleteForm({
                            ...completeForm,
                            width: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='W'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Height (cm)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={completeForm.height}
                        onChange={(e) =>
                          setCompleteForm({
                            ...completeForm,
                            height: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='H'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={completeForm.notes}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          notes: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
                      placeholder='Add any notes about the consolidation...'
                    />
                  </div>
                </div>

                <div className='flex gap-3 mt-6'>
                  <button
                    onClick={handleCompleteConsolidation}
                    disabled={
                      uploading ||
                      !completeForm.weight ||
                      !completeForm.length ||
                      !completeForm.width ||
                      !completeForm.height
                    }
                    className='flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                  >
                    {uploading ? (
                      <>
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        <span>Completing...</span>
                      </>
                    ) : (
                      <>
                        <Save className='w-5 h-5' />
                        <span>Complete</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    disabled={uploading}
                    className='px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors'
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Photo Upload Modal */}
        <AnimatePresence>
          {showPhotoModal && selectedConsolidation && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-md w-full mx-4'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <ImageIcon className='w-6 h-6 text-blue-600' />
                  <h3 className='text-xl font-bold text-slate-900'>
                    Upload Photos
                  </h3>
                </div>

                <div className='mb-6'>
                  <p className='text-slate-600 mb-2'>
                    Consolidation ID:{' '}
                    <strong className='text-slate-900'>
                      {selectedConsolidation._id.slice(-8)}
                    </strong>
                  </p>
                  <p className='text-sm text-slate-500'>
                    Current photos: {selectedConsolidation.photos.length}
                  </p>
                </div>

                <div className='mb-6'>
                  <label className='block mb-2 text-sm font-semibold text-slate-700'>
                    Select Photos
                  </label>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                    disabled={uploading}
                    className='w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                  />
                </div>

                {uploading && (
                  <div className='mb-4 text-center'>
                    <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
                    <p className='text-sm text-slate-600'>
                      Uploading photos...
                    </p>
                  </div>
                )}

                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowPhotoModal(false);
                      setSelectedConsolidation(null);
                    }}
                    disabled={uploading}
                    className='flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50'
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
