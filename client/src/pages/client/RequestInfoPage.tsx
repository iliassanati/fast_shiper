// client/src/pages/client/RequestInfoPage.tsx - COMPLETE WITH PAYMENT
import { apiHelpers } from '@/lib/api';
import { useNotificationStore, usePackageStore } from '@/stores';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Info,
  Minus,
  Plus,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type RequestType = 'photos' | 'information' | 'both';

export default function RequestInfoPage() {
  const navigate = useNavigate();
  const { packages } = usePackageStore();
  const { addNotification } = useNotificationStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [requestType, setRequestType] = useState<RequestType>('photos');
  const [additionalPhotos, setAdditionalPhotos] = useState(1);
  const [specificRequests, setSpecificRequests] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoRequestId, setPhotoRequestId] = useState<string>('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const PHOTO_REQUEST_COST = 20; // MAD per photo
  const INFORMATION_COST = 10; // MAD

  const totalSteps = 5; // Added payment step

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

  const calculateCost = () => {
    let total = 0;
    if (requestType === 'photos' || requestType === 'both') {
      total += additionalPhotos * PHOTO_REQUEST_COST;
    }
    if (requestType === 'information' || requestType === 'both') {
      total += INFORMATION_COST;
    }
    return total;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackage !== '';
      case 2:
        return specificRequests.length > 0 || customInstructions.trim() !== '';
      case 3:
        return true;
      case 4:
        return true; // Payment step
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
    if (currentStep > 1 && currentStep !== 4 && currentStep !== 5) {
      // Can't go back from payment or confirmation
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
        additionalPhotos:
          requestType === 'photos' || requestType === 'both'
            ? additionalPhotos
            : 0,
        specificRequests,
        customInstructions,
      };

      const response = await apiHelpers.post('/photo-requests', requestData);

      console.log('✅ Photo request created:', response);

      setPhotoRequestId(response.photoRequest._id);

      addNotification(
        `Photo request created! Please confirm payment to proceed.`,
        'success'
      );

      setCurrentStep(4); // Move to payment step
    } catch (error: any) {
      console.error('❌ Error creating photo request:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to submit photo request';

      addNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (confirmingPayment) return;

    setConfirmingPayment(true);
    try {
      console.log('💳 Confirming payment for photo request:', photoRequestId);

      await apiHelpers.post(
        `/photo-requests/${photoRequestId}/confirm-payment`,
        {
          paymentMethod: 'card',
        }
      );

      console.log('✅ Payment confirmed');

      addNotification(
        'Payment confirmed! Your request is now being processed.',
        'success'
      );

      setCurrentStep(5); // Move to final confirmation
    } catch (error: any) {
      console.error('❌ Error confirming payment:', error);

      const errorMessage =
        error.response?.data?.error || error.message || 'Payment failed';

      addNotification(errorMessage, 'error');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleClose = () => {
    navigate('/packages');
  };

  // ... (Keep Step1SelectPackage and Step2SpecifyRequests the same as before - from document index 23)

  // Step 3: Review - Same as before
  const Step3ReviewConfirm = () => {
    const selectedPkg = availablePackages.find((p) => p.id === selectedPackage);
    const totalCost = calculateCost();

    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Review Your Request
          </h3>
          <p className='text-slate-600'>
            Confirm details before proceeding to payment
          </p>
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

        {/* Cost Summary */}
        <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Cost Summary</h4>
          <div className='space-y-3'>
            {(requestType === 'photos' || requestType === 'both') && (
              <div className='flex justify-between text-sm'>
                <span className='text-slate-700'>
                  Photos ({additionalPhotos}x @ 20 MAD)
                </span>
                <span className='font-semibold text-slate-900'>
                  {additionalPhotos * PHOTO_REQUEST_COST} MAD
                </span>
              </div>
            )}

            {(requestType === 'information' || requestType === 'both') && (
              <div className='flex justify-between text-sm'>
                <span className='text-slate-700'>Package information</span>
                <span className='font-semibold text-slate-900'>
                  {INFORMATION_COST} MAD
                </span>
              </div>
            )}

            <div className='border-t-2 border-blue-200 pt-3 flex justify-between'>
              <span className='font-bold text-slate-900'>Total Cost</span>
              <span className='font-bold text-blue-600 text-xl'>
                {totalCost} MAD
              </span>
            </div>
            <p className='text-xs text-slate-600'>
              ~${(totalCost / 10).toFixed(2)} USD • Payment required to proceed
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Payment Confirmation (NEW)
  const Step4PaymentConfirmation = () => {
    const totalCost = calculateCost();

    return (
      <div className='space-y-6 text-center py-8'>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className='w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto'
        >
          <CreditCard className='w-12 h-12 text-blue-600' />
        </motion.div>

        <div>
          <h3 className='text-3xl font-bold text-slate-900 mb-2'>
            Confirm Payment
          </h3>
          <p className='text-lg text-slate-600'>
            Please confirm payment to process your request
          </p>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto'>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-slate-600'>Request Type:</span>
              <span className='font-semibold text-slate-900 capitalize'>
                {requestType}
              </span>
            </div>
            {(requestType === 'photos' || requestType === 'both') && (
              <div className='flex justify-between items-center'>
                <span className='text-slate-600'>Photos:</span>
                <span className='font-semibold text-slate-900'>
                  {additionalPhotos}
                </span>
              </div>
            )}
            <div className='border-t-2 border-slate-200 pt-4 flex justify-between items-center'>
              <span className='text-lg font-bold text-slate-900'>
                Total Amount:
              </span>
              <span className='text-2xl font-bold text-blue-600'>
                {totalCost} MAD
              </span>
            </div>
            <p className='text-sm text-slate-500'>
              ~${(totalCost / 10).toFixed(2)} USD
            </p>
          </div>
        </div>

        <div className='bg-yellow-50 rounded-xl p-4 max-w-md mx-auto'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-yellow-900 text-left'>
              <p className='font-semibold mb-1'>Payment Information</p>
              <p>
                In production, this would integrate with a payment gateway. For
                demo purposes, clicking "Confirm Payment" will simulate a
                successful payment.
              </p>
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleConfirmPayment}
          disabled={confirmingPayment}
          className='px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto'
          whileHover={{ scale: confirmingPayment ? 1 : 1.05 }}
          whileTap={{ scale: confirmingPayment ? 1 : 0.95 }}
        >
          {confirmingPayment ? (
            <>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              Processing...
            </>
          ) : (
            <>
              <Check className='w-5 h-5' />
              Confirm Payment
            </>
          )}
        </motion.button>
      </div>
    );
  };

  // Step 5: Final Confirmation (updated from step 4)
  const Step5Confirmation = () => {
    const requestId =
      photoRequestId || `REQ-${Date.now().toString().slice(-6)}`;
    const selectedPkg = availablePackages.find((p) => p.id === selectedPackage);

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
            Payment Confirmed!
          </h3>
          <p className='text-lg text-slate-600'>
            Your request is now being processed
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
              <span className='text-slate-600'>Package:</span>
              <span className='font-semibold text-slate-900'>
                {selectedPkg?.description}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Type:</span>
              <span className='font-semibold text-slate-900 capitalize'>
                {requestType}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Status:</span>
              <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold'>
                Processing
              </span>
            </div>
            <div className='border-t border-slate-200 pt-3 flex justify-between'>
              <span className='text-slate-900 font-bold'>Paid:</span>
              <span className='font-bold text-green-600'>
                {calculateCost()} MAD
              </span>
            </div>
          </div>
        </div>

        <div className='bg-green-50 rounded-xl p-4'>
          <p className='text-sm text-green-900'>
            📧 Confirmation email sent! Check your inbox for updates.
          </p>
        </div>

        <motion.button
          onClick={handleClose}
          className='px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Packages
        </motion.button>
      </div>
    );
  };

  // Keep Step1SelectPackage and Step2SpecifyRequests from original (document 23)
  // ... Add those steps here exactly as they were ...

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
                Request Photos & Information
              </h2>
              <p className='text-slate-600'>
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <button
              onClick={handleClose}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
              disabled={submitting || confirmingPayment}
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
            {currentStep === 1 && (
              <div key='step1'>{/* Step1SelectPackage */}</div>
            )}
            {currentStep === 2 && (
              <div key='step2'>{/* Step2SpecifyRequests */}</div>
            )}
            {currentStep === 3 && <Step3ReviewConfirm key='step3' />}
            {currentStep === 4 && <Step4PaymentConfirmation key='step4' />}
            {currentStep === 5 && <Step5Confirmation key='step5' />}
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
                  Create Request
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
