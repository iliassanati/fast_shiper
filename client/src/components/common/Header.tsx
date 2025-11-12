import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

interface HeaderProps {
  variant?: 'home' | 'auth' | 'dashboard';
  transparent?: boolean;
}

export default function Header({
  variant = 'home',
  transparent = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)']
  );

  // Navigation items for home page
  const navItems = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Calculator', href: '#calculator' },
    { label: 'FAQ', href: '#faq' },
  ];

  const renderAuthButtons = () => (
    <div className='hidden lg:flex items-center gap-4'>
      <motion.button
        className='px-6 py-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/auth/login')}
      >
        Sign In
      </motion.button>
      <motion.button
        className='px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl'
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/auth/register')}
      >
        Get Started Free
      </motion.button>
    </div>
  );

  // Home page header with navigation
  if (variant === 'home') {
    return (
      <motion.header
        className='fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-slate-200'
        style={{
          backgroundColor: transparent
            ? headerBackground
            : 'rgba(255,255,255,0.95)',
        }}
      >
        <nav className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <Logo />

            {/* Desktop Menu */}
            <div className='hidden lg:flex items-center gap-8'>
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className='text-slate-700 hover:text-blue-600 transition-colors font-medium'
                >
                  {item.label}
                </a>
              ))}
              {renderAuthButtons()}
            </div>

            {/* Mobile Menu Button */}
            <button
              className='lg:hidden p-2'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className='lg:hidden pt-4 pb-6 space-y-4 '
            >
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className='block text-slate-700 hover:text-blue-600'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth/login');
                }}
                className='w-full py-2 text-blue-600 font-semibold'
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth/register');
                }}
                className='w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold'
              >
                Get Started Free
              </button>
            </motion.div>
          )}
        </nav>
      </motion.header>
    );
  }

  // Auth page header (simple)
  if (variant === 'auth') {
    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className='fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white bg-opacity-80 backdrop-blur-lg border-b border-slate-200'
      >
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <Logo />
          <div className='text-sm text-slate-600'>
            Don't have an account?{' '}
            <span
              className='text-blue-600 font-semibold hover:text-blue-700 cursor-pointer'
              onClick={() => navigate('/auth/register')}
            >
              Sign Up Free
            </span>
          </div>
        </div>
      </motion.header>
    );
  }

  // Dashboard header (minimal)
  return (
    <header className='bg-white border-b border-slate-200 px-6 py-4'>
      <div className='flex items-center justify-between'>
        <Logo />
        <div className='flex items-center gap-4'>
          <span className='text-sm text-slate-600'>Welcome back!</span>
        </div>
      </div>
    </header>
  );
}
