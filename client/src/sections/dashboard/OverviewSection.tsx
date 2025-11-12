// src/sections/dashboard/OverviewSection.tsx
import { motion } from 'framer-motion';
import {
  Archive,
  Box,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Package,
  Truck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import {
  useAuthStore,
  useDashboardStore,
  usePackageStore,
  useNotificationStore,
} from '@/stores';

export default function OverviewSection() {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { user, usAddress } = useAuthStore();
  const { stats } = useDashboardStore();
  const { packages } = usePackageStore();
  const { addNotification } = useNotificationStore();

  const copyAddress = () => {
    if (!usAddress) return;

    const addressText = `${usAddress.name}\n${usAddress.suite}\n${usAddress.street}\n${usAddress.city}\n${usAddress.country}`;
    navigator.clipboard.writeText(addressText);
    setCopiedAddress(true);
    addNotification('Address copied to clipboard!', 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const statsData = [
    {
      icon: Package,
      label: 'Total Packages',
      value: stats.totalPackages,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Archive,
      label: 'In Storage',
      value: stats.inStorage,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Truck,
      label: 'Shipped',
      value: stats.shipped,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Clock,
      label: 'Days Left',
      value: stats.storageDaysLeft,
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const quickActions = [
    {
      icon: Zap,
      title: 'Ship Now',
      desc: 'Create a new shipment',
      gradient: 'from-orange-500 to-red-500',
      link: '/shipping', // Updated path
    },
    {
      icon: Box,
      title: 'Consolidate',
      desc: 'Combine packages',
      gradient: 'from-blue-500 to-cyan-500',
      link: '/consolidation', // Updated path
    },
    {
      icon: Camera,
      title: 'Request Photos',
      desc: 'Additional photos',
      gradient: 'from-purple-500 to-pink-500',
      link: '/request-info', // Updated path
    },
  ];

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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {statsData.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.1} />
        ))}
      </div>

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

      {/* Recent Packages */}
      <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-slate-900'>Recent Packages</h3>
          <button
            onClick={() => navigate('/packages')}
            className='text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1'
          >
            View All
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
        <div className='space-y-3'>
          {packages.slice(0, 3).map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className='flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer'
              onClick={() => navigate(`/packages/${pkg.id}`)}
            >
              <div className='flex items-center gap-4'>
                <div className='text-4xl'>{pkg.photo}</div>
                <div>
                  <p className='font-bold text-slate-900'>{pkg.description}</p>
                  <p className='text-sm text-slate-600'>
                    From {pkg.retailer} • {pkg.weight}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pkg.status === 'received'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {pkg.status === 'received' ? 'In Storage' : 'Consolidated'}
                </span>
                <p className='text-xs text-slate-500 mt-1'>
                  Day {pkg.storageDay}/45
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='grid md:grid-cols-3 gap-6'>
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 text-left'
            onClick={() => navigate(action.link)}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center text-white mb-4`}
            >
              <action.icon className='w-6 h-6' />
            </div>
            <h4 className='font-bold text-slate-900 mb-1'>{action.title}</h4>
            <p className='text-sm text-slate-600'>{action.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
