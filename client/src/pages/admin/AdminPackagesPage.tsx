// client/src/pages/admin/AdminPackagesPage.tsx - WITH CLOUDINARY & REFRESH
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { api } from '@/lib/api';
import { useAdminDashboardStore } from '@/stores/useAdminDashboardStore';

interface PackagePhoto {
  url: string;
  type: 'basic' | 'unpacked' | 'detailed' | 'damage';
}

interface PackageData {
  id: string;
  trackingNumber: string;
  retailer: string;
  description: string;
  status: string;
  receivedDate: string;
  weight: { value: number; unit: string };
  dimensions: { length: number; width: number; height: number; unit: string };
  photos: PackagePhoto[];
  userId: {
    name: string;
    email: string;
    suiteNumber: string;
  };
  consolidationId?: string;
}

export default function AdminPackagesPage() {
  const { forceRefresh } = useAdminDashboardStore();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(
    null
  );
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Cloudinary config - ADD YOUR CREDENTIALS HERE
  const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djwape6g1';
  const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fast-shipper-preset';

  useEffect(() => {
    fetchPackages();
  }, [statusFilter]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get('/admin/packages', { params });
      setPackages(response.data.data.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (packageId: string, newStatus: string) => {
    try {
      await api.put(`/admin/packages/${packageId}`, { status: newStatus });

      // ✅ Refresh packages list
      await fetchPackages();

      // ✅ Force refresh dashboard statistics
      await forceRefresh();

      alert('Package status updated successfully!');
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !selectedPackage) return;

    setUploading(true);
    const uploadedPhotos: { url: string; type: string }[] = [];

    try {
      // Upload each file to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append(
          'folder',
          `fast-shipper/packages/${selectedPackage.trackingNumber}`
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
            type: 'basic', // Default type
          });
        }
      }

      // Save photos to backend
      await api.post(`/admin/packages/${selectedPackage.id}/photos`, {
        photos: uploadedPhotos,
      });

      alert(`${uploadedPhotos.length} photo(s) uploaded successfully!`);
      setShowPhotoUpload(false);
      setSelectedPackage(null);
      await fetchPackages();
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.retailer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.userId.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: 'all', label: 'All Packages', color: 'gray' },
    { value: 'received', label: 'Received', color: 'blue' },
    { value: 'consolidated', label: 'Consolidated', color: 'purple' },
    { value: 'shipped', label: 'Shipped', color: 'orange' },
    { value: 'in_transit', label: 'In Transit', color: 'yellow' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      consolidated: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && packages.length === 0) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>Loading packages...</p>
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
              Package Management
            </h1>
            <p className='text-slate-600'>
              Manage incoming packages and their status
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/admin/packages/register')}
            className='px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all'
          >
            + Register New Package
          </button>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-2xl p-6 shadow-lg'>
          <div className='grid md:grid-cols-2 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                type='text'
                placeholder='Search by tracking number, retailer, or user...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>

            {/* Status Filter */}
            <div className='relative'>
              <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none appearance-none bg-white'
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

        {/* Packages Table */}
        <div className='bg-white rounded-2xl shadow-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Tracking Number
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    User
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Retailer
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Weight
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Photos
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-slate-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {filteredPackages.map((pkg) => (
                  <motion.tr
                    key={pkg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className='hover:bg-slate-50 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Package className='w-5 h-5 text-blue-600' />
                        <span className='font-semibold text-slate-900'>
                          {pkg.trackingNumber}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-slate-900'>
                          {pkg.userId.name}
                        </p>
                        <p className='text-sm text-slate-500'>
                          {pkg.userId.suiteNumber}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-slate-700'>{pkg.retailer}</td>
                    <td className='px-6 py-4'>
                      <select
                        value={pkg.status}
                        onChange={(e) =>
                          handleStatusChange(pkg.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          pkg.status
                        )} border-2 border-transparent focus:border-blue-500 focus:outline-none cursor-pointer`}
                      >
                        <option value='received'>Received</option>
                        <option value='consolidated'>Consolidated</option>
                        <option value='shipped'>Shipped</option>
                        <option value='in_transit'>In Transit</option>
                        <option value='delivered'>Delivered</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 text-slate-700'>
                      {pkg.weight.value} {pkg.weight.unit}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-slate-600'>
                          {pkg.photos.length} photo(s)
                        </span>
                        <button
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setShowPhotoUpload(true);
                          }}
                          className='p-2 hover:bg-blue-100 rounded-lg transition-colors'
                          title='Upload photos'
                        >
                          <Upload className='w-4 h-4 text-blue-600' />
                        </button>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/packages/${pkg.id}`)
                        }
                        className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
                      >
                        View Details →
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPackages.length === 0 && (
            <div className='text-center py-12'>
              <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-600 font-semibold'>No packages found</p>
              <p className='text-slate-500 text-sm'>
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>

        {/* Photo Upload Modal */}
        {showPhotoUpload && selectedPackage && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
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
                  Package: <strong>{selectedPackage.trackingNumber}</strong>
                </p>
                <p className='text-sm text-slate-500'>
                  Current photos: {selectedPackage.photos.length}
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
                  className='w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none'
                />
              </div>

              {uploading && (
                <div className='mb-4 text-center'>
                  <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
                  <p className='text-sm text-slate-600'>Uploading...</p>
                </div>
              )}

              <div className='flex gap-3'>
                <button
                  onClick={() => {
                    setShowPhotoUpload(false);
                    setSelectedPackage(null);
                  }}
                  disabled={uploading}
                  className='flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
