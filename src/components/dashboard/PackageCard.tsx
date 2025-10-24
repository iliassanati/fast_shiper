// src/components/dashboard/PackageCard.tsx
import { motion } from 'framer-motion';
import { Calendar, Package as PackageIcon, ShoppingBag } from 'lucide-react';
import type { Package } from '@/types/client.types';

interface PackageCardProps {
  package: Package;
  onClick: () => void;
  delay?: number;
}

export default function PackageCard({
  package: pkg,
  onClick,
  delay = 0,
}: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 cursor-pointer'
    >
      <div className='flex items-start justify-between mb-4'>
        <div className='text-5xl'>{pkg.photo}</div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            pkg.status === 'received'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {pkg.status === 'received' ? 'In Storage' : 'Consolidated'}
        </span>
      </div>

      <h3 className='font-bold text-slate-900 mb-2'>{pkg.description}</h3>

      <div className='space-y-2 text-sm text-slate-600'>
        <div className='flex items-center gap-2'>
          <ShoppingBag className='w-4 h-4' />
          <span>{pkg.retailer}</span>
        </div>
        <div className='flex items-center gap-2'>
          <PackageIcon className='w-4 h-4' />
          <span>
            {pkg.weight} • {pkg.dimensions}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <Calendar className='w-4 h-4' />
          <span>Received {pkg.receivedDate}</span>
        </div>
      </div>

      <div className='mt-4 pt-4 border-t border-slate-100'>
        <div className='flex items-center justify-between'>
          <span className='text-xs text-slate-500'>Storage</span>
          <span className='text-sm font-semibold text-slate-900'>
            Day {pkg.storageDay} of 45
          </span>
        </div>
      </div>
    </motion.div>
  );
}
