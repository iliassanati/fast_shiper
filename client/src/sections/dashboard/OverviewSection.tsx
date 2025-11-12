// src/sections/dashboard/OverviewSection.tsx
import {
  useAuthStore,
  useDashboardStore,
  useNotificationStore,
} from '@/stores';
import { motion } from 'framer-motion';
import { Check, Copy, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OverviewSection() {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { user, usAddress } = useAuthStore();
  const { stats } = useDashboardStore();

  const { addNotification } = useNotificationStore();

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
    </div>
  );
}
