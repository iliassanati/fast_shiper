// src/sections/dashboard/OverviewSection.tsx - UPDATED WITH 30 DAYS STORAGE
import PackageCard from '@/components/dashboard/PackageCard';
import { STORAGE } from '@/data/client/constants';
import {
  useAuthStore,
  useNotificationStore,
  usePackageStore,
  useShipmentStore,
} from '@/stores';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OverviewSection() {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user, usAddress } = useAuthStore();

  const { packages, fetchPackages } = usePackageStore();
  const { shipments } = useShipmentStore();
  const { addNotification } = useNotificationStore();

  // Calculate stats directly from packages for accuracy
  const calculatedStats = useMemo(() => {
    const inStorage = packages.filter((p) => p.status === 'received').length;
    const shipped = packages.filter(
      (p) =>
        p.status === 'shipped' ||
        p.status === 'in_transit' ||
        p.status === 'delivered'
    ).length;
    const consolidated = packages.filter((p) => p.isConsolidatedResult).length;

    // Calculate minimum storage days left for packages in storage (using 30 days)
    const packagesInStorage = packages.filter((p) => p.status === 'received');
    const storageDaysLeft =
      packagesInStorage.length > 0
        ? Math.min(
            ...packagesInStorage.map(
              (p) => STORAGE.FREE_DAYS - (p.storageDay || 0)
            )
          )
        : STORAGE.FREE_DAYS;

    // Count packages with warnings
    const warningPackages = packagesInStorage.filter(
      (p) => STORAGE.FREE_DAYS - (p.storageDay || 0) <= 7
    );
    const criticalPackages = packagesInStorage.filter(
      (p) => STORAGE.FREE_DAYS - (p.storageDay || 0) <= 3
    );

    return {
      totalPackages: packages.length,
      inStorage,
      shipped,
      consolidated,
      storageDaysLeft: Math.max(0, storageDaysLeft),
      warningCount: warningPackages.length,
      criticalCount: criticalPackages.length,
    };
  }, [packages]);

  // Get recent packages (only packages in storage, last 3)
  const recentPackages = useMemo(() => {
    return packages.filter((p) => p.status === 'received').slice(0, 3);
  }, [packages]);

  // Get active shipments
  const activeShipments = useMemo(() => {
    return shipments.filter(
      (s) => s.status === 'in_transit' || s.status === 'pending'
    );
  }, [shipments]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPackages({ forceRefresh: true });
      addNotification('Dashboard refreshed', 'success');
    } catch (error) {
      addNotification('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchPackages, addNotification]);

  const copyAddress = () => {
    if (!usAddress) return;

    const addressText = `${usAddress.name}\n${usAddress.suite}\n${usAddress.street}\n${usAddress.city}\n${usAddress.country}`;
    navigator.clipboard.writeText(addressText);
    setCopiedAddress(true);
    addNotification('Address copied to clipboard!', 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className='space-y-6'>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden'
      >
        <div className='absolute inset-0 bg-white opacity-10'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className='relative z-10'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>
                Welcome back, {user?.name.split(' ')[0]}! 👋
              </h1>
            </div>
            <div className='flex items-center gap-3'>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className='text-6xl'
              >
                📦
              </motion.div>
            </div>
          </div>
          {/* US Address Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='flex items-start justify-between mb-4'>
              <div>
                <h3 className='text-xl font-bold text-slate-900 mb-1 text-left'>
                  Your US Shipping Address
                </h3>
                <p className='text-sm text-slate-200'>
                  Use this address for all your US purchases
                </p>
              </div>
              <motion.button
                onClick={copyAddress}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {copiedAddress ? (
                  <Check className='w-4 h-4' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
                {copiedAddress ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
            Your Locker Number is: 71017425
            {usAddress && (
              <div className='rounded-xl p-4 font-mono text-white space-y-1'>
                <p className='font-bold'>Name : {usAddress.name}</p>

                <p>Address Line 1: {usAddress.street}</p>
                <p>Address Line 2: {usAddress.suite}</p>
                <p>City : {usAddress.city}</p>
                <p>State : {usAddress.country}</p>
                <p>Zip : {usAddress.country}</p>
                <p className='text-white'>Phone: {usAddress.phone}</p>
              </div>
            )}
            <p className='text-xs text-slate-100 mt-3'>
              💡 Always include suite number ({user?.suiteNumber}) • Free
              storage for {STORAGE.FREE_DAYS} days
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Storage Warning Alert - Show if there are packages with warnings */}
      {calculatedStats.criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-red-50 border-2 border-red-300 rounded-2xl p-6'
        >
          <div className='flex items-start gap-4'>
            <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <AlertTriangle className='w-6 h-6 text-red-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-red-900 mb-1'>
                🚨 Critical Storage Warning
              </h3>
              <p className='text-red-700'>
                You have <strong>{calculatedStats.criticalCount}</strong>{' '}
                package
                {calculatedStats.criticalCount !== 1 ? 's' : ''} with{' '}
                <strong>3 days or less</strong> of free storage remaining.
                Please ship soon to avoid additional fees.
              </p>
              <button
                onClick={() => navigate('/packages')}
                className='mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors'
              >
                View Packages
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {calculatedStats.warningCount > calculatedStats.criticalCount && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-orange-50 border-2 border-orange-200 rounded-2xl p-6'
        >
          <div className='flex items-start gap-4'>
            <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <Clock className='w-6 h-6 text-orange-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-orange-900 mb-1'>
                ⚠️ Storage Reminder
              </h3>
              <p className='text-orange-700'>
                You have{' '}
                <strong>
                  {calculatedStats.warningCount - calculatedStats.criticalCount}
                </strong>{' '}
                package
                {calculatedStats.warningCount -
                  calculatedStats.criticalCount !==
                1
                  ? 's'
                  : ''}{' '}
                approaching the storage limit. Consider shipping or
                consolidating soon.
              </p>
              <button
                onClick={() => navigate('/packages')}
                className='mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors'
              >
                View Packages
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Packages */}
      {recentPackages.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-2xl font-bold text-slate-900'>
              Recent Packages
            </h2>
            <div className='flex items-center gap-3'>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-50'
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={() => navigate('/packages')}
                className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
              >
                View All ({calculatedStats.inStorage}) →
              </button>
            </div>
          </div>
          <div className='grid md:grid-cols-3 gap-6'>
            {recentPackages.map((pkg, i) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onClick={() => navigate(`/packages/${pkg.id}`)}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Shipments */}
      {activeShipments.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-2xl font-bold text-slate-900'>
              Active Shipments
            </h2>
            <button
              onClick={() => navigate('/shipments')}
              className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
            >
              View All →
            </button>
          </div>
          <div className='space-y-4'>
            {activeShipments.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/shipments/${shipment.id}`)}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 cursor-pointer hover:shadow-xl transition-all'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
                      <Truck className='w-6 h-6 text-blue-600' />
                    </div>
                    <div>
                      <p className='font-bold text-slate-900'>
                        {shipment.carrier}
                      </p>
                      <p className='text-sm text-slate-600 font-mono'>
                        {shipment.trackingNumber}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold'>
                      {shipment.status === 'in_transit'
                        ? 'In Transit'
                        : 'Pending'}
                    </span>
                    <p className='text-xs text-slate-500 mt-1'>
                      Est: {shipment.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {packages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center py-20'
        >
          <div className='w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <Package className='w-12 h-12 text-slate-400' />
          </div>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            No packages yet
          </h3>
          <p className='text-slate-600 mb-8 max-w-md mx-auto'>
            Start shopping from US stores and your packages will appear here.
            Free storage for {STORAGE.FREE_DAYS} days!
          </p>
        </motion.div>
      )}
    </div>
  );
}
