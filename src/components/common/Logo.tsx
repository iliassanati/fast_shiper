import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  onClick?: () => void;
}

export default function Logo({
  className = '',
  showSubtitle = true,
  onClick,
}: LogoProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div
      className={`flex items-center gap-3 cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      onClick={handleClick}
    >
      <div className='relative'>
        <motion.div
          // className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg'
          className='w-20 h-20  rounded-xl flex items-center justify-center shadow-lg'
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          {/* <Package className='w-7 h-7 text-white' /> */}
          <img src={'/2.png'} />
        </motion.div>
        <motion.div
          className='absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full'
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <div>
        <span className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
          Fast Shipper
        </span>
        {showSubtitle && (
          <p className='text-xs text-slate-600'>USA to Morocco</p>
        )}
      </div>
    </motion.div>
  );
}
