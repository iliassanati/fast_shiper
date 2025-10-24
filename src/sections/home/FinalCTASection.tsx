import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className='py-24 px-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 relative overflow-hidden'>
      <div className='absolute inset-0 bg-white opacity-10'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className='max-w-4xl mx-auto text-center relative z-10'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className='text-4xl md:text-6xl font-bold text-white mb-6'>
            Ready to Start Shopping?
          </h2>
          <p className='text-xl md:text-2xl text-blue-100 mb-12'>
            Join 5,000+ Moroccan shoppers saving money on US purchases
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <motion.button
              className='px-12 py-5 bg-white text-blue-600 rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')}
            >
              Get Your Free US Address →
            </motion.button>
            <motion.button
              className='px-12 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-xl hover:bg-white hover:text-blue-600 transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Support
            </motion.button>
          </div>

          <p className='text-blue-100 mt-8 text-sm'>
            No credit card required • Free forever • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
