// src/sections/workflows/ConsolidationWorkflow.tsx
import { CONSOLIDATION_PRICING } from '@/data/client/constants';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Package,
  Ruler,
  Star,
  TrendingDown,
  Weight,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface PackageItem {
  id: string;
  description: string;
  retailer: string;
  weight: string;
  dimensions: string;
  photo: string;
  trackingNumber: string;
  receivedDate: string;
  storageDay: number;
}

interface ConsolidationWorkflowProps {
  onClose: () => void;
  onSubmit?: (selectedPackageIds: string[]) => void;
}

const mockPackages: PackageItem[] = [
  {
    id: 'PKG001',
    description: 'Wireless Headphones',
    retailer: 'Amazon',
    weight: '2.5',
    dimensions: '30x20x15',
    photo: '🎧',
    trackingNumber: '1Z999AA10123456784',
    receivedDate: '2025-10-08',
    storageDay: 3,
  },
  {
    id: 'PKG002',
    description: 'Nike Shoes',
    retailer: 'eBay',
    weight: '1.2',
    dimensions: '25x15x10',
    photo: '👟',
    trackingNumber: '1Z999AA10123456785',
    receivedDate: '2025-10-09',
    storageDay: 2,
  },
  {
    id: 'PKG003',
    description: 'Phone Case',
    retailer: 'Best Buy',
    weight: '0.8',
    dimensions: '20x15x5',
    photo: '📱',
    trackingNumber: '1Z999AA10123456786',
    receivedDate: '2025-10-10',
    storageDay: 1,
  },
  {
    id: 'PKG004',
    description: 'USB Cable',
    retailer: 'Amazon',
    weight: '0.3',
    dimensions: '15x10x3',
    photo: '🔌',
    trackingNumber: '1Z999AA10123456787',
    receivedDate: '2025-10-10',
    storageDay: 1,
  },
  {
    id: 'PKG005',
    description: 'T-Shirt',
    retailer: 'eBay',
    weight: '0.5',
    dimensions: '25x20x5',
    photo: '👕',
    trackingNumber: '1Z999AA10123456788',
    receivedDate: '2025-10-09',
    storageDay: 2,
  },
];

