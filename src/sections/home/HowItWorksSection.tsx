import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { steps } from '@/data/steps';

export default function HowItWorksSection() {
  const navigate = useNavigate();

  return (
    <section id='how-it-works' className='py-24 px-6 bg-white'>
      <div className='max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <span className='inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4'>
            Simple Process
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            How Fast Shipper Works
          </h2>
          <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
            Get started in 5 simple steps and start shopping from the USA today
          </p>
        </motion.div>

        <div className='relative'>
          {/* Connection Line */}
          <div className='hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-cyan-200 to-orange-200 transform -translate-y-1/2' />

          <div className='grid md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10'>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className='relative'
              >
                <div className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow border border-slate-100 h-full'>
                  {/* Step Number */}
                  <div className='relative mb-6'>
                    <motion.div
                      className='w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto'
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {step.number}
                    </motion.div>
                    <div className='absolute -bottom-2 -right-2 text-4xl'>
                      {step.image}
                    </div>
                  </div>

                  <div className='text-blue-600 mb-3 flex justify-center'>
                    <step.icon className='w-12 h-12' />
                  </div>

                  <h3 className='text-xl font-bold text-slate-900 mb-3 text-center'>
                    {step.title}
                  </h3>
                  <p className='text-slate-600 text-center text-sm leading-relaxed'>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mt-16'
        >
          <motion.button
            className='px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
          >
            Start Shopping Now →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
