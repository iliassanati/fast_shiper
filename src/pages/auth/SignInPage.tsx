import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Facebook,
  Truck,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = () => {
    console.log('Sign in:', formData);
    navigate('/client');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden flex items-center'>
      {/* Animated Background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <motion.div
          className='absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20'
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20'
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20'
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white bg-opacity-80 backdrop-blur-lg border-b border-slate-200'
      >
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <motion.div
            className='flex items-center gap-3 cursor-pointer'
            whileHover={{ scale: 1.05 }}
          >
            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg'>
              <Package className='w-7 h-7 text-white' />
            </div>
            <div>
              <span className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                Shipzy
              </span>
              <p className='text-xs text-slate-600'>USA to Morocco</p>
            </div>
          </motion.div>

          <div className='text-sm text-slate-600'>
            Don't have an account?{' '}
            <span className='text-blue-600 font-semibold hover:text-blue-700 cursor-pointer'>
              Sign Up Free
            </span>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className='relative z-10 w-full px-6 py-24'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid lg:grid-cols-2 gap-16 items-center'>
            {/* Left Side - Branding */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className='hidden lg:block'
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className='text-6xl font-bold text-slate-900 mb-6 leading-tight'>
                  Welcome Back to
                  <span className='block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                    Shipzy
                  </span>
                </h1>

                <p className='text-xl text-slate-600 mb-12 leading-relaxed'>
                  Continue your shopping journey. Access your US address, track
                  packages, and ship to Morocco with ease.
                </p>

                {/* Feature Highlights */}
                <div className='space-y-6'>
                  {[
                    {
                      icon: <Package className='w-6 h-6' />,
                      title: 'Track Your Packages',
                      desc: 'Real-time updates on all your shipments',
                      gradient: 'from-blue-500 to-cyan-500',
                    },
                    {
                      icon: <Truck className='w-6 h-6' />,
                      title: 'Ship Anytime',
                      desc: 'Request shipping with just one click',
                      gradient: 'from-orange-500 to-red-500',
                    },
                    {
                      icon: <Clock className='w-6 h-6' />,
                      title: 'Free Storage',
                      desc: '45 days of complimentary package storage',
                      gradient: 'from-green-500 to-emerald-500',
                    },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className='flex items-center gap-4 bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow'
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-white`}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className='font-bold text-slate-900'>
                          {feature.title}
                        </h3>
                        <p className='text-sm text-slate-600'>{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className='mt-12 flex items-center gap-8 p-6 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl'
                >
                  <div className='text-white'>
                    <p className='text-4xl font-bold'>5,000+</p>
                    <p className='text-blue-100'>Active Users</p>
                  </div>
                  <div className='h-12 w-px bg-white opacity-30' />
                  <div className='text-white'>
                    <p className='text-4xl font-bold'>50K+</p>
                    <p className='text-blue-100'>Packages Shipped</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Side - Sign In Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className='w-full max-w-md mx-auto lg:mx-0'
            >
              <div className='bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100'>
                <div className='text-center mb-8'>
                  <h2 className='text-3xl font-bold text-slate-900 mb-2'>
                    Sign In
                  </h2>
                  <p className='text-slate-600'>
                    Access your account and continue shopping
                  </p>
                </div>

                {/* Social Login */}
                <div className='space-y-3 mb-6'>
                  <motion.button
                    className='w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className='w-5 h-5' viewBox='0 0 24 24'>
                      <path
                        fill='#4285F4'
                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      />
                      <path
                        fill='#34A853'
                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      />
                      <path
                        fill='#FBBC05'
                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      />
                      <path
                        fill='#EA4335'
                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      />
                    </svg>
                    <span className='font-semibold text-slate-700'>
                      Continue with Google
                    </span>
                  </motion.button>

                  <motion.button
                    className='w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Facebook className='w-5 h-5 text-blue-600' />
                    <span className='font-semibold text-slate-700'>
                      Continue with Facebook
                    </span>
                  </motion.button>
                </div>

                <div className='relative mb-6'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-slate-200'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white text-slate-500'>
                      Or sign in with email
                    </span>
                  </div>
                </div>

                {/* Email & Password Form */}
                <div className='space-y-5'>
                  {/* Email */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Email Address
                    </label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                      <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                        placeholder='john@example.com'
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Password
                    </label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        className='w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                        placeholder='••••••••'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPassword ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id='rememberMe'
                        name='rememberMe'
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className='w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500'
                      />
                      <label
                        htmlFor='rememberMe'
                        className='text-sm text-slate-600'
                      >
                        Remember me
                      </label>
                    </div>
                    <span className='text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-semibold'>
                      Forgot password?
                    </span>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    onClick={handleSubmit}
                    className='w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In to Dashboard
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                  </motion.button>
                </div>

                {/* Sign Up Link */}
                <div className='mt-8 text-center'>
                  <p className='text-sm text-slate-600'>
                    Don't have an account?{' '}
                    <span className='text-blue-600 font-semibold hover:underline cursor-pointer'>
                      Sign Up Free
                    </span>
                  </p>
                  <p className='text-xs text-slate-500 mt-2'>
                    Get your US address instantly • No credit card required
                  </p>
                </div>
              </div>

              {/* Trust Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='mt-6 text-center'
              >
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-100'>
                  <CheckCircle className='w-5 h-5 text-green-500' />
                  <span className='text-sm text-slate-700'>
                    <span className='font-semibold'>256-bit SSL</span> encrypted
                    connection
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='fixed bottom-0 left-0 right-0 z-10 py-6 text-center text-sm text-slate-600 bg-white bg-opacity-50 backdrop-blur-sm'>
        <p>© 2025 Shipzy. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SignInPage;
