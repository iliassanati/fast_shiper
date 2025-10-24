import { motion } from 'framer-motion';
import { trustedStores } from '@/data/pricing';

export default function TrustedStoresSection() {
  return (
    <section className='py-16 px-6 bg-gradient-to-r from-slate-50 to-blue-50'>
      <div className='max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-12'
        >
          <p className='text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider'>
            Shop from your favorite stores
          </p>
          <h3 className='text-3xl font-bold text-slate-900'>
            Compatible with <span className='text-blue-600'>1000+</span> US
            Retailers
          </h3>
        </motion.div>

        <div className='flex flex-wrap justify-center items-center gap-8 md:gap-12'>
          {trustedStores.map((store, i) => (
            <motion.div
              key={store}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className='text-2xl font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer'
            >
              {store}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
