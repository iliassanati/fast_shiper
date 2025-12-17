// client/src/pages/client/PackageDetailsPage.tsx - IMPROVED VERSION WITH PHOTO REQUESTS
import DashboardLayout from '@/layouts/DashboardLayout';
import { usePackageStore, useNotificationStore } from '@/stores';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Box,
  Calendar,
  Camera,
  Clock,
  Copy,
  ExternalLink,
  Package,
  Scale,
  Ruler,
  DollarSign,
  Truck,
  CheckCircle,
  AlertTriangle,
  Info,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Eye,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiHelpers } from '@/lib/api';

// Types
interface PhotoRequestPhoto {
  url: string;
  description?: string;
  uploadedAt: string;
}

interface PhotoRequest {
  id: string;
  _id: string;
  packageId: string | { _id: string; id?: string };
  requestType: 'photos' | 'information' | 'both';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  additionalPhotos: number;
  specificRequests: string[];
  customInstructions: string;
  cost: {
    photos: number;
    information: number;
    total: number;
    currency: string;
  };
  photos: PhotoRequestPhoto[];
  informationReport?: string;
  createdAt: string;
  completedAt?: string;
}

export default function PackageDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    getPackageById,
    fetchPackageById,
    loading: storeLoading,
  } = usePackageStore();
  const { showToast } = useNotificationStore();

  // Local state
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
  const [loadingPhotoRequests, setLoadingPhotoRequests] = useState(false);
  const [refreshingRequests, setRefreshingRequests] = useState(false);

  // Helper to extract package ID from potentially populated field
  const extractPackageId = (packageIdField: any): string => {
    if (!packageIdField) return '';
    if (typeof packageIdField === 'string') return packageIdField;
    if (typeof packageIdField === 'object') {
      return (
        packageIdField._id?.toString() || packageIdField.id?.toString() || ''
      );
    }
    return packageIdField.toString();
  };

  // Fetch package on mount
  useEffect(() => {
    const loadPackage = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // First check if package is already in store
        let packageData = getPackageById(id);

        // If not in store, fetch it
        if (!packageData) {
          packageData = await fetchPackageById(id);
        }

        setPkg(packageData);
      } catch (err: any) {
        console.error('Error fetching package:', err);
        setError(err.message || 'Failed to load package');
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [id, getPackageById, fetchPackageById]);

  // Fetch photo requests for this package
  const fetchPhotoRequests = useCallback(async () => {
    if (!id) return;

    setLoadingPhotoRequests(true);
    try {
      console.log('📸 Fetching photo requests for package:', id);

      const response = await apiHelpers.get<{
        photoRequests: PhotoRequest[];
      }>('/photo-requests');

      console.log('📸 All photo requests response:', response);

      // Ensure we have an array
      const allRequests = response.photoRequests || response || [];

      if (!Array.isArray(allRequests)) {
        console.error('📸 Photo requests is not an array:', allRequests);
        setPhotoRequests([]);
        return;
      }

      // Filter to only show requests for this package
      const packageRequests = allRequests.filter((req) => {
        const reqPackageId = extractPackageId(req.packageId);
        const matches = reqPackageId === id;

        console.log('📸 Comparing request:', {
          requestId: req._id || req.id,
          reqPackageId,
          targetId: id,
          matches,
        });

        return matches;
      });

      console.log(
        '📸 Filtered requests for this package:',
        packageRequests.length
      );
      setPhotoRequests(packageRequests);
    } catch (err) {
      console.error('Error fetching photo requests:', err);
      setPhotoRequests([]);
    } finally {
      setLoadingPhotoRequests(false);
      setRefreshingRequests(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPhotoRequests();
  }, [fetchPhotoRequests]);

  // Refresh photo requests
  const handleRefreshRequests = async () => {
    setRefreshingRequests(true);
    await fetchPhotoRequests();
    showToast('Photo requests refreshed', 'success');
  };

  // Get all photos (package photos + photo request photos)
  const allPhotos = useMemo(() => {
    const photos: Array<{
      url: string;
      type: string;
      description?: string;
      source: 'package' | 'request';
      requestId?: string;
    }> = [];

    // Add package photos (from pkg.photos array)
    if (pkg?.photos && Array.isArray(pkg.photos) && pkg.photos.length > 0) {
      pkg.photos.forEach((photo: any) => {
        if (photo.url) {
          photos.push({
            url: photo.url,
            type: photo.type || 'basic',
            source: 'package',
          });
        }
      });
    }

    // Add photos from completed photo requests
    photoRequests
      .filter((req) => req.status === 'completed' && req.photos?.length > 0)
      .forEach((req) => {
        req.photos.forEach((photo) => {
          photos.push({
            url: photo.url,
            type: 'requested',
            description: photo.description,
            source: 'request',
            requestId: req._id || req.id,
          });
        });
      });

    console.log('📸 All photos compiled:', photos.length);
    return photos;
  }, [pkg, photoRequests]);

  // Copy tracking number
  const copyTracking = () => {
    if (pkg?.trackingNumber) {
      navigator.clipboard.writeText(pkg.trackingNumber);
      showToast('Tracking number copied!', 'success');
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: React.ReactNode; bgColor: string }
    > = {
      received: {
        label: 'In Storage',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: <Package className='w-5 h-5' />,
      },
      consolidated: {
        label: 'Consolidated',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: <Box className='w-5 h-5' />,
      },
      shipped: {
        label: 'Shipped',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: <Truck className='w-5 h-5' />,
      },
      in_transit: {
        label: 'In Transit',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        icon: <Truck className='w-5 h-5' />,
      },
      delivered: {
        label: 'Delivered',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        icon: <CheckCircle className='w-5 h-5' />,
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        icon: <Package className='w-5 h-5' />,
      }
    );
  };

  // Get photo request status badge
  const getPhotoRequestStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      pending: {
        label: 'Pending Payment',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock className='w-3 h-3' />,
      },
      processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Loader2 className='w-3 h-3 animate-spin' />,
      },
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle className='w-3 h-3' />,
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-700 border-red-200',
        icon: <X className='w-3 h-3' />,
      },
    };
    return (
      statusMap[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: null,
      }
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout activeSection='packages'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600'>Loading package details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !pkg) {
    return (
      <DashboardLayout activeSection='packages'>
        <div className='text-center py-20'>
          <div className='w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <AlertTriangle className='w-12 h-12 text-red-500' />
          </div>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Package Not Found
          </h3>
          <p className='text-slate-600 mb-8'>
            {error ||
              "The package you're looking for doesn't exist or you don't have access to it."}
          </p>
          <button
            onClick={() => navigate('/packages')}
            className='px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors'
          >
            Back to Packages
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = getStatusInfo(pkg.status);

  // Count stats for photo requests
  const requestStats = {
    total: photoRequests.length,
    pending: photoRequests.filter((r) => r.status === 'pending').length,
    processing: photoRequests.filter((r) => r.status === 'processing').length,
    completed: photoRequests.filter((r) => r.status === 'completed').length,
    totalPhotosReceived: photoRequests
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.photos?.length || 0), 0),
  };

  return (
    <DashboardLayout activeSection='packages'>
      <div className='space-y-6'>
        {/* Back Button & Header */}
        <div className='flex items-center gap-4'>
          <motion.button
            onClick={() => navigate('/packages')}
            className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className='w-6 h-6 text-slate-600' />
          </motion.button>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>
              {pkg.description}
            </h1>
            <p className='text-slate-600'>from {pkg.retailer}</p>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Package Photos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-lg overflow-hidden'
            >
              <div className='p-4 border-b border-slate-100'>
                <div className='flex items-center justify-between'>
                  <h2 className='font-bold text-slate-900 flex items-center gap-2'>
                    <Camera className='w-5 h-5 text-blue-600' />
                    Package Photos
                  </h2>
                  {allPhotos.length > 0 && (
                    <span className='text-sm text-slate-500'>
                      {activePhotoIndex + 1} of {allPhotos.length}
                    </span>
                  )}
                </div>
              </div>

              {allPhotos.length > 0 ? (
                <div className='relative'>
                  {/* Main Photo Display */}
                  <div
                    className='aspect-video bg-slate-100 cursor-pointer relative group'
                    onClick={() => setShowLightbox(true)}
                  >
                    <img
                      src={allPhotos[activePhotoIndex].url}
                      alt={`Package photo ${activePhotoIndex + 1}`}
                      className='w-full h-full object-contain'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
                      <span className='opacity-0 group-hover:opacity-100 text-white font-semibold bg-black/50 px-4 py-2 rounded-lg transition-opacity'>
                        Click to enlarge
                      </span>
                    </div>

                    {/* Photo type badge */}
                    <div className='absolute top-4 left-4'>
                      <span className='px-3 py-1 bg-black/70 text-white text-xs font-semibold rounded-full capitalize'>
                        {allPhotos[activePhotoIndex].type}
                        {allPhotos[activePhotoIndex].source === 'request' &&
                          ' (Requested)'}
                      </span>
                    </div>

                    {/* Description if available */}
                    {allPhotos[activePhotoIndex].description && (
                      <div className='absolute bottom-4 left-4 right-4'>
                        <span className='px-3 py-2 bg-black/70 text-white text-sm rounded-lg block'>
                          {allPhotos[activePhotoIndex].description}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {allPhotos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev === 0 ? allPhotos.length - 1 : prev - 1
                          )
                        }
                        className='absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors'
                      >
                        <ChevronLeft className='w-5 h-5' />
                      </button>
                      <button
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev === allPhotos.length - 1 ? 0 : prev + 1
                          )
                        }
                        className='absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors'
                      >
                        <ChevronRight className='w-5 h-5' />
                      </button>
                    </>
                  )}

                  {/* Thumbnail Strip */}
                  {allPhotos.length > 1 && (
                    <div className='p-4 flex gap-2 overflow-x-auto'>
                      {allPhotos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePhotoIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative ${
                            index === activePhotoIndex
                              ? 'border-blue-600 ring-2 ring-blue-200'
                              : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Thumbnail ${index + 1}`}
                            className='w-full h-full object-cover'
                          />
                          {photo.source === 'request' && (
                            <div className='absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-tl-lg flex items-center justify-center'>
                              <Camera className='w-2.5 h-2.5 text-white' />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className='p-12 text-center'>
                  <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <ImageIcon className='w-8 h-8 text-slate-400' />
                  </div>
                  <p className='text-slate-600 mb-4'>No photos available yet</p>
                  {pkg.status === 'received' && (
                    <button
                      onClick={() => navigate('/request-info')}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors'
                    >
                      Request Photos
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Package Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <h2 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Info className='w-5 h-5 text-blue-600' />
                Package Details
              </h2>

              <div className='grid md:grid-cols-2 gap-6'>
                {/* Tracking Number */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500'>Tracking Number</p>
                  <div className='flex items-center gap-2'>
                    <code className='text-slate-900 font-mono bg-slate-100 px-3 py-1.5 rounded-lg'>
                      {pkg.trackingNumber}
                    </code>
                    <button
                      onClick={copyTracking}
                      className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                      title='Copy tracking number'
                    >
                      <Copy className='w-4 h-4 text-slate-500' />
                    </button>
                  </div>
                </div>

                {/* Retailer */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500'>Retailer</p>
                  <p className='text-slate-900 font-semibold'>{pkg.retailer}</p>
                </div>

                {/* Weight */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500 flex items-center gap-1'>
                    <Scale className='w-4 h-4' /> Weight
                  </p>
                  <p className='text-slate-900 font-semibold'>
                    {typeof pkg.weight === 'object'
                      ? `${pkg.weight.value} ${pkg.weight.unit || 'kg'}`
                      : `${pkg.weight} kg`}
                  </p>
                </div>

                {/* Dimensions */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500 flex items-center gap-1'>
                    <Ruler className='w-4 h-4' /> Dimensions
                  </p>
                  <p className='text-slate-900 font-semibold'>
                    {typeof pkg.dimensions === 'object'
                      ? `${pkg.dimensions.length} × ${pkg.dimensions.width} × ${
                          pkg.dimensions.height
                        } ${pkg.dimensions.unit || 'cm'}`
                      : `${pkg.dimensions} cm`}
                  </p>
                </div>

                {/* Estimated Value */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500 flex items-center gap-1'>
                    <DollarSign className='w-4 h-4' /> Estimated Value
                  </p>
                  <p className='text-slate-900 font-semibold'>
                    {typeof pkg.estimatedValue === 'object'
                      ? `$${pkg.estimatedValue.amount} ${
                          pkg.estimatedValue.currency || 'USD'
                        }`
                      : pkg.estimatedValue}
                  </p>
                </div>

                {/* Received Date */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500 flex items-center gap-1'>
                    <Calendar className='w-4 h-4' /> Received
                  </p>
                  <p className='text-slate-900 font-semibold'>
                    {new Date(pkg.receivedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Storage Days */}
                <div className='space-y-1'>
                  <p className='text-sm text-slate-500 flex items-center gap-1'>
                    <Clock className='w-4 h-4' /> Storage Days
                  </p>
                  <div className='flex items-center gap-2'>
                    <p className='text-slate-900 font-semibold'>
                      {pkg.storageDay} days
                    </p>
                    {pkg.storageDay > 30 && (
                      <span className='px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full'>
                        {45 - pkg.storageDay} days left
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {pkg.notes && (
                <div className='mt-6 pt-6 border-t border-slate-100'>
                  <p className='text-sm text-slate-500 mb-2'>Notes</p>
                  <p className='text-slate-700'>{pkg.notes}</p>
                </div>
              )}
            </motion.div>

            {/* Photo Requests Section - IMPROVED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <h2 className='font-bold text-slate-900 flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-purple-600' />
                    Photo Requests
                  </h2>
                  {requestStats.total > 0 && (
                    <div className='flex items-center gap-2'>
                      {requestStats.processing > 0 && (
                        <span className='px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'>
                          {requestStats.processing} processing
                        </span>
                      )}
                      {requestStats.completed > 0 && (
                        <span className='px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full'>
                          {requestStats.totalPhotosReceived} photos received
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={handleRefreshRequests}
                    disabled={refreshingRequests}
                    className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors'
                    title='Refresh requests'
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        refreshingRequests ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                  {pkg.status === 'received' && (
                    <button
                      onClick={() => navigate('/request-info')}
                      className='px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2'
                    >
                      <Camera className='w-4 h-4' />
                      Request Photos
                    </button>
                  )}
                </div>
              </div>

              {loadingPhotoRequests ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='w-6 h-6 animate-spin text-slate-400' />
                  <span className='ml-2 text-slate-500'>
                    Loading requests...
                  </span>
                </div>
              ) : photoRequests.length > 0 ? (
                <div className='space-y-4'>
                  {photoRequests.map((request) => {
                    const statusBadge = getPhotoRequestStatusBadge(
                      request.status
                    );
                    const requestId = request._id || request.id;

                    return (
                      <div
                        key={requestId}
                        className={`border rounded-xl p-4 transition-all ${
                          request.status === 'completed'
                            ? 'border-green-200 bg-green-50/50'
                            : request.status === 'processing'
                            ? 'border-blue-200 bg-blue-50/50'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className='flex items-start justify-between mb-3'>
                          <div>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <span className='font-semibold text-slate-900 capitalize'>
                                {request.requestType === 'both'
                                  ? 'Photos & Information'
                                  : request.requestType}{' '}
                                Request
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1 ${statusBadge.className}`}
                              >
                                {statusBadge.icon}
                                {statusBadge.label}
                              </span>
                            </div>
                            <p className='text-sm text-slate-500 mt-1'>
                              Requested: {formatDate(request.createdAt)}
                              {request.completedAt && (
                                <span className='ml-2'>
                                  • Completed: {formatDate(request.completedAt)}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-semibold text-slate-900'>
                              {request.cost.total} {request.cost.currency}
                            </p>
                            <p className='text-sm text-slate-500'>
                              {request.additionalPhotos} photo
                              {request.additionalPhotos !== 1 ? 's' : ''}{' '}
                              requested
                            </p>
                          </div>
                        </div>

                        {/* Custom instructions if any */}
                        {request.customInstructions && (
                          <div className='mb-3 p-3 bg-slate-100 rounded-lg'>
                            <p className='text-sm text-slate-600 flex items-start gap-2'>
                              <MessageSquare className='w-4 h-4 flex-shrink-0 mt-0.5' />
                              <span className='italic'>
                                "{request.customInstructions}"
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Specific requests tags */}
                        {request.specificRequests &&
                          request.specificRequests.length > 0 && (
                            <div className='mb-3'>
                              <p className='text-xs text-slate-500 mb-2'>
                                Requested details:
                              </p>
                              <div className='flex flex-wrap gap-2'>
                                {request.specificRequests.map((req, idx) => (
                                  <span
                                    key={idx}
                                    className='px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full'
                                  >
                                    {req}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Show photos if completed */}
                        {request.status === 'completed' &&
                          request.photos?.length > 0 && (
                            <div className='mt-3 pt-3 border-t border-green-200'>
                              <p className='text-sm text-green-700 font-semibold mb-3 flex items-center gap-2'>
                                <CheckCircle className='w-4 h-4' />
                                {request.photos.length} photo
                                {request.photos.length !== 1 ? 's' : ''}{' '}
                                received
                              </p>
                              <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2'>
                                {request.photos.map((photo, idx) => (
                                  <div key={idx} className='relative group'>
                                    <img
                                      src={photo.url}
                                      alt={
                                        photo.description || `Photo ${idx + 1}`
                                      }
                                      className='w-full aspect-square rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border-2 border-transparent group-hover:border-purple-400'
                                      onClick={() => {
                                        // Find this photo in allPhotos and set active index
                                        const photoIndex = allPhotos.findIndex(
                                          (p) => p.url === photo.url
                                        );
                                        if (photoIndex >= 0) {
                                          setActivePhotoIndex(photoIndex);
                                          setShowLightbox(true);
                                        } else {
                                          // If not found in allPhotos, just open lightbox with this photo
                                          window.open(photo.url, '_blank');
                                        }
                                      }}
                                    />
                                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg pointer-events-none'>
                                      <Eye className='w-5 h-5 text-white' />
                                    </div>
                                    {photo.description && (
                                      <p
                                        className='text-xs text-slate-500 mt-1 truncate'
                                        title={photo.description}
                                      >
                                        {photo.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Show information report if available */}
                        {request.status === 'completed' &&
                          request.informationReport && (
                            <div className='mt-3 pt-3 border-t border-green-200'>
                              <p className='text-sm text-green-700 font-semibold mb-2 flex items-center gap-2'>
                                <FileText className='w-4 h-4' />
                                Information Report
                              </p>
                              <div className='p-3 bg-white rounded-lg border border-green-200'>
                                <p className='text-sm text-slate-700 whitespace-pre-wrap'>
                                  {request.informationReport}
                                </p>
                              </div>
                            </div>
                          )}

                        {/* Processing message */}
                        {request.status === 'processing' && (
                          <div className='mt-3 pt-3 border-t border-blue-200'>
                            <div className='flex items-center gap-2 text-blue-600'>
                              <Loader2 className='w-4 h-4 animate-spin' />
                              <p className='text-sm font-medium'>
                                Your request is being processed. Photos will
                                appear here once ready.
                              </p>
                            </div>
                            <p className='text-xs text-blue-500 mt-1'>
                              Typically completed within 1 business day
                            </p>
                          </div>
                        )}

                        {/* Pending payment message */}
                        {request.status === 'pending' && (
                          <div className='mt-3 pt-3 border-t border-yellow-200'>
                            <div className='flex items-center gap-2 text-yellow-700'>
                              <AlertTriangle className='w-4 h-4' />
                              <p className='text-sm font-medium'>
                                Payment pending. Complete payment to start
                                processing.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Camera className='w-8 h-8 text-slate-400' />
                  </div>
                  <p className='text-slate-900 font-semibold mb-1'>
                    No photo requests yet
                  </p>
                  <p className='text-sm text-slate-500 mb-4'>
                    Request additional photos to see your package contents in
                    detail
                  </p>
                  {pkg.status === 'received' && (
                    <button
                      onClick={() => navigate('/request-info')}
                      className='px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2'
                    >
                      <Camera className='w-4 h-4' />
                      Request Photos
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <h3 className='font-bold text-slate-900 mb-4'>Status</h3>
              <div
                className={`flex items-center gap-3 p-4 rounded-xl ${statusInfo.bgColor}`}
              >
                <div className={statusInfo.color}>{statusInfo.icon}</div>
                <div>
                  <p className={`font-bold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                  <p className='text-sm text-slate-600'>
                    {pkg.storageDay} days in storage
                  </p>
                </div>
              </div>

              {/* Consolidated badge */}
              {pkg.isConsolidatedResult && (
                <div className='mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200'>
                  <p className='font-semibold text-purple-900 flex items-center gap-2'>
                    <Box className='w-4 h-4' />
                    Consolidated Package
                  </p>
                  <p className='text-sm text-purple-700 mt-1'>
                    This package was created from consolidation
                  </p>
                </div>
              )}
            </motion.div>

            {/* Photo Request Summary */}
            {requestStats.total > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-purple-200'
              >
                <h3 className='font-bold text-purple-900 mb-4 flex items-center gap-2'>
                  <Camera className='w-5 h-5' />
                  Photo Request Summary
                </h3>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-purple-700'>Total Requests</span>
                    <span className='font-semibold text-purple-900'>
                      {requestStats.total}
                    </span>
                  </div>
                  {requestStats.processing > 0 && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-blue-700'>Processing</span>
                      <span className='font-semibold text-blue-900'>
                        {requestStats.processing}
                      </span>
                    </div>
                  )}
                  {requestStats.completed > 0 && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-green-700'>Completed</span>
                      <span className='font-semibold text-green-900'>
                        {requestStats.completed}
                      </span>
                    </div>
                  )}
                  <div className='pt-2 border-t border-purple-200'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-purple-700 font-medium'>
                        Photos Received
                      </span>
                      <span className='font-bold text-purple-900'>
                        {requestStats.totalPhotosReceived}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <h3 className='font-bold text-slate-900 mb-4'>Quick Actions</h3>
              <div className='space-y-3'>
                {pkg.status === 'received' && (
                  <>
                    <button
                      onClick={() => navigate('/shipping')}
                      className='w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow'
                    >
                      <Truck className='w-5 h-5' />
                      Ship Package
                    </button>
                    <button
                      onClick={() => navigate('/consolidation')}
                      className='w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors'
                    >
                      <Box className='w-5 h-5' />
                      Consolidate
                    </button>
                    <button
                      onClick={() => navigate('/request-info')}
                      className='w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors'
                    >
                      <Camera className='w-5 h-5' />
                      Request Photos
                    </button>
                  </>
                )}

                {(pkg.status === 'shipped' || pkg.status === 'in_transit') && (
                  <button
                    onClick={() => navigate('/shipments')}
                    className='w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors'
                  >
                    <ExternalLink className='w-5 h-5' />
                    Track Shipment
                  </button>
                )}
              </div>
            </motion.div>

            {/* Storage Warning */}
            {pkg.status === 'received' && pkg.storageDay > 30 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6'
              >
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='w-6 h-6 text-yellow-600 flex-shrink-0' />
                  <div>
                    <h3 className='font-bold text-yellow-900'>
                      Storage Reminder
                    </h3>
                    <p className='text-sm text-yellow-800 mt-1'>
                      Your package has been in storage for {pkg.storageDay}{' '}
                      days. Free storage is available for 45 days. Consider
                      shipping or consolidating soon.
                    </p>
                    <p className='text-sm font-semibold text-yellow-900 mt-2'>
                      {45 - pkg.storageDay} days remaining
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && allPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/95 z-50 flex items-center justify-center'
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className='absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors'
            >
              <X className='w-8 h-8' />
            </button>

            <img
              src={allPhotos[activePhotoIndex].url}
              alt={`Package photo ${activePhotoIndex + 1}`}
              className='max-w-[90vw] max-h-[90vh] object-contain'
              onClick={(e) => e.stopPropagation()}
            />

            {/* Description overlay */}
            {allPhotos[activePhotoIndex].description && (
              <div className='absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-lg text-white text-sm max-w-lg text-center'>
                {allPhotos[activePhotoIndex].description}
              </div>
            )}

            {/* Navigation */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? allPhotos.length - 1 : prev - 1
                    );
                  }}
                  className='absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors'
                >
                  <ChevronLeft className='w-8 h-8 text-white' />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) =>
                      prev === allPhotos.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className='absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors'
                >
                  <ChevronRight className='w-8 h-8 text-white' />
                </button>
              </>
            )}

            {/* Counter and source */}
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2'>
              <span className='px-4 py-2 bg-black/50 rounded-full text-white text-sm'>
                {activePhotoIndex + 1} / {allPhotos.length}
              </span>
              {allPhotos[activePhotoIndex].source === 'request' && (
                <span className='px-3 py-2 bg-purple-600/80 rounded-full text-white text-xs'>
                  Requested Photo
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
