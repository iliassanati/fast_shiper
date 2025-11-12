import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Truck,
  Shield,
  MapPin,
  CreditCard,
  DollarSign,
  FileText,
  Calendar,
  Weight,
  Ruler,
  ShoppingBag,
  Info,
} from 'lucide-react';

interface PackageItem {
  id: string;
  description: string;
  retailer: string;
  weight: string;
  dimensions: string;
  photo: string;
  trackingNumber: string;
}

interface CustomsInfo {
  description: string;
  quantity: number;
  value: number;
  hsCode: string;
  countryOfOrigin: string;
}

interface CarrierOption {
  id: string;
  name: string;
  logo: string;
  serviceLevels: ServiceLevel[];
}

interface ServiceLevel {
  id: string;
  name: string;
  delivery: string;
  price: number;
  features: string[];
}

const mockPackages: PackageItem[] = [
  {
    id: 'PKG001',
    description: 'Wireless Headphones',
    retailer: 'Amazon',
    weight: '2.5 kg',
    dimensions: '30x20x15 cm',
    photo: '🎧',
    trackingNumber: '1Z999AA10123456784',
  },
  {
    id: 'PKG002',
    description: 'Nike Shoes',
    retailer: 'eBay',
    weight: '1.2 kg',
    dimensions: '25x15x10 cm',
    photo: '👟',
    trackingNumber: '1Z999AA10123456785',
  },
  {
    id: 'PKG003',
    description: 'Phone Case',
    retailer: 'Best Buy',
    weight: '0.8 kg',
    dimensions: '20x15x5 cm',
    photo: '📱',
    trackingNumber: '1Z999AA10123456786',
  },
];

const carriers: CarrierOption[] = [
  {
    id: 'dhl',
    name: 'DHL Express',
    logo: '📦',
    serviceLevels: [
      {
        id: 'dhl_express',
        name: 'DHL Express Worldwide',
        delivery: '3-5 business days',
        price: 450,
        features: ['Fastest delivery', 'Full tracking', 'Door-to-door'],
      },
      {
        id: 'dhl_economy',
        name: 'DHL Economy Select',
        delivery: '5-7 business days',
        price: 320,
        features: ['Great value', 'Full tracking', 'Reliable'],
      },
    ],
  },
  {
    id: 'fedex',
    name: 'FedEx',
    logo: '🚚',
    serviceLevels: [
      {
        id: 'fedex_priority',
        name: 'FedEx Priority',
        delivery: '4-6 business days',
        price: 420,
        features: ['Fast delivery', 'Full tracking', 'Signature required'],
      },
      {
        id: 'fedex_economy',
        name: 'FedEx Economy',
        delivery: '6-8 business days',
        price: 300,
        features: ['Economical', 'Full tracking'],
      },
    ],
  },
  {
    id: 'aramex',
    name: 'Aramex',
    logo: '✈️',
    serviceLevels: [
      {
        id: 'aramex_express',
        name: 'Aramex Express',
        delivery: '5-7 business days',
        price: 380,
        features: ['Reliable', 'Local support', 'Full tracking'],
      },
    ],
  },
];

