// client/src/components/common/ToastContainer.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '@/stores';

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotificationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'error':
        return <AlertCircle className='w-5 h-5 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      default:
        return <Info className='w-5 h-5 text-blue-500' />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className='fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm'>
      <AnimatePresence mode='popLayout'>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg ${getStyles(
              toast.type
            )}`}
          >
            <div className='flex-shrink-0 mt-0.5'>{getIcon(toast.type)}</div>
            <p className='flex-1 text-sm font-medium'>{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className='flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
