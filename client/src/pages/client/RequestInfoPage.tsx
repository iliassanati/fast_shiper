// client/src/pages/client/RequestInfoPage.tsx - COMPLETE WORKING VERSION
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

  const FIRST_PHOTO_COST = 40;
  const ADDITIONAL_PHOTO_COST = 10;

  const totalSteps = 4;
  const PHOTO_REQUEST_COST = 20; // $2 per photo = ~20 MAD
  const INFORMATION_COST = 10;
  // Get available packages (received status only)
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
      // $2 per photo = 20 MAD per photo
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
        additionalPhotos:
          requestType === 'photos' || requestType === 'both'
            ? additionalPhotos
            : 0,
        specificRequests,
        customInstructions,
      };

      console.log('📸 Request data:', requestData);

      const response = await apiHelpers.post('/photo-requests', requestData);

      console.log('✅ Photo request created:', response);

      addNotification(
        `Photo request submitted! Cost: ${
          response.photoRequest.cost.total
        } MAD (~$${(response.photoRequest.cost.total / 10).toFixed(2)})`,
        'success'
      );

      setCurrentStep(4); // Move to confirmation step
    } catch (error: any) {
      console.error('❌ Error creating photo request:', error);

      // Better error messages
      let errorMessage = 'Failed to submit photo request';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      addNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate('/packages');
  };

  // Step 1: Select Package & Request Type
  const Step1SelectPackage = () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          What would you like to request?
        </h3>
        <p className='text-slate-600'>
          Choose a package and select your request type
        </p>
      </div>

      {/* Request Type Selection */}
      <div className='grid md:grid-cols-3 gap-4'>
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => setRequestType('photos')}
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
            requestType === 'photos'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4'>
            <Camera className='w-6 h-6 text-white' />
          </div>
          <h4 className='font-bold text-slate-900 mb-2'>Additional Photos</h4>
          <p className='text-sm text-slate-600 mb-3'>
            Get more detailed photos of your package
          </p>
          <p className='text-xs text-blue-600 font-semibold'>
            20 MAD per photo (~$2)
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => setRequestType('information')}
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
            requestType === 'information'
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4'>
            <FileText className='w-6 h-6 text-white' />
          </div>
          <h4 className='font-bold text-slate-900 mb-2'>Package Information</h4>
          <p className='text-sm text-slate-600 mb-3'>
            Visual inspection & detailed report
          </p>
          <p className='text-xs text-purple-600 font-semibold'>10 MAD</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => setRequestType('both')}
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
            requestType === 'both'
              ? 'border-green-500 bg-green-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4'>
            <Zap className='w-6 h-6 text-white' />
          </div>
          <h4 className='font-bold text-slate-900 mb-2'>Both Services</h4>
          <p className='text-sm text-slate-600 mb-3'>
            Photos + detailed inspection report
          </p>
          <p className='text-xs text-green-600 font-semibold'>
            Combined service
          </p>
        </motion.div>
      </div>

      {/* Photo Count Selection */}
      {(requestType === 'photos' || requestType === 'both') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-blue-50 rounded-xl p-6 border border-blue-200'
        >
          <h4 className='font-bold text-slate-900 mb-4'>
            How many additional photos?
          </h4>
          <div className='flex items-center gap-4'>
            <motion.button
              onClick={() =>
                setAdditionalPhotos(Math.max(1, additionalPhotos - 1))
              }
              className='w-10 h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center hover:bg-blue-100'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minus className='w-5 h-5 text-blue-600' />
            </motion.button>

            <div className='flex-1 text-center'>
              <p className='text-4xl font-bold text-blue-600'>
                {additionalPhotos}
              </p>
              <p className='text-sm text-slate-600'>
                photo{additionalPhotos > 1 ? 's' : ''}
              </p>
              <p className='text-xs text-slate-500 mt-1'>
                {additionalPhotos * PHOTO_REQUEST_COST} MAD (~$
                {(additionalPhotos * 2).toFixed(2)})
              </p>
            </div>

            <motion.button
              onClick={() =>
                setAdditionalPhotos(Math.min(10, additionalPhotos + 1))
              }
              className='w-10 h-10 bg-white border-2 border-blue-300 rounded-lg flex items-center justify-center hover:bg-blue-100'
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className='w-5 h-5 text-blue-600' />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Package Selection */}
      <div>
        <h4 className='font-bold text-slate-900 mb-4'>Select Package</h4>
        {availablePackages.length === 0 ? (
          <div className='bg-yellow-50 rounded-xl p-6 text-center'>
            <AlertCircle className='w-12 h-12 text-yellow-600 mx-auto mb-3' />
            <p className='text-yellow-900 font-semibold mb-2'>
              No Packages Available
            </p>
            <p className='text-sm text-yellow-800'>
              You need packages in storage to request photos or information.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {availablePackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className='flex items-center gap-4'>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPackage === pkg.id
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedPackage === pkg.id && (
                      <div className='w-2 h-2 bg-white rounded-full' />
                    )}
                  </div>
                  <div className='text-4xl'>{pkg.photo}</div>
                  <div className='flex-1'>
                    <p className='font-bold text-slate-900'>
                      {pkg.description}
                    </p>
                    <div className='flex items-center gap-3 text-sm text-slate-600 mt-1'>
                      <span>{pkg.retailer}</span>
                      <span>•</span>
                      <span>{pkg.weight} kg</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className='bg-slate-50 rounded-xl p-4 flex items-start gap-3'>
        <Info className='w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-slate-700'>
          <p className='font-semibold mb-1'>What's Included</p>
          <p>
            Each package comes with 1 FREE basic photo. Request additional
            photos anytime.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2: Specify Requirements
  const Step2SpecifyRequests = () => {
    const selectedPkg = availablePackages.find((p) => p.id === selectedPackage);

    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            What would you like to see?
          </h3>
          <p className='text-slate-600'>
            Select specific requests or add custom instructions
          </p>
        </div>

        {selectedPkg && (
          <div className='bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200'>
            <div className='flex items-center gap-3'>
              <div className='text-3xl'>{selectedPkg.photo}</div>
              <div>
                <p className='font-bold text-slate-900'>
                  {selectedPkg.description}
                </p>
                <p className='text-sm text-slate-600'>
                  From {selectedPkg.retailer}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Requests */}
        {(requestType === 'photos' || requestType === 'both') && (
          <div className='bg-white rounded-xl border border-slate-200 p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <Camera className='w-5 h-5 text-blue-600' />
              <h4 className='font-bold text-slate-900'>Photo Requests</h4>
            </div>
            <p className='text-sm text-slate-600 mb-4'>
              Select what you'd like to see in the photos:
            </p>
            <div className='grid md:grid-cols-2 gap-3'>
              {photoOptions.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => toggleSpecificRequest(option.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    specificRequests.includes(option.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        specificRequests.includes(option.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {specificRequests.includes(option.id) && (
                        <Check className='w-3 h-3 text-white' />
                      )}
                    </div>
                    <div>
                      <p className='font-semibold text-slate-900 text-sm'>
                        {option.label}
                      </p>
                      <p className='text-xs text-slate-600'>{option.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Information Requests */}
        {(requestType === 'information' || requestType === 'both') && (
          <div className='bg-white rounded-xl border border-slate-200 p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <Search className='w-5 h-5 text-purple-600' />
              <h4 className='font-bold text-slate-900'>Inspection Requests</h4>
            </div>
            <p className='text-sm text-slate-600 mb-4'>
              What would you like us to check?
            </p>
            <div className='grid md:grid-cols-2 gap-3'>
              {informationOptions.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => toggleSpecificRequest(option.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    specificRequests.includes(option.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        specificRequests.includes(option.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {specificRequests.includes(option.id) && (
                        <Check className='w-3 h-3 text-white' />
                      )}
                    </div>
                    <div>
                      <p className='font-semibold text-slate-900 text-sm'>
                        {option.label}
                      </p>
                      <p className='text-xs text-slate-600'>{option.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Instructions */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-3'>
            Additional Instructions (Optional)
          </h4>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g., 'Please take a close-up of the serial number', 'Check if the box is sealed', etc."
            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none'
            rows={4}
          />
          <p className='text-xs text-slate-500 mt-2'>
            💡 Be as specific as possible to help our team fulfill your request
          </p>
        </div>

        <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
          <Clock className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-blue-900'>
            <p className='font-semibold mb-1'>Processing Time</p>
            <p>
              Requests are typically completed same or next business day
              (Mon-Fri).
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Review & Confirm
  const Step3ReviewConfirm = () => {
    const selectedPkg = availablePackages.find((p) => p.id === selectedPackage);
    const totalCost = calculateCost();

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

        {/* Request Type Summary */}
        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>Request Type</h4>
          <div className='space-y-3'>
            {(requestType === 'photos' || requestType === 'both') && (
              <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-xl'>
                <Camera className='w-6 h-6 text-blue-600' />
                <div className='flex-1'>
                  <p className='font-semibold text-slate-900'>
                    Additional Photos
                  </p>
                  <p className='text-sm text-slate-600'>
                    {additionalPhotos} photo{additionalPhotos > 1 ? 's' : ''}{' '}
                    requested
                  </p>
                </div>
                <p className='font-bold text-blue-600'>
                  {FIRST_PHOTO_COST +
                    (additionalPhotos - 1) * ADDITIONAL_PHOTO_COST}{' '}
                  MAD
                </p>
              </div>
            )}

            {(requestType === 'information' || requestType === 'both') && (
              <div className='flex items-center gap-3 p-4 bg-purple-50 rounded-xl'>
                <FileText className='w-6 h-6 text-purple-600' />
                <div className='flex-1'>
                  <p className='font-semibold text-slate-900'>
                    Package Information
                  </p>
                  <p className='text-sm text-slate-600'>
                    Visual inspection & report
                  </p>
                </div>
                <p className='font-bold text-purple-600'>
                  {INFORMATION_COST} MAD
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Specific Requests */}
        {specificRequests.length > 0 && (
          <div className='bg-white rounded-xl border border-slate-200 p-6'>
            <h4 className='font-bold text-slate-900 mb-4'>
              Specific Requests ({specificRequests.length})
            </h4>
            <div className='flex flex-wrap gap-2'>
              {specificRequests.map((reqId) => {
                const option = [...photoOptions, ...informationOptions].find(
                  (o) => o.id === reqId
                );
                return option ? (
                  <span
                    key={reqId}
                    className='px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium'
                  >
                    {option.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Custom Instructions */}
        {customInstructions && (
          <div className='bg-white rounded-xl border border-slate-200 p-6'>
            <h4 className='font-bold text-slate-900 mb-3'>
              Additional Instructions
            </h4>
            <div className='p-4 bg-slate-50 rounded-xl'>
              <p className='text-sm text-slate-700 italic'>
                "{customInstructions}"
              </p>
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
              ~${(totalCost / 10).toFixed(2)} USD • Charge after completion
            </p>
          </div>
        </div>

        {/* Important Notes */}
        <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
          <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-yellow-900'>
            <p className='font-semibold mb-1'>Please Note</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>
                Requests processed Mon-Fri during business hours (9am-5pm EST)
              </li>
              <li>Photos/reports available same or next business day</li>
              <li>You'll receive an email notification when ready</li>
              <li>Payment charged only after request is fulfilled</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Step 4: Confirmation
  const Step4Confirmation = () => {
    const requestId = `REQ-${Date.now().toString().slice(-6)}`;
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
            Request Submitted!
          </h3>
          <p className='text-lg text-slate-600'>
            We'll process your request shortly
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
              <span className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold'>
                Processing
              </span>
            </div>
            <div className='border-t border-slate-200 pt-3 flex justify-between'>
              <span className='text-slate-900 font-bold'>Cost:</span>
              <span className='font-bold text-green-600'>
                {calculateCost()} MAD
              </span>
            </div>
          </div>
        </div>

        <div className='bg-blue-50 rounded-xl p-6 max-w-md mx-auto text-left'>
          <h4 className='font-bold text-slate-900 mb-3'>What Happens Next</h4>
          <div className='space-y-3'>
            {[
              {
                icon: <Check className='w-4 h-4 text-green-600' />,
                text: 'Request received and queued',
                status: 'done',
              },
              {
                icon: <Eye className='w-4 h-4 text-blue-600' />,
                text: 'Team processes your request',
                status: 'current',
              },
              {
                icon: <Camera className='w-4 h-4 text-slate-400' />,
                text: 'Photos/report ready & emailed to you',
                status: 'pending',
              },
            ].map((step, i) => (
              <div key={i} className='flex items-center gap-3'>
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
                <p
                  className={`text-sm ${
                    step.status === 'pending'
                      ? 'text-slate-500'
                      : 'text-slate-900 font-semibold'
                  }`}
                >
                  {step.text}
                </p>
              </div>
            ))}
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
            <div className='flex justify-between mt-2 text-xs text-slate-600'>
              <span>Select</span>
              <span>Specify</span>
              <span>Review</span>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 max-h-[60vh] overflow-y-auto'>
          <AnimatePresence mode='wait'>
            {currentStep === 1 && <Step1SelectPackage key='step1' />}
            {currentStep === 2 && <Step2SpecifyRequests key='step2' />}
            {currentStep === 3 && <Step3ReviewConfirm key='step3' />}
            {currentStep === 4 && <Step4Confirmation key='step4' />}
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
}
