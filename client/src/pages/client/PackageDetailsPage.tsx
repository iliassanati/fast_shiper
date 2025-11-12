// src/pages/client/PackageDetailsPage.tsx (ENHANCED VERSION)
import DashboardLayout from '@/layouts/DashboardLayout';
import { useNotificationStore, usePackageStore } from '@/stores';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit,
  Flag,
  Info,
  MoreVertical,
  Package as PackageIcon,
  Ruler,
  ShoppingBag,
  Trash2,
  Truck,
  Weight,
  X,
  ZoomIn,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Mock package photos data
const mockPhotos = [
  {
    id: 1,
    url: 'https://placehold.co/600x400/blue/white?text=Package+Front',
    alt: 'Front view',
  },
  {
    id: 2,
    url: 'https://placehold.co/600x400/green/white?text=Package+Side',
    alt: 'Side view',
  },
  {
    id: 3,
    url: 'https://placehold.co/600x400/orange/white?text=Package+Label',
    alt: 'Label closeup',
  },
  {
    id: 4,
    url: 'https://placehold.co/600x400/purple/white?text=Package+Top',
    alt: 'Top view',
  },
];

// Photo Gallery Component with Lightbox
function PhotoGallery({ photos }: { photos: typeof mockPhotos }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayPhotos = showAll ? photos : photos.slice(0, 3);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const nextPhoto = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1
      );
    }
  };

  return (
    <div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {displayPhotos.map((photo, index) => (
          <motion.div
            key={photo.id}
            whileHover={{ scale: 1.05 }}
            className='relative aspect-square bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-colors cursor-pointer group'
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo.url}
              alt={photo.alt}
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center'>
              <ZoomIn className='w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
            </div>
          </motion.div>
        ))}

        {!showAll && photos.length > 3 && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowAll(true)}
            className='aspect-square bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-300 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center justify-center'
          >
            <Camera className='w-8 h-8 text-blue-600 mb-2' />
            <p className='text-sm font-semibold text-blue-600'>
              +{photos.length - 3} more
            </p>
          </motion.div>
        )}
      </div>

      {showAll && photos.length > 3 && (
        <button
          onClick={() => setShowAll(false)}
          className='mt-4 text-sm text-blue-600 hover:text-blue-700 font-semibold'
        >
          Show less
        </button>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4'
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className='absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors'
            >
              <X className='w-6 h-6 text-white' />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className='absolute left-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors'
            >
              <ChevronLeft className='w-8 h-8 text-white' />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className='absolute right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors'
            >
              <ChevronRight className='w-8 h-8 text-white' />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className='max-w-4xl w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedIndex].url}
                alt={photos[selectedIndex].alt}
                className='w-full h-auto rounded-lg'
              />
              <div className='mt-4 text-center text-white'>
                <p className='text-lg font-semibold'>
                  {photos[selectedIndex].alt}
                </p>
                <p className='text-sm text-slate-300'>
                  Photo {selectedIndex + 1} of {photos.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Package Actions Menu Component
function PackageActionsMenu({ packageId }: { packageId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const actions = [
    {
      icon: Edit,
      label: 'Edit Details',
      onClick: () => {
        addNotification('Edit feature coming soon!', 'info');
        setIsOpen(false);
      },
      color: 'text-blue-600',
    },
    {
      icon: Download,
      label: 'Download Receipt',
      onClick: () => {
        addNotification('Downloading receipt...', 'success');
        setIsOpen(false);
      },
      color: 'text-green-600',
    },
    {
      icon: Flag,
      label: 'Report Issue',
      onClick: () => {
        addNotification('Opening support form...', 'info');
        setIsOpen(false);
      },
      color: 'text-orange-600',
    },
    {
      icon: Trash2,
      label: 'Request Disposal',
      onClick: () => {
        if (
          confirm('Are you sure you want to request disposal of this package?')
        ) {
          addNotification('Disposal request submitted', 'success');
          setIsOpen(false);
        }
      },
      color: 'text-red-600',
    },
  ];

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
      >
        <MoreVertical className='w-5 h-5' />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className='fixed inset-0 z-10'
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className='absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-20'
            >
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className='w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left'
                >
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className='font-medium text-slate-700'>
                    {action.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PackageDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPackageById } = usePackageStore();
  const { addNotification } = useNotificationStore();
  const [copiedTracking, setCopiedTracking] = useState(false);

  const packageData = getPackageById(id || '');

  if (!packageData) {
    return (
      <DashboardLayout>
        <div className='text-center py-20'>
          <PackageIcon className='w-16 h-16 text-slate-400 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            Package Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            The package you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/packages')}
            className='px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700'
          >
            Back to Packages
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(packageData.trackingNumber);
    setCopiedTracking(true);
    addNotification('Tracking number copied!', 'success');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Enhanced timeline with more details
  const timeline = [
    {
      status: 'completed',
      title: 'Package Received',
      description: 'Your package arrived at our US warehouse',
      date: packageData.receivedDate,
      time: '10:30 AM',
      icon: PackageIcon,
    },
    {
      status: 'completed',
      title: 'Inspected & Photographed',
      description: 'Package inspected and photos taken',
      date: packageData.receivedDate,
      time: '11:15 AM',
      icon: Camera,
    },
    {
      status: packageData.status === 'received' ? 'current' : 'completed',
      title: 'In Storage',
      description: `Stored safely in locker (Day ${packageData.storageDay}/45)`,
      date: packageData.receivedDate,
      time: '11:30 AM',
      icon: Box,
    },
  ];

  if (packageData.status !== 'received') {
    timeline.push({
      status: 'completed',
      title: 'Consolidated/Shipped',
      description: 'Package processed for shipping',
      date: new Date().toISOString().split('T')[0],
      time: '2:00 PM',
      icon: Truck,
    });
  }

  // Quick action handlers
  const handleShipNow = () => {
    navigate('/shipping');
  };

  const handleConsolidate = () => {
    navigate('/consolidation');
  };

  const handleRequestPhotos = () => {
    navigate('/request-info');
  };

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header with Actions Menu */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/packages')}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Package Details
              </h1>
              <p className='text-slate-600'>ID: {packageData.id}</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {/* Status Badge */}
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                packageData.status === 'received'
                  ? 'bg-green-100 text-green-700'
                  : packageData.status === 'consolidated'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {packageData.status === 'received'
                ? 'In Storage'
                : packageData.status === 'consolidated'
                ? 'Consolidated'
                : 'Shipped'}
            </span>

            {/* Actions Menu */}
            <PackageActionsMenu packageId={packageData.id} />
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Package Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-start gap-6 mb-6'>
                <div className='text-6xl'>{packageData.photo}</div>
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                    {packageData.description}
                  </h2>
                  <div className='flex items-center gap-2 text-slate-600 mb-4'>
                    <ShoppingBag className='w-4 h-4' />
                    <span>From {packageData.retailer}</span>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold'>
                      {packageData.weight} kg
                    </span>
                    <span className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold'>
                      {packageData.dimensions} cm
                    </span>
                    <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold'>
                      {packageData.estimatedValue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Package Info Grid */}
              <div className='grid md:grid-cols-3 gap-4'>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <Weight className='w-4 h-4' />
                    <span className='text-sm'>Weight</span>
                  </div>
                  <p className='font-bold text-slate-900'>
                    {packageData.weight} kg
                  </p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <Ruler className='w-4 h-4' />
                    <span className='text-sm'>Dimensions</span>
                  </div>
                  <p className='font-bold text-slate-900'>
                    {packageData.dimensions} cm
                  </p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <Calendar className='w-4 h-4' />
                    <span className='text-sm'>Received</span>
                  </div>
                  <p className='font-bold text-slate-900'>
                    {packageData.receivedDate}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tracking Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-4'>
                Tracking Information
              </h3>
              <div className='p-4 bg-blue-50 rounded-xl'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-blue-700 mb-1'>
                      {packageData.retailer} Tracking
                    </p>
                    <p className='font-mono font-bold text-blue-900 text-lg'>
                      {packageData.trackingNumber}
                    </p>
                  </div>
                  <motion.button
                    onClick={copyTrackingNumber}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copiedTracking ? (
                      <Check className='w-4 h-4' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                    {copiedTracking ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-6'>
                Package Timeline
              </h3>

              <div className='relative'>
                {timeline.map((item, index) => (
                  <div key={index} className='flex gap-4 pb-8 last:pb-0'>
                    <div className='flex flex-col items-center'>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          item.status === 'completed'
                            ? 'bg-green-500'
                            : item.status === 'current'
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                        }`}
                      >
                        <item.icon className='w-6 h-6 text-white' />
                      </div>
                      {index < timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-full my-2 ${
                            item.status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}
                        />
                      )}
                    </div>

                    <div className='flex-1 pb-4'>
                      <h4 className='font-bold text-slate-900 mb-1'>
                        {item.title}
                      </h4>
                      <p className='text-sm text-slate-600 mb-2'>
                        {item.description}
                      </p>
                      <p className='text-xs text-slate-500'>
                        {item.date} • {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Package Photos with Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-bold text-slate-900'>Package Photos</h3>
                <button
                  onClick={handleRequestPhotos}
                  className='text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1'
                >
                  <Camera className='w-4 h-4' />
                  Request More Photos →
                </button>
              </div>

              <PhotoGallery photos={mockPhotos} />

              <p className='text-xs text-slate-500 mt-3'>
                💡 Click on any photo to view full size
              </p>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Storage Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200'
            >
              <div className='flex items-center gap-3 mb-4'>
                <Clock className='w-6 h-6 text-green-600' />
                <h3 className='font-bold text-slate-900'>Storage Status</h3>
              </div>
              <div className='mb-4'>
                <div className='flex justify-between text-sm mb-2'>
                  <span className='text-slate-600'>Days Used</span>
                  <span className='font-bold text-slate-900'>
                    {packageData.storageDay} / 45
                  </span>
                </div>
                <div className='h-2 bg-white rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-green-500 transition-all'
                    style={{
                      width: `${(packageData.storageDay / 45) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <p className='text-sm text-green-800'>
                {45 - packageData.storageDay} days of free storage remaining
              </p>

              {packageData.storageDay >= 40 && (
                <div className='mt-4 p-3 bg-yellow-100 rounded-lg flex items-start gap-2'>
                  <AlertCircle className='w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5' />
                  <p className='text-xs text-yellow-800'>
                    Storage expiring soon! Ship or consolidate to avoid fees.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-4'>Quick Actions</h3>
              <div className='space-y-3'>
                <motion.button
                  onClick={handleShipNow}
                  className='w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Truck className='w-5 h-5' />
                  Ship Now
                </motion.button>

                <motion.button
                  onClick={handleConsolidate}
                  className='w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box className='w-5 h-5' />
                  Consolidate
                </motion.button>

                <motion.button
                  onClick={handleRequestPhotos}
                  className='w-full px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Camera className='w-5 h-5' />
                  Request Photos
                </motion.button>
              </div>
            </motion.div>

            {/* Package Value */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-4'>Estimated Value</h3>
              <div className='text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl'>
                <p className='text-3xl font-bold text-blue-600 mb-1'>
                  {packageData.estimatedValue}
                </p>
                <p className='text-sm text-slate-600'>Declared Value</p>
              </div>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-blue-50 rounded-2xl p-6 border border-blue-200'
            >
              <div className='flex items-start gap-3'>
                <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                <div>
                  <h4 className='font-bold text-blue-900 mb-2'>Need Help?</h4>
                  <p className='text-sm text-blue-800 mb-3'>
                    Have questions about this package? Our team is here to help!
                  </p>
                  <button className='text-sm font-semibold text-blue-600 hover:text-blue-700'>
                    Contact Support →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
