// client/src/pages/admin/AdminPhotoRequestsPage.tsx - COMPLETE WORKING VERSION
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Search,
  Filter,
  Upload,
  FileText,
  Eye,
  Check,
  Clock,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  X,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { api } from '@/lib/api';

interface PhotoRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    suiteNumber: string;
    phone: string;
  };
  packageId: {
    _id: string;
    trackingNumber: string;
    retailer: string;
    description: string;
    status: string;
  };
  requestType: 'photos' | 'information' | 'both';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  additionalPhotos: number;
  specificRequests: string[];
  customInstructions: string;
  cost: {
    total: number;
    currency: string;
  };
  photos: Array<{
    url: string;
    description: string;
    uploadedAt: string;
  }>;
  informationReport: string;
  createdAt: string;
  completedAt?: string;
}

// Cloudinary config
const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djwape6g1';
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fast-shipper-preset';

export default function AdminPhotoRequestsPage() {
  const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<PhotoRequest | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reportText, setReportText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPhotoRequests();
  }, [statusFilter]);

  const fetchPhotoRequests = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📸 Fetching photo requests...');
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get('/admin/photo-requests', { params });

      console.log('✅ Photo requests response:', response.data);

      setPhotoRequests(response.data.data.photoRequests || []);
    } catch (error: any) {
      console.error('❌ Error fetching photo requests:', error);
      setError(error.response?.data?.error || 'Failed to load photo requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      console.log(`📸 Updating status for ${requestId} to ${newStatus}`);

      await api.put(`/admin/photo-requests/${requestId}/status`, {
        status: newStatus,
      });

      setSuccess('Status updated successfully!');
      await fetchPhotoRequests();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      setError(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedRequest) {
      setError('Please select at least one photo');
      return;
    }

    console.log('📸 ========================================');
    console.log('📸 STARTING PHOTO UPLOAD');
    console.log('📸 Files to upload:', files.length);
    console.log('📸 Request ID:', selectedRequest._id);
    console.log('📸 ========================================');

    setUploading(true);
    setError('');
    setUploadProgress(0);

    const uploadedPhotos: { url: string; description: string }[] = [];

    try {
      // Upload each file to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📸 Uploading file ${i + 1}/${files.length}: ${file.name}`);

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append(
          'folder',
          `fast-shipper/photo-requests/${selectedRequest._id}`
        );

        console.log(`📸 Uploading to Cloudinary...`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Cloudinary upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Cloudinary upload successful:`, data.secure_url);

        if (data.secure_url) {
          uploadedPhotos.push({
            url: data.secure_url,
            description: `Photo ${i + 1} - ${file.name}`,
          });
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 50)); // First 50% for Cloudinary
      }

      console.log('✅ All files uploaded to Cloudinary');
      console.log('📸 Uploaded photos:', uploadedPhotos);

      // Validate we have photos
      if (uploadedPhotos.length === 0) {
        throw new Error('No photos were successfully uploaded to Cloudinary');
      }

      // Save photos to backend
      console.log('📸 Sending photos to backend...');
      console.log('📸 Request payload:', {
        photos: uploadedPhotos,
      });

      setUploadProgress(75); // 75% - saving to backend

      const response = await api.post(
        `/admin/photo-requests/${selectedRequest._id}/photos`,
        {
          photos: uploadedPhotos,
        }
      );

      console.log('✅ Backend response:', response.data);

      setUploadProgress(100); // 100% - complete

      setSuccess(`${uploadedPhotos.length} photo(s) uploaded successfully!`);
      setShowPhotoUpload(false);
      setSelectedRequest(null);

      await fetchPhotoRequests();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setUploadProgress(0);
      }, 3000);

      console.log('📸 ========================================');
      console.log('📸 PHOTO UPLOAD COMPLETE');
      console.log('📸 ========================================');
    } catch (error: any) {
      console.error('❌ ========================================');
      console.error('❌ PHOTO UPLOAD FAILED');
      console.error('❌ Error:', error);
      console.error('❌ ========================================');

      setError(error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReportSubmit = async () => {
    if (!selectedRequest || !reportText.trim()) {
      setError('Report text is required');
      return;
    }

    try {
      console.log('📝 Submitting report for:', selectedRequest._id);

      await api.post(`/admin/photo-requests/${selectedRequest._id}/report`, {
        report: reportText,
      });

      setSuccess('Report added successfully!');
      setShowReportModal(false);
      setReportText('');
      setSelectedRequest(null);

      await fetchPhotoRequests();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('❌ Error adding report:', error);
      setError(error.response?.data?.error || 'Failed to add report');
    }
  };

  const filteredRequests = photoRequests.filter(
    (req) =>
      req.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.packageId.trackingNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      req.userId.suiteNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: 'all', label: 'All Requests', color: 'gray' },
    { value: 'pending', label: 'Pending Payment', color: 'yellow' },
    { value: 'processing', label: 'Processing', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'processing':
        return <Camera className='w-4 h-4' />;
      case 'completed':
        return <Check className='w-4 h-4' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  if (loading && photoRequests.length === 0) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <Loader2 className='w-16 h-16 text-blue-600 animate-spin mx-auto mb-4' />
            <p className='text-slate-600 font-semibold'>
              Loading photo requests...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3'
            >
              <Check className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold text-green-900'>Success</p>
                <p className='text-sm text-green-700'>{success}</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3'
            >
              <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div className='flex-1'>
                <p className='font-semibold text-red-900'>Error</p>
                <p className='text-sm text-red-700'>{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className='text-red-600 hover:text-red-800'
              >
                <X className='w-5 h-5' />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              Photo Requests
            </h1>
            <p className='text-slate-600'>
              Manage user photo and information requests
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-2xl p-4 shadow-lg'>
          <div className='flex flex-col md:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search by user name, tracking number, or suite...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>

            {/* Status Filter */}
            <div className='relative'>
              <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='w-full md:w-64 pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none appearance-none bg-white cursor-pointer'
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className='bg-white rounded-2xl shadow-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Request ID
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    User
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Package
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Type
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Cost
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {filteredRequests.map((req) => (
                  <motion.tr
                    key={req._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='hover:bg-slate-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <span className='font-mono text-sm text-slate-900'>
                        {req._id?.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-slate-900'>
                          {req.userId.name}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {req.userId.suiteNumber}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-slate-900'>
                          {req?.packageId?.description}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {req?.packageId?.trackingNumber}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='capitalize text-slate-700'>
                        {req.requestType}
                      </span>
                      {req.additionalPhotos > 0 && (
                        <p className='text-xs text-slate-500'>
                          {req.additionalPhotos} photos
                        </p>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(req.status)}
                        <select
                          value={req.status}
                          onChange={(e) =>
                            handleStatusChange(req._id, e.target.value)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 focus:outline-none cursor-pointer ${getStatusColor(
                            req.status
                          )}`}
                        >
                          <option value='pending'>Pending</option>
                          <option value='processing'>Processing</option>
                          <option value='completed'>Completed</option>
                          <option value='cancelled'>Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-slate-700 font-semibold'>
                        {req.cost.total} {req.cost.currency}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailModal(true);
                          }}
                          className='p-2 hover:bg-blue-100 rounded-lg transition-colors'
                          title='View details'
                        >
                          <Eye className='w-4 h-4 text-blue-600' />
                        </button>
                        {req.status === 'processing' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setShowPhotoUpload(true);
                              }}
                              className='p-2 hover:bg-green-100 rounded-lg transition-colors'
                              title='Upload photos'
                            >
                              <Upload className='w-4 h-4 text-green-600' />
                            </button>
                            {(req.requestType === 'information' ||
                              req.requestType === 'both') && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setShowReportModal(true);
                                  setReportText(req.informationReport || '');
                                }}
                                className='p-2 hover:bg-purple-100 rounded-lg transition-colors'
                                title='Add report'
                              >
                                <FileText className='w-4 h-4 text-purple-600' />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className='text-center py-12'>
              <Camera className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600 font-semibold'>
                No photo requests found
              </p>
              <p className='text-slate-500 text-sm'>
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedRequest && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto'
              >
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-2xl font-bold text-slate-900'>
                    Request Details
                  </h3>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRequest(null);
                    }}
                    className='p-2 hover:bg-slate-100 rounded-lg'
                  >
                    <X className='w-6 h-6' />
                  </button>
                </div>

                <div className='space-y-6'>
                  {/* User Info */}
                  <div>
                    <h4 className='font-bold text-slate-900 mb-3'>User Info</h4>
                    <div className='bg-slate-50 rounded-lg p-4 space-y-2'>
                      <p>
                        <strong>Name:</strong> {selectedRequest.userId.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedRequest.userId.email}
                      </p>
                      <p>
                        <strong>Suite:</strong>{' '}
                        {selectedRequest.userId.suiteNumber}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedRequest.userId.phone}
                      </p>
                    </div>
                  </div>

                  {/* Package Info */}
                  <div>
                    <h4 className='font-bold text-slate-900 mb-3'>
                      Package Info
                    </h4>
                    <div className='bg-slate-50 rounded-lg p-4 space-y-2'>
                      <p>
                        <strong>Description:</strong>{' '}
                        {selectedRequest?.packageId?.description}
                      </p>
                      <p>
                        <strong>Tracking:</strong>{' '}
                        {selectedRequest?.packageId?.trackingNumber}
                      </p>
                      <p>
                        <strong>Retailer:</strong>{' '}
                        {selectedRequest?.packageId?.retailer}
                      </p>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div>
                    <h4 className='font-bold text-slate-900 mb-3'>
                      Request Details
                    </h4>
                    <div className='bg-slate-50 rounded-lg p-4 space-y-2'>
                      <p>
                        <strong>Type:</strong>{' '}
                        <span className='capitalize'>
                          {selectedRequest.requestType}
                        </span>
                      </p>
                      <p>
                        <strong>Photos Requested:</strong>{' '}
                        {selectedRequest.additionalPhotos}
                      </p>
                      <p>
                        <strong>Cost:</strong> {selectedRequest.cost.total}{' '}
                        {selectedRequest.cost.currency}
                      </p>
                      {selectedRequest.specificRequests.length > 0 && (
                        <div>
                          <strong>Specific Requests:</strong>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            {selectedRequest.specificRequests.map(
                              (req, idx) => (
                                <span
                                  key={idx}
                                  className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs'
                                >
                                  {req}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      {selectedRequest.customInstructions && (
                        <div>
                          <strong>Custom Instructions:</strong>
                          <p className='mt-1 text-sm'>
                            {selectedRequest.customInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photos */}
                  {selectedRequest.photos.length > 0 && (
                    <div>
                      <h4 className='font-bold text-slate-900 mb-3'>
                        Uploaded Photos ({selectedRequest.photos.length})
                      </h4>
                      <div className='grid grid-cols-3 gap-4'>
                        {selectedRequest.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className='aspect-square bg-slate-100 rounded-lg overflow-hidden'
                          >
                            <img
                              src={photo.url}
                              alt={photo.description}
                              className='w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity'
                              onClick={() => window.open(photo.url, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Information Report */}
                  {selectedRequest.informationReport && (
                    <div>
                      <h4 className='font-bold text-slate-900 mb-3'>
                        Information Report
                      </h4>
                      <div className='bg-slate-50 rounded-lg p-4'>
                        <p className='text-sm whitespace-pre-wrap'>
                          {selectedRequest.informationReport}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Photo Upload Modal */}
        <AnimatePresence>
          {showPhotoUpload && selectedRequest && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-md w-full'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <ImageIcon className='w-6 h-6 text-blue-600' />
                  <h3 className='text-xl font-bold text-slate-900'>
                    Upload Photos
                  </h3>
                </div>

                <div className='mb-6'>
                  <p className='text-slate-600 mb-2'>
                    Request: <strong>{selectedRequest._id.slice(-6)}</strong>
                  </p>
                  <p className='text-sm text-slate-500'>
                    Photos requested: {selectedRequest.additionalPhotos}
                  </p>
                  <p className='text-sm text-slate-500'>
                    Already uploaded: {selectedRequest.photos.length}
                  </p>
                </div>

                <div className='mb-6'>
                  <label className='block mb-2 text-sm font-semibold text-slate-700'>
                    Select Photos (Max 10MB each)
                  </label>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handlePhotoUpload(e.target.files);
                      }
                    }}
                    disabled={uploading}
                    className='w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
                  />
                </div>

                {uploading && (
                  <div className='mb-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-slate-600'>
                        Uploading...
                      </span>
                      <span className='text-sm font-semibold text-blue-600'>
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className='w-full bg-slate-200 rounded-full h-2 overflow-hidden'>
                      <motion.div
                        className='h-full bg-blue-600'
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className='text-xs text-slate-500 mt-2'>
                      Please wait while we upload your photos...
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setSelectedRequest(null);
                    setError('');
                  }}
                  disabled={uploading}
                  className='w-full px-4 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {uploading ? 'Uploading...' : 'Close'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {showReportModal && selectedRequest && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-2xl w-full'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <FileText className='w-6 h-6 text-purple-600' />
                  <h3 className='text-xl font-bold text-slate-900'>
                    Information Report
                  </h3>
                </div>

                <div className='mb-6'>
                  <label className='block mb-2 text-sm font-semibold text-slate-700'>
                    Report Content
                  </label>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={10}
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none'
                    placeholder='Enter package inspection report...'
                  />
                </div>

                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setSelectedRequest(null);
                      setReportText('');
                      setError('');
                    }}
                    className='flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    disabled={!reportText.trim()}
                    className='flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    Save Report
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
