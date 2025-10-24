import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SignUpBenefitsSection() {
  const benefits = [
    {
      icon: '📦',
      title: 'Instant US Address',
      desc: 'Get your suite number immediately after signup',
    },
    {
      icon: '🆓',
      title: '45 Days Free Storage',
      desc: 'No charges for the first 45 days',
    },
    {
      icon: '📸',
      title: 'Free Package Photos',
      desc: 'See your packages before shipping',
    },
    {
      icon: '🚚',
      title: 'DHL Express',
      desc: 'Fast delivery to Morocco in 3-5 days',
    },
    {
      icon: '🔒',
      title: 'Secure & Insured',
      desc: 'Your packages are protected',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className='lg:sticky lg:top-24'
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full border border-green-200 mb-6'
      >
        <CheckCircle className='w-4 h-4 text-green-600' />
        <span className='text-sm font-semibold text-green-700'>
          Free Forever • No Credit Card
        </span>
      </motion.div>

      <h1 className='text-5xl font-bold text-slate-900 mb-6 leading-tight'>
        Get Your Free
        <span className='block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
          US Address Now
        </span>
      </h1>

      <p className='text-xl text-slate-600 mb-8 leading-relaxed'>
        Sign up in 2 minutes and start shopping from thousands of US stores.
        Your unique US shipping address will be ready instantly!
      </p>

      {/* Benefits List */}
      <div className='space-y-4 mb-12'>
        {benefits.map((benefit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className='flex items-start gap-4'
          >
            <div className='text-3xl'>{benefit.icon}</div>
            <div>
              <h3 className='font-bold text-slate-900 mb-1'>{benefit.title}</h3>
              <p className='text-sm text-slate-600'>{benefit.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Indicators */}
      <div className='flex items-center gap-8 p-6 bg-white rounded-2xl shadow-lg border border-slate-100'>
        <div>
          <p className='text-3xl font-bold text-blue-600'>5,000+</p>
          <p className='text-sm text-slate-600'>Happy Customers</p>
        </div>
        <div className='h-12 w-px bg-slate-300' />
        <div>
          <p className='text-3xl font-bold text-orange-600'>100%</p>
          <p className='text-sm text-slate-600'>Secure</p>
        </div>
        <div className='h-12 w-px bg-slate-300' />
        <div>
          <p className='text-3xl font-bold text-green-600'>FREE</p>
          <p className='text-sm text-slate-600'>Forever</p>
        </div>
      </div>
    </motion.div>
  );
}
