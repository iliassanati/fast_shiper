// client/src/sections/workflows/ShippingWorkflow.tsx - FIXED with debugging
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  MapPin,
  Truck,
  Shield,
  DollarSign,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  AlertCircle,
  Info,
  Save,
} from 'lucide-react';
import { useShippingRates } from '@/hooks/useShippingRates';
import {
  useSavedAddresses,
  type SavedAddress,
} from '@/hooks/useSavedAddresses';
import PaymentMethod, {
  type PaymentResult,
} from '@/components/payment/PaymentMethod';
import SavedAddresses from '@/components/shipping/SavedAddresses';

interface ShippingWorkflowProps {
  selectedPackages: any[];
  consolidation?: {
    hasExtraProtection: boolean;
    photoRequests: number;
  };
  onSubmit: (shippingData: any) => void;
  onCancel: () => void;
}

export default function ShippingWorkflow({
  selectedPackages,
  consolidation,
  onSubmit,
  onCancel,
}: ShippingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { rates, loading: ratesLoading, fetchRates } = useShippingRates();

  // Saved addresses hook
  const {
    addresses,
    loading: addressesLoading,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useSavedAddresses();

  // Step 2: Destination
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [destination, setDestination] = useState({
    fullName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Morocco',
    phone: '',
  });

  // Step 3: Rate Selection
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Step 4: Insurance
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceCoverage, setInsuranceCoverage] = useState(0);

  // Debug: Log selected packages on mount
  useEffect(() => {
    console.log('🔍 Selected Packages:', selectedPackages);
    console.log('📦 Number of packages:', selectedPackages?.length);
    if (selectedPackages?.length > 0) {
      console.log('📋 Package structure:', selectedPackages[0]);
      console.log('⚖️ Package keys:', Object.keys(selectedPackages[0]));
    }
  }, [selectedPackages]);

  // Helper function to extract weight from package
  const getPackageWeight = (pkg: any): number => {
    // Try different possible property names
    return (
      pkg.weight ||
      pkg.totalWeight ||
      pkg.weightLbs ||
      pkg.weight_lbs ||
      pkg.packageWeight ||
      0
    );
  };

  // Helper function to extract value from package
  const getPackageValue = (pkg: any): number => {
    // Try different possible property names
    return (
      pkg.value ||
      pkg.totalValue ||
      pkg.declaredValue ||
      pkg.declared_value ||
      pkg.price ||
      pkg.amount ||
      0
    );
  };

  // Calculate totals with flexible property names
  const totalWeight = selectedPackages?.reduce(
    (sum, pkg) => sum + getPackageWeight(pkg),
    0
  );

  const totalValue = selectedPackages?.reduce(
    (sum, pkg) => sum + getPackageValue(pkg),
    0
  );

  // Log calculated totals
  useEffect(() => {
    console.log('📊 Total Weight:', totalWeight);
    console.log('💰 Total Value:', totalValue);
  }, [totalWeight, totalValue]);

  const steps = [
    { number: 1, name: 'Packages', icon: Package },
    { number: 2, name: 'Destination', icon: MapPin },
    { number: 3, name: 'Shipping', icon: Truck },
    { number: 4, name: 'Insurance', icon: Shield },
    { number: 5, name: 'Summary', icon: DollarSign },
    { number: 6, name: 'Payment', icon: CreditCard },
  ];

  // Handle saved address selection
  const handleSelectSavedAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setDestination({
      fullName: address.fullName,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    });
    setUseSavedAddress(true);
    setSaveThisAddress(false);
  };

  // Handle new address mode
  const handleAddNewAddress = () => {
    setUseSavedAddress(false);
    setSelectedAddressId(null);
    setDestination({
      fullName: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'Morocco',
      phone: '',
    });
  };

  const handleNext = async () => {
    // Step 2: Fetch rates after filling destination
    if (currentStep === 2) {
      // Validate destination
      if (
        !destination.fullName ||
        !destination.street ||
        !destination.city ||
        !destination.phone
      ) {
        alert('Please fill in all required fields');
        return;
      }

      // Save address if requested
      if (saveThisAddress && !useSavedAddress && addressLabel) {
        try {
          addAddress({
            label: addressLabel,
            ...destination,
            isDefault: addresses.length === 0,
          });
          console.log('✅ Address saved successfully');
        } catch (error) {
          console.error('❌ Failed to save address:', error);
        }
      }

      // Fetch rates
      await fetchRates({
        weight: totalWeight || 1, // Default to 1 if 0
        dimensions: { length: 12, width: 10, height: 8 },
        destinationPostalCode: destination.postalCode,
        destinationCity: destination.city,
        destinationPhone: destination.phone,
        declaredValue: totalValue || 100, // Default to 100 if 0
      });
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const calculateCosts = () => {
    const shipping = selectedRate?.amount || 0;
    const insurance = insuranceEnabled ? insuranceCoverage * 0.01 : 0;
    const protection = consolidation?.hasExtraProtection ? 2 : 0;
    const photoRequests = (consolidation?.photoRequests || 0) * 2;
    const total = shipping + insurance + protection + photoRequests;

    return {
      shipping,
      insurance,
      protection,
      photoRequests,
      total,
      packageValue:
        selectedPackages?.reduce(
          (sum, pkg) => sum + (getPackageValue(pkg) || 0),
          0
        ) || 0,
    };
  };

  const handlePaymentComplete = (paymentData: PaymentResult) => {
    const costs = calculateCosts();

    const shippingData = {
      destination,
      selectedRate,
      insurance: {
        enabled: insuranceEnabled,
        coverage: insuranceCoverage,
        cost: costs.insurance,
      },
      costs,
      payment: paymentData,
      packages: selectedPackages,
      consolidation,
    };

    console.log('✅ Shipping workflow complete:', shippingData);
    onSubmit(shippingData);
  };

  const costs = calculateCosts();
  const canProceed = {
    1: selectedPackages?.length > 0,
    2:
      destination.fullName &&
      destination.street &&
      destination.city &&
      destination.phone,
    3: selectedRate !== null,
    4: true,
    5: true,
    6: false,
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className='flex-1 relative'>
                <div className='flex flex-col items-center'>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white scale-110 shadow-lg'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className='w-6 h-6' />
                    ) : (
                      <Icon className='w-6 h-6' />
                    )}
                  </div>
                  <p className='text-xs font-semibold text-slate-600 mt-2 text-center'>
                    {step.name}
                  </p>
                </div>

                {step.number < steps.length && (
                  <div
                    className={`absolute top-6 left-1/2 w-full h-1 -z-10 transition-colors ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className='bg-white rounded-2xl shadow-lg p-8'
        >
          {/* Step 1: Package Review */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl'>
                  <Package className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Selected Packages
                </h2>
              </div>

              {/* Debug Info - Remove in production */}
              {import.meta.env.DEV && (
                <div className='p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 mb-4'>
                  <p className='text-xs font-mono text-yellow-900'>
                    DEBUG: {selectedPackages?.length} packages found
                    {selectedPackages?.length > 0 && (
                      <>
                        <br />
                        Weight detected: {totalWeight} lbs
                        <br />
                        Value detected: ${totalValue}
                      </>
                    )}
                  </p>
                </div>
              )}

              {selectedPackages?.length === 0 ? (
                <div className='p-6 bg-red-50 rounded-xl border-2 border-red-200'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='text-sm font-semibold text-red-900'>
                        No packages selected
                      </p>
                      <p className='text-sm text-red-800 mt-1'>
                        Please go back and select packages to ship.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className='space-y-4'>
                    {selectedPackages?.map((pkg, idx) => {
                      const weight = getPackageWeight(pkg);
                      const value = getPackageValue(pkg);

                      return (
                        <div
                          key={idx}
                          className='p-4 bg-slate-50 rounded-xl border-2 border-slate-200'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='font-semibold text-slate-900'>
                                {pkg.description ||
                                  pkg.name ||
                                  pkg.title ||
                                  `Package ${idx + 1}`}
                              </p>
                              <p className='text-sm text-slate-600'>
                                Weight:{' '}
                                {weight > 0 ? `${weight} lbs` : 'Not specified'}{' '}
                                | Value:{' '}
                                {value > 0 ? `$${value}` : 'Not specified'}
                              </p>
                              {pkg.trackingNumber && (
                                <p className='text-xs text-slate-500 mt-1'>
                                  Tracking: {pkg.trackingNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className='p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-slate-600'>Total Weight</p>
                        <p className='text-2xl font-bold text-blue-600'>
                          {totalWeight > 0
                            ? `${totalWeight} lbs`
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-slate-600'>Total Value</p>
                        <p className='text-2xl font-bold text-blue-600'>
                          {totalValue > 0 ? `$${totalValue}` : 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {(totalWeight === 0 || totalValue === 0) && (
                      <div className='mt-4 p-3 bg-yellow-100 rounded-lg'>
                        <p className='text-xs text-yellow-900'>
                          ⚠️ Missing weight or value will use default values for
                          shipping calculation
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Destination - Same as before */}
          {currentStep === 2 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl'>
                  <MapPin className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Shipping Destination
                </h2>
              </div>

              {/* Saved Addresses Section */}
              {addresses.length > 0 && (
                <SavedAddresses
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={handleSelectSavedAddress}
                  onDeleteAddress={deleteAddress}
                  onSetDefault={setDefaultAddress}
                  onAddNew={handleAddNewAddress}
                />
              )}

              {/* New Address Form */}
              {(!useSavedAddress || addresses.length === 0) && (
                <>
                  {addresses.length > 0 && (
                    <div className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200 mb-4'>
                      <p className='text-sm text-blue-900 font-semibold'>
                        💡 Using a new address
                      </p>
                    </div>
                  )}

                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Full Name *
                      </label>
                      <input
                        type='text'
                        value={destination.fullName}
                        onChange={(e) =>
                          setDestination({
                            ...destination,
                            fullName: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='John Doe'
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
                          setDestination({
                            ...destination,
                            street: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='123 Main St, Apt 4B'
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
                            setDestination({
                              ...destination,
                              city: e.target.value,
                            })
                          }
                          className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                          placeholder='Casablanca'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-semibold text-slate-700 mb-2'>
                          Postal Code
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
                          placeholder='20000'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Phone Number * (Required for some carriers)
                      </label>
                      <input
                        type='tel'
                        value={destination.phone}
                        onChange={(e) =>
                          setDestination({
                            ...destination,
                            phone: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='+212 6XX XXX XXX'
                      />
                    </div>

                    {/* Save Address Option */}
                    <div className='p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200'>
                      <label className='flex items-start gap-3 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={saveThisAddress}
                          onChange={(e) => setSaveThisAddress(e.target.checked)}
                          className='mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500'
                        />
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Save className='w-4 h-4 text-purple-600' />
                            <span className='font-semibold text-purple-900'>
                              Save this address for future use
                            </span>
                          </div>
                          <p className='text-sm text-purple-700'>
                            Quickly reuse this address next time you ship
                          </p>

                          {saveThisAddress && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className='mt-3'
                            >
                              <label className='block text-sm font-semibold text-purple-900 mb-2'>
                                Address Label *
                              </label>
                              <input
                                type='text'
                                value={addressLabel}
                                onChange={(e) =>
                                  setAddressLabel(e.target.value)
                                }
                                className='w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none'
                                placeholder='e.g., Home, Work, Moms House'
                              />
                            </motion.div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Steps 3-6 remain the same as in the previous version */}
          {/* I'll include them but they're unchanged */}

          {/* Step 3: Rate Selection */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl'>
                  <Truck className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Select Shipping Method
                </h2>
              </div>

              {ratesLoading ? (
                <div className='text-center py-12'>
                  <Loader2 className='w-12 h-12 animate-spin text-blue-600 mx-auto mb-4' />
                  <p className='text-slate-600'>Loading shipping rates...</p>
                </div>
              ) : rates.length === 0 ? (
                <div className='p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                    <p className='text-sm text-yellow-900'>
                      No shipping rates available. Please check your destination
                      details.
                    </p>
                  </div>
                </div>
              ) : (
                <div className='space-y-3'>
                  {rates?.map((rate, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRate(rate)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedRate?.objectId === rate.objectId
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
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
                              {rate.carrier} - {rate.serviceLevelName}
                            </p>
                            <p className='text-sm text-slate-600'>
                              Estimated: {rate.estimatedDays} business days
                            </p>
                            {rate.attributes.length > 0 && (
                              <p className='text-xs text-slate-500 mt-1'>
                                {rate.attributes.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold text-blue-600'>
                            ${rate.amount.toFixed(2)}
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
            </div>
          )}

          {/* Step 4: Insurance */}
          {currentStep === 4 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl'>
                  <Shield className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Additional Insurance
                </h2>
              </div>

              <div className='p-6 bg-blue-50 rounded-xl border-2 border-blue-200'>
                <div className='flex items-start gap-3'>
                  <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                  <p className='text-sm text-blue-900'>
                    Basic coverage up to $100 is included free. Add additional
                    insurance for high-value items at 1% of coverage amount.
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <label className='flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 transition-colors'>
                  <input
                    type='checkbox'
                    checked={insuranceEnabled}
                    onChange={(e) => setInsuranceEnabled(e.target.checked)}
                    className='w-5 h-5 text-blue-600 rounded focus:ring-blue-500'
                  />
                  <span className='font-semibold text-slate-900'>
                    Add Extra Insurance Protection
                  </span>
                </label>

                {insuranceEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='space-y-3'
                  >
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        Coverage Amount ($)
                      </label>
                      <input
                        type='number'
                        value={insuranceCoverage}
                        onChange={(e) =>
                          setInsuranceCoverage(Number(e.target.value))
                        }
                        min={100}
                        max={10000}
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='1000'
                      />
                    </div>

                    <div className='p-4 bg-slate-50 rounded-xl'>
                      <div className='flex items-center justify-between'>
                        <span className='text-slate-700'>Insurance Cost:</span>
                        <span className='text-xl font-bold text-blue-600'>
                          ${(insuranceCoverage * 0.01).toFixed(2)}
                        </span>
                      </div>
                      <p className='text-xs text-slate-500 mt-2'>
                        1% of coverage amount
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Payment Summary */}
          {currentStep === 5 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl'>
                  <DollarSign className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-slate-900'>
                  Payment Summary
                </h2>
              </div>

              {/* Cost Breakdown */}
              <div className='space-y-3'>
                <div className='p-4 bg-slate-50 rounded-xl border-2 border-slate-200'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-slate-700'>Shipping Fee</span>
                    <span className='font-bold text-slate-900'>
                      ${costs.shipping.toFixed(2)}
                    </span>
                  </div>
                  <p className='text-xs text-slate-500'>
                    {selectedRate?.carrier} - {selectedRate?.serviceLevelName}
                  </p>
                </div>

                {costs.insurance > 0 && (
                  <div className='p-4 bg-purple-50 rounded-xl border-2 border-purple-200'>
                    <div className='flex items-center justify-between'>
                      <span className='text-purple-700'>
                        Additional Insurance
                      </span>
                      <span className='font-bold text-purple-900'>
                        ${costs.insurance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {costs.protection > 0 && (
                  <div className='p-4 bg-green-50 rounded-xl border-2 border-green-200'>
                    <div className='flex items-center justify-between'>
                      <span className='text-green-700'>
                        Extra Protection Fee
                      </span>
                      <span className='font-bold text-green-900'>
                        ${costs.protection.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {costs.photoRequests > 0 && (
                  <div className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200'>
                    <div className='flex items-center justify-between'>
                      <span className='text-blue-700'>
                        Photo Requests ({consolidation?.photoRequests})
                      </span>
                      <span className='font-bold text-blue-900'>
                        ${costs.photoRequests.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className='p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white'>
                <div className='flex items-center justify-between'>
                  <span className='text-lg font-semibold'>Total Amount</span>
                  <span className='text-3xl font-bold'>
                    ${costs.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* What's Included */}
              <div className='p-4 bg-slate-50 rounded-xl border-2 border-slate-200'>
                <h3 className='font-semibold text-slate-900 mb-2'>
                  What's Included:
                </h3>
                <ul className='space-y-1 text-sm text-slate-600'>
                  <li>✓ Package handling and consolidation</li>
                  <li>✓ Secure shipping to Morocco</li>
                  <li>✓ Basic $100 insurance coverage</li>
                  <li>✓ Tracking number</li>
                  {consolidation?.hasExtraProtection && (
                    <li>✓ Extra protection packaging</li>
                  )}
                  {consolidation?.photoRequests > 0 && (
                    <li>✓ Photo documentation before shipping</li>
                  )}
                </ul>
              </div>

              {/* Shipping Details */}
              <div className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200'>
                <h3 className='font-semibold text-blue-900 mb-2'>
                  Shipping Details:
                </h3>
                <div className='space-y-1 text-sm text-blue-800'>
                  <p>
                    <strong>To:</strong> {destination.fullName}
                  </p>
                  <p>
                    {destination.street}, {destination.city}{' '}
                    {destination.postalCode}
                  </p>
                  <p>{destination.country}</p>
                  <p>
                    <strong>Carrier:</strong> {selectedRate?.carrier}
                  </p>
                  <p>
                    <strong>Service:</strong> {selectedRate?.serviceLevelName}
                  </p>
                  <p>
                    <strong>Estimated Delivery:</strong>{' '}
                    {selectedRate?.estimatedDays} business days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Payment */}
          {currentStep === 6 && (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl'>
                  <CreditCard className='w-6 h-6 text-white' />
                </div>
                <h2 className='text-2xl font-bold text-slate-900'>Payment</h2>
              </div>

              <PaymentMethod
                totalAmount={costs.total}
                currency='USD'
                onPaymentComplete={handlePaymentComplete}
                onCancel={handleBack}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 6 && (
            <div className='flex items-center gap-4 mt-8'>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className='px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2'
                >
                  <ChevronLeft className='w-5 h-5' />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed[currentStep as keyof typeof canProceed]}
                className='flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {currentStep === steps.length - 1 ? (
                  'Proceed to Payment'
                ) : (
                  <>
                    Next Step
                    <ChevronRight className='w-5 h-5' />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Cancel Button */}
          {currentStep === 1 && (
            <button
              onClick={onCancel}
              className='w-full px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors mt-4'
            >
              Cancel Shipping
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
