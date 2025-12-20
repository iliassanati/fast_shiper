// client/src/pages/client/PackageDetailsPage.tsx - OPTIMIZED UI/UX VERSION
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
  MapPin,
  ShoppingBag,
  Star,
  TrendingUp,
  Zap,
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

  // Helper to extract package ID
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
        let packageData = getPackageById(id);
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

  // Fetch photo requests
  const fetchPhotoRequests = useCallback(async () => {
    if (!id) return;

    setLoadingPhotoRequests(true);
    try {
      const response = await apiHelpers.get<{
        photoRequests: PhotoRequest[];
      }>('/photo-requests');

      const allRequests = response.photoRequests || response || [];
      if (!Array.isArray(allRequests)) {
        setPhotoRequests([]);
        return;
      }

      const packageRequests = allRequests.filter((req) => {
        const reqPackageId = extractPackageId(req.packageId);
        return reqPackageId === id;
      });

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

  // Get all photos
  const allPhotos = useMemo(() => {
    const photos: Array<{
      url: string;
      type: string;
      description?: string;
      source: 'package' | 'request';
      requestId?: string;
    }> = [];

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
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
        icon: <Package className='w-5 h-5' />,
      },
      consolidated: {
        label: 'Consolidated',
        color: 'text-purple-700',
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
        icon: <Box className='w-5 h-5' />,
      },
      shipped: {
        label: 'Shipped',
        color: 'text-blue-700',
        bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        icon: <Truck className='w-5 h-5' />,
      },
      in_transit: {
        label: 'In Transit',
        color: 'text-orange-700',
        bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
        icon: <Truck className='w-5 h-5' />,
      },
      delivered: {
        label: 'Delivered',
        color: 'text-emerald-700',
        bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50',
        icon: <CheckCircle className='w-5 h-5' />,
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
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
            <p className='text-slate-600 font-medium'>
              Loading package details...
            </p>
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
        {/* ========== ENHANCED HEADER ========== */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <motion.button
              onClick={() => navigate('/packages')}
              className='p-3 hover:bg-slate-100 rounded-xl transition-colors group'
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className='w-6 h-6 text-slate-600 group-hover:text-slate-900' />
            </motion.button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight text-left'>
                {pkg.description}
              </h1>
              <div className='flex items-center gap-3 mt-2'>
                <span className='flex items-center gap-2 text-slate-600'>
                  <ShoppingBag className='w-4 h-4' />
                  <span className='font-medium'>{pkg.retailer}</span>
                </span>
                <span className='text-slate-600'>•</span>
                <span className='flex items-center gap-2 text-slate-600'>
                  <Calendar className='w-4 h-4' />
                  <span>
                    Received{' '}
                    {new Date(pkg.receivedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-6 py-3 rounded-2xl ${statusInfo.bgColor} border-2 border-opacity-50 shadow-md`}
          >
            <div className='flex items-center gap-3'>
              <div className={`${statusInfo.color}`}>{statusInfo.icon}</div>
              <div className='text-left'>
                <p className={`font-bold ${statusInfo.color} text-lg`}>
                  {statusInfo.label}
                </p>
                <p className='text-sm text-slate-600'>
                  {pkg.storageDay} days in storage
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* ========== MAIN CONTENT ========== */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Package Photos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100'
            >
              <div className='p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white'>
                <div className='flex items-center justify-between'>
                  <h2 className='font-bold text-slate-900 text-xl flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md'>
                      <Camera className='w-5 h-5 text-white' />
                    </div>
                    Package Photos
                  </h2>
                  {allPhotos.length > 0 && (
                    <div className='flex items-center gap-2'>
                      <span className='px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full'>
                        {allPhotos.length} photo
                        {allPhotos.length !== 1 ? 's' : ''}
                      </span>
                      <span className='text-sm text-slate-500'>
                        {activePhotoIndex + 1} of {allPhotos.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {allPhotos.length > 0 ? (
                <div className='relative'>
                  {/* Main Photo Display */}
                  <div
                    className='aspect-video bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer relative group'
                    onClick={() => setShowLightbox(true)}
                  >
                    <img
                      src={allPhotos[activePhotoIndex].url}
                      alt={`Package photo ${activePhotoIndex + 1}`}
                      className='w-full h-full object-contain'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center'>
                      <div className='opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110'>
                        <div className='bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl flex items-center gap-2'>
                          <Eye className='w-5 h-5 text-slate-700' />
                          <span className='text-slate-900 font-bold'>
                            Click to enlarge
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Photo type badge */}
                    <div className='absolute top-4 left-4'>
                      <span className='px-4 py-2 bg-black/70 backdrop-blur-sm text-white text-sm font-bold rounded-full capitalize flex items-center gap-2 shadow-lg'>
                        {allPhotos[activePhotoIndex].source === 'request' && (
                          <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                        )}
                        {allPhotos[activePhotoIndex].type}
                        {allPhotos[activePhotoIndex].source === 'request' &&
                          ' (Requested)'}
                      </span>
                    </div>

                    {/* Description */}
                    {allPhotos[activePhotoIndex].description && (
                      <div className='absolute bottom-4 left-4 right-4'>
                        <div className='bg-black/70 backdrop-blur-sm text-white p-4 rounded-xl shadow-xl'>
                          <p className='text-sm leading-relaxed'>
                            {allPhotos[activePhotoIndex].description}
                          </p>
                        </div>
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
                        className='absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/95 hover:bg-white rounded-full shadow-xl transition-all hover:scale-110'
                      >
                        <ChevronLeft className='w-6 h-6 text-slate-900' />
                      </button>
                      <button
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev === allPhotos.length - 1 ? 0 : prev + 1
                          )
                        }
                        className='absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/95 hover:bg-white rounded-full shadow-xl transition-all hover:scale-110'
                      >
                        <ChevronRight className='w-6 h-6 text-slate-900' />
                      </button>
                    </>
                  )}

                  {/* Thumbnail Strip */}
                  {allPhotos.length > 1 && (
                    <div className='p-5 flex gap-3 overflow-x-auto bg-slate-50'>
                      {allPhotos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePhotoIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all relative ${
                            index === activePhotoIndex
                              ? 'border-blue-600 ring-4 ring-blue-200 scale-110'
                              : 'border-slate-200 hover:border-slate-400 hover:scale-105'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Thumbnail ${index + 1}`}
                            className='w-full h-full object-cover'
                          />
                          {photo.source === 'request' && (
                            <div className='absolute bottom-0 right-0 w-5 h-5 bg-purple-500 rounded-tl-lg flex items-center justify-center shadow-md'>
                              <Camera className='w-3 h-3 text-white' />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className='p-16 text-center bg-gradient-to-br from-slate-50 to-white'>
                  <div className='w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <ImageIcon className='w-10 h-10 text-slate-400' />
                  </div>
                  <p className='text-slate-600 text-lg mb-4 font-medium'>
                    No photos available yet
                  </p>
                  {pkg.status === 'received' && (
                    <button
                      onClick={() => navigate('/request-info')}
                      className='px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2'
                    >
                      <Camera className='w-5 h-5' />
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
              className='bg-white rounded-2xl shadow-lg p-6 border border-slate-100'
            >
              <h2 className='font-bold text-slate-900 text-xl mb-6 flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md'>
                  <Info className='w-5 h-5 text-white' />
                </div>
                Package Details
              </h2>

              <div className='grid md:grid-cols-2 gap-6'>
                {/* Tracking Number */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <MapPin className='w-4 h-4' />
                    Tracking Number
                  </p>
                  <div className='flex items-center gap-2'>
                    <code className='flex-1 text-slate-900 font-mono bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-xl border border-slate-200 font-semibold'>
                      {pkg.trackingNumber}
                    </code>
                    <button
                      onClick={copyTracking}
                      className='p-3 hover:bg-blue-50 rounded-xl transition-colors group border border-slate-200'
                      title='Copy tracking number'
                    >
                      <Copy className='w-5 h-5 text-slate-500 group-hover:text-blue-600' />
                    </button>
                  </div>
                </div>

                {/* Retailer */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <ShoppingBag className='w-4 h-4' />
                    Retailer
                  </p>
                  <p className='text-slate-900 font-bold text-lg bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-xl border border-slate-200'>
                    {pkg.retailer}
                  </p>
                </div>

                {/* Weight */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <Scale className='w-4 h-4' />
                    Weight
                  </p>
                  <p className='text-slate-900 font-bold text-lg bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-xl border border-slate-200'>
                    {typeof pkg.weight === 'object'
                      ? `${pkg.weight.value} ${pkg.weight.unit || 'kg'}`
                      : `${pkg.weight} kg`}
                  </p>
                </div>

                {/* Dimensions */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <Ruler className='w-4 h-4' />
                    Dimensions
                  </p>
                  <p className='text-slate-900 font-bold text-lg bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-xl border border-slate-200'>
                    {typeof pkg.dimensions === 'object'
                      ? `${pkg.dimensions.length} × ${pkg.dimensions.width} × ${
                          pkg.dimensions.height
                        } ${pkg.dimensions.unit || 'cm'}`
                      : `${pkg.dimensions} cm`}
                  </p>
                </div>

                {/* Estimated Value */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <DollarSign className='w-4 h-4' />
                    Estimated Value
                  </p>
                  <p className='text-slate-900 font-bold text-lg bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-200'>
                    {typeof pkg.estimatedValue === 'object'
                      ? `$${pkg.estimatedValue.amount} ${
                          pkg.estimatedValue.currency || 'USD'
                        }`
                      : pkg.estimatedValue}
                  </p>
                </div>

                {/* Received Date */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    Received Date
                  </p>
                  <p className='text-slate-900 font-bold text-lg bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-xl border border-slate-200'>
                    {new Date(pkg.receivedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Storage Days */}
                <div className='space-y-2'>
                  <p className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    Storage Duration
                  </p>
                  <div className='flex items-center gap-3 bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-xl border border-slate-200'>
                    <p className='text-slate-900 font-bold text-lg'>
                      {pkg.storageDay} days
                    </p>
                    {pkg.storageDay > 23 && (
                      <span className='px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1'>
                        <AlertTriangle className='w-3 h-3' />
                        {30 - pkg.storageDay} days left
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {pkg.notes && (
                <div className='mt-6 pt-6 border-t border-slate-100'>
                  <p className='text-sm text-slate-500 font-medium mb-3 flex items-center gap-2'>
                    <MessageSquare className='w-4 h-4' />
                    Additional Notes
                  </p>
                  <div className='bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200'>
                    <p className='text-slate-700 leading-relaxed'>
                      {pkg.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Storage Progress Bar */}
              {pkg.status === 'received' && (
                <div className='mt-6 pt-6 border-t border-slate-100'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm text-slate-500 font-medium flex items-center gap-2'>
                      <TrendingUp className='w-4 h-4' />
                      Free Storage Progress
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        30 - pkg.storageDay <= 3
                          ? 'text-red-600'
                          : 30 - pkg.storageDay <= 7
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {30 - pkg.storageDay <= 0
                        ? 'EXPIRED'
                        : `${30 - pkg.storageDay} of 30 days left`}
                    </span>
                  </div>

                  <div className='h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner'>
                    <div
                      className={`h-full transition-all duration-500 ${
                        30 - pkg.storageDay <= 3
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : 30 - pkg.storageDay <= 7
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((30 - pkg.storageDay) / 30) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  {30 - pkg.storageDay <= 3 && (
                    <p className='text-sm text-red-600 mt-3 font-bold flex items-center gap-2 bg-red-50 p-3 rounded-lg'>
                      <AlertTriangle className='w-4 h-4' />
                      {30 - pkg.storageDay <= 0
                        ? '⚠️ Storage period expired! Ship immediately to avoid fees.'
                        : `⚠️ Only ${30 - pkg.storageDay} day${
                            30 - pkg.storageDay !== 1 ? 's' : ''
                          } remaining! Ship soon.`}
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Photo Requests Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl shadow-lg p-6 border border-slate-100'
            >
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md'>
                    <FileText className='w-5 h-5 text-white' />
                  </div>
                  <h2 className='font-bold text-slate-900 text-xl flex items-center gap-3'>
                    Photo Requests
                    {requestStats.total > 0 && (
                      <div className='flex items-center gap-2'>
                        {requestStats.processing > 0 && (
                          <span className='px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full'>
                            {requestStats.processing} processing
                          </span>
                        )}
                        {requestStats.completed > 0 && (
                          <span className='px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full'>
                            {requestStats.totalPhotosReceived} photos received
                          </span>
                        )}
                      </div>
                    )}
                  </h2>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={handleRefreshRequests}
                    disabled={refreshingRequests}
                    className='p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors'
                    title='Refresh requests'
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${
                        refreshingRequests ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                  {pkg.status === 'received' && (
                    <button
                      onClick={() => navigate('/request-info')}
                      className='px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2'
                    >
                      <Camera className='w-4 h-4' />
                      Request Photos
                    </button>
                  )}
                </div>
              </div>

              {loadingPhotoRequests ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='w-8 h-8 animate-spin text-purple-500' />
                  <span className='ml-3 text-slate-500 font-medium'>
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
                        className={`border-2 rounded-2xl p-5 transition-all ${
                          request.status === 'completed'
                            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                            : request.status === 'processing'
                            ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-md'
                            : 'border-slate-200 bg-white shadow-sm'
                        }`}
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <div>
                            <div className='flex items-center gap-2 flex-wrap mb-2'>
                              <span className='font-bold text-slate-900 text-lg capitalize'>
                                {request.requestType === 'both'
                                  ? 'Photos & Information'
                                  : request.requestType}{' '}
                                Request
                              </span>
                              <span
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 flex items-center gap-1.5 ${statusBadge.className}`}
                              >
                                {statusBadge.icon}
                                {statusBadge.label}
                              </span>
                            </div>
                            <p className='text-sm text-slate-500'>
                              Requested: {formatDate(request.createdAt)}
                              {request.completedAt && (
                                <span className='ml-2 text-green-600 font-medium'>
                                  • Completed: {formatDate(request.completedAt)}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className='text-right bg-white rounded-xl p-3 border border-slate-200 shadow-sm'>
                            <p className='font-black text-slate-900 text-xl'>
                              {request.cost.total} {request.cost.currency}
                            </p>
                            <p className='text-xs text-slate-500 font-medium'>
                              {request.additionalPhotos} photo
                              {request.additionalPhotos !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {request.customInstructions && (
                          <div className='mb-4 p-4 bg-white rounded-xl border border-slate-200'>
                            <p className='text-sm text-slate-700 flex items-start gap-2 leading-relaxed'>
                              <MessageSquare className='w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500' />
                              <span className='italic'>
                                "{request.customInstructions}"
                              </span>
                            </p>
                          </div>
                        )}

                        {request.specificRequests &&
                          request.specificRequests.length > 0 && (
                            <div className='mb-4'>
                              <p className='text-xs text-slate-500 font-medium mb-2 text-left'>
                                Requested details:
                              </p>
                              <div className='flex flex-wrap gap-2'>
                                {request.specificRequests.map((req, idx) => (
                                  <span
                                    key={idx}
                                    className='px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full'
                                  >
                                    {req}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {request.status === 'completed' &&
                          request.photos?.length > 0 && (
                            <div className='mt-4 pt-4 border-t-2 border-green-200'>
                              <p className='text-sm text-green-700 font-bold mb-4 flex items-center gap-2'>
                                <CheckCircle className='w-5 h-5' />
                                {request.photos.length} photo
                                {request.photos.length !== 1 ? 's' : ''}{' '}
                                received
                              </p>
                              <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3'>
                                {request.photos.map((photo, idx) => (
                                  <div key={idx} className='relative group'>
                                    <img
                                      src={photo.url}
                                      alt={
                                        photo.description || `Photo ${idx + 1}`
                                      }
                                      className='w-full aspect-square rounded-xl object-cover cursor-pointer hover:opacity-90 transition-all border-2 border-transparent group-hover:border-purple-400 group-hover:scale-105 shadow-md'
                                      onClick={() => {
                                        const photoIndex = allPhotos.findIndex(
                                          (p) => p.url === photo.url
                                        );
                                        if (photoIndex >= 0) {
                                          setActivePhotoIndex(photoIndex);
                                          setShowLightbox(true);
                                        } else {
                                          window.open(photo.url, '_blank');
                                        }
                                      }}
                                    />
                                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl pointer-events-none'>
                                      <Eye className='w-6 h-6 text-white' />
                                    </div>
                                    {photo.description && (
                                      <p
                                        className='text-xs text-slate-600 mt-1.5 truncate font-medium'
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

                        {request.status === 'completed' &&
                          request.informationReport && (
                            <div className='mt-4 pt-4 border-t-2 border-green-200'>
                              <p className='text-sm text-green-700 font-bold mb-3 flex items-center gap-2'>
                                <FileText className='w-5 h-5' />
                                Information Report
                              </p>
                              <div className='p-4 bg-white rounded-xl border-2 border-green-200 shadow-sm'>
                                <p className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed'>
                                  {request.informationReport}
                                </p>
                              </div>
                            </div>
                          )}

                        {request.status === 'processing' && (
                          <div className='mt-4 pt-4 border-t-2 border-blue-200'>
                            <div className='flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-xl'>
                              <Loader2 className='w-5 h-5 animate-spin flex-shrink-0' />
                              <div>
                                <p className='text-sm font-bold'>
                                  Your request is being processed
                                </p>
                                <p className='text-xs text-blue-500 mt-1'>
                                  Photos will appear here once ready (typically
                                  within 1 business day)
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <div className='mt-4 pt-4 border-t-2 border-yellow-200'>
                            <div className='flex items-center gap-3 text-yellow-700 bg-yellow-50 p-4 rounded-xl'>
                              <AlertTriangle className='w-5 h-5 flex-shrink-0' />
                              <p className='text-sm font-bold'>
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
                <div className='text-center py-12 bg-gradient-to-br from-slate-50 to-white rounded-xl'>
                  <div className='w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Camera className='w-10 h-10 text-slate-400' />
                  </div>
                  <p className='text-slate-900 font-bold text-lg mb-2'>
                    No photo requests yet
                  </p>
                  <p className='text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed'>
                    Request additional photos to see your package contents in
                    detail
                  </p>
                  {pkg.status === 'received' && (
                    <button
                      onClick={() => navigate('/request-info')}
                      className='px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2'
                    >
                      <Camera className='w-5 h-5' />
                      Request Photos
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* ========== SIDEBAR ========== */}
          <div className='space-y-6'>
            {/* Consolidated Badge */}
            {pkg.isConsolidatedResult && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg'
              >
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md'>
                    <Box className='w-6 h-6 text-white' />
                  </div>
                  <p className='font-bold text-purple-900 text-lg'>
                    Consolidated Package
                  </p>
                </div>
                <p className='text-purple-700 leading-relaxed'>
                  This package was created from{' '}
                  {pkg.originalPackageIds?.length || 0} packages through
                  consolidation
                </p>
              </motion.div>
            )}

            {/* Photo Request Summary */}
            {requestStats.total > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className='bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200'
              >
                <h3 className='font-bold text-purple-900 mb-4 flex items-center gap-3 text-lg'>
                  <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md'>
                    <Camera className='w-5 h-5 text-white' />
                  </div>
                  Photo Request Summary
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center p-3 bg-white rounded-xl'>
                    <span className='text-purple-700 font-medium'>
                      Total Requests
                    </span>
                    <span className='font-bold text-purple-900 text-lg'>
                      {requestStats.total}
                    </span>
                  </div>
                  {requestStats.processing > 0 && (
                    <div className='flex justify-between items-center p-3 bg-blue-50 rounded-xl'>
                      <span className='text-blue-700 font-medium'>
                        Processing
                      </span>
                      <span className='font-bold text-blue-900 text-lg'>
                        {requestStats.processing}
                      </span>
                    </div>
                  )}
                  {requestStats.completed > 0 && (
                    <div className='flex justify-between items-center p-3 bg-green-50 rounded-xl'>
                      <span className='text-green-700 font-medium'>
                        Completed
                      </span>
                      <span className='font-bold text-green-900 text-lg'>
                        {requestStats.completed}
                      </span>
                    </div>
                  )}
                  <div className='pt-3 border-t-2 border-purple-200'>
                    <div className='flex justify-between items-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl'>
                      <span className='text-purple-700 font-bold flex items-center gap-2'>
                        <Star className='w-4 h-4' />
                        Photos Received
                      </span>
                      <span className='font-black text-purple-900 text-xl'>
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
              className='bg-white rounded-2xl shadow-lg p-6 border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 text-lg mb-4 flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md'>
                  <Zap className='w-5 h-5 text-white' />
                </div>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                {pkg.status === 'received' && (
                  <>
                    <button
                      onClick={() => navigate('/shipping')}
                      className='w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:scale-105'
                    >
                      <Truck className='w-5 h-5' />
                      Ship Package
                    </button>
                    <button
                      onClick={() => navigate('/consolidation')}
                      className='w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:scale-105'
                    >
                      <Box className='w-5 h-5' />
                      Consolidate
                    </button>
                    <button
                      onClick={() => navigate('/request-info')}
                      className='w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:scale-105'
                    >
                      <Camera className='w-5 h-5' />
                      Request Photos
                    </button>
                  </>
                )}

                {(pkg.status === 'shipped' || pkg.status === 'in_transit') && (
                  <button
                    onClick={() => navigate('/shipments')}
                    className='w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:scale-105'
                  >
                    <ExternalLink className='w-5 h-5' />
                    Track Shipment
                  </button>
                )}
              </div>
            </motion.div>

            {/* Storage Warning */}
            {pkg.status === 'received' && pkg.storageDay > 23 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl p-6 border-2 shadow-lg ${
                  30 - pkg.storageDay <= 3
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
                    : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                      30 - pkg.storageDay <= 3 ? 'bg-red-600' : 'bg-yellow-600'
                    }`}
                  >
                    <AlertTriangle className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-lg mb-2 ${
                        30 - pkg.storageDay <= 3
                          ? 'text-red-900'
                          : 'text-yellow-900'
                      }`}
                    >
                      {30 - pkg.storageDay <= 3
                        ? '🚨 Critical Warning'
                        : '⚠️ Storage Reminder'}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed mb-3 ${
                        30 - pkg.storageDay <= 3
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      }`}
                    >
                      Your package has been in storage for {pkg.storageDay}{' '}
                      days. Free storage is available for 30 days.
                      {30 - pkg.storageDay <= 3
                        ? ' Please ship immediately to avoid additional fees.'
                        : ' Consider shipping or consolidating soon.'}
                    </p>
                    <p
                      className={`font-bold ${
                        30 - pkg.storageDay <= 3
                          ? 'text-red-900'
                          : 'text-yellow-900'
                      }`}
                    >
                      ⏰ {30 - pkg.storageDay} days remaining
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox - Same as before */}
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
              className='absolute top-4 right-4 p-3 text-white hover:bg-white/10 rounded-xl transition-colors'
            >
              <X className='w-8 h-8' />
            </button>

            <img
              src={allPhotos[activePhotoIndex].url}
              alt={`Package photo ${activePhotoIndex + 1}`}
              className='max-w-[90vw] max-h-[90vh] object-contain'
              onClick={(e) => e.stopPropagation()}
            />

            {allPhotos[activePhotoIndex].description && (
              <div className='absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm max-w-lg text-center'>
                {allPhotos[activePhotoIndex].description}
              </div>
            )}

            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) =>
                      prev === 0 ? allPhotos.length - 1 : prev - 1
                    );
                  }}
                  className='absolute left-4 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors'
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
                  className='absolute right-4 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors'
                >
                  <ChevronRight className='w-8 h-8 text-white' />
                </button>
              </>
            )}

            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3'>
              <span className='px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-bold'>
                {activePhotoIndex + 1} / {allPhotos.length}
              </span>
              {allPhotos[activePhotoIndex].source === 'request' && (
                <span className='px-3 py-2 bg-purple-600/80 backdrop-blur-sm rounded-full text-white text-xs font-bold'>
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