const ShippingWorkflow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [customsInfo, setCustomsInfo] = useState<{
    [key: string]: CustomsInfo;
  }>({});
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [insuranceAmount, setInsuranceAmount] = useState(0);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: 'Youssef El Amrani',
    address: '123 Rue Mohammed V, Apt 4B',
    city: 'Casablanca',
    postalCode: '20000',
    country: 'Morocco',
    phone: '+212 6XX-XXXXXX',
  });

  const totalSteps = 7;

  const togglePackage = (pkgId: string) => {
    setSelectedPackages((prev) =>
      prev.includes(pkgId)
        ? prev.filter((id) => id !== pkgId)
        : [...prev, pkgId]
    );
  };

  const updateCustomsInfo = (
    pkgId: string,
    field: keyof CustomsInfo,
    value: any
  ) => {
    setCustomsInfo((prev) => ({
      ...prev,
      [pkgId]: { ...prev[pkgId], [field]: value },
    }));
  };

  const calculateTotalWeight = () => {
    return selectedPackages.reduce((total, pkgId) => {
      const pkg = mockPackages.find((p) => p.id === pkgId);
      return total + parseFloat(pkg?.weight || '0');
    }, 0);
  };

  const calculateInsuranceCost = () => {
    if (insuranceAmount <= 100) return 0;
    return Math.ceil((insuranceAmount - 100) / 100) * 5;
  };

  const getSelectedService = () => {
    for (const carrier of carriers) {
      for (const service of carrier.serviceLevels) {
        if (service.id === selectedService) return service;
      }
    }
    return null;
  };

  const calculateTotal = () => {
    const service = getSelectedService();
    const shippingCost = service?.price || 0;
    const insuranceCost = calculateInsuranceCost();
    return shippingCost + insuranceCost;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPackages.length > 0;
      case 2:
        return selectedPackages.every(
          (pkgId) =>
            customsInfo[pkgId]?.description && customsInfo[pkgId]?.value > 0
        );
      case 3:
        return selectedService !== '';
      case 4:
        return true;
      case 5:
        return (
          shippingAddress.fullName &&
          shippingAddress.address &&
          shippingAddress.city
        );
      case 6:
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
          Select Packages to Ship
        </h3>
        <p className='text-slate-600'>
          Choose one or more packages from your locker
        </p>
      </div>

      <div className='space-y-3'>
        {mockPackages.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => togglePackage(pkg.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPackages.includes(pkg.id)
                ? 'border-blue-500 bg-blue-50'
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
                <p className='text-sm text-slate-600'>
                  From {pkg.retailer} • {pkg.weight}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm text-slate-600'>{pkg.dimensions}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
        <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-blue-900'>
          <p className='font-semibold mb-1'>
            Selected: {selectedPackages.length} package(s)
          </p>
          <p>Total weight: {calculateTotalWeight().toFixed(1)} kg</p>
        </div>
      </div>
    </div>
  );

  // Step 2: Customs Information
  const Step2CustomsInfo = () => (
    <div className='space-y-4'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Customs Declaration
        </h3>
        <p className='text-slate-600'>
          Enter information for each package (required by customs)
        </p>
      </div>

      <div className='space-y-6'>
        {selectedPackages.map((pkgId) => {
          const pkg = mockPackages.find((p) => p.id === pkgId);
          if (!pkg) return null;

          return (
            <div
              key={pkgId}
              className='bg-white rounded-xl border border-slate-200 p-6'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='text-3xl'>{pkg.photo}</div>
                <div>
                  <p className='font-bold text-slate-900'>{pkg.description}</p>
                  <p className='text-sm text-slate-600'>{pkg.retailer}</p>
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    Product Description *
                  </label>
                  <input
                    type='text'
                    placeholder='e.g., Wireless Bluetooth Headphones'
                    value={customsInfo[pkgId]?.description || ''}
                    onChange={(e) =>
                      updateCustomsInfo(pkgId, 'description', e.target.value)
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Quantity *
                    </label>
                    <input
                      type='number'
                      min='1'
                      placeholder='1'
                      value={customsInfo[pkgId]?.quantity || ''}
                      onChange={(e) =>
                        updateCustomsInfo(
                          pkgId,
                          'quantity',
                          parseInt(e.target.value)
                        )
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Value (USD) *
                    </label>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='89.99'
                      value={customsInfo[pkgId]?.value || ''}
                      onChange={(e) =>
                        updateCustomsInfo(
                          pkgId,
                          'value',
                          parseFloat(e.target.value)
                        )
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      HS Code (Optional)
                    </label>
                    <input
                      type='text'
                      placeholder='8518.30.00'
                      value={customsInfo[pkgId]?.hsCode || ''}
                      onChange={(e) =>
                        updateCustomsInfo(pkgId, 'hsCode', e.target.value)
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Country of Origin
                    </label>
                    <select
                      value={customsInfo[pkgId]?.countryOfOrigin || 'USA'}
                      onChange={(e) =>
                        updateCustomsInfo(
                          pkgId,
                          'countryOfOrigin',
                          e.target.value
                        )
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      <option value='USA'>United States</option>
                      <option value='CHN'>China</option>
                      <option value='JPN'>Japan</option>
                      <option value='DEU'>Germany</option>
                      <option value='Other'>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
        <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-yellow-900'>
          <p className='font-semibold mb-1'>Important</p>
          <p>
            Accurate customs information is required by law. Incorrect
            declarations may result in delays, fines, or package seizure.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 3: Choose Carrier
  const Step3ChooseCarrier = () => (
    <div className='space-y-4'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Choose Shipping Service
        </h3>
        <p className='text-slate-600'>
          Select your preferred carrier and service level
        </p>
      </div>

      <div className='space-y-6'>
        {carriers.map((carrier) => (
          <div
            key={carrier.id}
            className='bg-white rounded-xl border border-slate-200 p-6'
          >
            <div className='flex items-center gap-3 mb-4'>
              <div className='text-4xl'>{carrier.logo}</div>
              <h4 className='text-xl font-bold text-slate-900'>
                {carrier.name}
              </h4>
            </div>

            <div className='space-y-3'>
              {carrier.serviceLevels.map((service) => (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedService(service.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedService === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedService === service.id
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedService === service.id && (
                            <div className='w-2 h-2 bg-white rounded-full' />
                          )}
                        </div>
                        <p className='font-bold text-slate-900'>
                          {service.name}
                        </p>
                      </div>
                      <div className='ml-8'>
                        <div className='flex items-center gap-2 text-sm text-slate-600 mb-2'>
                          <Calendar className='w-4 h-4' />
                          <span>{service.delivery}</span>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          {service.features.map((feature, i) => (
                            <span
                              key={i}
                              className='px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs'
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className='text-right ml-4'>
                      <p className='text-2xl font-bold text-blue-600'>
                        {service.price} MAD
                      </p>
                      <p className='text-xs text-slate-500'>
                        ~${(service.price / 10).toFixed(0)} USD
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className='bg-blue-50 rounded-xl p-4'>
        <p className='text-sm text-blue-900'>
          <span className='font-semibold'>💡 Tip:</span> Express services are
          faster but cost more. Economy services offer great value for
          non-urgent shipments.
        </p>
      </div>
    </div>
  );

  // Step 4: Insurance
  const Step4Insurance = () => {
    const totalValue = selectedPackages.reduce(
      (sum, pkgId) => sum + (customsInfo[pkgId]?.value || 0),
      0
    );

    return (
      <div className='space-y-4'>
        <div className='mb-6'>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Package Insurance
          </h3>
          <p className='text-slate-600'>
            Protect your shipment with additional insurance
          </p>
        </div>

        <div className='bg-green-50 rounded-xl p-6 border-2 border-green-200'>
          <div className='flex items-start gap-3 mb-4'>
            <Shield className='w-6 h-6 text-green-600 flex-shrink-0' />
            <div>
              <p className='font-bold text-green-900 mb-1'>
                FREE Insurance Included
              </p>
              <p className='text-sm text-green-800'>
                Coverage up to $100 USD at no cost
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-6'>
          <h4 className='font-bold text-slate-900 mb-4'>
            Additional Insurance Coverage
          </h4>

          <div className='mb-4'>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Total Declared Value
            </label>
            <p className='text-2xl font-bold text-slate-900 mb-1'>
              ${totalValue.toFixed(2)} USD
            </p>
            <p className='text-sm text-slate-600'>
              Based on your customs declarations
            </p>
          </div>

          <div className='mb-4'>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Insurance Amount (Optional)
            </label>
            <input
              type='number'
              min='0'
              max={totalValue}
              step='50'
              value={insuranceAmount}
              onChange={(e) =>
                setInsuranceAmount(parseFloat(e.target.value) || 0)
              }
              className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              placeholder='Enter amount (up to declared value)'
            />
          </div>

          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm text-slate-700'>Coverage Amount:</span>
              <span className='font-bold text-slate-900'>
                ${insuranceAmount.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-slate-700'>Insurance Cost:</span>
              <span className='font-bold text-blue-600'>
                {calculateInsuranceCost()} MAD
              </span>
            </div>
            {insuranceAmount > 0 && (
              <p className='text-xs text-slate-600 mt-2'>
                $
                {insuranceAmount <= 100
                  ? '0'
                  : `${calculateInsuranceCost() * 10}`}{' '}
                USD (${calculateInsuranceCost() / 10} per $100 value)
              </p>
            )}
          </div>
        </div>

        <div className='bg-yellow-50 rounded-xl p-4 flex items-start gap-3'>
          <Info className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-yellow-900'>
            <p className='font-semibold mb-1'>Insurance Coverage</p>
            <p>
              Insurance covers loss or damage during transit. For high-value
              items, we recommend purchasing additional coverage.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Step 5: Shipping Address
  const Step5ShippingAddress = () => (
    <div className='space-y-4'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Confirm Delivery Address
        </h3>
        <p className='text-slate-600'>
          Where should we deliver your packages in Morocco?
        </p>
      </div>

      <div className='bg-white rounded-xl border border-slate-200 p-6 space-y-4'>
        <div>
          <label className='block text-sm font-semibold text-slate-700 mb-2'>
            Full Name *
          </label>
          <input
            type='text'
            value={shippingAddress.fullName}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                fullName: e.target.value,
              })
            }
            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
          />
        </div>

        <div>
          <label className='block text-sm font-semibold text-slate-700 mb-2'>
            Street Address *
          </label>
          <input
            type='text'
            value={shippingAddress.address}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                address: e.target.value,
              })
            }
            className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              City *
            </label>
            <select
              value={shippingAddress.city}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, city: e.target.value })
              }
              className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
            >
              <option>Casablanca</option>
              <option>Rabat</option>
              <option>Marrakech</option>
              <option>Tangier</option>
              <option>Agadir</option>
              <option>Fes</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Postal Code *
            </label>
            <input
              type='text'
              value={shippingAddress.postalCode}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  postalCode: e.target.value,
                })
              }
              className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
            />
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Country
            </label>
            <input
              type='text'
              value={shippingAddress.country}
              disabled
              className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-600'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Phone Number *
            </label>
            <input
              type='tel'
              value={shippingAddress.phone}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  phone: e.target.value,
                })
              }
              className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
            />
          </div>
        </div>
      </div>

      <div className='bg-blue-50 rounded-xl p-4 flex items-start gap-3'>
        <MapPin className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-blue-900'>
          <p className='font-semibold mb-1'>Delivery Information</p>
          <p>
            DHL will contact you at the provided phone number for delivery
            coordination.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 6: Payment
  const Step6Payment = () => (
    <div className='space-y-4'>
      <div className='mb-6'>
        <h3 className='text-2xl font-bold text-slate-900 mb-2'>
          Payment Method
        </h3>
        <p className='text-slate-600'>Choose how you'd like to pay</p>
      </div>

      <div className='space-y-3'>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className='p-6 bg-white rounded-xl border-2 border-blue-500 cursor-pointer'
        >
          <div className='flex items-center gap-4'>
            <CreditCard className='w-8 h-8 text-blue-600' />
            <div className='flex-1'>
              <p className='font-bold text-slate-900'>Credit / Debit Card</p>
              <p className='text-sm text-slate-600'>Pay securely with Stripe</p>
            </div>
            <div className='flex gap-2'>
              <div className='w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold'>
                VISA
              </div>
              <div className='w-10 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold'>
                MC
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className='p-6 bg-white rounded-xl border-2 border-slate-200 cursor-pointer'
        >
          <div className='flex items-center gap-4'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold'>
              P
            </div>
            <div className='flex-1'>
              <p className='font-bold text-slate-900'>PayPal</p>
              <p className='text-sm text-slate-600'>Fast and secure payment</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className='bg-slate-50 rounded-xl p-6'>
        <h4 className='font-bold text-slate-900 mb-4'>Order Summary</h4>
        <div className='space-y-3'>
          <div className='flex justify-between text-sm'>
            <span className='text-slate-600'>
              Packages ({selectedPackages.length})
            </span>
            <span className='text-slate-900'>-</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-slate-600'>
              Shipping ({getSelectedService()?.name})
            </span>
            <span className='font-semibold text-slate-900'>
              {getSelectedService()?.price} MAD
            </span>
          </div>
          {insuranceAmount > 0 && (
            <div className='flex justify-between text-sm'>
              <span className='text-slate-600'>Insurance</span>
              <span className='font-semibold text-slate-900'>
                {calculateInsuranceCost()} MAD
              </span>
            </div>
          )}
          <div className='border-t border-slate-200 pt-3 flex justify-between'>
            <span className='font-bold text-slate-900'>Total</span>
            <span className='font-bold text-blue-600 text-xl'>
              {calculateTotal()} MAD
            </span>
          </div>
          <p className='text-xs text-slate-500'>
            ~${(calculateTotal() / 10).toFixed(2)} USD
          </p>
        </div>
      </div>

      <div className='bg-green-50 rounded-xl p-4 flex items-start gap-3'>
        <Shield className='w-5 h-5 text-green-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-green-900'>
          <p className='font-semibold mb-1'>Secure Payment</p>
          <p>
            All payments are encrypted and processed securely through Stripe.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 7: Confirmation
  const Step7Confirmation = () => (
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
          Shipment Created!
        </h3>
        <p className='text-lg text-slate-600'>
          Your packages are being prepared for shipping
        </p>
      </div>

      <div className='bg-white rounded-xl border border-slate-200 p-6 max-w-md mx-auto text-left'>
        <h4 className='font-bold text-slate-900 mb-4'>Shipment Details</h4>
        <div className='space-y-3 text-sm'>
          <div className='flex justify-between'>
            <span className='text-slate-600'>Tracking Number:</span>
            <span className='font-mono font-bold text-blue-600'>
              DHL{Date.now()}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-slate-600'>Packages:</span>
            <span className='font-semibold text-slate-900'>
              {selectedPackages.length}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-slate-600'>Carrier:</span>
            <span className='font-semibold text-slate-900'>
              {getSelectedService()?.name}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-slate-600'>Est. Delivery:</span>
            <span className='font-semibold text-slate-900'>
              {getSelectedService()?.delivery}
            </span>
          </div>
          <div className='border-t border-slate-200 pt-3 flex justify-between'>
            <span className='text-slate-900 font-bold'>Total Paid:</span>
            <span className='font-bold text-green-600'>
              {calculateTotal()} MAD
            </span>
          </div>
        </div>
      </div>

      <div className='bg-blue-50 rounded-xl p-4'>
        <p className='text-sm text-blue-900'>
          📧 A confirmation email has been sent to your inbox with tracking
          details.
        </p>
      </div>

      <motion.button
        onClick={onClose}
        className='px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold shadow-lg'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Back to Dashboard
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
                Ship Your Packages
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
                className='h-full bg-gradient-to-r from-blue-600 to-cyan-600'
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className='flex justify-between mt-2 text-xs text-slate-600'>
              <span>Select</span>
              <span>Customs</span>
              <span>Carrier</span>
              <span>Insurance</span>
              <span>Address</span>
              <span>Payment</span>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 max-h-[60vh] overflow-y-auto'>
          <AnimatePresence mode='wait'>
            {currentStep === 1 && <Step1SelectPackages key='step1' />}
            {currentStep === 2 && <Step2CustomsInfo key='step2' />}
            {currentStep === 3 && <Step3ChooseCarrier key='step3' />}
            {currentStep === 4 && <Step4Insurance key='step4' />}
            {currentStep === 5 && <Step5ShippingAddress key='step5' />}
            {currentStep === 6 && <Step6Payment key='step6' />}
            {currentStep === 7 && <Step7Confirmation key='step7' />}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {currentStep < 7 && (
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
              onClick={currentStep === 6 ? () => setCurrentStep(7) : nextStep}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${
                canProceed()
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              whileHover={canProceed() ? { scale: 1.05 } : {}}
              whileTap={canProceed() ? { scale: 0.95 } : {}}
            >
              {currentStep === 6 ? 'Pay Now' : 'Continue'}
              <ChevronRight className='w-5 h-5' />
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Demo Component
const ShippingWorkflowDemo: React.FC = () => {
  const [showWorkflow, setShowWorkflow] = useState(true);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-6'>
      {!showWorkflow ? (
        <motion.button
          onClick={() => setShowWorkflow(true)}
          className='px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-2xl'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Shipping Workflow
        </motion.button>
      ) : (
        <AnimatePresence>
          <ShippingWorkflow onClose={() => setShowWorkflow(false)} />
        </AnimatePresence>
      )}
    </div>
  );
};

export default ShippingWorkflowDemo;
