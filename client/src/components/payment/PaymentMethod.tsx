// client/src/components/payment/PaymentMethod.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Check, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentMethodProps {
  totalAmount: number;
  currency: string;
  onPaymentComplete: (paymentData: PaymentResult) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentMethod: 'stripe' | 'paypal' | 'cash_on_delivery';
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

export default function PaymentMethod({
  totalAmount,
  currency,
  onPaymentComplete,
  onCancel,
  loading = false,
}: PaymentMethodProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    'stripe' | 'paypal' | 'cash_on_delivery' | null
  >(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card details for Stripe (dev mode - fake data)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay securely with your card',
      enabled: true,
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      icon: () => (
        <div className='text-2xl font-bold text-blue-600'>PayPal</div>
      ),
      description: 'Pay with your PayPal account',
      enabled: true,
    },
    {
      id: 'cash_on_delivery' as const,
      name: 'Cash on Delivery',
      icon: () => <div className='text-2xl'>💵</div>,
      description: 'Pay when you receive your package',
      enabled: true,
    },
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleStripePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Validate card details
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) {
        throw new Error('Please fill in all card details');
      }

      // In DEV mode, simulate payment processing
      if (import.meta.env.DEV) {
        console.log('🔄 Processing Stripe payment (DEV MODE)...');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate success
        const paymentResult: PaymentResult = {
          success: true,
          paymentMethod: 'stripe',
          transactionId: `stripe_dev_${Date.now()}`,
          amount: totalAmount,
          currency,
          timestamp: new Date(),
        };

        console.log('✅ Stripe payment successful (DEV MODE):', paymentResult);
        onPaymentComplete(paymentResult);
      } else {
        // TODO: Implement real Stripe payment processing
        throw new Error('Stripe integration not yet implemented in production');
      }
    } catch (err: any) {
      console.error('❌ Stripe payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // In DEV mode, simulate PayPal payment
      if (import.meta.env.DEV) {
        console.log('🔄 Processing PayPal payment (DEV MODE)...');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate success
        const paymentResult: PaymentResult = {
          success: true,
          paymentMethod: 'paypal',
          transactionId: `paypal_dev_${Date.now()}`,
          amount: totalAmount,
          currency,
          timestamp: new Date(),
        };

        console.log('✅ PayPal payment successful (DEV MODE):', paymentResult);
        onPaymentComplete(paymentResult);
      } else {
        // TODO: Implement real PayPal payment processing
        throw new Error('PayPal integration not yet implemented in production');
      }
    } catch (err: any) {
      console.error('❌ PayPal payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCashOnDelivery = async () => {
    setProcessing(true);
    setError(null);

    try {
      console.log('🔄 Processing Cash on Delivery...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const paymentResult: PaymentResult = {
        success: true,
        paymentMethod: 'cash_on_delivery',
        transactionId: `cod_${Date.now()}`,
        amount: totalAmount,
        currency,
        timestamp: new Date(),
      };

      console.log('✅ Cash on Delivery confirmed:', paymentResult);
      onPaymentComplete(paymentResult);
    } catch (err: any) {
      console.error('❌ COD processing failed:', err);
      setError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    switch (selectedMethod) {
      case 'stripe':
        await handleStripePayment();
        break;
      case 'paypal':
        await handlePayPalPayment();
        break;
      case 'cash_on_delivery':
        await handleCashOnDelivery();
        break;
    }
  };

  return (
    <div className='space-y-6'>
      {/* DEV MODE Notice */}
      {import.meta.env.DEV && (
        <div className='p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-semibold text-yellow-900'>
                Development Mode
              </p>
              <p className='text-xs text-yellow-800 mt-1'>
                All payments are simulated. No real charges will be made.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className='space-y-4'>
        <h3 className='font-bold text-slate-900 text-lg'>
          Select Payment Method
        </h3>

        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <motion.div
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !processing && setSelectedMethod(method.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              } ${
                !method.enabled || processing
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {selectedMethod === method.id && (
                      <Check className='w-4 h-4 text-white' />
                    )}
                  </div>
                  <div className='w-10 h-10 flex items-center justify-center'>
                    <Icon />
                  </div>
                  <div>
                    <p className='font-semibold text-slate-900'>
                      {method.name}
                    </p>
                    <p className='text-sm text-slate-600'>
                      {method.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stripe Card Details Form */}
      <AnimatePresence>
        {selectedMethod === 'stripe' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='space-y-4'
          >
            <div className='p-6 bg-slate-50 rounded-xl border-2 border-slate-200'>
              <div className='flex items-center gap-2 mb-4'>
                <Lock className='w-4 h-4 text-green-600' />
                <p className='text-sm text-slate-600'>
                  Your payment is secure and encrypted
                </p>
              </div>

              {import.meta.env.DEV && (
                <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                  <p className='text-xs text-blue-900 font-semibold mb-2'>
                    Test Card Details:
                  </p>
                  <p className='text-xs text-blue-800'>
                    Card: 4242 4242 4242 4242
                    <br />
                    Expiry: 12/25 | CVC: 123
                  </p>
                </div>
              )}

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    Card Number
                  </label>
                  <input
                    type='text'
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        number: formatCardNumber(e.target.value),
                      })
                    }
                    placeholder='4242 4242 4242 4242'
                    maxLength={19}
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    disabled={processing}
                  />
                </div>

                <div className='grid grid-cols-3 gap-4'>
                  <div className='col-span-2'>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Expiry Date
                    </label>
                    <input
                      type='text'
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          expiry: formatExpiry(e.target.value),
                        })
                      }
                      placeholder='MM/YY'
                      maxLength={5}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      CVC
                    </label>
                    <input
                      type='text'
                      value={cardDetails.cvc}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          cvc: e.target.value.replace(/\D/g, '').slice(0, 3),
                        })
                      }
                      placeholder='123'
                      maxLength={3}
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                      disabled={processing}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    Cardholder Name
                  </label>
                  <input
                    type='text'
                    value={cardDetails.name}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, name: e.target.value })
                    }
                    placeholder='John Doe'
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    disabled={processing}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PayPal Notice */}
      <AnimatePresence>
        {selectedMethod === 'paypal' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200'
          >
            <p className='text-sm text-blue-900'>
              You will be redirected to PayPal to complete your payment
              securely.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash on Delivery Notice */}
      <AnimatePresence>
        {selectedMethod === 'cash_on_delivery' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='p-4 bg-green-50 rounded-xl border-2 border-green-200'
          >
            <p className='text-sm text-green-900 font-semibold mb-2'>
              Cash on Delivery Selected
            </p>
            <p className='text-sm text-green-800'>
              You will pay{' '}
              <span className='font-bold'>
                {totalAmount} {currency}
              </span>{' '}
              when you receive your package at your doorstep.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className='p-4 bg-red-50 border-2 border-red-200 rounded-xl'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-red-900'>{error}</p>
          </div>
        </div>
      )}

      {/* Total Amount Display */}
      <div className='p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
        <div className='flex items-center justify-between'>
          <span className='text-lg font-bold text-slate-900'>Total Amount</span>
          <span className='text-2xl font-bold text-blue-600'>
            {totalAmount} {currency}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center gap-4'>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={processing || loading}
            className='flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
        )}

        <button
          onClick={handlePayment}
          disabled={!selectedMethod || processing || loading}
          className='flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          {processing || loading ? (
            <>
              <Loader2 className='w-5 h-5 animate-spin' />
              Processing...
            </>
          ) : (
            <>
              <Lock className='w-5 h-5' />
              {selectedMethod === 'cash_on_delivery'
                ? 'Confirm Order'
                : 'Pay Now'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
