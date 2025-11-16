// client/src/pages/client/ProfilePage.tsx - IMPROVED VERSION
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  Camera,
  Edit,
  Save,
  X,
  Copy,
  Check,
  AlertCircle,
  Eye,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuthStore, usePackageStore, useShipmentStore } from '@/stores';
import { apiHelpers } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface PhotoRequest {
  _id: string;
  packageId: {
    _id: string;
    description: string;
    retailer: string;
    trackingNumber: string;
  };
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
  createdAt: string;
  completedAt?: string;
  photos?: Array<{
    url: string;
    description: string;
    uploadedAt: string;
  }>;
  informationReport?: string;
}

// Photo Lightbox Component
function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: Array<{ url: string; description: string }>;
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextPhoto = () => {
    setCurrentIndex((currentIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className='absolute top-4 right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors z-10'
      >
        <X className='w-6 h-6 text-white' />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevPhoto();
            }}
            className='absolute left-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors z-10'
          >
            <ChevronLeft className='w-8 h-8 text-white' />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPhoto();
            }}
            className='absolute right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors z-10'
          >
            <ChevronRight className='w-8 h-8 text-white' />
          </button>
        </>
      )}

      <motion.div
        key={currentIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-6xl w-full'
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[currentIndex].url}
          alt={photos[currentIndex].description || `Photo ${currentIndex + 1}`}
          className='w-full h-auto rounded-lg shadow-2xl'
        />
        <div className='mt-4 text-center text-white'>
          <p className='text-lg font-semibold'>
            {photos[currentIndex].description || `Photo ${currentIndex + 1}`}
          </p>
          <p className='text-sm text-slate-300 mt-1'>
            Photo {currentIndex + 1} of {photos.length}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { packages } = usePackageStore();
  const { shipments } = useShipmentStore();

  const [isEditing, setIsEditing] = useState(false);
  const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PhotoRequest | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<Array<{
    url: string;
    description: string;
  }> | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.address?.city || '',
    street: user?.address?.street || '',
    postalCode: user?.address?.postalCode || '',
  });

  // Fetch photo requests
  useEffect(() => {
    const fetchPhotoRequests = async () => {
      try {
        setLoading(true);
        console.log('📸 Fetching photo requests...');

        const response = await apiHelpers.get<{
          photoRequests: PhotoRequest[];
        }>('/photo-requests', { limit: 100 });

        console.log('✅ Photo requests loaded:', response.photoRequests.length);
        setPhotoRequests(response.photoRequests);
      } catch (error: any) {
        console.error('❌ Error fetching photo requests:', error);
        setPhotoRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoRequests();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: 'Morocco',
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.address?.city || '',
      street: user?.address?.street || '',
      postalCode: user?.address?.postalCode || '',
    });
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (!user) return;
    const addressText = `${user.name}\nSuite ${user.suiteNumber}\n123 Warehouse Drive\nWilmington, DE 19801\nUnited States\n+1 (555) 123-4567`;
    navigator.clipboard.writeText(addressText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const openLightbox = (
    photos: Array<{ url: string; description: string }>,
    index: number
  ) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  return (
    <DashboardLayout activeSection='profile'>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>My Profile</h1>
          <p className='text-slate-600'>Manage your account and preferences</p>
        </div>

        {/* Profile Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
        >
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-slate-900'>
              Personal Information
            </h2>
            {!isEditing ? (
              <motion.button
                onClick={() => setIsEditing(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit className='w-4 h-4' />
                Edit
              </motion.button>
            ) : (
              <div className='flex gap-2'>
                <motion.button
                  onClick={handleCancel}
                  disabled={saving}
                  className='px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className='w-4 h-4' />
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  className='px-4 py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {saving ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='w-4 h-4' />
                      Save
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            {/* Name */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <User className='w-4 h-4 inline mr-2' />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                  placeholder='Enter your full name'
                />
              ) : (
                <p className='text-slate-900 font-medium'>{user?.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Mail className='w-4 h-4 inline mr-2' />
                Email
              </label>
              <p className='text-slate-900 font-medium'>{user?.email}</p>
              <p className='text-xs text-slate-500 mt-1'>
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Phone className='w-4 h-4 inline mr-2' />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type='tel'
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                  placeholder='+212 XXX-XXXXXX'
                />
              ) : (
                <p className='text-slate-900 font-medium'>{user?.phone}</p>
              )}
            </div>

            {/* Suite Number */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Package className='w-4 h-4 inline mr-2' />
                Suite Number
              </label>
              <p className='text-blue-600 font-bold text-lg'>
                {user?.suiteNumber}
              </p>
              <p className='text-xs text-slate-500 mt-1'>
                Use this in your US shipping address
              </p>
            </div>

            {/* City */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <MapPin className='w-4 h-4 inline mr-2' />
                City (Morocco)
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                  placeholder='Casablanca, Rabat, Marrakech...'
                />
              ) : (
                <p className='text-slate-900 font-medium'>
                  {user?.address?.city}
                </p>
              )}
            </div>

            {/* Street */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Street Address
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                  placeholder='Street address'
                />
              ) : (
                <p className='text-slate-900 font-medium'>
                  {user?.address?.street || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* US Shipping Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200'
        >
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-bold text-slate-900'>
              Your US Shipping Address
            </h2>
            <motion.button
              onClick={copyAddress}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copiedAddress ? (
                <>
                  <Check className='w-4 h-4' />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4' />
                  Copy
                </>
              )}
            </motion.button>
          </div>

          <div className='bg-white rounded-xl p-4 font-mono text-slate-800 space-y-1'>
            <p className='font-bold'>{user?.name}</p>
            <p className='text-blue-600 font-bold text-lg'>
              Suite {user?.suiteNumber}
            </p>
            <p>123 Warehouse Drive</p>
            <p>Wilmington, DE 19801</p>
            <p>United States</p>
            <p className='text-slate-600'>Phone: +1 (555) 123-4567</p>
          </div>

          <div className='mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2'>
            <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-yellow-900'>
              <strong>Important:</strong> Always include your suite number (
              {user?.suiteNumber}) in the shipping address when ordering from US
              stores.
            </p>
          </div>
        </motion.div>

        {/* Account Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
        >
          <h2 className='text-xl font-bold text-slate-900 mb-6'>
            Account Statistics
          </h2>
          <div className='grid md:grid-cols-3 gap-6'>
            <div className='text-center p-4 bg-blue-50 rounded-xl'>
              <Package className='w-8 h-8 text-blue-600 mx-auto mb-2' />
              <p className='text-3xl font-bold text-blue-600'>
                {packages.length}
              </p>
              <p className='text-sm text-slate-600'>Total Packages</p>
            </div>

            <div className='text-center p-4 bg-green-50 rounded-xl'>
              <Truck className='w-8 h-8 text-green-600 mx-auto mb-2' />
              <p className='text-3xl font-bold text-green-600'>
                {shipments.length}
              </p>
              <p className='text-sm text-slate-600'>Total Shipments</p>
            </div>

            <div className='text-center p-4 bg-purple-50 rounded-xl'>
              <Camera className='w-8 h-8 text-purple-600 mx-auto mb-2' />
              <p className='text-3xl font-bold text-purple-600'>
                {photoRequests.length}
              </p>
              <p className='text-sm text-slate-600'>Photo Requests</p>
            </div>
          </div>
        </motion.div>

        {/* Photo Requests History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
        >
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-slate-900'>
              Photo Requests History
            </h2>
            <motion.button
              onClick={() => navigate('/request-info')}
              className='px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera className='w-4 h-4' />
              Request Photos
            </motion.button>
          </div>

          {loading ? (
            <div className='text-center py-12'>
              <div className='w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
              <p className='text-slate-600'>Loading photo requests...</p>
            </div>
          ) : photoRequests.length === 0 ? (
            <div className='text-center py-12'>
              <Camera className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600 mb-2'>No photo requests yet</p>
              <p className='text-sm text-slate-500'>
                Request photos of your packages to see them here
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {photoRequests.map((request) => (
                <div
                  key={request._id}
                  className='p-5 border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='font-bold text-slate-900 text-lg mb-1'>
                        {request?.packageId?.description}
                      </h3>
                      <p className='text-sm text-slate-600'>
                        From {request?.packageId?.retailer} • Tracking:{' '}
                        {request?.packageId?.trackingNumber}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusBadge(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                    <div className='bg-slate-50 rounded-lg p-3'>
                      <p className='text-xs text-slate-500 mb-1'>Type</p>
                      <p className='font-semibold text-slate-900 capitalize text-sm'>
                        {request.requestType}
                      </p>
                    </div>
                    <div className='bg-slate-50 rounded-lg p-3'>
                      <p className='text-xs text-slate-500 mb-1'>Photos</p>
                      <p className='font-semibold text-slate-900 text-sm'>
                        {request.photos?.length || 0} /{' '}
                        {request.additionalPhotos}
                      </p>
                    </div>
                    <div className='bg-slate-50 rounded-lg p-3'>
                      <p className='text-xs text-slate-500 mb-1'>Cost</p>
                      <p className='font-semibold text-slate-900 text-sm'>
                        {request.cost.total} {request.cost.currency}
                      </p>
                    </div>
                    <div className='bg-slate-50 rounded-lg p-3'>
                      <p className='text-xs text-slate-500 mb-1'>Requested</p>
                      <p className='font-semibold text-slate-900 text-sm'>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Photos Preview */}
                  {request.status === 'completed' &&
                    request.photos &&
                    request.photos.length > 0 && (
                      <div className='mb-4'>
                        <p className='text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2'>
                          <Camera className='w-4 h-4' />
                          Photos ({request.photos.length})
                        </p>
                        <div className='grid grid-cols-4 md:grid-cols-8 gap-2'>
                          {request.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className='aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all group relative'
                              onClick={() => openLightbox(request.photos!, idx)}
                            >
                              <img
                                src={photo.url}
                                alt={photo.description || `Photo ${idx + 1}`}
                                className='w-full h-full object-cover group-hover:scale-110 transition-transform'
                              />
                              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center'>
                                <ZoomIn className='w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Information Report */}
                  {request.informationReport && (
                    <div className='mb-4 p-4 bg-blue-50 rounded-lg'>
                      <p className='text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2'>
                        <FileText className='w-4 h-4' />
                        Package Information Report
                      </p>
                      <p className='text-sm text-blue-800 whitespace-pre-wrap'>
                        {request.informationReport}
                      </p>
                    </div>
                  )}

                  <div className='flex gap-2'>
                    <motion.button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailModal(true);
                      }}
                      className='px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-purple-200 transition-colors'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className='w-4 h-4' />
                      View Details
                    </motion.button>
                    <motion.button
                      onClick={() =>
                        navigate(`/packages/${request.packageId._id}`)
                      }
                      className='px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:bg-blue-200 transition-colors'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Package className='w-4 h-4' />
                      View Package
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Photo Request Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedRequest && (
            <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto'
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
                  {/* Package Info */}
                  <div>
                    <h4 className='font-bold text-slate-900 mb-3'>Package</h4>
                    <div className='bg-slate-50 rounded-lg p-4 space-y-2'>
                      <p>
                        <strong>Description:</strong>{' '}
                        {selectedRequest.packageId.description}
                      </p>
                      <p>
                        <strong>Retailer:</strong>{' '}
                        {selectedRequest.packageId.retailer}
                      </p>
                      <p>
                        <strong>Tracking:</strong>{' '}
                        {selectedRequest.packageId.trackingNumber}
                      </p>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div>
                    <h4 className='font-bold text-slate-900 mb-3'>
                      Request Info
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
                        <strong>Photos Received:</strong>{' '}
                        {selectedRequest.photos?.length || 0}
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadge(
                            selectedRequest.status
                          )}`}
                        >
                          {getStatusLabel(selectedRequest.status)}
                        </span>
                      </p>
                      <p>
                        <strong>Cost:</strong> {selectedRequest.cost.total}{' '}
                        {selectedRequest.cost.currency}
                      </p>
                      <p>
                        <strong>Requested On:</strong>{' '}
                        {new Date(selectedRequest.createdAt).toLocaleString()}
                      </p>
                      {selectedRequest.completedAt && (
                        <p>
                          <strong>Completed On:</strong>{' '}
                          {new Date(
                            selectedRequest.completedAt
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specific Requests */}
                  {selectedRequest.specificRequests.length > 0 && (
                    <div>
                      <h4 className='font-bold text-slate-900 mb-3'>
                        Specific Requests
                      </h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedRequest.specificRequests.map((req, idx) => (
                          <span
                            key={idx}
                            className='px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Instructions */}
                  {selectedRequest.customInstructions && (
                    <div>
                      <h4 className='font-bold text-slate-900 mb-3'>
                        Custom Instructions
                      </h4>
                      <div className='bg-slate-50 rounded-lg p-4'>
                        <p className='text-sm'>
                          {selectedRequest.customInstructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {selectedRequest.photos &&
                    selectedRequest.photos.length > 0 && (
                      <div>
                        <h4 className='font-bold text-slate-900 mb-3'>
                          Photos ({selectedRequest.photos.length})
                        </h4>
                        <div className='grid grid-cols-3 gap-4'>
                          {selectedRequest.photos.map((photo, idx) => (
                            <div
                              key={idx}
                              className='aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all'
                              onClick={() =>
                                openLightbox(selectedRequest.photos!, idx)
                              }
                            >
                              <img
                                src={photo.url}
                                alt={photo.description}
                                className='w-full h-full object-cover hover:scale-110 transition-transform'
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
                      <div className='bg-blue-50 rounded-lg p-4'>
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

        {/* Photo Lightbox */}
        <AnimatePresence>
          {lightboxPhotos && (
            <PhotoLightbox
              photos={lightboxPhotos}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxPhotos(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
