import { motion } from 'framer-motion';
import { features } from '@/data/features';

export default function FeaturesSection() {
  return (
    <section
      id='features'
      className='py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50'
    >
      <div className='max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <span className='inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4'>
            Why Choose Us
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            Our Services
          </h2>
          <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
            Comprehensive features to make international shopping effortless
          </p>
        </motion.div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className='group'
            >
              <div className='bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-100 h-full'>
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className='w-8 h-8' />
                </motion.div>
                <h3 className='text-2xl font-bold text-slate-900 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-slate-600 leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
