import { useAuthStore } from '@/stores';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const moroccanCities = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fes',
  'Tangier',
  'Agadir',
  'Meknes',
  'Oujda',
  'Kenitra',
  'Tetouan',
];

// Validation Schema
const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(
        /^(\+212|0)[5-7]\d{8}$/,
        'Please enter a valid Moroccan phone number'
      ),
    city: z.string().min(1, 'Please select a city'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, 'You must agree to the terms'),
    newsletter: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpFormSection() {
  const navigate = useNavigate();
  const { register: registerUser, loading, error: authError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      newsletter: false,
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await registerUser({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        phone: data.phone,
        city: data.city,
      });
      navigate('/dashboard');
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Registration failed. Please try again.',
      });
    }
  };

  const displayError = errors.root?.message || authError;

  return (
    <div className='w-full max-w-2xl mx-auto'>
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
              Create{' '}
            </span>
            <span className='font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'>
              Account
            </span>
          </h2>

          <p className='text-slate-600'>Fill in your details to get started</p>
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
                Registration Error
              </p>
              <p className='text-sm text-red-700'>{displayError}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
          {/* Name Fields */}
          <div className='grid grid-cols-2 gap-4'>
            {/* First Name */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                First Name *
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  {...register('firstName')}
                  type='text'
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.firstName
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder='John'
                  disabled={isSubmitting || loading}
                />
              </div>
              {errors.firstName && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
                >
                  <AlertCircle className='w-3 h-3' />
                  {errors.firstName.message}
                </motion.p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Last Name *
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  {...register('lastName')}
                  type='text'
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.lastName
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder='Doe'
                  disabled={isSubmitting || loading}
                />
              </div>
              {errors.lastName && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
                >
                  <AlertCircle className='w-3 h-3' />
                  {errors.lastName.message}
                </motion.p>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className='grid grid-cols-2 gap-4'>
            {/* City */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                City *
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10' />
                <select
                  {...register('city')}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors appearance-none ${
                    errors.city
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  disabled={isSubmitting || loading}
                >
                  <option value=''>Select City</option>
                  {moroccanCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              {errors.city && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
                >
                  <AlertCircle className='w-3 h-3' />
                  {errors.city.message}
                </motion.p>
              )}
            </div>
            {/* Phone */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                WhatsApp Number *
              </label>
              <div className='relative'>
                <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  {...register('phone')}
                  type='tel'
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder='+212 6XX-XXXXXX'
                  disabled={isSubmitting || loading}
                />
              </div>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
                >
                  <AlertCircle className='w-3 h-3' />
                  {errors.phone.message}
                </motion.p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
              Email Address *
            </label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
              <input
                {...register('email')}
                type='email'
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
                <AlertCircle className='w-3 h-3' />
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password Fields */}
          <div className='grid grid-cols-2 gap-4'>
            {/* Password */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Password *
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
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600'
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
                  <AlertCircle className='w-3 h-3' />
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Confirm Password *
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder='••••••••'
                  disabled={isSubmitting || loading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600'
                  disabled={isSubmitting || loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
                >
                  <AlertCircle className='w-3 h-3' />
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>
          </div>

          {/* Newsletter */}
          <div className='flex items-start gap-3 text-left'>
            <input
              {...register('newsletter')}
              type='checkbox'
              id='newsletter'
              className='mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500'
              disabled={isSubmitting || loading}
            />
            <label htmlFor='newsletter' className='text-sm text-slate-600'>
              Yes, I'd like to occasionally receive emails from Fast Shipper
              about special offers, new features and other interesting content
            </label>
          </div>

          {/* Terms */}
          <div>
            <div className='flex items-start gap-3 text-left'>
              <input
                {...register('agreeToTerms')}
                type='checkbox'
                id='terms'
                className={`mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 ${
                  errors.agreeToTerms ? 'border-red-300' : ''
                }`}
                disabled={isSubmitting || loading}
              />
              <label htmlFor='terms' className='text-sm text-slate-600'>
                I agree to the{' '}
                <a href='#' className='text-blue-600 hover:underline'>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href='#' className='text-blue-600 hover:underline'>
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className='mt-1.5 text-sm text-red-600 flex items-center gap-1'
              >
                <AlertCircle className='w-3 h-3' />
                {errors.agreeToTerms.message}
              </motion.p>
            )}
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
                Creating Account...
              </>
            ) : (
              <>
                Create Account & Get US Address
                <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </>
            )}
          </motion.button>
        </form>

        {/* Sign In Link */}
        <p className='text-center text-sm text-slate-600 mt-6'>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/auth/login')}
            className='text-blue-600 font-semibold hover:underline'
            disabled={isSubmitting || loading}
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
}
