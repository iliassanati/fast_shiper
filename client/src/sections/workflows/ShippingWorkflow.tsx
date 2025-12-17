// client/src/sections/workflows/ShippingWorkflow.tsx
import PaymentMethod, {
  type PaymentResult,
} from '@/components/payment/PaymentMethod';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useNotificationStore, usePackageStore } from '@/stores';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ShippingWorkflowProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

interface ShippingRate {
  objectId: string;
  carrier: string;
  productName: string;
  totalPrice: string;
  currency: string;
  deliveryTime: number;
  serviceLevel: string;
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({
  onClose,
  onSubmit,
  submitting,
}) => {
  const { packages, selectedPackageIds } = usePackageStore();
  const { showToast } = useNotificationStore();
  const { rates, loading: ratesLoading, fetchRates } = useShippingRates();

  // Steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Package selection (already done from PackagesPage)
  const selectedPackages = packages.filter((pkg) =>
    selectedPackageIds.includes(pkg.id)
  );

  // Step 2: Destination
  const [destination, setDestination] = useState({
    fullName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Morocco',
    phone: '',
  });

  // Step 3: Rate selection
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Step 4: Insurance (optional)
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceCoverage, setInsuranceCoverage] = useState(0);

  // Step 5: Customs
  const [customsItems, setCustomsItems] = useState<any[]>([]);

