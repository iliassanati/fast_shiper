// src/sections/dashboard/OverviewSection.tsx - IMPROVED UX/UI VERSION
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
    <div className='space-y-8'>
      {/* Welcome Banner - IMPROVED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden shadow-xl'
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
          {/* Welcome Header - IMPROVED spacing and typography */}
          <div className='flex flex-row justify-between items-start mb-8 '>
            <div className='flex-row text-left'>
              <h1 className='text-3xl lg:text-4xl font-bold mb-3 leading-tight'>
                Welcome back, {user?.name.split(' ')[0]}! 👋
              </h1>
              <p className='text-blue-100 text-lg leading-relaxed '>
                Here's what's happening with your packages today
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className='text-6xl ml-4 flex-shrink-0'
            >
              📦
            </motion.div>
          </div>

          {/* US Address Card - IMPROVED layout and readability */}
          <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-left'>
            <div className='flex flex-row items-start justify-between mb-5'>
              <div className='flex-row'>
                <h3 className='text-xl font-bold text-white mb-2'>
                  Your US Shipping Address
                </h3>
                <p className='text-blue-100 text-sm leading-relaxed'>
                  Use this address when shopping from US stores
                </p>
              </div>
              <motion.button
                onClick={copyAddress}
                className='px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl flex-shrink-0 ml-4'
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
            <p className='text-blue-200 font-bold uppercase tracking-wider text-center mb-4'>
              Your Locker Number : {user?.suiteNumber}
            </p>

            {usAddress && (
              <div className='flex justify-center items-start'>
                <div className='grid md:grid-cols-2 gap-8'>
                  {/* Left Column */}
                  <div className='space-y-3'>
                    <div className='space-y-1 leading-relaxed'>
                      <p className='text-blue-200 font-semibold uppercase tracking-wider'>
                        Name
                      </p>
                      <p className='text-blue-200 font-semibold uppercase tracking-wider'>
                        Address line 1
                      </p>
                      <p className='text-blue-200 font-semibold uppercase tracking-wider'>
                        Address line 2
                      </p>
                      <p className='text-blue-200 font-semibold uppercase tracking-wider'>
                        City
                      </p>
                      <p className='text-blue-200 font-semibold uppercase tracking-wider'>
                        State
                      </p>
                      <p className='text-blue-200 font-semibold uppercase tracking-wider'>
                        Zip Code
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className='space-y-3'>
                    <div className='text-white space-y-1 leading-relaxed'>
                      <p>{usAddress.name}</p>
                      <p>{usAddress.street}</p>
                      <p>{usAddress.suite}</p>
                      <p>{usAddress.city}</p>
                      <p>{usAddress.country}</p>
                      <p>{usAddress.city.split(' ')[2]}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Important Note - IMPROVED */}
            <div className='mt-5 pt-5 border-t border-white/20 text-center'>
              <p className='text-blue-100 text-sm leading-relaxed'>
                <span className='font-semibold'>💡 Important:</span> Always
                include your suite number ({user?.suiteNumber}) • Free storage
                for {STORAGE.FREE_DAYS} days
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Storage Warning Alert - IMPROVED spacing and hierarchy */}
      {calculatedStats.criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg'
        >
          <div className='flex items-start gap-5'>
            <div className='w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0'>
              <AlertTriangle className='w-7 h-7 text-red-600' />
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-xl font-bold text-red-900 mb-2'>
                🚨 Critical Storage Warning
              </h3>
              <p className='text-red-700 leading-relaxed mb-4'>
                You have <strong>{calculatedStats.criticalCount}</strong>{' '}
                package{calculatedStats.criticalCount !== 1 ? 's' : ''} with{' '}
                <strong>3 days or less</strong> of free storage remaining.
                Please ship soon to avoid additional fees.
              </p>
              <button
                onClick={() => navigate('/packages')}
                className='px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg'
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
          className='bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 shadow-lg'
        >
          <div className='flex items-start gap-5'>
            <div className='w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0'>
              <Clock className='w-7 h-7 text-orange-600' />
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-xl font-bold text-orange-900 mb-2'>
                ⚠️ Storage Reminder
              </h3>
              <p className='text-orange-700 leading-relaxed mb-4'>
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
                className='px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg'
              >
                View Packages
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Packages - IMPROVED header and spacing */}
      {recentPackages.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl lg:text-3xl font-bold text-slate-900 leading-tight'>
                Recent Packages
              </h2>
              <p className='text-slate-600 mt-1'>
                Your latest arrivals in storage
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl disabled:opacity-50 transition-colors'
                title='Refresh packages'
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <button
                onClick={() => navigate('/packages')}
                className='text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors'
              >
                View All ({calculatedStats.inStorage}) →
              </button>
            </div>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
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

      {/* Active Shipments - IMPROVED layout */}
      {activeShipments.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl lg:text-3xl font-bold text-slate-900 leading-tight'>
                Active Shipments
              </h2>
              <p className='text-slate-600 mt-1'>
                Track your packages in transit
              </p>
            </div>
            <button
              onClick={() => navigate('/shipments')}
              className='text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors'
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
                <div className='flex items-center justify-between gap-6'>
                  <div className='flex items-center gap-5 flex-1 min-w-0'>
                    <div className='w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0'>
                      <Truck className='w-7 h-7 text-blue-600' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-bold text-lg text-slate-900 mb-1'>
                        {shipment.carrier}
                      </p>
                      <p className='text-sm text-slate-600 font-mono truncate'>
                        {shipment.trackingNumber}
                      </p>
                    </div>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <span className='inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold mb-2'>
                      {shipment.status === 'in_transit'
                        ? 'In Transit'
                        : 'Pending'}
                    </span>
                    <p className='text-xs text-slate-500'>
                      Est: {shipment.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - IMPROVED */}
      {packages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center py-20'
        >
          <div className='w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg'>
            <Package className='w-14 h-14 text-slate-400' />
          </div>
          <h3 className='text-3xl font-bold text-slate-900 mb-3'>
            No packages yet
          </h3>
          <p className='text-slate-600 mb-8 max-w-md mx-auto leading-relaxed text-lg'>
            Start shopping from US stores and your packages will appear here.
            Free storage for {STORAGE.FREE_DAYS} days!
          </p>
          <div className='flex flex-wrap gap-3 justify-center text-sm text-slate-500'>
            <div className='flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl'>
              <span>✓</span>
              <span>Free US Address</span>
            </div>
            <div className='flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl'>
              <span>✓</span>
              <span>{STORAGE.FREE_DAYS} Days Free Storage</span>
            </div>
            <div className='flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl'>
              <span>✓</span>
              <span>Package Consolidation</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
