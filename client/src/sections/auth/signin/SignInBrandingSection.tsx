import { motion } from 'framer-motion';
import { Clock, Package, Truck } from 'lucide-react';

export default function SignInBrandingSection() {
  const features = [
    {
      icon: <Package className='w-6 h-6' />,
      title: 'Track Your Packages',
      desc: 'Real-time updates on all your shipments',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Truck className='w-6 h-6' />,
      title: 'Ship Anytime',
      desc: 'Request shipping with just one click',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: <Clock className='w-6 h-6' />,
      title: 'Free Storage',
      desc: '45 days of complimentary package storage',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className='hidden lg:block'
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className='text-6xl font-bold text-slate-900 mb-6 leading-tight'>
          Welcome Back to
          <span className='block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
            Fast Shipper
          </span>
        </h1>

        <p className='text-xl text-slate-600 mb-12 leading-relaxed'>
          Continue your shopping journey. Access your US address, track
          packages, and ship to Morocco with ease.
        </p>

        {/* Feature Highlights */}
        <div className='space-y-6'>
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className='flex items-center gap-4 bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow'
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-white`}
              >
                {feature.icon}
              </div>
              <div>
                <h3 className='font-bold text-slate-900'>{feature.title}</h3>
                <p className='text-sm text-slate-600'>{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
