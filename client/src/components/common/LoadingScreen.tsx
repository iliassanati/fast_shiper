import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  /**
   * Whether to show the loading screen
   */
  isLoading?: boolean;
  /**
   * Minimum time to show the loading screen (in ms)
   * Prevents flash of loading screen for very fast loads
   */
  minDisplayTime?: number;
  /**
   * Optional text to show below the logo
   */
  loadingText?: string;
  /**
   * Callback when loading is complete (after minDisplayTime)
   */
  onLoadingComplete?: () => void;
}

export default function LoadingScreen({
  isLoading = true,
  minDisplayTime = 1000,
  loadingText = 'Loading your packages...',
  onLoadingComplete,
}: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      // Simulate progress to 100% when loading completes
      setProgress(100);

      const timer = setTimeout(() => {
        setShouldShow(false);
        onLoadingComplete?.();
      }, minDisplayTime);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minDisplayTime, onLoadingComplete]);

  // Simulate progress bar
  useEffect(() => {
    if (isLoading && progress < 90) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 15;
          const next = Math.min(prev + increment, 90);
          return next;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isLoading, progress]);

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'
    >
      {/* Animated Background Blobs */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div
          className='absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20'
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20'
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20'
          animate={{
            x: [0, -50, 0],
            y: [0, -50, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className='relative z-10 flex flex-col items-center'>
        {/* Main Logo Container with Rotating Frame */}
        <div className='relative mb-8'>
          {/* Outer Rotating Frame - Multiple Layers */}
          <motion.div
            className='absolute inset-0 -m-8'
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            {/* Frame Border 1 */}
            <div className='absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent' />
          </motion.div>

          <motion.div
            className='absolute inset-0 -m-8'
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            {/* Frame Border 2 */}
            <div className='absolute inset-0 rounded-full border-4 border-t-transparent border-r-cyan-500 border-b-transparent border-l-transparent' />
          </motion.div>

          <motion.div
            className='absolute inset-0 -m-8'
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          >
            {/* Frame Border 3 */}
            <div className='absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-orange-500 border-l-transparent' />
          </motion.div>

          {/* Middle Glow Ring */}
          <motion.div
            className='absolute inset-0 -m-6'
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className='absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-orange-500 blur-xl opacity-30' />
          </motion.div>

          {/* Logo Container with Pulse */}
          <motion.div
            className='relative bg-white rounded-3xl p-8 shadow-2xl'
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Logo Image */}
            <motion.div
              className='relative w-32 h-32 flex items-center justify-center'
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src='/2.png'
                alt='Fast Shipper Logo'
                className='w-full h-full object-contain'
              />

              {/* Floating Badge */}
              <motion.div
                className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full shadow-lg flex items-center justify-center'
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div
                  className='w-4 h-4 bg-white rounded-full'
                  animate={{
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            {/* Corner Accents */}
            <div className='absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg' />
            <div className='absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg' />
            <div className='absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl-lg' />
            <div className='absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-red-500 rounded-br-lg' />
          </motion.div>

          {/* Inner Sparkle Effect */}
          <motion.div
            className='absolute inset-0 -m-8'
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className='absolute w-2 h-2 bg-white rounded-full shadow-lg'
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='text-center mb-6'
        >
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2'>
            Fast Shipper
          </h1>
          <p className='text-slate-600 text-sm font-medium'>USA to Morocco</p>
        </motion.div>

        {/* Loading Text with Typing Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='text-center mb-8'
        >
          <p className='text-slate-700 font-semibold text-lg mb-2'>
            {loadingText}
          </p>
          <div className='flex items-center justify-center gap-2'>
            <motion.div
              className='w-2 h-2 bg-blue-600 rounded-full'
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className='w-2 h-2 bg-cyan-600 rounded-full'
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className='w-2 h-2 bg-orange-600 rounded-full'
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 280 }}
          transition={{ delay: 0.6 }}
          className='relative h-2 bg-slate-200 rounded-full overflow-hidden'
        >
          <motion.div
            className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-orange-600 rounded-full'
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />

          {/* Shimmer Effect */}
          <motion.div
            className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent'
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>

        {/* Progress Percentage */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className='text-slate-500 text-sm font-semibold mt-4'
        >
          {Math.round(progress)}%
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='text-slate-400 text-xs mt-6 italic'
        >
          Your gateway to US shopping 🇺🇸 → 🇲🇦
        </motion.p>
      </div>

      {/* Bottom Branding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className='absolute bottom-8 left-0 right-0 text-center'
      >
        <p className='text-slate-400 text-xs'>
          Powered by{' '}
          <span className='font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
            Fast Shipper
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}
