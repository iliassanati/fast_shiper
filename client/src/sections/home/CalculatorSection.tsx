import { motion } from 'framer-motion';
import { Calculator, Package, Loader2, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

interface ShippingRate {
  carrier: string;
  serviceLevelName: string;
  amount: number;
  currency: string;
  estimatedDays: number;
  durationTerms: string;
}

export default function CalculatorSection() {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    weight: '',
    length: '',
    width: '',
    height: '',
    city: 'Casablanca',
    postalCode: '',
    phone: '',
    declaredValue: '',
  });

  const moroccanCities = [
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Fes',
    'Tangier',
    'Agadir',
    'Meknes',
    'Oujda',
    'Kenitra',
    'Tetouan',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setError('Please enter a valid weight');
      return false;
    }
    if (!formData.length || parseFloat(formData.length) <= 0) {
      setError('Please enter a valid length');
      return false;
    }
    if (!formData.width || parseFloat(formData.width) <= 0) {
      setError('Please enter a valid width');
      return false;
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      setError('Please enter a valid height');
      return false;
    }
    if (!formData.postalCode || formData.postalCode.trim().length === 0) {
      setError('Please enter a postal code');
      return false;
    }
    if (!formData.phone || formData.phone.trim().length === 0) {
      setError('Please enter a phone number');
      return false;
    }
    return true;
  };

  const calculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setRates([]);

    try {
      const requestData = {
        weight: parseFloat(formData.weight),
        dimensions: {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
        },
        destinationCity: formData.city,
        destinationCountry: 'MA',
        destinationPostalCode: formData.postalCode.trim(),
        destinationPhone: formData.phone.trim(),
        declaredValue: formData.declaredValue
          ? parseFloat(formData.declaredValue)
          : 100,
      };

      console.log('🚀 Sending request:', requestData);

      // Use PUBLIC endpoint (no authentication required)
      const response = await axios.post(
        `${API_URL}/public/shipping/get-rates`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Full response:', response);
      console.log('📦 Response data:', response.data);

      // Handle different response structures
      let ratesData: ShippingRate[] = [];

      if (response.data?.success && response.data?.data) {
        ratesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        ratesData = response.data;
      } else {
        console.error('❌ Unexpected response structure:', response.data);
      }

      console.log('📊 Extracted rates:', ratesData);

      if (ratesData && Array.isArray(ratesData) && ratesData.length > 0) {
        setRates(ratesData);
        console.log('✅ Set rates successfully:', ratesData.length, 'rates');
      } else {
        console.warn('⚠️ No rates in response');
        setError(
          'No shipping rates available. This could mean: 1) Package dimensions are invalid, 2) No carriers service this route, or 3) API configuration issue. Check console for details.'
        );
      }
    } catch (err: any) {
      console.error('❌ Error fetching rates:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to calculate shipping rates. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id='calculator'
      className='py-24 px-6 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 relative overflow-hidden'
    >
      {/* Decorative Elements */}
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl' />
      </div>

      <div className='max-w-5xl mx-auto relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-12'
        >
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-4'>
            <Calculator className='w-5 h-5' />
            <span className='font-semibold'>Shipping Calculator</span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Get Real-Time Shipping Rates
          </h2>
          <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
            Compare prices from multiple carriers instantly and choose the best
            option for your package
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className='bg-white rounded-3xl p-8 md:p-10 shadow-2xl'
        >
          <form onSubmit={calculateShipping} className='space-y-6'>
            {/* Package Details */}
            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2'>
                  <Package className='w-4 h-4 text-blue-600' />
                  Package Weight (kg) *
                </label>
                <input
                  type='number'
                  name='weight'
                  value={formData.weight}
                  onChange={handleInputChange}
                  step='0.1'
                  min='0.1'
                  placeholder='2.5'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Destination City *
                </label>
                <select
                  name='city'
                  value={formData.city}
                  onChange={handleInputChange}
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                >
                  {moroccanCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Postal Code *
                </label>
                <input
                  type='text'
                  name='postalCode'
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder='20000'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Phone Number *
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='+212600000000'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                />
                <p className='text-sm text-slate-500 mt-2'>
                  Required for carriers like DHL (include country code)
                </p>
              </div>
            </div>

            {/* Dimensions */}
            <div className='grid md:grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Length (cm) *
                </label>
                <input
                  type='number'
                  name='length'
                  value={formData.length}
                  onChange={handleInputChange}
                  step='0.1'
                  min='0.1'
                  placeholder='30'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Width (cm) *
                </label>
                <input
                  type='number'
                  name='width'
                  value={formData.width}
                  onChange={handleInputChange}
                  step='0.1'
                  min='0.1'
                  placeholder='20'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Height (cm) *
                </label>
                <input
                  type='number'
                  name='height'
                  value={formData.height}
                  onChange={handleInputChange}
                  step='0.1'
                  min='0.1'
                  placeholder='15'
                  className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
                  required
                />
              </div>
            </div>

            {/* Declared Value (Optional) */}
            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                Declared Value (USD) - Optional
              </label>
              <input
                type='number'
                name='declaredValue'
                value={formData.declaredValue}
                onChange={handleInputChange}
                step='0.01'
                min='0'
                placeholder='100'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg'
              />
              <p className='text-sm text-slate-500 mt-2'>
                Enter the value of your items for customs and insurance purposes
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className='bg-red-50 border-2 border-red-200 rounded-xl p-4'
              >
                <p className='text-red-700 font-medium'>{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type='submit'
              disabled={loading}
              className='w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Calculating Rates...
                </>
              ) : (
                <>
                  <Calculator className='w-5 h-5' />
                  Get Shipping Rates
                </>
              )}
            </motion.button>
          </form>

          {/* Results */}
          {rates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='mt-8 space-y-4'
            >
              <div className='flex items-center gap-2 text-green-600 mb-4'>
                <TrendingDown className='w-5 h-5' />
                <h3 className='text-lg font-bold'>
                  Available Shipping Options
                </h3>
              </div>

              <div className='space-y-3'>
                {rates.map((rate, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all'
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-1'>
                        <span className='font-bold text-lg text-slate-900'>
                          {rate.carrier}
                        </span>
                        <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full'>
                          {rate.serviceLevelName}
                        </span>
                      </div>
                      <p className='text-sm text-slate-600'>
                        Estimated delivery: {rate.estimatedDays}{' '}
                        {rate.estimatedDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-blue-600'>
                        ${rate.amount.toFixed(2)}
                      </div>
                      <div className='text-xs text-slate-500'>
                        {rate.currency}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className='mt-6 p-4 bg-orange-50 border-2 border-orange-100 rounded-xl'>
                <p className='text-sm text-orange-800'>
                  <span className='font-bold'>💡 Pro Tip:</span> Consolidate
                  multiple packages to save up to 80% on shipping costs!
                </p>
              </div>
            </motion.div>
          )}

          <p className='text-center text-sm text-slate-500 mt-6'>
            * All rates are estimates and may vary based on actual package
            specifications
          </p>
        </motion.div>
      </div>
    </section>
  );
}
