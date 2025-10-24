// src/sections/dashboard/PackagesSection.tsx
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PackageCard from '@/components/dashboard/PackageCard';
import { usePackageStore } from '@/stores';
import type { PackageStatus } from '@/types/client.types';

export default function PackagesSection() {
  const navigate = useNavigate();
  const { packages, filterStatus, setFilterStatus } = usePackageStore();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );

  const filters: Array<{ label: string; value: PackageStatus | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Received', value: 'received' },
    { label: 'Consolidated', value: 'consolidated' },
    { label: 'Shipped', value: 'shipped' },
  ];

  const filteredPackages =
    filterStatus === 'all'
      ? packages
      : packages.filter((pkg) => pkg.status === filterStatus);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold text-slate-900'>My Packages</h2>
          <p className='text-slate-600'>Manage and ship your packages</p>
        </div>
        <motion.button
          className='px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/shipping')}
        >
          <Zap className='w-5 h-5' />
          Ship Selected
        </motion.button>
      </div>

      {/* Filters */}
      <div className='flex gap-3 flex-wrap'>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredPackages.map((pkg, i) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            onClick={() => setSelectedPackageId(pkg.id)}
            delay={i * 0.1}
          />
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-slate-600'>No packages found</p>
        </div>
      )}
    </div>
  );
}
