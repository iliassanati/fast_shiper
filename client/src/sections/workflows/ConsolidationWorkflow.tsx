// client/src/sections/workflows/ConsolidationWorkflow.tsx - COMPLETE VERSION
import { CONSOLIDATION_PRICING } from '@/data/client/constants';
import { usePackageStore } from '@/stores';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConsolidationWorkflowProps {
  onClose: () => void;
  onSubmit?: (
    selectedPackageIds: string[],
    preferences: any,
    specialInstructions: string
  ) => void;
  submitting?: boolean;
}

export default function ConsolidationWorkflow({
  onClose,
  onSubmit,
  submitting = false,
}: ConsolidationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [removePackaging, setRemovePackaging] = useState(true);
  const [addProtection, setAddProtection] = useState(false);
  const [requestUnpackedPhotos, setRequestUnpackedPhotos] = useState(false);

  // Get real packages from store
  const { packages, fetchPackages } = usePackageStore();

  // 🔥 CRITICAL FIX: Fetch packages when workflow opens
  useEffect(() => {
    const loadPackages = async () => {
      try {
        console.log('📦 Loading packages for consolidation...');
        await fetchPackages({ limit: 100 });
      } catch (error) {
        console.error('❌ Error loading packages:', error);
      }
    };

    if (packages.length === 0) {
      loadPackages();
    }
  }, [fetchPackages, packages.length]);

  // Filter only packages that can be consolidated (received status)
  const availablePackages = packages.filter((pkg) => pkg.status === 'received');

  const totalSteps = 4;

  const togglePackage = (pkgId: string) => {
    setSelectedPackages((prev) =>
      prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId]
    );
  };

  const calculateTotalWeight = () => {
    return selectedPackages.reduce((total, pkgId) => {
      const pkg = availablePackages.find((p) => p.id === pkgId);
      return total + parseFloat(pkg?.weight || '0');
    }, 0);
  };

  const calculateEstimatedDimensions = () => {
    const totalVolume = selectedPackages.reduce((total, pkgId) => {
      const pkg = availablePackages.find((p) => p.id === pkgId);
      if (!pkg) return total;
      const [l, w, h] = pkg.dimensions.split('x').map((d) => parseInt(d));
      return total + l * w * h;
    }, 0);

    const estimatedLength = Math.ceil(Math.pow(totalVolume, 1 / 3) * 1.5);
    const estimatedWidth = Math.ceil(estimatedLength * 0.8);
    const estimatedHeight = Math.ceil(estimatedLength * 0.6);

    return `${estimatedLength}x${estimatedWidth}x${estimatedHeight}`;
  };

  const calculateConsolidationFee = () => {
    const baseFee = Math.min(
      selectedPackages.length * CONSOLIDATION_PRICING.FEE_PER_PACKAGE,
      CONSOLIDATION_PRICING.MAX_FEE
    );

    const unpackedPhotosFee = requestUnpackedPhotos
      ? CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE
      : 0;

    const protectionFee = addProtection
      ? CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE
      : 0;

    return baseFee + unpackedPhotosFee + protectionFee;
  };

  const calculateSavings = () => {
    if (selectedPackages.length < 2) return 0;

    const separateShippingEstimate = selectedPackages.length * 350;
    const consolidatedShippingEstimate = 450;
    const consolidationCost = calculateConsolidationFee();

    return (
      separateShippingEstimate -
      (consolidatedShippingEstimate + consolidationCost)
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackages.length >= 2;
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

  const handleSubmit = () => {
    if (onSubmit && selectedPackages.length >= 2) {
      const preferences = {
        removePackaging,
        addProtection,
        requestUnpackedPhotos,
      };
      onSubmit(selectedPackages, preferences, specialInstructions);

      // Move to confirmation step
      setCurrentStep(4);
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

      {/* Benefits Banner */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200'>
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0'>
            <TrendingDown className='w-6 h-6 text-white' />
          </div>
          <div>
            <h4 className='font-bold text-green-900 mb-2'>
              Save Up to 80% on Shipping!
            </h4>
            <p className='text-sm text-green-800 mb-3'>
              Consolidation combines multiple packages into one, dramatically
              reducing international shipping costs.
            </p>
            <div className='flex flex-wrap gap-2'>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Save Money
              </span>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Faster Customs
              </span>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Eco-Friendly
              </span>
            </div>
          </div>
        </div>
      </div>

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
      ) : (
        <div className='space-y-3'>
          {availablePackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => togglePackage(pkg.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPackages.includes(pkg.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className='flex items-center gap-4'>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                    selectedPackages.includes(pkg.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {selectedPackages.includes(pkg.id) && (
                    <Check className='w-4 h-4 text-white' />
                  )}
                </div>

                <div className='text-4xl'>{pkg.photo}</div>

                <div className='flex-1'>
                  <p className='font-bold text-slate-900'>{pkg.description}</p>
                  <div className='flex items-center gap-4 mt-1'>
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
                    Day {pkg.storageDay}/45
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedPackages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-blue-50 rounded-xl p-6 border-2 border-blue-200'
        >
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm text-blue-700 mb-1'>Selected Packages</p>
              <p className='text-2xl font-bold text-blue-900'>
                {selectedPackages.length}
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
              <p className='text-2xl font-bold text-blue-900'>
                {calculateConsolidationFee()} MAD
              </p>
            </div>
            <div>
              <p className='text-sm text-blue-700 mb-1'>Est. Savings</p>
              <p className='text-2xl font-bold text-green-600'>
                ~{calculateSavings()} MAD
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Minimum Warning */}
      {selectedPackages.length === 1 && (
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

  // Step 2: Consolidation Options
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
              to reduce size and weight. This saves you money on shipping!
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

      {/* Add Protection Option */}
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
                +{CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE} MAD
              </span>
            </div>
            <p className='text-sm text-slate-600 mb-3'>
              We'll add bubble wrap, foam padding, or other protective materials
              to ensure your items arrive safely.
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

      {/* Unpacked Photos Option */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setRequestUnpackedPhotos(!requestUnpackedPhotos)}
        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
          requestUnpackedPhotos
            ? 'border-purple-500 bg-purple-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className='flex items-start gap-4'>
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              requestUnpackedPhotos
                ? 'bg-purple-600 border-purple-600'
                : 'border-slate-300'
            }`}
          >
            {requestUnpackedPhotos && <Check className='w-4 h-4 text-white' />}
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <h4 className='font-bold text-slate-900'>
                Request Unpacked Photos
              </h4>
              <span className='px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold'>
                +{CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE} MAD (~$2)
              </span>
            </div>
            <p className='text-sm text-slate-600 mb-3'>
              Get detailed photos of your items after unpacking, before
              consolidation. Basic packaging photos are always free!
            </p>
            <div className='flex items-center gap-2 text-sm'>
              <Camera className='w-4 h-4 text-purple-600' />
              <span className='text-slate-600'>
                See your items in detail before they're packed together
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Special Instructions */}
      <div className='bg-white rounded-xl border border-slate-200 p-6'>
        <h4 className='font-bold text-slate-900 mb-3'>
          Special Instructions (Optional)
        </h4>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
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

  // Step 3: Review
  const Step3Review = () => {
    const selectedPkgs = availablePackages.filter((pkg) =>
      selectedPackages.includes(pkg.id)
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
                    {pkg.retailer} • {pkg.weight} • {pkg.dimensions}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences Summary */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Your Preferences</h4>
          <div className='space-y-2'>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Remove Extra Packaging</span>
              <span className='font-semibold text-slate-900'>
                {removePackaging ? 'Yes' : 'No'}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Add Extra Protection</span>
              <span className='font-semibold text-slate-900'>
                {addProtection ? 'Yes' : 'No'}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Request Unpacked Photos</span>
              <span className='font-semibold text-slate-900'>
                {requestUnpackedPhotos ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {specialInstructions && (
            <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
              <p className='text-sm font-semibold text-blue-900 mb-1'>
                Special Instructions:
              </p>
              <p className='text-sm text-blue-800'>{specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6'>
          <h4 className='font-bold text-green-900 mb-4'>Cost Breakdown</h4>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-slate-700'>
              <span>
                Consolidation Fee ({selectedPackages.length} packages)
              </span>
              <span className='font-semibold'>
                {Math.min(
                  selectedPackages.length *
                    CONSOLIDATION_PRICING.FEE_PER_PACKAGE,
                  CONSOLIDATION_PRICING.MAX_FEE
                )}{' '}
                MAD
              </span>
            </div>

            {addProtection && (
              <div className='flex items-center justify-between text-slate-700'>
                <span>Extra Protection</span>
                <span className='font-semibold'>
                  {CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE} MAD
                </span>
              </div>
            )}

            {requestUnpackedPhotos && (
              <div className='flex items-center justify-between text-slate-700'>
                <span>Unpacked Photos</span>
                <span className='font-semibold'>
                  {CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE} MAD
                </span>
              </div>
            )}

            <div className='pt-3 mt-3 border-t-2 border-green-300 flex items-center justify-between'>
              <span className='text-lg font-bold text-green-900'>
                Total Cost
              </span>
              <span className='text-2xl font-bold text-green-900'>
                {calculateConsolidationFee()} MAD
              </span>
            </div>

            <div className='flex items-center justify-between text-green-700 pt-2'>
              <span className='flex items-center gap-2'>
                <TrendingDown className='w-5 h-5' />
                <span className='font-semibold'>Estimated Savings</span>
              </span>
              <span className='text-xl font-bold'>
                ~{calculateSavings()} MAD
              </span>
            </div>
          </div>
        </div>

        {/* Processing Info */}
        <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
          <Clock className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-blue-900'>
            <p className='font-semibold mb-1'>What happens next?</p>
            <ul className='space-y-1 list-disc list-inside'>
              <li>
                Your packages will be consolidated within 2-4 business days
              </li>
              <li>You'll receive photos and updates via email</li>
              <li>Once ready, you can ship your consolidated package</li>
            </ul>
          </div>
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
        your packages shortly.
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
        onClick={onClose}
        className='mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Return to Dashboard
      </motion.button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto'
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl max-w-4xl w-full shadow-2xl my-8'
      >
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
              onClick={onClose}
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
              whileHover={currentStep > 1 && !submitting ? { scale: 1.05 } : {}}
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
      </motion.div>
    </motion.div>
  );
}
