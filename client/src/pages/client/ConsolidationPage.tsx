// client/src/pages/client/ConsolidationPage.tsx - FIXED VERSION
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
  usePackageStore,
  useDashboardStore,
  useNotificationStore,
} from '@/stores';
import { apiHelpers } from '@/lib/api';
import { CONSOLIDATION_PRICING } from '@/data/client/constants';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';

export default function ConsolidationPage() {
  const navigate = useNavigate();
  const {
    packages,
    selectedPackageIds: storeSelectedIds,
    fetchPackages,
    invalidateCache,
    clearSelection,
    selectMultiplePackages,
  } = usePackageStore();
  const { refreshStats, updateStatsFromPackages } = useDashboardStore();
  const { addNotification, showToast } = useNotificationStore();

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [removePackaging, setRemovePackaging] = useState(true);
  const [addProtection, setAddProtection] = useState(false);
  // REMOVED: requestUnpackedPhotos - no longer offering this option

  // FIX: Use useCallback to prevent re-creating function on every render
  const [localInstructions, setLocalInstructions] = useState('');
  const handleInstructionsChange = useCallback((value: string) => {
    setLocalInstructions(value);
  }, []);

  // Local selection state - initialized from store
  const [localSelectedPackages, setLocalSelectedPackages] = useState<string[]>(
    []
  );

  const totalSteps = 4;

  // Sync local selection with store on mount
  useEffect(() => {
    if (storeSelectedIds.length > 0) {
      console.log(
        '📦 Syncing selection from store:',
        storeSelectedIds.length,
        'packages'
      );
      setLocalSelectedPackages(storeSelectedIds);
    }
  }, [storeSelectedIds]);

  // Fetch packages when workflow opens
  useEffect(() => {
    const loadPackages = async () => {
      try {
        console.log('📦 Loading packages for consolidation...');
        await fetchPackages({ limit: 100, forceRefresh: true });
      } catch (error) {
        console.error('❌ Error loading packages:', error);
      }
    };

    loadPackages();
  }, [fetchPackages]);

  // Filter packages available for consolidation
  const availablePackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (pkg.status !== 'received') return false;
      if (pkg.isConsolidatedResult) return false;
      return true;
    });
  }, [packages]);

  const handleClose = useCallback(() => {
    clearSelection();
    navigate('/packages');
  }, [clearSelection, navigate]);

  const togglePackage = (pkgId: string) => {
    setLocalSelectedPackages((prev) => {
      const newSelection = prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId];
      selectMultiplePackages(newSelection);
      return newSelection;
    });
  };

  const selectAllPackages = () => {
    const allIds = availablePackages.map((pkg) => pkg.id);
    setLocalSelectedPackages(allIds);
    selectMultiplePackages(allIds);
  };

  const deselectAllPackages = () => {
    setLocalSelectedPackages([]);
    clearSelection();
  };

  const calculateTotalWeight = () => {
    return localSelectedPackages.reduce((total, pkgId) => {
      const pkg = availablePackages.find((p) => p.id === pkgId);
      return total + parseFloat(pkg?.weight || '0');
    }, 0);
  };

  // UPDATED: Consolidation is now FREE
  const calculateConsolidationFee = () => {
    return 0; // FREE!
  };

  // UPDATED: Protection fee is tracked but not charged during consolidation
  const getProtectionFee = () => {
    return addProtection ? CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE : 0;
  };

  const calculateSavings = () => {
    if (localSelectedPackages.length < 2) return 0;
    const separateShippingEstimate = localSelectedPackages.length * 350;
    const consolidatedShippingEstimate = 450;
    return Math.max(0, separateShippingEstimate - consolidatedShippingEstimate);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return localSelectedPackages.length >= 2;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting || localSelectedPackages.length < 2) return;

    const validPackages = packages.filter(
      (pkg) =>
        localSelectedPackages.includes(pkg.id) &&
        pkg.status === 'received' &&
        !pkg.isConsolidatedResult
    );

    if (validPackages.length < 2) {
      addNotification(
        'Some selected packages are no longer available for consolidation',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const preferences = {
        removePackaging,
        addProtection,
        requestUnpackedPhotos: false, // REMOVED: No longer offering this
      };

      console.log('📦 Creating consolidation request...', {
        packageIds: localSelectedPackages,
        preferences,
        specialInstructions: localInstructions,
      });

      const response = await apiHelpers.post('/consolidations', {
        packageIds: localSelectedPackages,
        preferences,
        specialInstructions: localInstructions || '',
      });

      console.log('✅ Consolidation created successfully:', response);

      // DON'T remove packages - just clear selection and refresh
      clearSelection();
      invalidateCache();

      // Refresh data from server
      await fetchPackages({ forceRefresh: true });

      // Update stats
      const updatedPackages = usePackageStore.getState().packages;
      updateStatsFromPackages(updatedPackages);

      showToast(
        `Successfully consolidated ${localSelectedPackages.length} packages! We'll start processing them within 2-4 business days.`,
        'success'
      );

      // Move to confirmation step
      setCurrentStep(4);
    } catch (error: any) {
      console.error('❌ Error creating consolidation:', error);
      const errorMessage =
        error?.message ||
        error?.response?.data?.error ||
        'Failed to consolidate packages. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Select Packages
  const Step1SelectPackages = () => (
    <div className='space-y-4'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Select Packages to Consolidate
        </h3>
        <p className='text-slate-600'>
          Choose 2 or more packages to combine into one shipment
        </p>
      </div>

      {/* Benefits Banner - UPDATED: Consolidation is FREE */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200'>
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0'>
            <TrendingDown className='w-6 h-6 text-white' />
          </div>
          <div>
            <h4 className='font-bold text-green-900 mb-2'>
              Save Up to 80% on Shipping - Consolidation is FREE! 🎉
            </h4>
            <p className='text-sm text-green-800 mb-3'>
              Consolidation combines multiple packages into one, dramatically
              reducing international shipping costs. Best of all, there are NO
              consolidation fees!
            </p>
            <div className='flex flex-wrap gap-2'>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                100% FREE
              </span>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Save Money
              </span>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Faster Customs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {availablePackages.length > 0 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-slate-600'>
            {availablePackages.length} package(s) available for consolidation
          </p>
          <div className='flex gap-2'>
            {localSelectedPackages.length < availablePackages.length ? (
              <button
                onClick={selectAllPackages}
                className='text-sm text-blue-600 hover:text-blue-700 font-semibold'
              >
                Select All
              </button>
            ) : (
              <button
                onClick={deselectAllPackages}
                className='text-sm text-slate-600 hover:text-slate-700 font-semibold'
              >
                Deselect All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Package Selection */}
      {availablePackages.length === 0 ? (
        <div className='bg-yellow-50 rounded-xl p-6 text-center'>
          <AlertCircle className='w-12 h-12 text-yellow-600 mx-auto mb-3' />
          <p className='text-yellow-900 font-semibold mb-2'>
            No Packages Available
          </p>
          <p className='text-sm text-yellow-800'>
            You need at least 2 packages in storage to create a consolidation.
          </p>
        </div>
      ) : availablePackages.length === 1 ? (
        <div className='bg-yellow-50 rounded-xl p-6 text-center'>
          <AlertCircle className='w-12 h-12 text-yellow-600 mx-auto mb-3' />
          <p className='text-yellow-900 font-semibold mb-2'>
            Not Enough Packages
          </p>
          <p className='text-sm text-yellow-800'>
            You need at least 2 packages to consolidate. You currently have only
            1 package available.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {availablePackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => togglePackage(pkg.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                localSelectedPackages.includes(pkg.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                    localSelectedPackages.includes(pkg.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {localSelectedPackages.includes(pkg.id) && (
                    <Check className='w-4 h-4 text-white' />
                  )}
                </div>
                <div className='text-4xl'>{pkg.photo}</div>
                <div className='flex-1'>
                  <p className='font-bold text-slate-900'>{pkg.description}</p>
                  <div className='flex items-center gap-4 mt-1 flex-wrap'>
                    <span className='text-sm text-slate-600'>
                      From {pkg.retailer}
                    </span>
                    <span className='text-sm text-slate-500'>•</span>
                    <span className='text-sm text-slate-600'>
                      {pkg.weight} kg
                    </span>
                    <span className='text-sm text-slate-500'>•</span>
                    <span className='text-sm text-slate-600'>
                      {pkg.dimensions} cm
                    </span>
                  </div>
                </div>
                <div className='text-right'>
                  <span className='px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold'>
                    Day {pkg.storageDay}/30
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selection Summary - UPDATED: Show FREE */}
      {localSelectedPackages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-blue-50 rounded-xl p-6 border-2 border-blue-200'
        >
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            <div>
              <p className='text-sm text-blue-700 mb-1'>Selected Packages</p>
              <p className='text-2xl font-bold text-blue-900'>
                {localSelectedPackages.length}
              </p>
            </div>
            <div>
              <p className='text-sm text-blue-700 mb-1'>Total Weight</p>
              <p className='text-2xl font-bold text-blue-900'>
                {calculateTotalWeight().toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className='text-sm text-blue-700 mb-1'>Consolidation Fee</p>
              <p className='text-2xl font-bold text-green-600'>FREE! 🎉</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Minimum Warning */}
      {localSelectedPackages.length === 1 && (
        <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
          <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-yellow-900'>
            <p className='font-semibold mb-1'>Select at least 2 packages</p>
            <p>Consolidation requires a minimum of 2 packages to combine.</p>
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Options - UPDATED: Removed unpacked photos, updated protection info
  const Step2Options = () => (
    <div className='space-y-4'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Consolidation Preferences
        </h3>
        <p className='text-slate-600'>Customize how we handle your packages</p>
      </div>

      {/* Remove Packaging Option */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setRemovePackaging(!removePackaging)}
        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
          removePackaging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className='flex items-start gap-4'>
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              removePackaging
                ? 'bg-blue-600 border-blue-600'
                : 'border-slate-300'
            }`}
          >
            {removePackaging && <Check className='w-4 h-4 text-white' />}
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <h4 className='font-bold text-slate-900'>
                Remove Extra Packaging
              </h4>
              <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                Recommended
              </span>
            </div>
            <p className='text-sm text-slate-600 mb-3'>
              We'll remove unnecessary boxes, paperwork, and packaging materials
              to reduce size and weight.
            </p>
            <div className='flex items-center gap-2 text-sm'>
              <TrendingDown className='w-4 h-4 text-green-600' />
              <span className='text-green-600 font-semibold'>
                Saves ~20-30% on shipping costs
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add Protection Option - UPDATED: $2 fee, paid during shipment */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setAddProtection(!addProtection)}
        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
          addProtection
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className='flex items-start gap-4'>
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              addProtection ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
            }`}
          >
            {addProtection && <Check className='w-4 h-4 text-white' />}
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <h4 className='font-bold text-slate-900'>Add Extra Protection</h4>
              <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold'>
                +$2 (paid at shipment)
              </span>
            </div>
            <p className='text-sm text-slate-600 mb-3'>
              We'll add bubble wrap, foam padding, or other protective
              materials. This $2 fee will be added to your shipment cost.
            </p>
            <div className='flex items-center gap-2 text-sm'>
              <Star className='w-4 h-4 text-yellow-600' />
              <span className='text-slate-600'>
                Recommended for fragile or valuable items
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Special Instructions - FIXED: Use controlled component with useCallback */}
      <div className='bg-white rounded-xl border border-slate-200 p-6'>
        <h4 className='font-bold text-slate-900 mb-3'>
          Special Instructions (Optional)
        </h4>
        <textarea
          value={localInstructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="Any specific requests? e.g., 'Keep original box for headphones', 'Handle with extra care', etc."
          className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
          rows={4}
        />
        <p className='text-xs text-slate-500 mt-2'>
          💡 Our team will do their best to accommodate your requests
        </p>
      </div>

      {/* Processing Time Info */}
      <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
        <Clock className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-blue-900'>
          <p className='font-semibold mb-1'>Processing Time</p>
          <p>
            Consolidation typically takes 2-4 business days. We'll notify you
            via email when your consolidated package is ready to ship.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 3: Review - UPDATED: Show FREE consolidation
  const Step3Review = () => {
    const selectedPkgs = availablePackages.filter((pkg) =>
      localSelectedPackages.includes(pkg.id)
    );

    return (
      <div className='space-y-4'>
        <div className='mb-6'>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Review Your Consolidation
          </h3>
          <p className='text-slate-600'>
            Please review all details before submitting
          </p>
        </div>

        {/* Selected Packages Summary */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>
            Selected Packages ({selectedPkgs.length})
          </h4>
          <div className='space-y-3'>
            {selectedPkgs.map((pkg) => (
              <div
                key={pkg.id}
                className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg'
              >
                <div className='text-3xl'>{pkg.photo}</div>
                <div className='flex-1'>
                  <p className='font-semibold text-slate-900'>
                    {pkg.description}
                  </p>
                  <p className='text-sm text-slate-600'>
                    {pkg.retailer} • {pkg.weight} kg • {pkg.dimensions} cm
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Summary - UPDATED */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Your Preferences</h4>
          <div className='space-y-2'>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Remove Extra Packaging</span>
              <span
                className={`font-semibold ${
                  removePackaging ? 'text-green-600' : 'text-slate-500'
                }`}
              >
                {removePackaging ? 'Yes ✓' : 'No'}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Add Extra Protection</span>
              <span
                className={`font-semibold ${
                  addProtection ? 'text-green-600' : 'text-slate-500'
                }`}
              >
                {addProtection ? 'Yes (+$2 at shipment)' : 'No'}
              </span>
            </div>
          </div>
          {localInstructions && (
            <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
              <p className='text-sm font-semibold text-blue-900 mb-1'>
                Special Instructions:
              </p>
              <p className='text-sm text-blue-800'>{localInstructions}</p>
            </div>
          )}
        </div>

        {/* Cost Breakdown - UPDATED: Show FREE consolidation */}
        <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6'>
          <h4 className='font-bold text-green-900 mb-4'>
            Cost Summary - Consolidation is FREE! 🎉
          </h4>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-slate-700'>
              <span>
                Consolidation Service ({localSelectedPackages.length} packages)
              </span>
              <span className='font-semibold text-green-600 text-xl'>FREE</span>
            </div>
            {addProtection && (
              <div className='flex items-center justify-between text-slate-700'>
                <span>Extra Protection (paid at shipment)</span>
                <span className='font-semibold'>$2.00</span>
              </div>
            )}
            {addProtection && (
              <div className='pt-3 mt-3 border-t-2 border-green-300 flex items-center justify-between'>
                <span className='text-lg font-bold text-green-900'>
                  Consolidation Cost
                </span>
                <span className='text-2xl font-bold text-green-900'>2$</span>
              </div>
            )}
          </div>
          {addProtection && (
            <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
              <p className='text-xs text-blue-900'>
                💡 The $2 extra protection fee will be added to your total cost
                when you ship this consolidated package.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step 4: Confirmation
  const Step4Confirmation = () => (
    <div className='space-y-4 text-center py-8'>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'
      >
        <Check className='w-12 h-12 text-green-600' />
      </motion.div>

      <h3 className='text-3xl font-bold text-slate-900'>
        Consolidation Request Submitted!
      </h3>

      <p className='text-lg text-slate-600 max-w-md mx-auto'>
        Your consolidation request has been received. We'll start processing
        your {localSelectedPackages.length} packages shortly.
      </p>

      <div className='bg-blue-50 rounded-xl p-6 max-w-md mx-auto text-left'>
        <h4 className='font-bold text-blue-900 mb-3'>What's Next?</h4>
        <div className='space-y-3'>
          <div className='flex items-start gap-3'>
            <div className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
              <span className='text-white text-xs font-bold'>1</span>
            </div>
            <div>
              <p className='font-semibold text-blue-900'>Processing</p>
              <p className='text-sm text-blue-800'>
                We'll consolidate your packages within 2-4 business days
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
              <span className='text-white text-xs font-bold'>2</span>
            </div>
            <div>
              <p className='font-semibold text-blue-900'>Notification</p>
              <p className='text-sm text-blue-800'>
                You'll receive an email when consolidation is complete
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
              <span className='text-white text-xs font-bold'>3</span>
            </div>
            <div>
              <p className='font-semibold text-blue-900'>Ready to Ship</p>
              <p className='text-sm text-blue-800'>
                Your consolidated package will be ready for international
                shipping
              </p>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        onClick={handleClose}
        className='mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Return to Packages
      </motion.button>
    </div>
  );

  return (
    <DashboardLayout activeSection='packages'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-lg'>
          {/* Header */}
          <div className='bg-white border-b border-slate-200 p-6 rounded-t-3xl'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Package Consolidation
                </h2>
                <p className='text-slate-600'>
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
              <button
                onClick={handleClose}
                className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                disabled={submitting}
              >
                <X className='w-6 h-6' />
              </button>
            </div>

            {/* Progress Bar */}
            <div className='relative'>
              <div className='h-2 bg-slate-200 rounded-full overflow-hidden'>
                <motion.div
                  className='h-full bg-gradient-to-r from-green-500 to-emerald-500'
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='p-6 max-h-[60vh] overflow-y-auto'>
            <AnimatePresence mode='wait'>
              {currentStep === 1 && (
                <motion.div
                  key='step1'
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step1SelectPackages />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key='step2'
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step2Options />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key='step3'
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step3Review />
                </motion.div>
              )}
              {currentStep === 4 && (
                <motion.div
                  key='step4'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Step4Confirmation />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          {currentStep < 4 && (
            <div className='bg-white border-t border-slate-200 p-6 rounded-b-3xl flex justify-between'>
              <motion.button
                onClick={prevStep}
                disabled={currentStep === 1 || submitting}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${
                  currentStep === 1 || submitting
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
                whileHover={
                  currentStep > 1 && !submitting ? { scale: 1.05 } : {}
                }
                whileTap={currentStep > 1 && !submitting ? { scale: 0.95 } : {}}
              >
                <ChevronLeft className='w-5 h-5' />
                Back
              </motion.button>

              <motion.button
                onClick={currentStep === 3 ? handleSubmit : nextStep}
                disabled={!canProceed() || submitting}
                className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${
                  canProceed() && !submitting
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                whileHover={canProceed() && !submitting ? { scale: 1.05 } : {}}
                whileTap={canProceed() && !submitting ? { scale: 0.95 } : {}}
              >
                {submitting ? (
                  <>
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Processing...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Zap className='w-5 h-5' />
                    Confirm Consolidation
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className='w-5 h-5' />
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
