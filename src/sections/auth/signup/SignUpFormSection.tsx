import { motion } from 'framer-motion';
import {
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

export default function SignUpFormSection() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'Morocco',
    city: '',
    address: '',
    postalCode: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign up:', formData);
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className='bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100'>
        <h2 className='text-3xl font-bold text-slate-900 mb-2'>
          Create Account
        </h2>
        <p className='text-slate-600 mb-8'>
          Fill in your details to get started
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* Name Fields */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                First Name *
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleChange}
                  className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  placeholder='First Name'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Last Name *
              </label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleChange}
                  className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  placeholder='Last Name'
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Email Address *
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
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                Phone Number *
              </label>
              <div className='relative'>
                <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  placeholder='+212 6XX-XXXXXX'
                  required
                />
              </div>
            </div>
          </div>

          {/* City & Postal Code */}
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                City *
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <select
                  name='city'
                  value={formData.city}
                  onChange={handleChange}
                  className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none'
                  required
                >
                  <option value=''>Select City</option>
                  {moroccanCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Password *
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
                  required
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
              <p className='text-xs text-slate-500 mt-1 text-left'>
                Minimum 8 characters, at least one uppercase and one number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2 text-left'>
                Confirm Password *
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className='w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                  placeholder='••••••••'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className='flex items-start gap-3 text-left'>
            <input
              type='checkbox'
              id='terms'
              className='mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500'
              required
            />
            <label htmlFor='terms' className='text-sm text-slate-600'>
              Yes, I'd like to occasionally receive emails from Fast Shipper
              about special offers, new features and other interesting content
            </label>
          </div>

          {/* Terms */}
          <div className='flex items-start gap-3'>
            <input
              type='checkbox'
              id='terms'
              className='mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500'
              required
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

          {/* Submit Button */}
          <motion.button
            type='submit'
            className='w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account & Get US Address
            <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
          </motion.button>
        </form>

        {/* Sign In Link */}
        <p className='text-center text-sm text-slate-600 mt-6'>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/signin')}
            className='text-blue-600 font-semibold hover:underline cursor-pointer'
          >
            Sign In
          </span>
        </p>
      </div>
    </motion.div>
  );
}
