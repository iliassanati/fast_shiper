import DashboardLayout from '@/layouts/DashboardLayout';
import { useNotificationStore, usePackageStore } from '@/stores';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Box,
  Calendar,
  Camera,
  Check,
  Clock,
  Copy,
  Info,
  Package as PackageIcon,
  Ruler,
  ShoppingBag,
  Truck,
  Weight
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

  // Mock timeline
  const timeline = [
    {
      status: 'completed',
      title: 'Package Received',
      description: 'Your package arrived at our US warehouse',
      date: packageData.receivedDate,
      time: '10:30 AM',
    },
    {
      status: 'completed',
      title: 'Inspected & Photographed',
      description: 'Package inspected and photos taken',
      date: packageData.receivedDate,
      time: '11:15 AM',
    },
    {
      status: packageData.status === 'received' ? 'current' : 'completed',
      title: 'In Storage',
      description: `Stored safely in locker (Day ${packageData.storageDay}/45)`,
      date: packageData.receivedDate,
      time: '11:30 AM',
    },
  ];

  if (packageData.status !== 'received') {
    timeline.push({
      status: 'completed',
      title: 'Consolidated/Shipped',
      description: 'Package consolidated or shipped',
      date: new Date().toISOString().split('T')[0],
      time: '2:00 PM',
    });
  }

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header */}
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
                      ${packageData.estimatedValue}
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'completed'
                            ? 'bg-green-500'
                            : item.status === 'current'
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                        }`}
                      >
                        {item.status === 'completed' ? (
                          <Check className='w-5 h-5 text-white' />
                        ) : (
                          <div className='w-3 h-3 bg-white rounded-full' />
                        )}
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

            {/* Package Photos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-bold text-slate-900'>Package Photos</h3>
                <button
                  onClick={() => navigate('/request-info')}
                  className='text-sm text-blue-600 hover:text-blue-700 font-semibold'
                >
                  Request More Photos →
                </button>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className='aspect-square bg-slate-100 rounded-xl flex items-center justify-center border-2 border-slate-200 hover:border-blue-400 transition-colors cursor-pointer'
                  >
                    <Camera className='w-8 h-8 text-slate-400' />
                  </div>
                ))}
              </div>

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
                  onClick={() => navigate('/shipping')}
                  className='w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Truck className='w-5 h-5' />
                  Ship Now
                </motion.button>

                <motion.button
                  onClick={() => navigate('/consolidation')}
                  className='w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box className='w-5 h-5' />
                  Consolidate
                </motion.button>

                <motion.button
                  onClick={() => navigate('/request-info')}
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
