import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { faqs } from '@/data/faqs';

export default function FAQSection() {
  return (
    <section
      id='faq'
      className='py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50'
    >
      <div className='max-w-4xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <span className='inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4'>
            FAQ
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            Frequently Asked Questions
          </h2>
          <p className='text-xl text-slate-600'>
            Everything you need to know about Shipzy
          </p>
        </motion.div>

        <div className='space-y-4'>
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <details className='group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100'>
                <summary className='flex justify-between items-center cursor-pointer list-none'>
                  <span className='font-bold text-lg text-slate-900'>
                    {faq.q}
                  </span>
                  <motion.div
                    className='ml-4'
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 180 }}
                  >
                    <ChevronDown className='w-6 h-6 text-blue-600 group-open:rotate-180 transition-transform' />
                  </motion.div>
                </summary>
                <p className='mt-4 text-slate-600 leading-relaxed'>{faq.a}</p>
              </details>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
