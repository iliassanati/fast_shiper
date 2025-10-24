import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Box,
  DollarSign,
  Info,
  Scissors,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Ruler,
  Weight,
  Shield,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface PackageItem {
  id: string;
  description: string;
  retailer: string;
  weight: string;
  dimensions: string;
  photo: string;
  trackingNumber: string;
  receivedDate: string;
  estimatedDimWeight: string;
}

const mockPackages: PackageItem[] = [
  {
    id: 'PKG001',
    description: 'Wireless Headphones in Large Box',
    retailer: 'Amazon',
    weight: '2.5 kg',
    dimensions: '50x40x30 cm',
    photo: '🎧',
    trackingNumber: '1Z999AA10123456784',
    receivedDate: '2025-10-08',
    estimatedDimWeight: '3.8 kg',
  },
  {
    id: 'PKG002',
    description: 'Nike Shoes (Oversized Packaging)',
    retailer: 'eBay',
    weight: '1.2 kg',
    dimensions: '40x35x25 cm',
    photo: '👟',
    trackingNumber: '1Z999AA10123456785',
    receivedDate: '2025-10-09',
    estimatedDimWeight: '2.2 kg',
  },
  {
    id: 'PKG003',
    description: 'Phone Case with Excess Packaging',
    retailer: 'Best Buy',
    weight: '0.8 kg',
    dimensions: '30x25x15 cm',
    photo: '📱',
    trackingNumber: '1Z999AA10123456786',
    receivedDate: '2025-10-10',
    estimatedDimWeight: '1.4 kg',
  },
  {
    id: 'PKG004',
    description: 'USB Cable in Retail Box',
    retailer: 'Amazon',
    weight: '0.3 kg',
    dimensions: '25x20x10 cm',
    photo: '🔌',
    trackingNumber: '1Z999AA10123456787',
    receivedDate: '2025-10-10',
    estimatedDimWeight: '0.6 kg',
  },
];

