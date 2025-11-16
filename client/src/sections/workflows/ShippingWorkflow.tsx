// client/src/sections/workflows/ShippingWorkflow.tsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  MapPin,
  Truck,
  Shield,
  FileText,
  CreditCard,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { usePackageStore, useAuthStore, useNotificationStore } from '@/stores';
import { apiHelpers } from '@/lib/api';

interface ShippingWorkflowProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

type Step =
  | 'packages'
  | 'address'
  | 'carrier'
  | 'insurance'
  | 'customs'
  | 'review'
  | 'payment';

interface CarrierRate {
  productCode: string;
  productName: string;
  totalPrice: number;
  currency: string;
  deliveryTime: number;
  serviceLevel: string;
}

export default function ShippingWorkflow({
  onClose,
  onSubmit,
  submitting,
}: ShippingWorkflowProps) {
  const { packages, selectedPackageIds } = usePackageStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [currentStep, setCurrentStep] = useState<Step>('packages');
  const [selectedPackages, setSelectedPackages] =
    useState<string[]>(selectedPackageIds);
  const [loadingRates, setLoadingRates] = useState(false);
  const [rates, setRates] = useState<CarrierRate[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    // Address
    destination: {
      fullName: user?.name || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      postalCode: user?.address?.postalCode || '',
      country: 'Morocco',
      phone: user?.phone || '',
    },
    // Carrier
    carrier: 'DHL',
    serviceLevel: 'express',
    selectedRate: null as CarrierRate | null,
    // Insurance
    insurance: {
      coverage: 100,
      enabled: false,
    },
    // Customs
    customsInfo: [] as Array<{
      description: string;
      quantity: number;
      value: number;
      hsCode: string;
      countryOfOrigin: string;
    }>,
  });

  const steps: Array<{
    id: Step;
    label: string;
    icon: any;
  }> = [
    { id: 'packages', label: 'Select Packages', icon: Package },
    { id: 'address', label: 'Destination', icon: MapPin },
    { id: 'carrier', label: 'Shipping', icon: Truck },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'customs', label: 'Customs', icon: FileText },
    { id: 'review', label: 'Review', icon: Check },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Get selected package details
  const selectedPackageDetails = packages.filter((pkg) =>
    selectedPackages.includes(pkg.id)
  );

  const totalWeight = selectedPackageDetails.reduce(
    (sum, pkg) => sum + parseFloat(pkg.weight),
    0
  );

  const totalValue = selectedPackageDetails.reduce((sum, pkg) => {
    const value = parseFloat(pkg.estimatedValue.replace(/[^0-9.]/g, ''));
    return sum + value;
  }, 0);

  // Load DHL rates when carrier step is reached
  useEffect(() => {
    if (currentStep === 'carrier' && selectedPackages.length > 0) {
      fetchShippingRates();
    }
  }, [currentStep]);

  const fetchShippingRates = async () => {
    setLoadingRates(true);
    try {
      // Calculate combined dimensions (simplified - use largest dimensions)
      const maxDimensions = selectedPackageDetails.reduce(
        (max, pkg) => {
          const dims = pkg.dimensions.split('x').map((d) => parseFloat(d));
          return {
            length: Math.max(max.length, dims[0] || 0),
            width: Math.max(max.width, dims[1] || 0),
            height: Math.max(max.height, dims[2] || 0),
          };
        },
        { length: 0, width: 0, height: 0 }
      );

      const response = await apiHelpers.post<{ rates: CarrierRate[] }>(
        '/admin/shipments/get-rates',
        {
          weight: totalWeight,
          dimensions: maxDimensions,
        }
      );

      setRates(response.rates);

      // Pre-select the first rate
      if (response.rates.length > 0) {
        setFormData((prev) => ({
          ...prev,
          selectedRate: response.rates[0],
          serviceLevel: response.rates[0].serviceLevel,
        }));
      }
    } catch (error: any) {
      console.error('Failed to fetch rates:', error);
      addNotification('Failed to load shipping rates', 'error');
    } finally {
      setLoadingRates(false);
    }
  };

  const handleNext = () => {
    // Validation
    if (currentStep === 'packages' && selectedPackages.length === 0) {
      addNotification('Please select at least one package', 'warning');
      return;
    }

    if (currentStep === 'address') {
      if (
        !formData.destination.fullName ||
        !formData.destination.street ||
        !formData.destination.city ||
        !formData.destination.postalCode ||
        !formData.destination.phone
      ) {
        addNotification('Please fill in all address fields', 'warning');
        return;
      }
    }

    if (currentStep === 'carrier' && !formData.selectedRate) {
      addNotification('Please select a shipping option', 'warning');
      return;
    }

    if (currentStep === 'customs') {
      if (formData.customsInfo.length === 0) {
        addNotification('Please add at least one customs item', 'warning');
        return;
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit({
        packageIds: selectedPackages,
        destination: formData.destination,
        carrier: formData.carrier,
        serviceLevel: formData.serviceLevel,
        insurance: formData.insurance.enabled
          ? {
              coverage: formData.insurance.coverage,
            }
          : undefined,
        customsInfo: formData.customsInfo,
      });
    } catch (error) {
      console.error('Shipment creation failed:', error);
    }
  };

  const addCustomsItem = () => {
    setFormData((prev) => ({
      ...prev,
      customsInfo: [
        ...prev.customsInfo,
        {
          description: '',
          quantity: 1,
          value: 0,
          hsCode: '',
          countryOfOrigin: 'US',
        },
      ],
    }));
  };

  const updateCustomsItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      customsInfo: prev.customsInfo.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeCustomsItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customsInfo: prev.customsInfo.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <button
              onClick={onClose}
              className='p-2 hover:bg-white rounded-lg transition-colors'
            >
              <ArrowLeft className='w-6 h-6' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Ship Your Packages
              </h1>
              <p className='text-slate-600'>
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className='mb-8 bg-white rounded-2xl p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            {steps.map((step, index) => (
              <div key={step.id} className='flex items-center flex-1'>
                <div className='flex flex-col items-center flex-1'>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className='w-6 h-6' />
                    ) : (
                      <step.icon className='w-6 h-6' />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 font-semibold ${
                      index <= currentStepIndex
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='bg-white rounded-2xl p-8 shadow-lg mb-6'
          >
            {/* STEP 1: Package Selection */}
            {currentStep === 'packages' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                  Select Packages to Ship
                </h2>
                <div className='space-y-4'>
                  {packages
                    .filter((pkg) => pkg.status === 'received')
                    .map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => {
                          if (selectedPackages.includes(pkg.id)) {
                            setSelectedPackages(
                              selectedPackages.filter((id) => id !== pkg.id)
                            );
                          } else {
                            setSelectedPackages([...selectedPackages, pkg.id]);
                          }
                        }}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedPackages.includes(pkg.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className='flex items-center gap-4'>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedPackages.includes(pkg.id)
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300'
                            }`}
                          >
                            {selectedPackages.includes(pkg.id) && (
                              <Check className='w-4 h-4 text-white' />
                            )}
                          </div>
                          <div className='text-4xl'>{pkg.photo}</div>
                          <div className='flex-1'>
                            <p className='font-bold text-slate-900'>
                              {pkg.description}
                            </p>
                            <p className='text-sm text-slate-600'>
                              {pkg.retailer} • {pkg.weight} kg •{' '}
                              {pkg.dimensions}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-bold text-blue-600'>
                              {pkg.estimatedValue}
                            </p>
                            <p className='text-xs text-slate-500'>
                              Day {pkg.storageDay}/45
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {selectedPackages.length > 0 && (
                  <div className='mt-6 p-4 bg-blue-50 rounded-xl'>
                    <p className='text-sm font-semibold text-blue-900'>
                      {selectedPackages.length} package(s) selected • Total
                      weight: {totalWeight.toFixed(2)} kg • Total value: $
                      {totalValue.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Destination Address */}
            {currentStep === 'address' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                  Destination Address
                </h2>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      value={formData.destination.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            fullName: e.target.value,
                          },
                        }))
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      placeholder='John Doe'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Street Address
                    </label>
                    <input
                      type='text'
                      value={formData.destination.street}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            street: e.target.value,
                          },
                        }))
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      placeholder='123 Main Street, Apt 4B'
                    />
                  </div>

                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold text-slate-700 mb-2'>
                        City
                      </label>
                      <input
                        type='text'
                        value={formData.destination.city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            destination: {
                              ...prev.destination,
                              city: e.target.value,
                            },
                          }))
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
                        value={formData.destination.postalCode}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            destination: {
                              ...prev.destination,
                              postalCode: e.target.value,
                            },
                          }))
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='20000'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Phone Number
                    </label>
                    <input
                      type='tel'
                      value={formData.destination.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            phone: e.target.value,
                          },
                        }))
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      placeholder='+212 6 12 34 56 78'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Carrier Selection */}
            {currentStep === 'carrier' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                  Select Shipping Option
                </h2>

                {loadingRates ? (
                  <div className='text-center py-12'>
                    <Loader2 className='w-12 h-12 text-blue-600 animate-spin mx-auto mb-4' />
                    <p className='text-slate-600'>Loading shipping rates...</p>
                  </div>
                ) : rates.length > 0 ? (
                  <div className='space-y-4'>
                    {rates.map((rate) => (
                      <div
                        key={rate.productCode}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            selectedRate: rate,
                            serviceLevel: rate.serviceLevel,
                          }))
                        }
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.selectedRate?.productCode ===
                          rate.productCode
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-4'>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                formData.selectedRate?.productCode ===
                                rate.productCode
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-slate-300'
                              }`}
                            >
                              {formData.selectedRate?.productCode ===
                                rate.productCode && (
                                <Check className='w-4 h-4 text-white' />
                              )}
                            </div>
                            <Truck className='w-8 h-8 text-blue-600' />
                            <div>
                              <p className='font-bold text-slate-900'>
                                DHL {rate.productName}
                              </p>
                              <p className='text-sm text-slate-600'>
                                Estimated delivery: {rate.deliveryTime} business
                                days
                              </p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='text-2xl font-bold text-slate-900'>
                              {rate.totalPrice} {rate.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-12'>
                    <AlertCircle className='w-12 h-12 text-orange-500 mx-auto mb-4' />
                    <p className='text-slate-600'>
                      No shipping rates available. Please try again.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Insurance */}
            {currentStep === 'insurance' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                  Package Insurance
                </h2>

                <div className='space-y-6'>
                  <div className='p-6 bg-blue-50 rounded-xl border-2 border-blue-200'>
                    <div className='flex items-start gap-3'>
                      <Shield className='w-6 h-6 text-blue-600 mt-1' />
                      <div>
                        <h3 className='font-bold text-blue-900 mb-2'>
                          Free Coverage up to $100
                        </h3>
                        <p className='text-sm text-blue-800'>
                          All shipments include free insurance coverage up to
                          $100 USD. Your current package value: $
                          {totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {totalValue > 100 && (
                    <div>
                      <label className='flex items-center gap-3 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={formData.insurance.enabled}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              insurance: {
                                ...prev.insurance,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                          className='w-5 h-5'
                        />
                        <span className='font-semibold text-slate-900'>
                          Add additional insurance coverage
                        </span>
                      </label>

                      {formData.insurance.enabled && (
                        <div className='mt-4'>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Coverage Amount (USD)
                          </label>
                          <input
                            type='number'
                            min={100}
                            max={totalValue}
                            step={100}
                            value={formData.insurance.coverage}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                insurance: {
                                  ...prev.insurance,
                                  coverage: parseInt(e.target.value),
                                },
                              }))
                            }
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                          />
                          <p className='text-xs text-slate-500 mt-2'>
                            Insurance cost: 5 MAD per $100 above free coverage
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Customs Information */}
            {currentStep === 'customs' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                  Customs Declaration
                </h2>

                <div className='mb-6 p-4 bg-orange-50 rounded-xl border-2 border-orange-200'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-5 h-5 text-orange-600 mt-0.5' />
                    <div>
                      <p className='text-sm text-orange-900 font-semibold'>
                        Accurate customs information is required for
                        international shipping
                      </p>
                      <p className='text-xs text-orange-800 mt-1'>
                        Please provide accurate descriptions and values to avoid
                        customs delays
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  {formData.customsInfo.map((item, index) => (
                    <div
                      key={index}
                      className='p-4 border-2 border-slate-200 rounded-xl'
                    >
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='font-bold text-slate-900'>
                          Item {index + 1}
                        </h3>
                        <button
                          onClick={() => removeCustomsItem(index)}
                          className='p-2 text-red-600 hover:bg-red-50 rounded-lg'
                        >
                          <X className='w-5 h-5' />
                        </button>
                      </div>

                      <div className='grid md:grid-cols-2 gap-4'>
                        <div className='md:col-span-2'>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Description
                          </label>
                          <input
                            type='text'
                            value={item.description}
                            onChange={(e) =>
                              updateCustomsItem(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                            placeholder='Electronics, Clothing, Books, etc.'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Quantity
                          </label>
                          <input
                            type='number'
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateCustomsItem(
                                index,
                                'quantity',
                                parseInt(e.target.value)
                              )
                            }
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Value (USD)
                          </label>
                          <input
                            type='number'
                            min={0}
                            step={0.01}
                            value={item.value}
                            onChange={(e) =>
                              updateCustomsItem(
                                index,
                                'value',
                                parseFloat(e.target.value)
                              )
                            }
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            HS Code (Optional)
                          </label>
                          <input
                            type='text'
                            value={item.hsCode}
                            onChange={(e) =>
                              updateCustomsItem(index, 'hsCode', e.target.value)
                            }
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                            placeholder='e.g., 8517.12.00'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-semibold text-slate-700 mb-2'>
                            Country of Origin
                          </label>
                          <select
                            value={item.countryOfOrigin}
                            onChange={(e) =>
                              updateCustomsItem(
                                index,
                                'countryOfOrigin',
                                e.target.value
                              )
                            }
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                          >
                            <option value='US'>United States</option>
                            <option value='CN'>China</option>
                            <option value='UK'>United Kingdom</option>
                            <option value='DE'>Germany</option>
                            <option value='JP'>Japan</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addCustomsItem}
                    className='w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-600 font-semibold transition-colors'
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Review */}
            {currentStep === 'review' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                  Review Your Shipment
                </h2>

                <div className='space-y-6'>
                  {/* Packages Summary */}
                  <div>
                    <h3 className='font-bold text-slate-900 mb-3'>
                      Packages ({selectedPackages.length})
                    </h3>
                    <div className='space-y-2'>
                      {selectedPackageDetails.map((pkg) => (
                        <div
                          key={pkg.id}
                          className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg'
                        >
                          <div className='text-2xl'>{pkg.photo}</div>
                          <div className='flex-1'>
                            <p className='font-semibold text-slate-900 text-sm'>
                              {pkg.description}
                            </p>
                            <p className='text-xs text-slate-600'>
                              {pkg.weight} kg • {pkg.estimatedValue}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <h3 className='font-bold text-slate-900 mb-3'>
                      Destination
                    </h3>
                    <div className='p-4 bg-slate-50 rounded-lg'>
                      <p className='font-semibold text-slate-900'>
                        {formData.destination.fullName}
                      </p>
                      <p className='text-sm text-slate-600'>
                        {formData.destination.street}
                      </p>
                      <p className='text-sm text-slate-600'>
                        {formData.destination.city},{' '}
                        {formData.destination.postalCode}
                      </p>
                      <p className='text-sm text-slate-600'>
                        {formData.destination.country}
                      </p>
                      <p className='text-sm text-slate-600 mt-2'>
                        📞 {formData.destination.phone}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Details */}
                  {formData.selectedRate && (
                    <div>
                      <h3 className='font-bold text-slate-900 mb-3'>
                        Shipping Method
                      </h3>
                      <div className='p-4 bg-slate-50 rounded-lg'>
                        <p className='font-semibold text-slate-900'>
                          DHL {formData.selectedRate.productName}
                        </p>
                        <p className='text-sm text-slate-600'>
                          Estimated delivery:{' '}
                          {formData.selectedRate.deliveryTime} business days
                        </p>
                        <p className='text-lg font-bold text-blue-600 mt-2'>
                          {formData.selectedRate.totalPrice}{' '}
                          {formData.selectedRate.currency}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Insurance */}
                  <div>
                    <h3 className='font-bold text-slate-900 mb-3'>Insurance</h3>
                    <div className='p-4 bg-slate-50 rounded-lg'>
                      {formData.insurance.enabled ? (
                        <p className='text-sm text-slate-900'>
                          ✅ Additional coverage: ${formData.insurance.coverage}
                        </p>
                      ) : (
                        <p className='text-sm text-slate-600'>
                          Free coverage up to $100 included
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Cost */}
                  <div className='p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
                    <div className='flex items-center justify-between mb-4'>
                      <span className='text-slate-700'>Shipping Cost</span>
                      <span className='font-bold text-slate-900'>
                        {formData.selectedRate?.totalPrice}{' '}
                        {formData.selectedRate?.currency}
                      </span>
                    </div>
                    {formData.insurance.enabled &&
                      formData.insurance.coverage > 100 && (
                        <div className='flex items-center justify-between mb-4'>
                          <span className='text-slate-700'>
                            Insurance (${formData.insurance.coverage})
                          </span>
                          <span className='font-bold text-slate-900'>
                            {Math.ceil(
                              (formData.insurance.coverage - 100) / 100
                            ) * 5}{' '}
                            MAD
                          </span>
                        </div>
                      )}
                    <div className='pt-4 border-t-2 border-blue-300 flex items-center justify-between'>
                      <span className='text-lg font-bold text-slate-900'>
                        Total
                      </span>
                      <span className='text-2xl font-bold text-blue-600'>
                        {(formData.selectedRate?.totalPrice || 0) +
                          (formData.insurance.enabled &&
                          formData.insurance.coverage > 100
                            ? Math.ceil(
                                (formData.insurance.coverage - 100) / 100
                              ) * 5
                            : 0)}{' '}
                        MAD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Payment */}
            {currentStep === 'payment' && (
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                  Payment
                </h2>

                <div className='text-center py-12'>
                  <CreditCard className='w-16 h-16 text-blue-600 mx-auto mb-4' />
                  <h3 className='text-xl font-bold text-slate-900 mb-2'>
                    Payment Integration
                  </h3>
                  <p className='text-slate-600 mb-6'>
                    Payment processing will be integrated here
                  </p>
                  <p className='text-sm text-slate-500'>
                    For now, clicking "Confirm Shipment" will create the
                    shipment with pending payment status
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className='flex items-center justify-between'>
          {currentStepIndex > 0 ? (
            <button
              onClick={handleBack}
              className='px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2'
              disabled={submitting}
            >
              <ArrowLeft className='w-5 h-5' />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2'
              disabled={submitting}
            >
              Next
              <ArrowRight className='w-5 h-5' />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50'
            >
              {submitting ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Creating Shipment...
                </>
              ) : (
                <>
                  <Check className='w-5 h-5' />
                  Confirm Shipment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
