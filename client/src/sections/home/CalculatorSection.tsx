import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';

export default function CalculatorSection() {
  return (
    <section
      id='calculator'
      className='py-24 px-6 bg-gradient-to-br from-blue-600 to-cyan-600'
    >
      <div className='max-w-4xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-12'
        >
          <h2 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Shipping Calculator
          </h2>
          <p className='text-xl text-blue-100'>
            Get an instant quote for your shipment
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className='bg-white rounded-3xl p-8 md:p-12 shadow-2xl'
        >
          <div className='grid md:grid-cols-2 gap-6 mb-8'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Package Weight (kg)
              </label>
              <input
                type='number'
                placeholder='2.5'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Destination City
              </label>
              <select className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'>
                <option>Casablanca</option>
                <option>Rabat</option>
                <option>Marrakech</option>
                <option>Tangier</option>
                <option>Agadir</option>
              </select>
            </div>
          </div>

          <div className='grid md:grid-cols-3 gap-6 mb-8'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Length (cm)
              </label>
              <input
                type='number'
                placeholder='30'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Width (cm)
              </label>
              <input
                type='number'
                placeholder='20'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Height (cm)
              </label>
              <input
                type='number'
                placeholder='15'
                className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
              />
            </div>
          </div>

          <motion.button
            className='w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calculator className='w-5 h-5' />
            Calculate Shipping Cost
          </motion.button>

          <p className='text-center text-sm text-slate-500 mt-6'>
            Estimated cost will be shown based on DHL Express rates
          </p>
        </motion.div>
      </div>
    </section>
  );
}