export default function ConsolidationWorkflow({
  onClose,
  onSubmit,
}: ConsolidationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [removePackaging, setRemovePackaging] = useState(true);
  const [addProtection, setAddProtection] = useState(false);
  const [requestUnpackedPhotos, setRequestUnpackedPhotos] = useState(false);

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
      const pkg = mockPackages.find((p) => p.id === pkgId);
      return total + parseFloat(pkg?.weight || '0');
    }, 0);
  };

  const calculateEstimatedDimensions = () => {
    const totalVolume = selectedPackages.reduce((total, pkgId) => {
      const pkg = mockPackages.find((p) => p.id === pkgId);
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
      <div className='space-y-3'>
        {mockPackages.map((pkg) => (
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

      {/* How It Works */}
      <div className='bg-white rounded-xl border border-slate-200 p-6'>
        <h4 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
          <Info className='w-5 h-5 text-blue-600' />
          How Consolidation Works
        </h4>
        <div className='space-y-3'>
          {[
            { step: 1, text: 'Select the packages you want to combine' },
            {
              step: 2,
              text: 'Our team carefully removes extra packaging and consolidates items',
            },
            { step: 3, text: 'Processing takes 2-4 business days' },
            {
              step: 4,
              text: 'You receive one optimized package ready to ship',
            },
          ].map((item) => (
            <div key={item.step} className='flex items-start gap-3'>
              <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-blue-600'>
                  {item.step}
                </span>
              </div>
              <p className='text-sm text-slate-700'>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
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

      {/* Free Photos Notice */}
      <div className='bg-green-50 rounded-xl p-4 flex items-start gap-3'>
        <Camera className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-green-900'>
          <p className='font-semibold mb-1'>Free Package Photos Included!</p>
          <p>
            Basic photos of your packaged consolidation are always free. Only
            unpacked/detailed photos have an additional fee.
          </p>
        </div>
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

  // Step 3: Review & Confirm
  const Step3Review = () => {
    const totalFee = calculateConsolidationFee();

    return (
      <div className='space-y-4'>
        <div className='mb-6'>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Review & Confirm
          </h3>
          <p className='text-slate-600'>
            Double-check everything before submitting
          </p>
        </div>

        {/* Selected Packages Summary */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>
            Selected Packages ({selectedPackages.length})
          </h4>
          <div className='space-y-3'>
            {selectedPackages.map((pkgId) => {
              const pkg = mockPackages.find((p) => p.id === pkgId);
              if (!pkg) return null;
              return (
                <div
                  key={pkgId}
                  className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg'
                >
                  <div className='text-2xl'>{pkg.photo}</div>
                  <div className='flex-1'>
                    <p className='font-semibold text-slate-900'>
                      {pkg.description}
                    </p>
                    <p className='text-xs text-slate-600'>
                      {pkg.retailer} • {pkg.weight} kg
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Before & After Comparison */}
        <div className='grid md:grid-cols-2 gap-4'>
          <div className='bg-red-50 rounded-xl border-2 border-red-200 p-6'>
            <h4 className='font-bold text-red-900 mb-3'>
              Before Consolidation
            </h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-red-700'>Individual Packages:</span>
                <span className='font-bold text-red-900'>
                  {selectedPackages.length}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-red-700'>Total Weight:</span>
                <span className='font-bold text-red-900'>
                  {calculateTotalWeight().toFixed(1)} kg
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-red-700'>Est. Shipping (separate):</span>
                <span className='font-bold text-red-900'>
                  ~{selectedPackages.length * 350} MAD
                </span>
              </div>
            </div>
          </div>

          <div className='bg-green-50 rounded-xl border-2 border-green-200 p-6'>
            <h4 className='font-bold text-green-900 mb-3'>
              After Consolidation
            </h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-green-700'>Consolidated Package:</span>
                <span className='font-bold text-green-900'>1</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-green-700'>Optimized Weight:</span>
                <span className='font-bold text-green-900'>
                  ~{(calculateTotalWeight() * 0.8).toFixed(1)} kg
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-green-700'>Est. Shipping:</span>
                <span className='font-bold text-green-900'>~450 MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Dimensions */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>
            Estimated Consolidated Package
          </h4>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <Weight className='w-6 h-6 text-blue-600 mx-auto mb-2' />
              <p className='text-xs text-slate-600 mb-1'>Weight</p>
              <p className='font-bold text-slate-900'>
                ~{(calculateTotalWeight() * 0.8).toFixed(1)} kg
              </p>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <Ruler className='w-6 h-6 text-blue-600 mx-auto mb-2' />
              <p className='text-xs text-slate-600 mb-1'>Dimensions</p>
              <p className='font-bold text-slate-900 text-sm'>
                {calculateEstimatedDimensions()} cm
              </p>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <Package className='w-6 h-6 text-blue-600 mx-auto mb-2' />
              <p className='text-xs text-slate-600 mb-1'>Status</p>
              <p className='font-bold text-slate-900'>Ready</p>
            </div>
          </div>
        </div>

        {/* Options Summary */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Your Preferences</h4>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Remove Extra Packaging</span>
              <span
                className={`font-semibold ${
                  removePackaging ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {removePackaging ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Add Extra Protection</span>
              <span
                className={`font-semibold ${
                  addProtection ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {addProtection
                  ? `✓ Yes (+${CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE} MAD)`
                  : '✗ No'}
              </span>
            </div>
            <div className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'>
              <span className='text-slate-700'>Unpacked Photos</span>
              <span
                className={`font-semibold ${
                  requestUnpackedPhotos ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {requestUnpackedPhotos
                  ? `✓ Yes (+${CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE} MAD)`
                  : '✗ No (Free basic photos)'}
              </span>
            </div>
            {specialInstructions && (
              <div className='p-3 bg-slate-50 rounded-lg'>
                <p className='text-xs text-slate-600 mb-1'>
                  Special Instructions:
                </p>
                <p className='text-sm text-slate-900 italic'>
                  "{specialInstructions}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Cost Breakdown</h4>
          <div className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-slate-700'>
                Consolidation Fee ({selectedPackages.length} packages)
              </span>
              <span className='font-semibold text-slate-900'>
                {Math.min(
                  selectedPackages.length *
                    CONSOLIDATION_PRICING.FEE_PER_PACKAGE,
                  CONSOLIDATION_PRICING.MAX_FEE
                )}{' '}
                MAD
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-slate-700'>Basic Package Photos</span>
              <span className='font-semibold text-green-600'>FREE ✓</span>
            </div>
            {requestUnpackedPhotos && (
              <div className='flex justify-between text-sm'>
                <span className='text-slate-700'>Unpacked Photos</span>
                <span className='font-semibold text-slate-900'>
                  {CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE} MAD
                </span>
              </div>
            )}
            {addProtection && (
              <div className='flex justify-between text-sm'>
                <span className='text-slate-700'>Extra Protection</span>
                <span className='font-semibold text-slate-900'>
                  {CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE} MAD
                </span>
              </div>
            )}
            <div className='border-t-2 border-blue-200 pt-3 flex justify-between'>
              <span className='font-bold text-slate-900'>
                Total Consolidation Cost
              </span>
              <span className='font-bold text-blue-600 text-xl'>
                {totalFee} MAD
              </span>
            </div>
            <p className='text-xs text-slate-600'>
              ~${(totalFee / 10).toFixed(2)} USD • Payment due after completion
            </p>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className='bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-100 mb-1'>Estimated Total Savings</p>
              <p className='text-4xl font-bold'>~{calculateSavings()} MAD</p>
              <p className='text-green-100 text-sm mt-1'>
                On shipping costs when you consolidate!
              </p>
            </div>
            <div className='text-6xl'>💰</div>
          </div>
        </div>

        {/* Important Notice */}
        <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
          <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-yellow-900'>
            <p className='font-semibold mb-1'>Please Note</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>Consolidation cannot be undone once started</li>
              <li>Processing takes 2-4 business days</li>
              <li>
                You'll be able to ship your consolidated package after
                processing
              </li>
              <li>Payment is due after consolidation is complete</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Confirmation
  const Step4Confirmation = () => {
    const consolidationId = `CONS-${Date.now().toString().slice(-6)}`;
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 3);

    return (
      <div className='space-y-6 text-center py-8'>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className='w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto'
        >
          <Check className='w-12 h-12 text-green-600' />
        </motion.div>

        <div>
          <h3 className='text-3xl font-bold text-slate-900 mb-2'>
            Consolidation Requested!
          </h3>
          <p className='text-lg text-slate-600'>
            Your packages are being prepared
          </p>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto text-left'>
          <h4 className='font-bold text-slate-900 mb-4'>Request Details</h4>
          <div className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Consolidation ID:</span>
              <span className='font-mono font-bold text-blue-600'>
                {consolidationId}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Packages:</span>
              <span className='font-semibold text-slate-900'>
                {selectedPackages.length}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Status:</span>
              <span className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold'>
                Processing
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Est. Completion:</span>
              <span className='font-semibold text-slate-900'>
                {estimatedCompletion.toLocaleDateString()}
              </span>
            </div>
            <div className='border-t border-slate-200 pt-3 flex justify-between'>
              <span className='text-slate-900 font-bold'>Total Cost:</span>
              <span className='font-bold text-green-600'>
                {calculateConsolidationFee()} MAD
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className='bg-blue-50 rounded-xl p-6 max-w-md mx-auto text-left'>
          <h4 className='font-bold text-slate-900 mb-4'>What Happens Next</h4>
          <div className='space-y-4'>
            {[
              {
                status: 'current',
                title: 'Request Received',
                desc: 'Your consolidation request is confirmed',
              },
              {
                status: 'pending',
                title: 'Processing',
                desc: 'Our team consolidates your packages (2-4 days)',
              },
              {
                status: 'pending',
                title: 'Ready to Ship',
                desc: 'You can create a shipment for your consolidated package',
              },
            ].map((step, i) => (
              <div key={i} className='flex items-start gap-3'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'current'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step.status === 'current' ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <span className='text-xs font-bold'>{i + 1}</span>
                  )}
                </div>
                <div>
                  <p className='font-semibold text-slate-900'>{step.title}</p>
                  <p className='text-xs text-slate-600'>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-green-50 rounded-xl p-4'>
          <p className='text-sm text-green-900'>
            📧 Confirmation email sent! We'll notify you when consolidation is
            complete.
          </p>
        </div>

        <div className='flex gap-3 justify-center'>
          <motion.button
            onClick={onClose}
            className='px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg flex items-center gap-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Dashboard
          </motion.button>
          <motion.button
            className='px-8 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-full font-bold flex items-center gap-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Track Status
            <ArrowRight className='w-5 h-5' />
          </motion.button>
        </div>
      </div>
    );
  };

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
            <div className='flex justify-between mt-2 text-xs text-slate-600'>
              <span>Select</span>
              <span>Options</span>
              <span>Review</span>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 max-h-[60vh] overflow-y-auto'>
          <AnimatePresence mode='wait'>
            {currentStep === 1 && <Step1SelectPackages key='step1' />}
            {currentStep === 2 && <Step2Options key='step2' />}
            {currentStep === 3 && <Step3Review key='step3' />}
            {currentStep === 4 && <Step4Confirmation key='step4' />}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {currentStep < 4 && (
          <div className='bg-white border-t border-slate-200 p-6 rounded-b-3xl flex justify-between'>
            <motion.button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${
                currentStep === 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              whileHover={currentStep > 1 ? { scale: 1.05 } : {}}
              whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
            >
              <ChevronLeft className='w-5 h-5' />
              Back
            </motion.button>

            <motion.button
              onClick={
                currentStep === 3
                  ? () => {
                      if (onSubmit) {
                        onSubmit(selectedPackages);
                      }
                      setCurrentStep(4);
                    }
                  : nextStep
              }
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              whileHover={canProceed() ? { scale: 1.05 } : {}}
              whileTap={canProceed() ? { scale: 0.95 } : {}}
            >
              {currentStep === 3 ? (
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
