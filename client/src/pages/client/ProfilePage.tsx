// client/src/pages/client/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  };
  requestType: 'photos' | 'information' | 'both';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  additionalPhotos: number;
  cost: {
    total: number;
    currency: string;
  };
  createdAt: string;
  completedAt?: string;
  photos?: Array<{
    url: string;
    description: string;
  }>;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, usAddress, updateProfile } = useAuthStore();
  const { packages } = usePackageStore();
  const { shipments } = useShipmentStore();

  const [isEditing, setIsEditing] = useState(false);
  const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
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
        }>('/photo-requests', { limit: 50 });
        console.log('✅ Photo requests loaded:', response.photoRequests.length);
        setPhotoRequests(response.photoRequests);
      } catch (error: any) {
        console.error('❌ Error fetching photo requests:', error);
        // Don't throw error, just show empty state
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
      console.log('💾 Saving profile updates...');

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

      console.log('✅ Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
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
    if (!usAddress) return;
    const addressText = `${usAddress.name}\n${usAddress.suite}\n${usAddress.street}\n${usAddress.city}\n${usAddress.country}\n${usAddress.phone}`;
    navigator.clipboard.writeText(addressText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

            {/* Postal Code */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Postal Code
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                  placeholder='Postal code'
                />
              ) : (
                <p className='text-slate-900 font-medium'>
                  {user?.address?.postalCode || 'Not provided'}
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

          {usAddress && (
            <div className='bg-white rounded-xl p-4 font-mono text-slate-800 space-y-1'>
              <p className='font-bold'>{usAddress.name}</p>
              <p className='text-blue-600 font-bold text-lg'>
                {usAddress.suite}
              </p>
              <p>{usAddress.street}</p>
              <p>{usAddress.city}</p>
              <p>{usAddress.country}</p>
              <p className='text-slate-600'>Phone: {usAddress.phone}</p>
            </div>
          )}

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
            <div className='text-center py-8'>
              <div className='w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
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
                  className='p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h3 className='font-bold text-slate-900'>
                        {request.packageId.description}
                      </h3>
                      <p className='text-sm text-slate-600'>
                        From {request.packageId.retailer}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3'>
                    <div>
                      <p className='text-slate-500'>Request Type</p>
                      <p className='font-semibold text-slate-900 capitalize'>
                        {request.requestType}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-500'>Photos</p>
                      <p className='font-semibold text-slate-900'>
                        {request.additionalPhotos}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-500'>Cost</p>
                      <p className='font-semibold text-slate-900'>
                        {request.cost.total} {request.cost.currency}
                      </p>
                    </div>
                    <div>
                      <p className='text-slate-500'>Requested</p>
                      <p className='font-semibold text-slate-900'>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {request.status === 'completed' && request.photos && (
                    <div className='mt-4 pt-4 border-t border-slate-200'>
                      <p className='text-sm font-semibold text-slate-700 mb-3'>
                        Photos ({request.photos.length})
                      </p>
                      <div className='grid grid-cols-3 md:grid-cols-6 gap-2'>
                        {request.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className='aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity'
                          >
                            <img
                              src={photo.url}
                              alt={photo.description || `Photo ${idx + 1}`}
                              className='w-full h-full object-cover'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='mt-3 flex gap-2'>
                    <motion.button
                      onClick={() =>
                        navigate(`/packages/${request.packageId._id}`)
                      }
                      className='px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold flex items-center gap-1'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className='w-3 h-3' />
                      View Package
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
