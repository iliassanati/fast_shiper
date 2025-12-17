// src/components/dashboard/PackageCard.tsx - UPDATED to show consolidation status
import { motion } from 'framer-motion';
import {
  Calendar,
  Package as PackageIcon,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';
import type { Package } from '@/types/client.types';
import ConsolidatedBadge from './ConsolidatedBadge';
import { STORAGE } from '@/data/client/constants';

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
  // Calculate days remaining (30 days total)
  const storageLimitDays = STORAGE.FREE_DAYS; // 30 days
  const daysRemaining = Math.max(0, storageLimitDays - pkg.storageDay);

  // Determine warning level
  const isExpired = daysRemaining <= 0;
  const isCritical = daysRemaining <= 3 && daysRemaining > 0;
  const isWarning = daysRemaining <= 7 && daysRemaining > 3;
  const hasStorageWarning = isExpired || isCritical || isWarning;

  // Check if package is in consolidation (status = 'consolidated' but not a result)
  const isConsolidating =
    pkg.status === 'consolidated' && !pkg.isConsolidatedResult;

  // Get card background and border styles based on status
  const getCardStyles = () => {
    // If consolidating, show pending state
    if (isConsolidating) {
      return 'bg-purple-50 border-purple-300 ring-2 ring-purple-200 opacity-90';
    }

    if (pkg.status !== 'received') {
      // Non-storage packages (shipped, consolidated result, etc.) - normal style
      return 'bg-white border-slate-100';
    }

    if (isExpired) {
      return 'bg-red-50 border-red-300 ring-2 ring-red-200';
    }
    if (isCritical) {
      return 'bg-red-50 border-red-200';
    }
    if (isWarning) {
      return 'bg-orange-50 border-orange-200';
    }
    return 'bg-white border-slate-100';
  };

  // Get storage status badge
  const getStorageBadge = () => {
    if (pkg.status !== 'received') return null;

    if (isExpired) {
      return (
        <div className='flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold'>
          <AlertTriangle className='w-3 h-3' />
          EXPIRED
        </div>
      );
    }
    if (isCritical) {
      return (
        <div className='flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse'>
          <AlertTriangle className='w-3 h-3' />
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left!
        </div>
      );
    }
    if (isWarning) {
      return (
        <div className='flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold'>
          <Clock className='w-3 h-3' />
          {daysRemaining} days left
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ y: isConsolidating ? 0 : -5 }} // Don't lift if consolidating
      onClick={isConsolidating ? undefined : onClick} // Disable click if consolidating
      className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border ${
        isConsolidating ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${getCardStyles()}`}
    >
      {/* Consolidation Pending Badge */}
      {isConsolidating && (
        <div className='flex justify-end mb-2'>
          <div className='flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold animate-pulse'>
            <Loader2 className='w-3 h-3 animate-spin' />
            Consolidation Pending
          </div>
        </div>
      )}

      {/* Storage Warning Badge - Top */}
      {hasStorageWarning && pkg.status === 'received' && !isConsolidating && (
        <div className='flex justify-end mb-2'>{getStorageBadge()}</div>
      )}

      {/* Consolidated Badge */}
      {pkg.isConsolidatedResult && (
        <ConsolidatedBadge
          originalCount={pkg.originalPackageIds?.length || 0}
          onViewDetails={onClick}
        />
      )}

      <div className='flex items-start justify-between mb-4'>
        <div className='text-5xl'>{pkg.photo}</div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isConsolidating
              ? 'bg-purple-100 text-purple-700'
              : pkg.status === 'received'
              ? isExpired || isCritical
                ? 'bg-red-100 text-red-700'
                : isWarning
                ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isConsolidating
            ? 'Consolidating'
            : pkg.status === 'received'
            ? 'In Storage'
            : 'Consolidated'}
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

      {/* Consolidation Pending Message */}
      {isConsolidating && (
        <div className='mt-4 pt-4 border-t border-purple-200'>
          <p className='text-xs text-purple-700 font-medium'>
            📦 This package is being consolidated with others. We'll notify you
            when it's ready (typically 2-4 business days).
          </p>
        </div>
      )}

      {/* Storage Progress Bar - Only for received packages not being consolidated */}
      {pkg.status === 'received' && !isConsolidating && (
        <div className='mt-4 pt-4 border-t border-slate-100'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-xs text-slate-500'>Storage</span>
            <span
              className={`text-sm font-semibold ${
                isExpired || isCritical
                  ? 'text-red-600'
                  : isWarning
                  ? 'text-orange-600'
                  : 'text-slate-900'
              }`}
            >
              {isExpired
                ? 'EXPIRED'
                : `${daysRemaining} of ${storageLimitDays} days left`}
            </span>
          </div>

          {/* Progress bar */}
          <div className='h-2 bg-slate-200 rounded-full overflow-hidden'>
            <div
              className={`h-full transition-all duration-500 ${
                isExpired || isCritical
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (daysRemaining / storageLimitDays) * 100
                )}%`,
              }}
            />
          </div>

          {/* Warning message */}
          {(isExpired || isCritical) && (
            <p className='text-xs text-red-600 mt-2 font-medium'>
              {isExpired
                ? '⚠️ Storage period expired! Ship immediately to avoid fees.'
                : `⚠️ Only ${daysRemaining} day${
                    daysRemaining !== 1 ? 's' : ''
                  } remaining! Ship soon.`}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
