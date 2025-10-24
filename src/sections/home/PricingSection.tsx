import { motion } from 'framer-motion';
import { pricingFeatures, shippingRates } from '@/data/pricing';

export default function PricingSection() {
  return (
    <section id='pricing' className='py-24 px-6 bg-white'>
      <div className='max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <span className='inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4'>
            Transparent Pricing
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            Simple & Affordable
          </h2>
          <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
            No hidden fees. Pay only for what you use.
          </p>
        </motion.div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Free Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200'
          >
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-slate-900 mb-2'>
                Always Free
              </h3>
              <p className='text-slate-600'>No membership fees, ever</p>
            </div>
            <div className='space-y-4'>
              {pricingFeatures.map((feat, i) => (
                <div key={i} className='flex items-start gap-3'>
                  <feat.icon className='w-5 h-5 text-green-500' />
                  <span className='text-slate-700'>{feat.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Consolidation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-200'
          >
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-slate-900 mb-2'>
                Consolidation
              </h3>
              <div className='flex items-baseline gap-2'>
                <span className='text-4xl font-bold text-blue-600'>50 DH</span>
                <span className='text-slate-600'>per package</span>
              </div>
            </div>
            <p className='text-slate-600 mb-6'>
              Combine multiple packages into one shipment and save up to 80% on
              shipping costs
            </p>
            <div className='bg-blue-100 rounded-xl p-4'>
              <p className='text-sm text-blue-700 font-semibold'>
                💡 Tip: The more packages you consolidate, the more you save!
              </p>
            </div>
          </motion.div>

          {/* Shipping */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className='bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 border-2 border-orange-200'
          >
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-slate-900 mb-2'>
                DHL Shipping
              </h3>
              <p className='text-slate-600'>Based on weight & dimensions</p>
            </div>
            <div className='space-y-4'>
              {shippingRates.map((rate, i) => (
                <div
                  key={i}
                  className='flex justify-between items-center py-3 border-b border-slate-200 last:border-0'
                >
                  <span className='text-slate-700'>{rate.weight}</span>
                  <span className='font-bold text-slate-900'>{rate.price}</span>
                </div>
              ))}
            </div>
            <p className='text-xs text-slate-500 mt-4'>
              * Prices are estimates. Use our calculator for exact quotes.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
