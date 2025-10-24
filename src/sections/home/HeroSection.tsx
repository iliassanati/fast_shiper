import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  Package,
  Star,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className='relative pt-32 pb-20 px-6 overflow-hidden'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full border border-blue-200 mb-6'
            >
              <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
              <span className='text-sm font-semibold text-blue-700'>
                🇺🇸 Shop USA → 🇲🇦 Deliver Morocco
              </span>
            </motion.div>

            <h1 className='text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight'>
              Shop from the
              <span className='block bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent'>
                USA, Receive in Morocco
              </span>
            </h1>

            <p className='text-xl text-slate-600 mb-8 leading-relaxed'>
              Get your free US shipping address. Shop on Amazon, eBay, and
              thousands of US stores. We handle consolidation and DHL Express
              shipping to Morocco.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 mb-12'>
              <motion.button
                className='group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl flex items-center justify-center gap-2'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
              >
                Get Your US Address FREE
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </motion.button>

              <motion.button
                className='px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg shadow-lg hover:shadow-xl border-2 border-blue-200 flex items-center justify-center gap-2'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calculator className='w-5 h-5' />
                Calculate Shipping
              </motion.button>
            </div>

            {/* Trust Indicators */}
            <div className='flex flex-wrap items-center gap-8'>
              <div>
                <div className='flex items-center gap-1 mb-2'>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className='w-5 h-5 fill-yellow-400 text-yellow-400'
                    />
                  ))}
                </div>
                <p className='text-sm text-slate-600'>
                  <span className='font-bold text-slate-900'>5,000+</span> happy
                  customers
                </p>
              </div>
              <div className='h-12 w-px bg-slate-300' />
              <div>
                <p className='text-2xl font-bold text-blue-600'>3-5 Days</p>
                <p className='text-sm text-slate-600'>Express Delivery</p>
              </div>
              <div className='h-12 w-px bg-slate-300' />
              <div>
                <p className='text-2xl font-bold text-orange-600'>45 Days</p>
                <p className='text-sm text-slate-600'>Free Storage</p>
              </div>
            </div>
          </motion.div>

          {/* Right Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className='relative'
          >
            <motion.div
              className='relative'
              animate={{ y: [0, -20, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className='bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-8 shadow-2xl'>
                <div className='bg-white rounded-2xl p-6'>
                  <div className='text-center text-8xl mb-4'>📦</div>
                  <div className='flex justify-center items-center gap-4 mb-4'>
                    <span className='text-4xl'>🇺🇸</span>
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className='w-8 h-8 text-blue-600' />
                    </motion.div>
                    <span className='text-4xl'>🇲🇦</span>
                  </div>
                  <p className='text-center text-slate-600 font-medium'>
                    Fast & Secure Shipping
                  </p>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                className='absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border-2 border-blue-100'
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className='flex items-center gap-2'>
                  <Package className='w-6 h-6 text-blue-600' />
                  <div>
                    <p className='text-xs text-slate-600'>Packages Received</p>
                    <p className='text-lg font-bold text-slate-900'>1,234</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className='absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border-2 border-orange-100'
                animate={{ y: [0, 10, 0], rotate: [2, -2, 2] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              >
                <div className='flex items-center gap-2'>
                  <Truck className='w-6 h-6 text-orange-600' />
                  <div>
                    <p className='text-xs text-slate-600'>Delivered Today</p>
                    <p className='text-lg font-bold text-slate-900'>89</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className='absolute bottom-8 left-1/2 transform -translate-x-1/2'
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className='w-8 h-8 text-slate-400' />
      </motion.div>
    </section>
  );
}
