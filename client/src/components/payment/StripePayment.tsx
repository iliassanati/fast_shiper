// client/src/components/payment/StripePayment.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock, AlertCircle, CreditCard } from 'lucide-react';

interface StripePaymentProps {
  amount: number;
  currency: string;
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function StripePayment({
  amount,
  currency,
  onSuccess,
  onError,
  disabled = false,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1e293b',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#94a3b8',
        },
        iconColor: '#3b82f6',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card details');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      console.log('✅ Payment method created:', paymentMethod.id);
      onSuccess(paymentMethod.id);
    } catch (err: any) {
      console.error('❌ Stripe payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Card Input */}
      <div className='space-y-3'>
        <label className='block text-sm font-bold text-slate-700'>
          Card Details
        </label>
        <div className='p-4 border-2 border-slate-200 rounded-xl focus-within:border-blue-500 transition-colors bg-white'>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(e.complete);
              setError(e.error?.message || null);
            }}
          />
        </div>
      </div>

      {/* Security Badge */}
      <div className='flex items-center gap-2 text-sm text-slate-600'>
        <Lock className='w-4 h-4 text-green-600' />
        <span>Secured by Stripe - Your payment info is encrypted</span>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='p-4 bg-red-50 border-2 border-red-200 rounded-xl'
        >
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-red-900'>{error}</p>
          </div>
        </motion.div>
      )}

      {/* Amount Display */}
      <div className='p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
        <div className='flex items-center justify-between'>
          <span className='text-lg font-bold text-slate-900'>Total Amount</span>
          <span className='text-2xl font-bold text-blue-600'>
            ${amount.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={!stripe || processing || disabled || !cardComplete}
        className='w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
      >
        {processing ? (
          <>
            <Loader2 className='w-5 h-5 animate-spin' />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className='w-5 h-5' />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
}
