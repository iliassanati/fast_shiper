import { motion } from 'framer-motion';
import {
  ArrowRight,
  Box,
  Calculator,
  Camera,
  CheckCircle,
  ChevronDown,
  Clock,
  Package,
  Plane,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  Users,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Package className='w-8 h-8' />,
      title: 'Free US Address',
      description:
        'Get your unique US shipping address with suite number instantly upon signup',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Clock className='w-8 h-8' />,
      title: '45 Days Free Storage',
      description:
        'Store your packages at our warehouse for free up to 45 days',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Box className='w-8 h-8' />,
      title: 'Package Consolidation',
      description:
        'Combine multiple packages into one shipment and save up to 80% on shipping',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: <Camera className='w-8 h-8' />,
      title: 'Free Package Photos',
      description:
        'Receive photos of your packages once they arrive at our warehouse',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Plane className='w-8 h-8' />,
      title: 'DHL Express Shipping',
      description:
        'Fast and reliable delivery to Morocco in just 3-5 business days',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: <Shield className='w-8 h-8' />,
      title: 'Secure & Insured',
      description:
        'Your packages are protected with comprehensive insurance coverage',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: <Users className='w-12 h-12' />,
      title: 'Sign Up Free',
      description:
        'Create your free account in minutes and get your unique US shipping address with suite number',
      image: '📝',
    },
    {
      number: '02',
      icon: <ShoppingBag className='w-12 h-12' />,
      title: 'Shop US Stores',
      description:
        'Use your Shipzy address to shop on Amazon, eBay, Walmart, Best Buy, and thousands of US retailers',
      image: '🛍️',
    },
    {
      number: '03',
      icon: <Package className='w-12 h-12' />,
      title: 'We Receive & Store',
      description:
        'Your packages arrive at our US warehouse. We send you photos and store them FREE for 45 days',
      image: '📦',
    },
    {
      number: '04',
      icon: <Box className='w-12 h-12' />,
      title: 'Consolidate & Save',
      description:
        'Combine multiple packages into one shipment to maximize savings on international shipping',
      image: '📦',
    },
    {
      number: '05',
      icon: <Truck className='w-12 h-12' />,
      title: 'Ship to Morocco',
      description:
        'Choose DHL Express shipping and receive your packages at your doorstep in Morocco',
      image: '🚚',
    },
  ];

  const testimonials = [
    {
      name: 'Youssef El Amrani',
      location: 'Casablanca',
      rating: 5,
      text: 'Shipzy made it so easy to buy electronics from Amazon US! Got my PS5 delivered in just 4 days. Highly recommend!',
      avatar: '👨',
    },
    {
      name: 'Fatima Zahiri',
      location: 'Rabat',
      rating: 5,
      text: 'I saved over 2000 DH by consolidating 5 packages into one shipment. The customer service is amazing!',
      avatar: '👩',
    },
    {
      name: 'Amine Benali',
      location: 'Marrakech',
      rating: 5,
      text: 'Best package forwarding service in Morocco! Fast, reliable, and transparent pricing. Will use again!',
      avatar: '👨',
    },
  ];

  const faqs = [
    {
      q: 'How do I get my US address?',
      a: "Simply sign up for a free account, and you'll instantly receive your unique US shipping address with a suite number. Use this address for all your US purchases.",
    },
    {
      q: 'How long does shipping to Morocco take?',
      a: 'With DHL Express, your packages typically arrive in Morocco within 3-5 business days after shipping from our warehouse.',
    },
    {
      q: 'What is package consolidation?',
      a: 'Package consolidation means combining multiple packages into one shipment. This can save you up to 80% on international shipping costs!',
    },
    {
      q: 'How much does storage cost?',
      a: 'Storage is completely FREE for the first 45 days! This gives you plenty of time to accumulate packages for consolidation.',
    },
    {
      q: 'Can I shop from any US store?',
      a: 'Yes! You can shop from any US retailer including Amazon, eBay, Walmart, Target, Best Buy, and thousands more.',
    },
    {
      q: 'How do I pay for shipping?',
      a: 'We accept credit cards, PayPal, and local Moroccan payment methods. All prices are transparent with no hidden fees.',
    },
  ];

  const pricingFeatures = [
    {
      icon: <CheckCircle className='w-5 h-5 text-green-500' />,
      text: 'Free US shipping address',
    },
    {
      icon: <CheckCircle className='w-5 h-5 text-green-500' />,
      text: '45 days free storage',
    },
    {
      icon: <CheckCircle className='w-5 h-5 text-green-500' />,
      text: 'Free package photos',
    },
    {
      icon: <CheckCircle className='w-5 h-5 text-green-500' />,
      text: 'Package consolidation available',
    },
    {
      icon: <CheckCircle className='w-5 h-5 text-green-500' />,
      text: 'Real-time tracking',
    },
    {
      icon: <CheckCircle className='w-5 h-5 text-green-500' />,
      text: '24/7 customer support',
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className='relative pt-32 pb-20 px-6 overflow-hidden'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full border border-blue-200 mb-6'
              >
                <span className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-semibold text-blue-700'>
                  🇺🇸 Shop USA → 🇲🇦 Deliver Morocco
                </span>
              </motion.div>

              <h1 className='text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight'>
                Shop from the
                <span className='block bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent'>
                  USA, Receive in Morocco
                </span>
              </h1>

              <p className='text-xl text-slate-600 mb-8 leading-relaxed'>
                Get your free US shipping address. Shop on Amazon, eBay, and
                thousands of US stores. We handle consolidation and DHL Express
                shipping to Morocco.
              </p>

              <div className='flex flex-col sm:flex-row gap-4 mb-12'>
                <motion.button
                  className='group px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/signup')}
                >
                  Get Your US Address FREE
                  <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </motion.button>

                <motion.button
                  className='px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg shadow-lg hover:shadow-xl border-2 border-blue-200 flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calculator className='w-5 h-5' />
                  Calculate Shipping
                </motion.button>
              </div>

              {/* Trust Indicators */}
              <div className='flex flex-wrap items-center gap-8'>
                <div>
                  <div className='flex items-center gap-1 mb-2'>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className='w-5 h-5 fill-yellow-400 text-yellow-400'
                      />
                    ))}
                  </div>
                  <p className='text-sm text-slate-600'>
                    <span className='font-bold text-slate-900'>5,000+</span>{' '}
                    happy customers
                  </p>
                </div>
                <div className='h-12 w-px bg-slate-300' />
                <div>
                  <p className='text-2xl font-bold text-blue-600'>3-5 Days</p>
                  <p className='text-sm text-slate-600'>Express Delivery</p>
                </div>
                <div className='h-12 w-px bg-slate-300' />
                <div>
                  <p className='text-2xl font-bold text-orange-600'>45 Days</p>
                  <p className='text-sm text-slate-600'>Free Storage</p>
                </div>
              </div>
            </motion.div>

            {/* Right Image/Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className='relative'
            >
              <motion.div
                className='relative'
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className='bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-8 shadow-2xl'>
                  <div className='bg-white rounded-2xl p-6'>
                    <div className='text-center text-8xl mb-4'>📦</div>
                    <div className='flex justify-center items-center gap-4 mb-4'>
                      <span className='text-4xl'>🇺🇸</span>
                      <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className='w-8 h-8 text-blue-600' />
                      </motion.div>
                      <span className='text-4xl'>🇲🇦</span>
                    </div>
                    <p className='text-center text-slate-600 font-medium'>
                      Fast & Secure Shipping
                    </p>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  className='absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border-2 border-blue-100'
                  animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className='flex items-center gap-2'>
                    <Package className='w-6 h-6 text-blue-600' />
                    <div>
                      <p className='text-xs text-slate-600'>
                        Packages Received
                      </p>
                      <p className='text-lg font-bold text-slate-900'>1,234</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className='absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border-2 border-orange-100'
                  animate={{ y: [0, 10, 0], rotate: [2, -2, 2] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                >
                  <div className='flex items-center gap-2'>
                    <Truck className='w-6 h-6 text-orange-600' />
                    <div>
                      <p className='text-xs text-slate-600'>Delivered Today</p>
                      <p className='text-lg font-bold text-slate-900'>89</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className='absolute bottom-8 left-1/2 transform -translate-x-1/2'
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className='w-8 h-8 text-slate-400' />
        </motion.div>
      </section>

      {/* Trusted Stores Section */}
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
            {[
              'Amazon',
              'eBay',
              'Walmart',
              'Best Buy',
              'Target',
              'Nike',
              "Macy's",
              'Sephora',
            ].map((store, i) => (
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

      {/* How It Works Section */}
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
              How Shipzy Works
            </h2>
            <p className='text-xl text-slate-600 max-w-2xl mx-auto'>
              Get started in 5 simple steps and start shopping from the USA
              today
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
                      {step.icon}
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

      {/* Features Section */}
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
              Everything You Need
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
                    {feature.icon}
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

      {/* Pricing Section */}
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
                    {feat.icon}
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
                  <span className='text-4xl font-bold text-blue-600'>
                    50 DH
                  </span>
                  <span className='text-slate-600'>per package</span>
                </div>
              </div>
              <p className='text-slate-600 mb-6'>
                Combine multiple packages into one shipment and save up to 80%
                on shipping costs
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
                <div className='flex justify-between items-center py-3 border-b border-slate-200'>
                  <span className='text-slate-700'>0-1 kg</span>
                  <span className='font-bold text-slate-900'>~300 DH</span>
                </div>
                <div className='flex justify-between items-center py-3 border-b border-slate-200'>
                  <span className='text-slate-700'>1-3 kg</span>
                  <span className='font-bold text-slate-900'>~500 DH</span>
                </div>
                <div className='flex justify-between items-center py-3'>
                  <span className='text-slate-700'>3-5 kg</span>
                  <span className='font-bold text-slate-900'>~700 DH</span>
                </div>
              </div>
              <p className='text-xs text-slate-500 mt-4'>
                * Prices are estimates. Use our calculator for exact quotes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
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

      {/* Testimonials Section */}
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
                    <p className='font-bold text-slate-900'>
                      {testimonial.name}
                    </p>
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

      {/* FAQ Section */}
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

      {/* Final CTA Section */}
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
    </MainLayout>
  );
};

export default HomePage;
