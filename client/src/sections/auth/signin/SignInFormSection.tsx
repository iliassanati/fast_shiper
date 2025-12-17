import { useAuthStore } from '@/stores';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Validation Schema
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInFormSection() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error: authError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Invalid email or password',
      });
    }
  };

  const displayError = errors.root?.message || authError;

  return (
    <div className='w-full max-w-md mx-auto'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100'
      >
        {/* Header */}
        <div className='text-center mb-8'>
          <h2 className='text-3xl md:text-5xl font-bold mb-4'>
            <span className='font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
              Welcome{' '}
            </span>
            <span className='font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
              Back
            </span>
          </h2>
          <p className='text-slate-600'>Sign in to access your account</p>
        </div>

        {/* Global Error Message */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3'
          >
            <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-semibold text-red-900'>
                Sign In Failed
              </p>
              <p className='text-sm text-red-700'>{displayError}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
          {/* Email Field */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
              Email Address
            </label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                {...register('email')}
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder='john@example.com'
                disabled={isSubmitting || loading}
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
              >
                <AlertCircle className='w-4 h-4' />
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
              Password
            </label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder='••••••••'
                disabled={isSubmitting || loading}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
                disabled={isSubmitting || loading}
              >
                {showPassword ? (
                  <EyeOff className='w-5 h-5' />
                ) : (
                  <Eye className='w-5 h-5' />
                )}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
              >
                <AlertCircle className='w-4 h-4' />
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <input
                {...register('rememberMe')}
                type='checkbox'
                id='rememberMe'
                className='w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500'
                disabled={isSubmitting || loading}
              />
              <label htmlFor='rememberMe' className='text-sm text-slate-600'>
                Remember me
              </label>
            </div>
            <button
              type='button'
              className='text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors'
              disabled={isSubmitting || loading}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            type='submit'
            disabled={isSubmitting || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group transition-all ${
              isSubmitting || loading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            }`}
            whileHover={!isSubmitting && !loading ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && !loading ? { scale: 0.98 } : {}}
          >
            {isSubmitting || loading ? (
              <>
                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Signing in...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </>
            )}
          </motion.button>
        </form>

        {/* Sign Up Link */}
        <div className='mt-8 text-center'>
          <p className='text-sm text-slate-600'>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/auth/register')}
              className='text-blue-600 font-semibold hover:underline'
              disabled={isSubmitting || loading}
            >
              Sign Up Free
            </button>
          </p>
          <p className='text-xs text-slate-500 mt-2'>
            Get your US address instantly • No credit card required
          </p>
        </div>
      </motion.div>

      {/* Trust Badge */}
      {/* <motion.div
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
      </motion.div> */}
    </div>
  );
}
