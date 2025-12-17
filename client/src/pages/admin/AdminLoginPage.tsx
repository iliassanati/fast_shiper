// client/src/pages/admin/AdminLoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Lock, Mail, Shield } from 'lucide-react';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAdminAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-6'>
      {/* Background Effects */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div
          className='absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10'
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10'
          animate={{
            x: [0, -100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='relative z-10 w-full max-w-md'
      >
        <div className='bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12'>
          {/* Header */}
          <div className='text-center mb-8'>
            <motion.div
              className='w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'
              whileHover={{ scale: 1.05 }}
            >
              <Shield className='w-8 h-8 text-white' />
            </motion.div>
            <h1 className='text-3xl font-bold text-white mb-2'>Admin Portal</h1>
            <p className='text-blue-200'>Fast Shipper Management System</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 flex items-start gap-3'
            >
              <AlertCircle className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-semibold text-red-200'>
                  Authentication Error
                </p>
                <p className='text-sm text-red-300'>{error}</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Email */}
            <div>
              <label className='block text-sm font-semibold text-blue-100 mb-2'>
                Email Address
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300' />
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  className='w-full pl-11 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none transition-colors'
                  placeholder='admin@example.com'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-semibold text-blue-100 mb-2'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300' />
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  className='w-full pl-11 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none transition-colors'
                  placeholder='••••••••'
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type='submit'
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                loading
                  ? 'bg-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
              }`}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className='w-5 h-5' />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <div className='mt-8 text-center'>
            <p className='text-xs text-blue-200'>
              🔒 Secured admin access • All actions are logged
            </p>
          </div>
        </div>

        {/* Back to Client Portal Link */}
        <div className='mt-6 text-center'>
          <button
            onClick={() => navigate('/')}
            className='text-blue-200 hover:text-white transition-colors text-sm'
          >
            ← Back to Client Portal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
