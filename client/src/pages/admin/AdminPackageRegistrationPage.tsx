// client/src/pages/admin/AdminPackageRegistrationPage.tsx - ENHANCED VERSION
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Search,
  User,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface PackageForm {
  trackingNumber: string;
  retailer: string;
  description: string;
  weight: string;
  weightUnit: 'kg' | 'lb';
  length: string;
  width: string;
  height: string;
  dimensionsUnit: 'cm' | 'in';
  estimatedValue: string;
  currency: 'USD' | 'MAD';
  suiteNumber: string;
  notes: string;
}

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  suiteNumber: string;
}

interface PhotoUpload {
  file: File;
  preview: string;
  type: 'basic' | 'unpacked' | 'detailed' | 'damage';
}

export default function AdminPackageRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);

  // Cloudinary config
  const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djwape6g1';
  const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fast-shipper-preset';

  const [formData, setFormData] = useState<PackageForm>({
    trackingNumber: '',
    retailer: '',
    description: '',
    weight: '',
    weightUnit: 'kg',
    length: '',
    width: '',
    height: '',
    dimensionsUnit: 'cm',
    estimatedValue: '',
    currency: 'USD',
    suiteNumber: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const searchUser = async () => {
    if (!formData.suiteNumber) {
      setError('Please enter a suite number');
      return;
    }

    try {
      setSearchingUser(true);
      setError('');

      const response = await apiHelpers.get('/admin/users', {
        search: formData.suiteNumber,
      });

      const user = response.users.find(
        (u: any) => u.suiteNumber === formData.suiteNumber
      );

      if (user) {
        setUserInfo(user);
      } else {
        setError('No user found with this suite number');
        setUserInfo(null);
      }
    } catch (error: any) {
      setError(error.message || 'Error searching for user');
      setUserInfo(null);
    } finally {
      setSearchingUser(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newPhotos.push({
          file,
          preview: URL.createObjectURL(file),
          type: 'basic',
        });
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const updatePhotoType = (
    index: number,
    type: 'basic' | 'unpacked' | 'detailed' | 'damage'
  ) => {
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index].type = type;
      return updated;
    });
  };

  const uploadPhotosToCloudinary = async (): Promise<
    Array<{ url: string; type: string }>
  > => {
    const uploadedPhotos: Array<{ url: string; type: string }> = [];

    for (const photo of photos) {
      const formData = new FormData();
      formData.append('file', photo.file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', `fast-shipper/packages/incoming`);

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
          type: photo.type,
        });
      }
    }

    return uploadedPhotos;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!userInfo) {
        setError('Please search and verify the suite number first');
        setLoading(false);
        return;
      }

      if (!formData.trackingNumber || !formData.retailer) {
        setError('Tracking number and retailer are required');
        setLoading(false);
        return;
      }

      // Upload photos first if any
      let uploadedPhotos: Array<{ url: string; type: string }> = [];
      if (photos.length > 0) {
        console.log(`📸 Uploading ${photos.length} photos...`);
        setUploadingPhotos(true);
        uploadedPhotos = await uploadPhotosToCloudinary();
        console.log(`✅ ${uploadedPhotos.length} photos uploaded`);
        setUploadingPhotos(false);
      }

      // Prepare package data with optional fields
      const packageData: any = {
        trackingNumber: formData.trackingNumber.trim(),
        retailer: formData.retailer.trim(),
        suiteNumber: formData.suiteNumber.trim(),
        notes: formData.notes.trim(),
      };

      // Add description if provided
      if (formData.description.trim()) {
        packageData.description = formData.description.trim();
      }

      // Add weight if provided
      if (formData.weight) {
        packageData.weight = {
          value: parseFloat(formData.weight),
          unit: formData.weightUnit,
        };
      }

      // Add dimensions if all provided
      if (formData.length && formData.width && formData.height) {
        packageData.dimensions = {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          unit: formData.dimensionsUnit,
        };
      }

      // Add estimated value if provided
      if (formData.estimatedValue) {
        packageData.estimatedValue = {
          amount: parseFloat(formData.estimatedValue),
          currency: formData.currency,
        };
      }

      // Add photos if any
      if (uploadedPhotos.length > 0) {
        packageData.photos = uploadedPhotos;
      }

      console.log('📦 Registering package:', packageData);

      // Register package (will trigger email notification on backend)
      const response = await apiHelpers.post('/admin/packages', packageData);

      console.log('✅ Package registered:', response);

      setSuccess(true);

      // Cleanup photo previews
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin/packages');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message || 'Failed to register package');
      setUploadingPhotos(false);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className='text-center'
          >
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <CheckCircle className='w-12 h-12 text-green-600' />
            </div>
            <h2 className='text-2xl font-bold text-slate-900 mb-2'>
              Package Registered Successfully!
            </h2>
            <p className='text-slate-600'>
              Email notification sent to user. Redirecting...
            </p>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <button
            onClick={() => navigate('/admin/packages')}
            className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
          >
            <ArrowLeft className='w-6 h-6 text-slate-700' />
          </button>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>
              Register New Package
            </h1>
            <p className='text-slate-600'>
              Register an incoming package to client's locker
            </p>
          </div>
        </div>

        {/* Error Message */}
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
          </motion.div>
        )}

        {/* Upload Progress */}
        {uploadingPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-blue-50 border-2 border-blue-200 rounded-xl p-4'
          >
            <div className='flex items-center gap-3'>
              <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
              <p className='text-blue-900 font-semibold'>
                Uploading {photos.length} photo(s) to cloud storage...
              </p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Client Information */}
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
              <User className='w-5 h-5' />
              Client Information
            </h2>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Suite Number *
                </label>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    name='suiteNumber'
                    value={formData.suiteNumber}
                    onChange={handleChange}
                    placeholder='MA-XXXX'
                    className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    required
                  />
                  <button
                    type='button'
                    onClick={searchUser}
                    disabled={searchingUser || !formData.suiteNumber}
                    className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
                  >
                    {searchingUser ? (
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <Search className='w-5 h-5' />
                    )}
                    Search
                  </button>
                </div>
              </div>

              {userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='bg-green-50 border-2 border-green-200 rounded-xl p-4'
                >
                  <div className='flex items-start gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-semibold text-green-900'>
                        Client Found
                      </p>
                      <p className='text-sm text-green-700'>
                        {userInfo.name} ({userInfo.email})
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Package Details */}
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
              <Package className='w-5 h-5' />
              Package Details
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Tracking Number *
                </label>
                <input
                  type='text'
                  name='trackingNumber'
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  placeholder='1Z999AA10123456784'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Retailer *
                </label>
                <input
                  type='text'
                  name='retailer'
                  value={formData.retailer}
                  onChange={handleChange}
                  placeholder='Amazon, eBay, etc.'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  required
                />
              </div>

              <div className='md:col-span-2'>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Description <span className='text-slate-400'>(Optional)</span>
                </label>
                <input
                  type='text'
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  placeholder='Brief description of contents'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                />
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-2 flex items-center gap-2'>
              <ImageIcon className='w-5 h-5' />
              Package Photos{' '}
              <span className='text-sm font-normal text-slate-500'>
                (Optional)
              </span>
            </h2>
            <p className='text-sm text-slate-600 mb-4'>
              Upload photos of the package for the client
            </p>

            {/* Photo Upload Button */}
            <div className='mb-4'>
              <label className='cursor-pointer'>
                <div className='flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors'>
                  <Upload className='w-6 h-6 text-slate-600' />
                  <span className='font-semibold text-slate-700'>
                    Click to select photos
                  </span>
                </div>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handlePhotoSelect}
                  className='hidden'
                />
              </label>
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className='relative group border-2 border-slate-200 rounded-xl overflow-hidden'
                  >
                    <img
                      src={photo.preview}
                      alt={`Preview ${index + 1}`}
                      className='w-full h-40 object-cover'
                    />

                    {/* Remove Button */}
                    <button
                      type='button'
                      onClick={() => removePhoto(index)}
                      className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <X className='w-4 h-4' />
                    </button>

                    {/* Photo Type Selector */}
                    <div className='absolute bottom-2 left-2 right-2'>
                      <select
                        value={photo.type}
                        onChange={(e) =>
                          updatePhotoType(
                            index,
                            e.target.value as
                              | 'basic'
                              | 'unpacked'
                              | 'detailed'
                              | 'damage'
                          )
                        }
                        className='w-full px-2 py-1 text-xs bg-white bg-opacity-90 border border-slate-300 rounded focus:outline-none focus:border-blue-500'
                      >
                        <option value='basic'>Basic</option>
                        <option value='unpacked'>Unpacked</option>
                        <option value='detailed'>Detailed</option>
                        <option value='damage'>Damage</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Measurements (Optional) */}
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-2'>
              Measurements{' '}
              <span className='text-sm font-normal text-slate-500'>
                (Optional - Can be added later)
              </span>
            </h2>
            <p className='text-sm text-slate-600 mb-4'>
              Leave empty if measurements are not available yet
            </p>

            <div className='space-y-4'>
              {/* Weight */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Weight
                </label>
                <div className='flex gap-2'>
                  <input
                    type='number'
                    name='weight'
                    value={formData.weight}
                    onChange={handleChange}
                    step='0.01'
                    placeholder='5.5'
                    className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <select
                    name='weightUnit'
                    value={formData.weightUnit}
                    onChange={handleChange}
                    className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  >
                    <option value='kg'>kg</option>
                    <option value='lb'>lb</option>
                  </select>
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Dimensions (L × W × H)
                </label>
                <div className='flex gap-2'>
                  <input
                    type='number'
                    name='length'
                    value={formData.length}
                    onChange={handleChange}
                    step='0.1'
                    placeholder='30'
                    className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <span className='flex items-center text-slate-400'>×</span>
                  <input
                    type='number'
                    name='width'
                    value={formData.width}
                    onChange={handleChange}
                    step='0.1'
                    placeholder='20'
                    className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <span className='flex items-center text-slate-400'>×</span>
                  <input
                    type='number'
                    name='height'
                    value={formData.height}
                    onChange={handleChange}
                    step='0.1'
                    placeholder='15'
                    className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <select
                    name='dimensionsUnit'
                    value={formData.dimensionsUnit}
                    onChange={handleChange}
                    className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  >
                    <option value='cm'>cm</option>
                    <option value='in'>in</option>
                  </select>
                </div>
              </div>

              {/* Estimated Value */}
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Estimated Value
                </label>
                <div className='flex gap-2'>
                  <input
                    type='number'
                    name='estimatedValue'
                    value={formData.estimatedValue}
                    onChange={handleChange}
                    step='0.01'
                    placeholder='100.00'
                    className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <select
                    name='currency'
                    value={formData.currency}
                    onChange={handleChange}
                    className='px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  >
                    <option value='USD'>USD</option>
                    <option value='MAD'>MAD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Additional Notes
            </h2>
            <textarea
              name='notes'
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder='Any special instructions or notes about this package...'
              className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
            />
          </div>

          {/* Submit Button */}
          <div className='flex gap-4'>
            <button
              type='button'
              onClick={() => navigate('/admin/packages')}
              className='flex-1 px-6 py-4 border-2 border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading || uploadingPhotos || !userInfo}
              className='flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2'
            >
              {loading || uploadingPhotos ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  {uploadingPhotos ? 'Uploading Photos...' : 'Registering...'}
                </>
              ) : (
                <>
                  <Package className='w-5 h-5' />
                  Register Package & Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
