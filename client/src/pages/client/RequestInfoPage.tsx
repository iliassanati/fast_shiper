// client/src/pages/client/RequestInfoPage.tsx - COMPLETE FIXED VERSION
import { apiHelpers } from '@/lib/api';
import { useNotificationStore, usePackageStore } from '@/stores';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  X,
  Zap,
  Info,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';

type RequestType = 'photos' | 'information' | 'both';

// FIXED PRICING - $2 USD / 20 MAD
const FIXED_PRICE_USD = 2;
const FIXED_PRICE_MAD = 20;

export default function RequestInfoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { packages, selectedPackageIds, fetchPackages } = usePackageStore();
  const { showToast } = useNotificationStore();

  // 🔥 FIX #1: Get packageId from URL params for auto-selection
  const packageIdFromUrl = searchParams.get('packageId');

  const [currentStep, setCurrentStep] = useState(1);

  // 🔥 FIX #1: Auto-select package from URL or selectedPackageIds
  const preSelectedPackageId = packageIdFromUrl || selectedPackageIds[0] || '';
  const [selectedPackage, setSelectedPackage] =
    useState<string>(preSelectedPackageId);

  const [requestType, setRequestType] = useState<RequestType>('photos');

  // 🔥 FIX #3: Removed additionalPhotos state - fixed price now
  const [specificRequests, setSpecificRequests] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🔥 FIX #6: Only 3 steps now (removed payment steps)
  const totalSteps = 3;

  // Fetch packages on mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        console.log('📦 Loading packages for photo request...');
        await fetchPackages({ limit: 100 });
      } catch (error) {
        console.error('Error loading packages:', error);
        showToast('Failed to load packages', 'error');
      }
    };
    loadPackages();
  }, [fetchPackages, showToast]);

  // 🔥 FIX #1: Auto-select package when URL param or selectedPackageIds available
  useEffect(() => {
    const newSelection = packageIdFromUrl || selectedPackageIds[0] || '';
    if (newSelection && newSelection !== selectedPackage) {
      setSelectedPackage(newSelection);
      console.log('📦 Auto-selected package:', newSelection);
    }
  }, [packageIdFromUrl, selectedPackageIds]);

  const availablePackages = packages.filter((pkg) => pkg.status === 'received');

  const photoOptions = [
    {
      id: 'angles',
      label: 'Different Angles',
      desc: 'Multiple views of the package',
    },
    {
      id: 'opened',
      label: 'Package Opened',
      desc: 'Contents visible inside box',
    },
    {
      id: 'closeup',
      label: 'Close-up Details',
      desc: 'Detailed shots of specific items',
    },
    { id: 'label', label: 'Shipping Label', desc: 'Clear photo of the label' },
    {
      id: 'damage',
      label: 'Damage Check',
      desc: 'Look for any visible damage',
    },
    {
      id: 'dimensions',
      label: 'With Ruler',
      desc: 'Package next to measuring tape',
    },
  ];

  const informationOptions = [
    {
      id: 'condition',
      label: 'Package Condition',
      desc: 'Overall condition assessment',
    },
    {
      id: 'contents',
      label: 'Contents Check',
      desc: 'Visual inspection of items inside',
    },
    {
      id: 'brand',
      label: 'Brand Verification',
      desc: 'Confirm brand/model of items',
    },
    {
      id: 'quantity',
      label: 'Quantity Count',
      desc: 'Count items inside package',
    },
    {
      id: 'accessories',
      label: 'Accessories Check',
      desc: 'Verify included accessories',
    },
    {
      id: 'working',
      label: 'Working Condition',
      desc: 'Basic functionality check (if possible)',
    },
  ];

  const toggleSpecificRequest = (id: string) => {
    setSpecificRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== '';
      case 2:
        return specificRequests.length > 0 || customInstructions.trim() !== '';
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
    if (submitting) return;

    setSubmitting(true);
    try {
      console.log('📸 Submitting photo request...');

      const requestData = {
        packageId: selectedPackage,
        requestType,
        additionalPhotos: 1, // Fixed: always 1 photo for $2
        specificRequests,
        customInstructions,
      };

      console.log('📤 Request data:', requestData);

      await apiHelpers.post('/photo-requests', requestData);

      console.log('✅ Photo request created');

      showToast(
        `Photo request submitted! You'll pay $${FIXED_PRICE_USD} during shipping.`,
        'success'
      );

      // 🔥 FIX #7: Navigate to package details after submission
      navigate(`/packages/${selectedPackage}`);
    } catch (error: any) {
      console.error('❌ Error creating photo request:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to submit photo request';

      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 FIX #2: Navigate to package details on close
  const handleClose = () => {
    if (selectedPackage) {
      navigate(`/packages/${selectedPackage}`);
    } else {
      navigate('/packages');
    }
  };

  // Step 1: Select Package
  const Step1SelectPackage = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Select Package
        </h3>
        <p className='text-slate-600'>
          Choose which package you'd like photos or information about
        </p>
      </div>

      {/* 🔥 FIX #5: Payment timing info */}
      <div className='bg-blue-50 rounded-xl p-4 border-2 border-blue-200'>
        <div className='flex items-start gap-3'>
          <Info className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
          <div>
            <p className='font-semibold text-blue-900 mb-1'>
              Fixed Price: ${FIXED_PRICE_USD} USD ({FIXED_PRICE_MAD} MAD)
            </p>
            <p className='text-sm text-blue-800'>
              Payment will be added to your shipping cost when you ship this
              package. No payment needed now.
            </p>
          </div>
        </div>
      </div>

      {availablePackages.length === 0 ? (
        <div className='text-center py-12'>
          <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
          <p className='text-slate-600 font-semibold mb-2'>
            No packages in storage
          </p>
          <p className='text-sm text-slate-500'>
            You need packages in storage to request photos
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {availablePackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPackage === pkg.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className='flex items-center gap-4'>
                <div className='text-4xl'>{pkg.photo}</div>
                <div className='flex-1'>
                  <h4 className='font-bold text-slate-900'>
                    {pkg.description}
                  </h4>
                  <div className='flex items-center gap-3 text-sm text-slate-600 mt-1'>
                    <span>{pkg.retailer}</span>
                    <span>•</span>
                    <span>{pkg.weight} kg</span>
                    <span>•</span>
                    <span>Day {pkg.storageDay}</span>
                  </div>
                </div>
                {selectedPackage === pkg.id && (
                  <Check className='w-6 h-6 text-blue-600' />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 2: Specify Requests
  const Step2SpecifyRequests = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          What do you need?
        </h3>
        <p className='text-slate-600'>
          Specify your photo and information requests
        </p>
      </div>

      {/* 🔥 FIX #5: Payment reminder */}
      <div className='bg-green-50 rounded-xl p-4 border-2 border-green-200'>
        <div className='flex items-start gap-3'>
          <Check className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' />
          <div>
            <p className='font-semibold text-green-900'>
              Fixed ${FIXED_PRICE_USD} - Paid During Shipping
            </p>
            <p className='text-sm text-green-800'>
              This cost will be added to your shipping fee. No payment required
              now.
            </p>
          </div>
        </div>
      </div>

      {/* Request Type Selection */}
      <div>
        <label className='block text-sm font-semibold text-slate-700 mb-3'>
          Request Type
        </label>
        <div className='grid grid-cols-3 gap-3'>
          {[
            { value: 'photos', label: 'Photos Only', icon: Camera },
            { value: 'information', label: 'Info Only', icon: FileText },
            { value: 'both', label: 'Both', icon: Zap },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setRequestType(option.value as RequestType)}
              className={`p-4 rounded-xl border-2 transition-all ${
                requestType === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <option.icon
                className={`w-6 h-6 mx-auto mb-2 ${
                  requestType === option.value
                    ? 'text-blue-600'
                    : 'text-slate-400'
                }`}
              />
              <p className='text-sm font-semibold text-slate-900'>
                {option.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Specific Photo Requests */}
      {(requestType === 'photos' || requestType === 'both') && (
        <div>
          <label className='block text-sm font-semibold text-slate-700 mb-3'>
            Specific Photo Requests (Optional)
          </label>
          <div className='grid md:grid-cols-2 gap-3'>
            {photoOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleSpecificRequest(option.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  specificRequests.includes(option.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className='flex items-start gap-2'>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      specificRequests.includes(option.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {specificRequests.includes(option.id) && (
                      <Check className='w-3 h-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-slate-900 text-sm'>
                      {option.label}
                    </p>
                    <p className='text-xs text-slate-600'>{option.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Information Requests */}
      {(requestType === 'information' || requestType === 'both') && (
        <div>
          <label className='block text-sm font-semibold text-slate-700 mb-3'>
            Information Requests (Optional)
          </label>
          <div className='grid md:grid-cols-2 gap-3'>
            {informationOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleSpecificRequest(option.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  specificRequests.includes(option.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className='flex items-start gap-2'>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      specificRequests.includes(option.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {specificRequests.includes(option.id) && (
                      <Check className='w-3 h-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p className='font-semibold text-slate-900 text-sm'>
                      {option.label}
                    </p>
                    <p className='text-xs text-slate-600'>{option.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 FIX #4: Simplified textarea - inline onChange */}
      <div>
        <label className='block text-sm font-semibold text-slate-700 mb-2'>
          Custom Instructions (Optional)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder='Any specific instructions or questions about your package...'
          rows={4}
          className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
        />
      </div>
    </div>
  );

  // Step 3: Review & Submit
  const Step3ReviewConfirm = () => {
    const selectedPkg = availablePackages.find((p) => p.id === selectedPackage);

    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Review Your Request
          </h3>
          <p className='text-slate-600'>Confirm details before submitting</p>
        </div>

        {/* Package Info */}
        {selectedPkg && (
          <div className='bg-white rounded-xl border border-slate-200 p-6'>
            <h4 className='font-bold text-slate-900 mb-4'>Package</h4>
            <div className='flex items-center gap-4 p-4 bg-slate-50 rounded-xl'>
              <div className='text-4xl'>{selectedPkg.photo}</div>
              <div className='flex-1'>
                <p className='font-bold text-slate-900'>
                  {selectedPkg.description}
                </p>
                <div className='flex items-center gap-3 text-sm text-slate-600 mt-1'>
                  <span>{selectedPkg.retailer}</span>
                  <span>•</span>
                  <span>{selectedPkg.weight} kg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Details */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Request Details</h4>
          <div className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Type:</span>
              <span className='font-semibold text-slate-900 capitalize'>
                {requestType}
              </span>
            </div>
            {specificRequests.length > 0 && (
              <div>
                <p className='text-slate-600 mb-2'>Specific Requests:</p>
                <div className='flex flex-wrap gap-2'>
                  {specificRequests.map((req) => (
                    <span
                      key={req}
                      className='px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold'
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {customInstructions && (
              <div className='pt-3 border-t border-slate-200'>
                <p className='text-slate-600 mb-2'>Custom Instructions:</p>
                <p className='text-slate-700 italic'>"{customInstructions}"</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔥 FIX #3 & #5: Show fixed price with payment timing info */}
        <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Cost Summary</h4>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-slate-700'>Photo Request Fee</span>
              <span className='text-2xl font-bold text-blue-600'>
                ${FIXED_PRICE_USD} USD
              </span>
            </div>
            <div className='flex justify-between text-sm text-slate-600'>
              <span>Equivalent in MAD</span>
              <span className='font-semibold'>{FIXED_PRICE_MAD} MAD</span>
            </div>
            <div className='pt-3 border-t-2 border-blue-300'>
              <div className='bg-white rounded-lg p-3'>
                <p className='text-sm font-semibold text-blue-900 mb-1'>
                  💡 Payment Information
                </p>
                <p className='text-sm text-blue-800'>
                  This ${FIXED_PRICE_USD} fee will be{' '}
                  <strong>added to your shipping cost</strong> when you ship
                  this package. No payment is required now.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Info */}
        <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
          <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-blue-900'>
            <p className='font-semibold mb-1'>What happens next?</p>
            <ul className='space-y-1 list-disc list-inside'>
              <li>Your request will be processed within 1 business day</li>
              <li>Photos will be added to your package details</li>
              <li>The ${FIXED_PRICE_USD} fee will be included when you ship</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout activeSection='packages'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='max-w-4xl mx-auto'
      >
        <div className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl'>
          {/* Header */}
          <div className='bg-white border-b border-slate-200 p-6 rounded-t-3xl'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Request Photos & Information
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
                  className='h-full bg-gradient-to-r from-blue-600 to-purple-600'
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
              {currentStep === 1 && <Step1SelectPackage key='step1' />}
              {currentStep === 2 && <Step2SpecifyRequests key='step2' />}
              {currentStep === 3 && <Step3ReviewConfirm key='step3' />}
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
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
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
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
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