  // Payment data
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);

  // Calculate totals
  const totalWeight = selectedPackages.reduce(
    (sum, pkg) => sum + parseFloat(pkg.weight || '0'),
    0
  );

  const totalValue = selectedPackages.reduce(
    (sum, pkg) =>
      sum + parseFloat(pkg.estimatedValue.replace(/[^0-9.]/g, '') || '0'),
    0
  );

  // Auto-populate customs items
  useEffect(() => {
    if (selectedPackages.length > 0 && customsItems.length === 0) {
      const items = selectedPackages.map((pkg) => ({
        description: pkg.description || 'General Merchandise',
        quantity: 1,
        value: parseFloat(pkg.estimatedValue.replace(/[^0-9.]/g, '') || '0'),
        countryOfOrigin: 'US',
      }));
      setCustomsItems(items);
    }
  }, [selectedPackages, customsItems.length]);

  // Get dimensions from packages
  const getDimensions = () => {
    const dims = selectedPackages.map((pkg) => {
      const [l, w, h] = pkg.dimensions
        .split('x')
        .map((d) => parseFloat(d.trim()));
      return { length: l || 0, width: w || 0, height: h || 0 };
    });

    return {
      length: Math.max(...dims.map((d) => d.length)),
      width: Math.max(...dims.map((d) => d.width)),
      height: dims.reduce((sum, d) => sum + d.height, 0),
    };
  };

  // Handle rate fetch
  const handleFetchRates = async () => {
    if (!destination.city || !destination.postalCode) {
      showToast('Please fill in all destination fields', 'warning');
      return;
    }

    const dimensions = getDimensions();

    await fetchRates({
      weight: totalWeight,
      dimensions,
      destinationCity: destination.city,
      destinationPostalCode: destination.postalCode,
      declaredValue: totalValue,
    });

    if (rates.length > 0) {
      setCurrentStep(3);
    }
  };

  // Calculate costs
  const calculateCosts = () => {
    const shippingCost = selectedRate ? parseFloat(selectedRate.totalPrice) : 0;
    const insuranceCost = insuranceEnabled ? insuranceCoverage * 0.01 : 0;
    const total = shippingCost + insuranceCost;

    return {
      shipping: shippingCost,
      insurance: insuranceCost,
      total,
      currency: selectedRate?.currency || 'USD',
    };
  };

  // Handle payment completion and submission
  const handlePaymentComplete = async (payment: PaymentResult) => {
    setPaymentData(payment);

    const costs = calculateCosts();

    const shipmentData = {
      packageIds: selectedPackageIds,
      destination: {
        fullName: destination.fullName,
        street: destination.street,
        city: destination.city,
        postalCode: destination.postalCode,
        country: destination.country,
        phone: destination.phone,
      },
      carrier: selectedRate?.carrier || '',
      serviceLevel: selectedRate?.serviceLevel || '',
      rateObjectId: selectedRate?.objectId || '',
      insurance: insuranceEnabled
        ? {
            enabled: true,
            coverage: insuranceCoverage,
          }
        : undefined,
      customsInfo: customsItems,
      cost: {
        shipping: costs.shipping,
        insurance: costs.insurance,
        total: costs.total,
        currency: costs.currency,
      },
      payment: {
        method: payment.paymentMethod,
        transactionId: payment.transactionId,
        amount: costs.total,
        currency: costs.currency,
        timestamp: payment.timestamp,
      },
    };

    await onSubmit(shipmentData);
  };

  // Step content renderer
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-slate-900'>
              Selected Packages
            </h3>
            <p className='text-slate-600'>
              {selectedPackages.length} package(s) selected for shipping
            </p>
            <div className='space-y-3'>
              {selectedPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className='p-4 bg-slate-50 rounded-xl border border-slate-200'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='font-semibold text-slate-900'>
                        {pkg.description}
                      </p>
                      <p className='text-sm text-slate-600'>
                        {pkg.retailer} • {pkg.trackingNumber}
                      </p>
                      <p className='text-sm text-slate-600'>
                        Weight: {pkg.weight} • {pkg.dimensions}
                      </p>
                    </div>
                    <p className='font-semibold text-green-600'>
                      {pkg.estimatedValue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className='p-4 bg-blue-50 rounded-xl border border-blue-200'>
              <div className='flex justify-between items-center'>
                <span className='font-semibold text-slate-900'>
                  Total Weight:
                </span>
                <span className='font-bold text-blue-600'>
                  {totalWeight.toFixed(2)} kg
                </span>
              </div>
              <div className='flex justify-between items-center mt-2'>
                <span className='font-semibold text-slate-900'>
                  Total Value:
                </span>
                <span className='font-bold text-blue-600'>
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className='w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
            >
              Continue to Destination
              <ArrowRight className='w-5 h-5' />
            </button>
          </div>
        );

      case 2:
        return (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-slate-900'>
              Shipping Destination
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Full Name *
                </label>
                <input
                  type='text'
                  value={destination.fullName}
                  onChange={(e) =>
                    setDestination({ ...destination, fullName: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Street Address *
                </label>
                <input
                  type='text'
                  value={destination.street}
                  onChange={(e) =>
                    setDestination({ ...destination, street: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                  required
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    City *
                  </label>
                  <input
                    type='text'
                    value={destination.city}
                    onChange={(e) =>
                      setDestination({ ...destination, city: e.target.value })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    Postal Code *
                  </label>
                  <input
                    type='text'
                    value={destination.postalCode}
                    onChange={(e) =>
                      setDestination({
                        ...destination,
                        postalCode: e.target.value,
                      })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    required
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Country
                </label>
                <input
                  type='text'
                  value={destination.country}
                  disabled
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-100 text-slate-600'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>
                  Phone Number *
                </label>
                <input
                  type='tel'
                  value={destination.phone}
                  onChange={(e) =>
                    setDestination({ ...destination, phone: e.target.value })
                  }
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                  required
                />
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() => setCurrentStep(1)}
                className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2'
              >
                <ArrowLeft className='w-5 h-5' />
                Back
              </button>
              <button
                onClick={handleFetchRates}
                disabled={
                  ratesLoading ||
                  !destination.fullName ||
                  !destination.street ||
                  !destination.city ||
                  !destination.postalCode ||
                  !destination.phone
                }
                className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {ratesLoading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    Loading Rates...
                  </>
                ) : (
                  <>
                    Get Shipping Rates
                    <ArrowRight className='w-5 h-5' />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-slate-900'>
              Select Shipping Rate
            </h3>
            {rates.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-slate-600'>
                  No shipping rates available. Please try different options.
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {rates.map((rate: any) => (
                  <motion.div
                    key={rate.objectId}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRate(rate)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedRate?.objectId === rate.objectId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedRate?.objectId === rate.objectId
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedRate?.objectId === rate.objectId && (
                            <Check className='w-4 h-4 text-white' />
                          )}
                        </div>
                        <div>
                          <p className='font-semibold text-slate-900'>
                            {rate.carrier}
                          </p>
                          <p className='text-sm text-slate-600'>
                            {rate.productName}
                          </p>
                          <p className='text-sm text-slate-500'>
                            Delivery: ~{rate.deliveryTime} days
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-2xl font-bold text-slate-900'>
                          {rate.totalPrice}
                        </p>
                        <p className='text-sm text-slate-600'>
                          {rate.currency}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <div className='flex gap-3'>
              <button
                onClick={() => setCurrentStep(2)}
                className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2'
              >
                <ArrowLeft className='w-5 h-5' />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!selectedRate}
                className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                Continue to Insurance
                <ArrowRight className='w-5 h-5' />
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-slate-900'>
              Insurance (Optional)
            </h3>
            <div className='p-4 border-2 border-slate-200 rounded-xl'>
              <label className='flex items-center gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={insuranceEnabled}
                  onChange={(e) => setInsuranceEnabled(e.target.checked)}
                  className='w-5 h-5 rounded'
                />
                <span className='font-semibold text-slate-900'>
                  Add shipping insurance
                </span>
              </label>
              <AnimatePresence>
                {insuranceEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='mt-4'
                  >
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Coverage Amount ($)
                    </label>
                    <input
                      type='number'
                      value={insuranceCoverage}
                      onChange={(e) =>
                        setInsuranceCoverage(parseFloat(e.target.value) || 0)
                      }
                      min='0'
                      step='100'
                      max={totalValue}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      placeholder='Enter coverage amount'
                    />
                    <p className='text-sm text-slate-600 mt-2'>
                      Insurance cost: ${(insuranceCoverage * 0.01).toFixed(2)}{' '}
                      (1% of coverage)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() => setCurrentStep(3)}
                className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2'
              >
                <ArrowLeft className='w-5 h-5' />
                Back
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
              >
                Continue to Payment
                <ArrowRight className='w-5 h-5' />
              </button>
            </div>
          </div>
        );

      case 5:
        const costs = calculateCosts();
        return (
          <div className='space-y-6'>
            <h3 className='text-xl font-bold text-slate-900'>
              Review & Payment
            </h3>

            {/* Summary */}
            <div className='p-6 bg-slate-50 rounded-xl space-y-3'>
              <div className='flex justify-between'>
                <span className='text-slate-700'>Packages:</span>
                <span className='font-semibold'>
                  {selectedPackageIds.length}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-700'>Carrier:</span>
                <span className='font-semibold'>{selectedRate?.carrier}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-700'>Service:</span>
                <span className='font-semibold'>
                  {selectedRate?.productName}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-700'>Destination:</span>
                <span className='font-semibold'>
                  {destination.city}, {destination.country}
                </span>
              </div>
              <div className='border-t border-slate-200 pt-3 mt-3'>
                <div className='flex justify-between'>
                  <span className='text-slate-700'>Shipping:</span>
                  <span className='font-semibold'>
                    ${costs.shipping.toFixed(2)}
                  </span>
                </div>
                {insuranceEnabled && (
                  <div className='flex justify-between mt-2'>
                    <span className='text-slate-700'>Insurance:</span>
                    <span className='font-semibold'>
                      ${costs.insurance.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between font-bold text-lg mt-3 pt-3 border-t border-slate-200'>
                  <span>Total:</span>
                  <span className='text-blue-600'>
                    ${costs.total.toFixed(2)} {costs.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <PaymentMethod
              totalAmount={costs.total}
              currency={costs.currency}
              onPaymentComplete={handlePaymentComplete}
              onCancel={() => setCurrentStep(4)}
              loading={submitting}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='max-w-3xl mx-auto'>
      {/* Progress */}
      <div className='mb-8'>
        <div className='flex justify-between items-center mb-4'>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className='flex items-center'>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step < currentStep ? <Check className='w-5 h-5' /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-full h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className='h-2 bg-slate-200 rounded-full overflow-hidden'>
          <motion.div
            className='h-full bg-blue-600'
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className='bg-white rounded-2xl shadow-xl p-6 border border-slate-200'>
        {renderStep()}
      </div>

      {/* Close Button */}
      <div className='mt-4 text-center'>
        <button
          onClick={onClose}
          disabled={submitting}
          className='text-slate-600 hover:text-slate-900 font-semibold disabled:opacity-50'
        >
          Cancel Shipping
        </button>
      </div>
    </div>
  );
};

export default ShippingWorkflow;
