import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ShoppingCart,
  Package,
  Truck,
  Home,
  type LucideIcon,
} from 'lucide-react';

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: UserPlus,
    title: 'REGISTER',
    description: 'Sign up easily to instantly get your own U.S address.',
  },
  {
    icon: ShoppingCart,
    title: 'SHOP',
    description: 'Shop from any online retailers in the world.',
  },
  {
    icon: Package,
    title: 'SHIP',
    description: 'Ship to your address with Fast Shipper.',
  },
  {
    icon: Truck,
    title: 'CONSOLIDATE',
    description: 'Combine multiple packages into one shipment.',
  },
  {
    icon: Home,
    title: 'DELIVER',
    description: 'Fast Shipper will deliver your order to you.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id='how-it-works' className='relative'>
      {/* Main Content Area */}
      <div className='py-20 px-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl md:text-5xl font-bold'>
              <span className=' font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                How Fast{' '}
              </span>
              <span className='font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
                Shipper Works
              </span>
            </h2>
          </motion.div>

          {/* Steps Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6'>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className='flex flex-col items-center text-center group'
              >
                {/* Circular Icon Container */}
                <motion.div
                  className='relative mb-6'
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {/* Outer Ring */}
                  <div className='w-32 h-32 md:w-44 md:h-44 rounded-full p-[6px] bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center bg-white shadow-lg group-hover:shadow-xl transition-shadow duration-300'>
                    {/* Inner Icon */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className='bg-white rounded-full w-full h-full flex items-center justify-center'
                    >
                      <svg width='0' height='0' className='absolute'>
                        <defs>
                          <linearGradient
                            id='icon-gradient'
                            x1='0%'
                            y1='0%'
                            x2='100%'
                            y2='0%'
                          >
                            <stop offset='0%' stopColor='#f97316' />{' '}
                            {/* orange-500 */}
                            <stop offset='100%' stopColor='#ef4444' />{' '}
                            {/* red-500 */}
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Then apply it to your icon */}
                      <step.icon
                        className='w-14 h-14 md:w-16 md:h-16 transition-all duration-300'
                        stroke='url(#icon-gradient)'
                        strokeWidth={1.5}
                      />
                    </motion.div>{' '}
                  </div>

                  {/* Decorative gradient glow on hover */}
                  <div className='absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10' />
                </motion.div>

                {/* Title */}
                <h3 className='text-lg md:text-xl mb-2 tracking-wide'>
                  <span className='font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
                    {step.title}
                  </span>
                </h3>

                {/* Description */}
                <p className='text-slate-600 text-sm md:text-base leading-relaxed max-w-[200px]'>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section with Arrow */}
      {/* <div className='relative bg-slate-100 pt-16 pb-20'> */}
      {/* Upward Arrow/Triangle */}
      {/* <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full'>
          <div className='w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[25px] border-b-slate-100' />
        </div> */}

      {/* CTA Content */}
      {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center'
        >
          <h3 className='text-2xl md:text-3xl font-bold text-slate-800 mb-4'>
            Ready to Start Shopping?
          </h3>
          <p className='text-slate-600 mb-8 max-w-xl mx-auto px-4'>
            Join thousands of customers who shop from the USA and get their
            packages delivered worldwide.
          </p>
          <motion.button
            className='px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-shadow'
            whileHover={{
              scale: 1.05,
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/signup')}
          >
            Get Your Free Address →
          </motion.button>
        </motion.div> */}
      {/* </div> */}
    </section>
  );
}
