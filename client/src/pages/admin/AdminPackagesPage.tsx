// client/src/pages/admin/AdminPackagesPage.tsx - COMPREHENSIVE FIX
import AdminLayout from '@/layouts/AdminLayout';
import { api } from '@/lib/api';
import { useAdminDashboardStore } from '@/stores/useAdminDashboardStore';
import { motion } from 'framer-motion';
import {
  Box,
  Filter,
  Image as ImageIcon,
  Package,
  RefreshCw,
  Search,
  Upload
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  isConsolidatedResult?: boolean;
  originalPackageIds?: string[];
}

type ViewMode =
  | 'all'
  | 'active'
  | 'consolidated-source'
  | 'consolidated-result';

export default function AdminPackagesPage() {
  const { forceRefresh } = useAdminDashboardStore();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(
    null
  );
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConsolidatedSource, setShowConsolidatedSource] = useState(false);

  // Cloudinary config
  const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djwape6g1';
  const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'fast-shipper-preset';

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('📦 Fetching admin packages...');
      const response = await api.get('/admin/packages', { params });

      // Transform the data
      const packagesData = response.data.data.packages.map((pkg: any) => ({
        ...pkg,
        isConsolidatedResult: pkg.isConsolidatedResult || false,
        originalPackageIds: pkg.originalPackageIds || [],
      }));

      setPackages(packagesData);
      console.log(`✅ Loaded ${packagesData.length} packages`);
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Calculate stats
  const packageStats = useMemo(() => {
    return {
      total: packages.length,
      received: packages.filter((p) => p.status === 'received').length,
      consolidated: packages.filter((p) => p.status === 'consolidated').length,
      consolidatedResults: packages.filter((p) => p.isConsolidatedResult)
        .length,
      shipped: packages.filter((p) => p.status === 'shipped').length,
      inTransit: packages.filter((p) => p.status === 'in_transit').length,
      delivered: packages.filter((p) => p.status === 'delivered').length,
    };
  }, [packages]);

  // Filter packages based on view mode
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply view mode filter
    switch (viewMode) {
      case 'active':
        // Show only "active" packages (received, shipped, in_transit)
        // Hide source packages that were consolidated
        filtered = filtered.filter(
          (pkg) =>
            (pkg.status === 'received' ||
              pkg.status === 'shipped' ||
              pkg.status === 'in_transit' ||
              pkg.isConsolidatedResult) &&
            !(pkg.status === 'consolidated' && !pkg.isConsolidatedResult)
        );
        break;
      case 'consolidated-source':
        // Show only source packages that were consolidated
        filtered = filtered.filter(
          (pkg) => pkg.status === 'consolidated' && !pkg.isConsolidatedResult
        );
        break;
      case 'consolidated-result':
        // Show only consolidation result packages
        filtered = filtered.filter((pkg) => pkg.isConsolidatedResult);
        break;
      case 'all':
      default:
        // Show everything
        break;
    }

    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter((pkg) => pkg.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.trackingNumber.toLowerCase().includes(search) ||
          pkg.retailer.toLowerCase().includes(search) ||
          pkg.userId.name.toLowerCase().includes(search) ||
          pkg.userId.suiteNumber.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [packages, viewMode, statusFilter, searchTerm]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPackages();
    setRefreshing(false);
  };

  const handleStatusChange = async (packageId: string, newStatus: string) => {
    try {
      await api.put(`/admin/packages/${packageId}`, { status: newStatus });
      await fetchPackages();
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
            type: 'basic',
          });
        }
      }

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

  const statusOptions = [
    { value: 'all', label: 'All Statuses', color: 'gray' },
    { value: 'received', label: 'Received', color: 'blue' },
    { value: 'consolidated', label: 'Consolidated', color: 'purple' },
    { value: 'shipped', label: 'Shipped', color: 'orange' },
    { value: 'in_transit', label: 'In Transit', color: 'yellow' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
  ];

  const viewModeOptions: { value: ViewMode; label: string; count: number }[] = [
    {
      value: 'active',
      label: 'Active Packages',
      count:
        packageStats.received +
        packageStats.shipped +
        packageStats.inTransit +
        packageStats.consolidatedResults,
    },
    { value: 'all', label: 'All Packages', count: packageStats.total },
    {
      value: 'consolidated-source',
      label: 'Consolidated (Source)',
      count: packageStats.consolidated,
    },
    {
      value: 'consolidated-result',
      label: 'Consolidated (Result)',
      count: packageStats.consolidatedResults,
    },
  ];

  const getStatusColor = (status: string, isConsolidatedResult?: boolean) => {
    if (isConsolidatedResult) {
      return 'bg-purple-100 text-purple-800';
    }
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      consolidated: 'bg-gray-100 text-gray-800',
      shipped: 'bg-orange-100 text-orange-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (pkg: PackageData) => {
    if (pkg.isConsolidatedResult) {
      return 'Consolidated Package';
    }
    if (pkg.status === 'consolidated') {
      return 'Source (Merged)';
    }
    return (
      pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1).replace('_', ' ')
    );
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
          <div className='flex gap-3'>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className='px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </motion.button>
            <button
              onClick={() =>
                (window.location.href = '/admin/packages/register')
              }
              className='px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all'
            >
              + Register New Package
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
          <div className='bg-white rounded-xl p-4 shadow border border-slate-100'>
            <p className='text-xs text-slate-500'>Total</p>
            <p className='text-2xl font-bold text-slate-900'>
              {packageStats.total}
            </p>
          </div>
          <div className='bg-blue-50 rounded-xl p-4 shadow border border-blue-100'>
            <p className='text-xs text-blue-600'>Received</p>
            <p className='text-2xl font-bold text-blue-900'>
              {packageStats.received}
            </p>
          </div>
          <div className='bg-gray-50 rounded-xl p-4 shadow border border-gray-200'>
            <p className='text-xs text-gray-600'>Consolidated (Source)</p>
            <p className='text-2xl font-bold text-gray-900'>
              {packageStats.consolidated}
            </p>
          </div>
          <div className='bg-purple-50 rounded-xl p-4 shadow border border-purple-100'>
            <p className='text-xs text-purple-600'>Consolidated (Result)</p>
            <p className='text-2xl font-bold text-purple-900'>
              {packageStats.consolidatedResults}
            </p>
          </div>
          <div className='bg-orange-50 rounded-xl p-4 shadow border border-orange-100'>
            <p className='text-xs text-orange-600'>Shipped</p>
            <p className='text-2xl font-bold text-orange-900'>
              {packageStats.shipped}
            </p>
          </div>
          <div className='bg-green-50 rounded-xl p-4 shadow border border-green-100'>
            <p className='text-xs text-green-600'>Delivered</p>
            <p className='text-2xl font-bold text-green-900'>
              {packageStats.delivered}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className='flex gap-2 flex-wrap'>
          {viewModeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setViewMode(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === option.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {option.label}
              <span
                className={`ml-2 ${
                  viewMode === option.value ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                ({option.count})
              </span>
            </button>
          ))}
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

        {/* Info Banner for View Mode */}
        {viewMode === 'consolidated-source' && (
          <div className='bg-gray-50 border border-gray-200 rounded-xl p-4'>
            <div className='flex items-start gap-3'>
              <Box className='w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold text-gray-900'>
                  Viewing Consolidated Source Packages
                </p>
                <p className='text-sm text-gray-700'>
                  These packages have been merged into consolidated packages and
                  are no longer active. They are kept for record-keeping
                  purposes.
                </p>
              </div>
            </div>
          </div>
        )}

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
                    className={`hover:bg-slate-50 transition-colors ${
                      pkg.status === 'consolidated' && !pkg.isConsolidatedResult
                        ? 'bg-gray-50 opacity-75'
                        : ''
                    }`}
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Package className='w-5 h-5 text-blue-600' />
                        <div>
                          <span className='font-semibold text-slate-900'>
                            {pkg.trackingNumber}
                          </span>
                          {pkg.isConsolidatedResult && (
                            <span className='ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full'>
                              Result
                            </span>
                          )}
                          {pkg.status === 'consolidated' &&
                            !pkg.isConsolidatedResult && (
                              <span className='ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full'>
                                Merged
                              </span>
                            )}
                        </div>
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
                      {pkg.status === 'consolidated' &&
                      !pkg.isConsolidatedResult ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            pkg.status,
                            pkg.isConsolidatedResult
                          )}`}
                        >
                          {getStatusLabel(pkg)}
                        </span>
                      ) : (
                        <select
                          value={pkg.status}
                          onChange={(e) =>
                            handleStatusChange(pkg.id, e.target.value)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            pkg.status,
                            pkg.isConsolidatedResult
                          )} border-2 border-transparent focus:border-blue-500 focus:outline-none cursor-pointer`}
                        >
                          <option value='received'>Received</option>
                          <option value='consolidated'>Consolidated</option>
                          <option value='shipped'>Shipped</option>
                          <option value='in_transit'>In Transit</option>
                          <option value='delivered'>Delivered</option>
                        </select>
                      )}
                    </td>
                    <td className='px-6 py-4 text-slate-700'>
                      {pkg.weight.value} {pkg.weight.unit}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-slate-600'>
                          {pkg.photos.length} photo(s)
                        </span>
                        {pkg.status !== 'consolidated' && (
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
                        )}
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
