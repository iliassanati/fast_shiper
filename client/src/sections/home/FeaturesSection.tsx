import { motion } from 'framer-motion';
import {
  Archive,
  Image,
  MapPin,
  PackageOpen,
  ShoppingBag,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    icon: MapPin,
    title: 'ADDRESSES',
    description:
      'We provide you with a US address where your mail and packages will be received.',
  },
  {
    icon: Image,
    title: 'FREE CLEAR IMAGES',
    description:
      'Fast Shipper will provide a photo and attach it to your account for each item you receive.',
  },
  {
    icon: Smartphone,
    title: 'MOBILE NOTIFICATIONS',
    description:
      'App Notifications will alert you when updates are made to your account.',
  },
  {
    icon: PackageOpen,
    title: 'CONSOLIDATION',
    description:
      'We remove all unnecessary packaging and combine all your items in one delivery to lower your shipping cost.',
  },
  {
    icon: Archive,
    title: 'FREE STORAGE',
    description:
      'With Fast Shipper account you can store each package free up to 60 days.',
  },
];

export default function FeaturesSection() {
  return (
    <section id='features' className='py-2 px-6 '>
      {/* 
    <section id='features' className='bg-slate-100'> */}
      {/* Services Section */}
      <div className='max-w-6xl mx-auto relative  pt-16 pb-20 '>
        <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full'>
          <div className='w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[25px] border-b-slate-50' />
        </div>
        <div className='py-20 px-6'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-16'
          >
            <h2 className='text-4xl md:text-5xl font-bold'>
              <span className=' font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                Our{' '}
              </span>
              <span className='font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
                Services
              </span>
            </h2>
          </motion.div>

          {/* Services Grid */}
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-14'>
            {services.map((service, index) => (
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
                  className='relative mb-5'
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
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
                  {/* Outer Ring */}
                  <div className='w-32 h-32 md:w-44 md:h-44 rounded-full p-[6px] bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center bg-white shadow-lg group-hover:shadow-xl transition-shadow duration-300shadow-md '>
                    {/* Inner Icon */}
                    <motion.div
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className='bg-white rounded-full w-full h-full flex items-center justify-center'
                    >
                      <service.icon
                        className='w-14 h-14 md:w-16 md:h-16 transition-all duration-300'
                        stroke='url(#icon-gradient)'
                        // className='w-12 h-12 md:w-14 md:h-14 text-slate-500 group-hover:text-blue-500 transition-colors duration-300'
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  </div>

                  {/* Subtle glow effect */}
                  <div className='absolute inset-0 rounded-full bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10' />
                </motion.div>

                {/* Title */}
                <h3 className='text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
                  {service.title}
                </h3>

                {/* Description */}
                <p className='text-slate-600 text-sm leading-relaxed max-w-[280px]'>
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
