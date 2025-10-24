import { useAuthStore } from '@/stores';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignInFormSection() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const login = useAuthStore((state) => state.login);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async () => {
    try {
      // This will set isAuthenticated to true
      await login(formData.email, formData.password);

      // Navigation will happen automatically via ProtectedRoute
      // But we can also manually navigate
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className='w-full max-w-md mx-auto lg:mx-0'
    >
      <div className='bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-bold text-slate-900 mb-2'>Sign In</h2>
          <p className='text-slate-600'>
            Access your account and continue shopping
          </p>
        </div>

        {/* Email & Password Form */}
        <div className='space-y-5'>
          {/* Email */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
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
            <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
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
              <label htmlFor='rememberMe' className='text-sm text-slate-600'>
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
            <span
              onClick={() => navigate('/signup')}
              className='text-blue-600 font-semibold hover:underline cursor-pointer'
            >
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
            <span className='font-semibold'>Secure</span> encrypted connection
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
