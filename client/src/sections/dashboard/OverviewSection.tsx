// src/sections/dashboard/OverviewSection.tsx
import {
  useAuthStore,
  useDashboardStore,
  usePackageStore,
  useShipmentStore,
  useNotificationStore,
} from '@/stores';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Zap,
  Package,
  Truck,
  Archive,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import PackageCard from '@/components/dashboard/PackageCard';

export default function OverviewSection() {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { user, usAddress } = useAuthStore();
  const { stats } = useDashboardStore();
  const { packages } = usePackageStore();
  const { shipments } = useShipmentStore();
  const { addNotification } = useNotificationStore();

  // Get recent packages (last 3)
  const recentPackages = packages
    .filter((p) => p.status === 'received')
    .slice(0, 3);

  // Get active shipments
  const activeShipments = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'pending'
  );

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
              <p className='text-blue-100'>
                You have {stats.inStorage} packages waiting
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className='text-6xl'
            >
              📦
            </motion.div>
          </div>
          <motion.button
            className='px-6 py-3 bg-white text-blue-600 rounded-full font-bold shadow-lg flex items-center gap-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/shipping')}
          >
            <Zap className='w-5 h-5' />
            Ship Now
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className='grid md:grid-cols-4 gap-6'>
        <StatCard
          icon={Package}
          label='Total Packages'
          value={stats.totalPackages}
          gradient='from-blue-500 to-cyan-500'
          delay={0}
        />
        <StatCard
          icon={Archive}
          label='In Storage'
          value={stats.inStorage}
          gradient='from-green-500 to-emerald-500'
          delay={0.1}
        />
        <StatCard
          icon={Truck}
          label='Shipped'
          value={stats.shipped}
          gradient='from-orange-500 to-red-500'
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label='Storage Days Left'
          value={stats.storageDaysLeft}
          gradient='from-purple-500 to-pink-500'
          delay={0.3}
        />
      </div>

      {/* Recent Packages */}
      {recentPackages.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-2xl font-bold text-slate-900'>
              Recent Packages
            </h2>
            <button
              onClick={() => navigate('/packages')}
              className='text-blue-600 hover:text-blue-700 font-semibold text-sm'
            >
              View All →
            </button>
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

      {/* US Address Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200'
      >
        <div className='flex items-start justify-between mb-4'>
          <div>
            <h3 className='text-xl font-bold text-slate-900 mb-1'>
              Your US Shipping Address
            </h3>
            <p className='text-sm text-slate-600'>
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
        {usAddress && (
          <div className='bg-white rounded-xl p-4 font-mono text-slate-800 space-y-1'>
            <p className='font-bold'>{usAddress.name}</p>
            <p className='text-blue-600 font-bold text-lg'>{usAddress.suite}</p>
            <p>{usAddress.street}</p>
            <p>{usAddress.city}</p>
            <p>{usAddress.country}</p>
            <p className='text-slate-600'>Phone: {usAddress.phone}</p>
          </div>
        )}
        <p className='text-xs text-slate-500 mt-3'>
          💡 Always include suite number ({user?.suiteNumber})
        </p>
      </motion.div>

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
            Start shopping from US stores and your packages will appear here
          </p>
        </motion.div>
      )}
    </div>
  );
}
