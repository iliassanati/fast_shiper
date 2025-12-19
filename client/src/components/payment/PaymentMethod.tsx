// client/src/components/payment/PaymentMethod.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import StripePayment from './StripePayment';

// Initialize Stripe
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_KEY) {
  console.error(
    '❌ VITE_STRIPE_PUBLISHABLE_KEY not set in environment variables'
  );
}

const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentMethodProps {
  totalAmount: number;
  currency: string;
  onPaymentComplete: (paymentData: PaymentResult) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentMethod: 'stripe' | 'paypal';
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
    'stripe' | 'paypal' | null
  >(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  ];

  const handleStripeSuccess = async (paymentMethodId: string) => {
    setProcessing(true);
    try {
      const paymentResult: PaymentResult = {
        success: true,
        paymentMethod: 'stripe',
        transactionId: paymentMethodId,
        amount: totalAmount,
        currency,
        timestamp: new Date(),
      };

      console.log('✅ Stripe payment successful:', paymentResult);
      onPaymentComplete(paymentResult);
    } catch (err: any) {
      console.error('❌ Payment completion failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleStripeError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handlePayPalPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // In DEV mode, simulate PayPal payment
      if (import.meta.env.DEV) {
        console.log('🔄 Processing PayPal payment (DEV MODE)...');
        await new Promise((resolve) => setTimeout(resolve, 2000));

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

  return (
    <div className='space-y-6'>
      {/* DEV MODE Notice */}
      {import.meta.env.DEV && !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && (
        <div className='p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-semibold text-yellow-900'>
                Development Mode - Stripe Not Configured
              </p>
              <p className='text-xs text-yellow-800 mt-1'>
                Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file to enable real
                Stripe payments.
              </p>
            </div>
          </div>
        </div>
      )}
      {!stripePromise && (
        <div className='p-4 bg-red-50 border-2 border-red-200 rounded-xl'>
          <AlertCircle className='w-5 h-5 text-red-600' />
          <p className='text-sm text-red-900'>
            Payment system not configured. Please contact support.
          </p>
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
                  ? 'border-blue-500 bg-blue-50 shadow-md'
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
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
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
              <Elements stripe={stripePromise}>
                <StripePayment
                  amount={totalAmount}
                  currency={currency}
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                  disabled={loading || processing}
                />
              </Elements>
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
            className='space-y-4'
          >
            <div className='p-4 bg-blue-50 rounded-xl border-2 border-blue-200'>
              <p className='text-sm text-blue-900 mb-4'>
                You will be redirected to PayPal to complete your payment
                securely.
              </p>
              <button
                onClick={handlePayPalPayment}
                disabled={processing || loading}
                className='w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {processing ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>Continue with PayPal</>
                )}
              </button>
            </div>
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

      {/* Cancel Button */}
      {onCancel && selectedMethod && (
        <button
          onClick={onCancel}
          disabled={processing || loading}
          className='w-full px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50'
        >
          Go Back
        </button>
      )}
    </div>
  );
}
