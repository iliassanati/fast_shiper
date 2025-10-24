import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { testimonials } from '@/data/testimonials';

export default function TestimonialsSection() {
  return (
    <section className='py-24 px-6 bg-white'>
      <div className='max-w-7xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-20'
        >
          <span className='inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4'>
            Testimonials
          </span>
          <h2 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
            What Our Customers Say
          </h2>
          <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
            Join thousands of satisfied customers shopping from the USA
          </p>
        </motion.div>

        <div className='grid md:grid-cols-3 gap-8'>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200'
            >
              <div className='flex items-center gap-1 mb-4'>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className='w-5 h-5 fill-yellow-400 text-yellow-400'
                  />
                ))}
              </div>
              <p className='text-slate-700 mb-6 leading-relaxed italic'>
                "{testimonial.text}"
              </p>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl'>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className='font-bold text-slate-900'>{testimonial.name}</p>
                  <p className='text-sm text-slate-600'>
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