const RepackService: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [repackOptions, setRepackOptions] = useState<{
    [key: string]: {
      removeRetailBox: boolean;
      addProtection: boolean;
      minimizeSize: boolean;
      specialInstructions: string;
    };
  }>({});

  const totalSteps = 4;
  const REPACK_FEE = 50; // 50 MAD (~$5 USD) per package

  const togglePackage = (pkgId: string) => {
    setSelectedPackages((prev) => {
      const newSelection = prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId];

      // Initialize options for newly selected packages
      if (!prev.includes(pkgId)) {
        setRepackOptions((current) => ({
          ...current,
          [pkgId]: {
            removeRetailBox: true,
            addProtection: false,
            minimizeSize: true,
            specialInstructions: '',
          },
        }));
      }

      return newSelection;
    });
  };

  const updateRepackOption = (pkgId: string, option: string, value: any) => {
    setRepackOptions((prev) => ({
      ...prev,
      [pkgId]: {
        ...prev[pkgId],
        [option]: value,
      },
    }));
  };

  const calculateDimensionalWeight = (dimensions: string) => {
    const [l, w, h] = dimensions.split('x').map((d) => parseInt(d));
    // DHL dimensional weight formula: L x W x H / 5000 (in cm)
    return ((l * w * h) / 5000).toFixed(1);
  };

  const estimateNewDimensions = (originalDims: string) => {
    const [l, w, h] = originalDims.split('x').map((d) => parseInt(d));
    // Estimate ~40% size reduction with repacking
    const newL = Math.ceil(l * 0.7);
    const newW = Math.ceil(w * 0.7);
    const newH = Math.ceil(h * 0.6);
    return `${newL}x${newW}x${newH}`;
  };

  const calculateSavings = (pkgId: string) => {
    const pkg = mockPackages.find((p) => p.id === pkgId);
    if (!pkg) return 0;

    const originalDimWeight = parseFloat(pkg.estimatedDimWeight);
    const newDims = estimateNewDimensions(pkg.dimensions);
    const newDimWeight = parseFloat(calculateDimensionalWeight(newDims));

    // Estimate shipping cost difference (~100 MAD per kg)
    const weightDiff = originalDimWeight - newDimWeight;
    const shippingSavings = weightDiff * 100;

    return Math.max(0, shippingSavings - REPACK_FEE);
  };

  const getTotalCost = () => {
    return selectedPackages.length * REPACK_FEE;
  };

  const getTotalSavings = () => {
    return selectedPackages.reduce(
      (total, pkgId) => total + calculateSavings(pkgId),
      0
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackages.length > 0;
      case 2:
        return true; // Options are optional
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
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Select Packages to Repack
        </h3>
        <p className='text-slate-600'>
          Choose packages with oversized or excessive packaging
        </p>
      </div>

      {/* Info Banner */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200'>
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0'>
            <TrendingDown className='w-6 h-6 text-white' />
          </div>
          <div>
            <h4 className='font-bold text-green-900 mb-2'>
              Save on Shipping Costs!
            </h4>
            <p className='text-sm text-green-800 mb-3'>
              US retailers often use oversized boxes with lots of empty space.
              Repacking reduces dimensional weight and saves you money on
              international shipping.
            </p>
            <div className='flex flex-wrap gap-2'>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Reduce Size
              </span>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Lower Shipping Cost
              </span>
              <span className='px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold'>
                Money-Back Guarantee
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Package Selection */}
      <div className='space-y-3'>
        {mockPackages.map((pkg) => {
          const savings = calculateSavings(pkg.id);
          const isSelected = selectedPackages.includes(pkg.id);

          return (
            <motion.div
              key={pkg.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => togglePackage(pkg.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-green-300'
              }`}
            >
              <div className='flex items-start gap-4'>
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    isSelected
                      ? 'bg-green-600 border-green-600'
                      : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className='w-4 h-4 text-white' />}
                </div>

                <div className='text-4xl'>{pkg.photo}</div>

                <div className='flex-1'>
                  <p className='font-bold text-slate-900'>{pkg.description}</p>
                  <div className='flex items-center gap-3 text-sm text-slate-600 mt-1'>
                    <span>{pkg.retailer}</span>
                    <span>•</span>
                    <span>{pkg.weight} actual</span>
                    <span>•</span>
                    <span className='text-orange-600 font-semibold'>
                      {pkg.estimatedDimWeight} dimensional
                    </span>
                  </div>
                  <div className='flex items-center gap-2 mt-2'>
                    <Ruler className='w-4 h-4 text-slate-500' />
                    <span className='text-xs text-slate-600'>
                      Current: {pkg.dimensions} cm
                    </span>
                    <span className='text-xs text-slate-400'>→</span>
                    <span className='text-xs text-green-600 font-semibold'>
                      Est: {estimateNewDimensions(pkg.dimensions)} cm
                    </span>
                  </div>
                </div>

                <div className='text-right'>
                  <div className='px-3 py-1 bg-green-100 text-green-700 rounded-lg mb-2'>
                    <p className='text-xs font-semibold'>Est. Savings</p>
                    <p className='text-lg font-bold'>
                      ~{Math.round(savings)} MAD
                    </p>
                  </div>
                  <p className='text-xs text-slate-500'>After repack fee</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedPackages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-green-50 rounded-xl p-6 border-2 border-green-200'
        >
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            <div>
              <p className='text-sm text-green-700 mb-1'>Selected Packages</p>
              <p className='text-2xl font-bold text-green-900'>
                {selectedPackages.length}
              </p>
            </div>
            <div>
              <p className='text-sm text-green-700 mb-1'>Repack Fee</p>
              <p className='text-2xl font-bold text-green-900'>
                {getTotalCost()} MAD
              </p>
            </div>
            <div>
              <p className='text-sm text-green-700 mb-1'>Est. Net Savings</p>
              <p className='text-2xl font-bold text-green-600'>
                ~{Math.round(getTotalSavings())} MAD
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <div className='bg-white rounded-xl border border-slate-200 p-6'>
        <h4 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
          <Scissors className='w-5 h-5 text-blue-600' />
          How Repacking Works
        </h4>
        <div className='space-y-3'>
          {[
            { step: 1, text: 'Our team carefully opens your package' },
            {
              step: 2,
              text: 'Remove unnecessary retail boxes, paperwork, and excess packaging',
            },
            { step: 3, text: 'Repack items into the smallest suitable box' },
            { step: 4, text: 'Add protection padding as needed' },
            { step: 5, text: 'You save on dimensional weight shipping costs!' },
          ].map((item) => (
            <div key={item.step} className='flex items-start gap-3'>
              <div className='w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-green-600'>
                  {item.step}
                </span>
              </div>
              <p className='text-sm text-slate-700'>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Money-Back Guarantee */}
      <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
        <Shield className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-blue-900'>
          <p className='font-semibold mb-1'>💯 Money-Back Guarantee</p>
          <p>
            If repacking doesn't reduce shipping costs or add protection, we'll
            refund the {REPACK_FEE} MAD fee automatically.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2: Repack Options
  const Step2RepackOptions = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Repacking Preferences
        </h3>
        <p className='text-slate-600'>Customize how we repack each package</p>
      </div>

      {selectedPackages.map((pkgId) => {
        const pkg = mockPackages.find((p) => p.id === pkgId);
        if (!pkg) return null;

        const options = repackOptions[pkgId] || {
          removeRetailBox: true,
          addProtection: false,
          minimizeSize: true,
          specialInstructions: '',
        };

        return (
          <div
            key={pkgId}
            className='bg-white rounded-xl border border-slate-200 p-6'
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='text-3xl'>{pkg.photo}</div>
              <div>
                <p className='font-bold text-slate-900'>{pkg.description}</p>
                <p className='text-sm text-slate-600'>{pkg.retailer}</p>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Remove Retail Box */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() =>
                  updateRepackOption(
                    pkgId,
                    'removeRetailBox',
                    !options.removeRetailBox
                  )
                }
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  options.removeRetailBox
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200'
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      options.removeRetailBox
                        ? 'bg-green-600 border-green-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {options.removeRetailBox && (
                      <Check className='w-3 h-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='font-semibold text-slate-900'>
                        Remove Retail Packaging
                      </p>
                      <span className='px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold'>
                        Recommended
                      </span>
                    </div>
                    <p className='text-sm text-slate-600'>
                      Remove original retail boxes and excess packaging
                      materials to minimize size
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Minimize Size */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() =>
                  updateRepackOption(
                    pkgId,
                    'minimizeSize',
                    !options.minimizeSize
                  )
                }
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  options.minimizeSize
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200'
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      options.minimizeSize
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {options.minimizeSize && (
                      <Check className='w-3 h-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='font-semibold text-slate-900'>
                        Minimize Package Size
                      </p>
                    </div>
                    <p className='text-sm text-slate-600'>
                      Use the smallest box possible that fits your items safely
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Add Protection */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() =>
                  updateRepackOption(
                    pkgId,
                    'addProtection',
                    !options.addProtection
                  )
                }
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  options.addProtection
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200'
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      options.addProtection
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {options.addProtection && (
                      <Check className='w-3 h-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <p className='font-semibold text-slate-900'>
                        Add Extra Protection
                      </p>
                      <span className='px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold'>
                        For Fragile Items
                      </span>
                    </div>
                    <p className='text-sm text-slate-600'>
                      Add bubble wrap or foam padding for fragile items
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Special Instructions */}
              <div>
                <label className='block text-sm font-semibold text-slate-900 mb-2'>
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={options.specialInstructions}
                  onChange={(e) =>
                    updateRepackOption(
                      pkgId,
                      'specialInstructions',
                      e.target.value
                    )
                  }
                  placeholder="e.g., 'Keep original headphone box', 'Extra padding for electronics', etc."
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Processing Info */}
      <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
        <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-yellow-900'>
          <p className='font-semibold mb-1'>Processing Time</p>
          <p>
            Repacking typically takes 1-2 business days. We'll email you when
            complete with new package dimensions and weight.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 3: Review & Confirm
  const Step3Review = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Review Your Request
        </h3>
        <p className='text-slate-600'>Confirm details before submitting</p>
      </div>

      {/* Packages Summary */}
      <div className='bg-white rounded-xl border border-slate-200 p-6'>
        <h4 className='font-bold text-slate-900 mb-4'>
          Selected Packages ({selectedPackages.length})
        </h4>
        <div className='space-y-4'>
          {selectedPackages.map((pkgId) => {
            const pkg = mockPackages.find((p) => p.id === pkgId);
            if (!pkg) return null;

            const options = repackOptions[pkgId];
            const newDims = estimateNewDimensions(pkg.dimensions);
            const savings = calculateSavings(pkgId);

            return (
              <div key={pkgId} className='p-4 bg-slate-50 rounded-xl'>
                <div className='flex items-start gap-3 mb-3'>
                  <div className='text-3xl'>{pkg.photo}</div>
                  <div className='flex-1'>
                    <p className='font-bold text-slate-900'>
                      {pkg.description}
                    </p>
                    <p className='text-sm text-slate-600'>{pkg.retailer}</p>
                  </div>
                </div>

                <div className='grid md:grid-cols-2 gap-4 mb-3'>
                  <div className='bg-red-50 rounded-lg p-3 border border-red-200'>
                    <p className='text-xs text-red-700 font-semibold mb-1'>
                      Current
                    </p>
                    <p className='text-sm text-slate-900'>
                      {pkg.dimensions} cm
                    </p>
                    <p className='text-xs text-orange-600 mt-1'>
                      {pkg.estimatedDimWeight} dim weight
                    </p>
                  </div>
                  <div className='bg-green-50 rounded-lg p-3 border border-green-200'>
                    <p className='text-xs text-green-700 font-semibold mb-1'>
                      After Repack
                    </p>
                    <p className='text-sm text-slate-900'>~{newDims} cm</p>
                    <p className='text-xs text-green-600 mt-1'>
                      ~{calculateDimensionalWeight(newDims)} dim weight
                    </p>
                  </div>
                </div>

                <div className='flex flex-wrap gap-2 mb-2'>
                  {options?.removeRetailBox && (
                    <span className='px-2 py-1 bg-green-100 text-green-700 rounded text-xs'>
                      Remove Retail Box
                    </span>
                  )}
                  {options?.minimizeSize && (
                    <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs'>
                      Minimize Size
                    </span>
                  )}
                  {options?.addProtection && (
                    <span className='px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs'>
                      Extra Protection
                    </span>
                  )}
                </div>

                {options?.specialInstructions && (
                  <p className='text-xs text-slate-600 italic mt-2'>
                    "{options.specialInstructions}"
                  </p>
                )}

                <div className='mt-3 pt-3 border-t border-slate-200 flex justify-between items-center'>
                  <span className='text-sm text-slate-600'>
                    Estimated Savings:
                  </span>
                  <span className='text-lg font-bold text-green-600'>
                    ~{Math.round(savings)} MAD
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6'>
        <h4 className='font-bold text-slate-900 mb-4'>Cost Summary</h4>
        <div className='space-y-3'>
          <div className='flex justify-between text-sm'>
            <span className='text-slate-700'>
              Repack Service ({selectedPackages.length} packages)
            </span>
            <span className='font-semibold text-slate-900'>
              {getTotalCost()} MAD
            </span>
          </div>
          <div className='flex justify-between text-sm text-green-600'>
            <span>Estimated Shipping Savings</span>
            <span className='font-semibold'>
              ~{Math.round(getTotalSavings() + getTotalCost())} MAD
            </span>
          </div>
          <div className='border-t-2 border-blue-200 pt-3 flex justify-between'>
            <span className='font-bold text-slate-900'>Repack Fee</span>
            <span className='font-bold text-blue-600 text-xl'>
              {getTotalCost()} MAD
            </span>
          </div>
          <div className='bg-green-100 rounded-lg p-3 flex justify-between items-center'>
            <span className='font-bold text-green-900'>Net Savings</span>
            <span className='font-bold text-green-600 text-2xl'>
              ~{Math.round(getTotalSavings())} MAD
            </span>
          </div>
          <p className='text-xs text-slate-600'>
            ~${(getTotalCost() / 10).toFixed(2)} USD fee • Payment after
            completion
          </p>
        </div>
      </div>

      {/* Guarantee */}
      <div className='bg-green-50 rounded-xl p-6 border-2 border-green-200'>
        <div className='flex items-start gap-4'>
          <div className='w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0'>
            <Shield className='w-6 h-6 text-white' />
          </div>
          <div>
            <h4 className='font-bold text-green-900 mb-2'>💯 Our Guarantee</h4>
            <p className='text-sm text-green-800 mb-3'>
              If repacking doesn't provide cost savings or add protection to
              your package, we'll automatically refund the full {REPACK_FEE} MAD
              fee.
            </p>
            <p className='text-xs text-green-700'>
              You only pay if it saves you money!
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
        <Info className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-yellow-900'>
          <p className='font-semibold mb-1'>Please Note</p>
          <ul className='list-disc list-inside space-y-1 text-xs'>
            <li>Repacking cannot be undone once started</li>
            <li>Processing takes 1-2 business days</li>
            <li>We'll take photos before and after for your records</li>
            <li>Payment charged only if savings are achieved</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Step 4: Confirmation
  const Step4Confirmation = () => {
    const requestId = `RPK-${Date.now().toString().slice(-6)}`;
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 2);

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
            Repack Request Submitted!
          </h3>
          <p className='text-lg text-slate-600'>
            We'll start processing your packages
          </p>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto text-left'>
          <h4 className='font-bold text-slate-900 mb-4'>Request Details</h4>
          <div className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Request ID:</span>
              <span className='font-mono font-bold text-blue-600'>
                {requestId}
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
              <span className='text-slate-900 font-bold'>
                Fee (if beneficial):
              </span>
              <span className='font-bold text-green-600'>
                {getTotalCost()} MAD
              </span>
            </div>
          </div>
        </div>

        <div className='bg-green-50 rounded-xl p-6 max-w-md mx-auto text-left'>
          <h4 className='font-bold text-slate-900 mb-4'>What Happens Next</h4>
          <div className='space-y-4'>
            {[
              {
                icon: <Check className='w-4 h-4 text-green-600' />,
                title: 'Request Received',
                desc: 'Your request is confirmed and queued',
                status: 'done',
              },
              {
                icon: <Scissors className='w-4 h-4 text-blue-600' />,
                title: 'Repacking in Progress',
                desc: 'Our team repacks your packages (1-2 days)',
                status: 'current',
              },
              {
                icon: <Sparkles className='w-4 h-4 text-slate-400' />,
                title: 'Quality Check',
                desc: 'We verify savings and take photos',
                status: 'pending',
              },
              {
                icon: <RefreshCw className='w-4 h-4 text-slate-400' />,
                title: 'Ready to Ship',
                desc: 'Your optimized packages are ready!',
                status: 'pending',
              },
            ].map((step, i) => (
              <div key={i} className='flex items-start gap-3'>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'done'
                      ? 'bg-green-100'
                      : step.status === 'current'
                      ? 'bg-blue-100'
                      : 'bg-slate-100'
                  }`}
                >
                  {step.icon}
                </div>
                <div className='flex-1'>
                  <p
                    className={`font-semibold ${
                      step.status === 'pending'
                        ? 'text-slate-500'
                        : 'text-slate-900'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className='text-xs text-slate-600'>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-blue-50 rounded-xl p-4'>
          <p className='text-sm text-blue-900'>
            📧 Confirmation email sent! We'll update you with before/after
            photos and new dimensions.
          </p>
        </div>

        <div className='flex gap-3 justify-center'>
          <motion.button
            onClick={onClose}
            className='px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg'
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
                Repack Service
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
            {currentStep === 2 && <Step2RepackOptions key='step2' />}
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
              onClick={currentStep === 3 ? () => setCurrentStep(4) : nextStep}
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
                  Submit Request
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
};

// Demo Component
const RepackDemo: React.FC = () => {
  const [showWorkflow, setShowWorkflow] = useState(true);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 to-green-900 flex items-center justify-center p-6'>
      {!showWorkflow ? (
        <motion.button
          onClick={() => setShowWorkflow(true)}
          className='px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold text-lg shadow-2xl flex items-center gap-2'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Scissors className='w-6 h-6' />
          Request Repack Service
        </motion.button>
      ) : (
        <AnimatePresence>
          <RepackService onClose={() => setShowWorkflow(false)} />
        </AnimatePresence>
      )}
    </div>
  );
};

export default RepackDemo;
