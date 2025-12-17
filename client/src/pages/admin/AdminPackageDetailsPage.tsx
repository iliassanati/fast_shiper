// client/src/pages/admin/AdminPackageDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  User,
  Weight,
  Ruler,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface PackageDetails {
  _id: string;
  trackingNumber: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    suiteNumber: string;
    phone: string;
  };
  retailer: string;
  description: string;
  status: string;
  receivedDate: string;
  weight: {
    value: number;
    unit: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  storageDay: number;
  estimatedValue: {
    amount: number;
    currency: string;
  };
  photos: Array<{
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPackageDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    length: '',
    width: '',
    height: '',
    estimatedValue: '',
    status: '',
    notes: '',
  });

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiHelpers.get(`/admin/packages/${id}`);
      setPackageDetails(response.package);

      // Initialize form data
      if (response.package) {
        setFormData({
          weight: response.package.weight.value.toString(),
          length: response.package.dimensions.length.toString(),
          width: response.package.dimensions.width.toString(),
          height: response.package.dimensions.height.toString(),
          estimatedValue: response.package.estimatedValue.amount.toString(),
          status: response.package.status,
          notes: response.package.notes || '',
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!packageDetails) return;

    try {
      setSaving(true);
      setError('');

      const updateData = {
        weight: {
          value: parseFloat(formData.weight),
          unit: packageDetails.weight.unit,
        },
        dimensions: {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          unit: packageDetails.dimensions.unit,
        },
        estimatedValue: {
          amount: parseFloat(formData.estimatedValue),
          currency: packageDetails.estimatedValue.currency,
        },
        status: formData.status,
        notes: formData.notes,
      };

      await apiHelpers.put(`/admin/packages/${id}`, updateData);
      await fetchPackageDetails();
      setEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to update package');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-700 border-blue-300',
      consolidated: 'bg-purple-100 text-purple-700 border-purple-300',
      shipped: 'bg-green-100 text-green-700 border-green-300',
      in_transit: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      delivered: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStorageDayColor = (days: number) => {
    if (days >= 40) return 'text-red-600 bg-red-50 border-red-300';
    if (days >= 30) return 'text-orange-600 bg-orange-50 border-orange-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>
              Loading package details...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !packageDetails) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-slate-900 mb-2'>
              Error Loading Package
            </h2>
            <p className='text-slate-600 mb-4'>{error}</p>
            <button
              onClick={() => navigate('/admin/packages')}
              className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
            >
              Back to Packages
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!packageDetails) return null;

  return (
    <AdminLayout>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/admin/packages')}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-6 h-6 text-slate-700' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Package Details
              </h1>
              <p className='text-slate-600'>
                Tracking: {packageDetails.trackingNumber}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors'
              >
                <Edit className='w-5 h-5' />
                Edit Package
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchPackageDetails();
                  }}
                  className='flex items-center gap-2 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                >
                  <X className='w-5 h-5' />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className='flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors'
                >
                  {saving ? (
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  ) : (
                    <Save className='w-5 h-5' />
                  )}
                  Save Changes
                </button>
              </>
            )}
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

        {/* Status and Storage Warning */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div
            className={`rounded-2xl p-6 border-2 ${getStatusColor(
              packageDetails.status
            )}`}
          >
            <div className='flex items-center gap-3'>
              <Package className='w-8 h-8' />
              <div>
                <p className='text-sm font-semibold opacity-80'>
                  Package Status
                </p>
                <p className='text-2xl font-bold'>
                  {packageDetails.status.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl p-6 border-2 ${getStorageDayColor(
              packageDetails.storageDay
            )}`}
          >
            <div className='flex items-center gap-3'>
              <Calendar className='w-8 h-8' />
              <div>
                <p className='text-sm font-semibold opacity-80'>Storage Days</p>
                <p className='text-2xl font-bold'>
                  Day {packageDetails.storageDay} of 45
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
            <User className='w-5 h-5' />
            Client Information
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Name</p>
              <p className='font-semibold text-slate-900'>
                {packageDetails.userId.name}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Suite Number</p>
              <p className='font-mono font-bold text-blue-600'>
                {packageDetails.userId.suiteNumber}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Email</p>
              <p className='font-semibold text-slate-900'>
                {packageDetails.userId.email}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Phone</p>
              <p className='font-semibold text-slate-900'>
                {packageDetails.userId.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Package Information */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Package Information
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Tracking Number</p>
              <p className='font-mono font-semibold text-slate-900'>
                {packageDetails.trackingNumber}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Retailer</p>
              <p className='font-semibold text-slate-900'>
                {packageDetails.retailer}
              </p>
            </div>
            <div className='md:col-span-2'>
              <p className='text-sm text-slate-600 mb-1'>Description</p>
              <p className='font-semibold text-slate-900'>
                {packageDetails.description}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Received Date</p>
              <p className='font-semibold text-slate-900'>
                {new Date(packageDetails.receivedDate).toLocaleString()}
              </p>
            </div>
            <div>
              <p className='text-sm text-slate-600 mb-1'>Last Updated</p>
              <p className='font-semibold text-slate-900'>
                {new Date(packageDetails.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
            <Ruler className='w-5 h-5' />
            Measurements{' '}
            {editing && (
              <span className='text-sm text-blue-600'>(Editing)</span>
            )}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Weight */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Weight className='w-4 h-4 inline mr-1' />
                Weight
              </label>
              {editing ? (
                <div className='flex gap-2'>
                  <input
                    type='number'
                    name='weight'
                    value={formData.weight}
                    onChange={handleChange}
                    step='0.01'
                    className='flex-1 px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <div className='px-4 py-3 bg-slate-100 rounded-xl font-semibold text-slate-700'>
                    {packageDetails.weight.unit}
                  </div>
                </div>
              ) : (
                <p className='text-2xl font-bold text-slate-900'>
                  {packageDetails.weight.value} {packageDetails.weight.unit}
                </p>
              )}
            </div>

            {/* Dimensions */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <Ruler className='w-4 h-4 inline mr-1' />
                Dimensions (L × W × H)
              </label>
              {editing ? (
                <div className='flex gap-2'>
                  <input
                    type='number'
                    name='length'
                    value={formData.length}
                    onChange={handleChange}
                    step='0.1'
                    placeholder='L'
                    className='flex-1 px-3 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <span className='flex items-center text-slate-400'>×</span>
                  <input
                    type='number'
                    name='width'
                    value={formData.width}
                    onChange={handleChange}
                    step='0.1'
                    placeholder='W'
                    className='flex-1 px-3 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <span className='flex items-center text-slate-400'>×</span>
                  <input
                    type='number'
                    name='height'
                    value={formData.height}
                    onChange={handleChange}
                    step='0.1'
                    placeholder='H'
                    className='flex-1 px-3 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <div className='px-4 py-3 bg-slate-100 rounded-xl font-semibold text-slate-700'>
                    {packageDetails.dimensions.unit}
                  </div>
                </div>
              ) : (
                <p className='text-2xl font-bold text-slate-900'>
                  {packageDetails.dimensions.length} ×{' '}
                  {packageDetails.dimensions.width} ×{' '}
                  {packageDetails.dimensions.height}{' '}
                  {packageDetails.dimensions.unit}
                </p>
              )}
            </div>

            {/* Estimated Value */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                <DollarSign className='w-4 h-4 inline mr-1' />
                Estimated Value
              </label>
              {editing ? (
                <div className='flex gap-2'>
                  <input
                    type='number'
                    name='estimatedValue'
                    value={formData.estimatedValue}
                    onChange={handleChange}
                    step='0.01'
                    className='flex-1 px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  />
                  <div className='px-4 py-3 bg-slate-100 rounded-xl font-semibold text-slate-700'>
                    {packageDetails.estimatedValue.currency}
                  </div>
                </div>
              ) : (
                <p className='text-2xl font-bold text-green-600'>
                  {packageDetails.estimatedValue.amount.toLocaleString()}{' '}
                  {packageDetails.estimatedValue.currency}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Status
              </label>
              {editing ? (
                <select
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                  className='w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                >
                  <option value='received'>Received</option>
                  <option value='consolidated'>Consolidated</option>
                  <option value='shipped'>Shipped</option>
                  <option value='in_transit'>In Transit</option>
                  <option value='delivered'>Delivered</option>
                </select>
              ) : (
                <p className='text-xl font-bold text-slate-900'>
                  {packageDetails.status.replace('_', ' ').toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          <h2 className='text-xl font-bold text-slate-900 mb-4'>
            Notes{' '}
            {editing && (
              <span className='text-sm text-blue-600'>(Editing)</span>
            )}
          </h2>
          {editing ? (
            <textarea
              name='notes'
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className='w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none'
              placeholder='Add any notes about this package...'
            />
          ) : (
            <p className='text-slate-700 whitespace-pre-wrap'>
              {packageDetails.notes || 'No notes added'}
            </p>
          )}
        </div>

        {/* Photos */}
        {packageDetails.photos.length > 0 && (
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>Photos</h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {packageDetails.photos.map((photo, index) => (
                <div key={index} className='relative group'>
                  <img
                    src={photo.url}
                    alt={`Package photo ${index + 1}`}
                    className='w-full h-48 object-cover rounded-xl border-2 border-slate-200 group-hover:border-blue-500 transition-colors'
                  />
                  <div className='absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-60 rounded text-xs text-white font-semibold'>
                    {photo.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
