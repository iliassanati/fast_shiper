// src/components/dashboard/StatCard.tsx
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  gradient: string;
  delay?: number;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100'
    >
      <div
        className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-4`}
      >
        <Icon className='w-6 h-6' />
      </div>
      <p className='text-sm text-slate-600 mb-1'>{label}</p>
      <p className='text-3xl font-bold text-slate-900'>{value}</p>
    </motion.div>
  );
}
