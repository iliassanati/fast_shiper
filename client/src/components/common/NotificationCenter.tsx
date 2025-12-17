// client/src/components/common/NotificationCenter.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Package,
  Truck,
  Camera,
  CreditCard,
  AlertTriangle,
  Box,
} from 'lucide-react';
import { useNotificationStore } from '@/stores';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  variant?: 'dropdown' | 'modal';
}

export default function NotificationCenter({
  variant = 'dropdown',
}: NotificationCenterProps) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isModalOpen,
    setModalOpen,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications({ limit: 50 });

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications({ limit: 50 });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'package_received':
        return <Package className='w-5 h-5 text-blue-600' />;
      case 'shipment_update':
        return <Truck className='w-5 h-5 text-orange-600' />;
      case 'consolidation_complete':
        return <Box className='w-5 h-5 text-purple-600' />;
      case 'photo_request_complete':
        return <Camera className='w-5 h-5 text-pink-600' />;
      case 'payment_received':
        return <CreditCard className='w-5 h-5 text-green-600' />;
      case 'storage_warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-600' />;
      default:
        return <Bell className='w-5 h-5 text-slate-600' />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if there's an action URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
      setModalOpen(false);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const NotificationList = () => (
    <div className='max-h-[400px] overflow-y-auto'>
      {loading && notifications.length === 0 ? (
        <div className='p-8 text-center'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2' />
          <p className='text-sm text-slate-500'>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className='p-8 text-center'>
          <Bell className='w-12 h-12 text-slate-300 mx-auto mb-2' />
          <p className='text-slate-500 font-medium'>No notifications yet</p>
          <p className='text-sm text-slate-400'>
            You'll see updates about your packages here
          </p>
        </div>
      ) : (
        <div className='divide-y divide-slate-100'>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className='flex items-start gap-3'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notification.read ? 'bg-blue-100' : 'bg-slate-100'
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2'>
                    <p
                      className={`font-semibold text-sm ${
                        !notification.read ? 'text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <button
                      onClick={(e) => handleDismiss(e, notification.id)}
                      className='p-1 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0'
                    >
                      <X className='w-4 h-4 text-slate-400' />
                    </button>
                  </div>
                  <p className='text-sm text-slate-600 mt-1 line-clamp-2'>
                    {notification.message}
                  </p>
                  <p className='text-xs text-slate-400 mt-2'>
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.read && (
                  <div className='w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2' />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === 'modal') {
    return (
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden'
            >
              {/* Header */}
              <div className='flex items-center justify-between p-4 border-b border-slate-200'>
                <div className='flex items-center gap-3'>
                  <h2 className='text-lg font-bold text-slate-900'>
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className='px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full'>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className='px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-1'
                    >
                      <CheckCheck className='w-4 h-4' />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setModalOpen(false)}
                    className='p-2 hover:bg-slate-100 rounded-lg'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
              </div>

              {/* Content */}
              <NotificationList />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Dropdown variant
  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 hover:bg-slate-100 rounded-lg transition-colors'
      >
        <Bell className='w-6 h-6 text-slate-700' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className='fixed inset-0 z-40'
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className='absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden'
            >
              {/* Header */}
              <div className='flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-bold text-slate-900'>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className='px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full'>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className='text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1'
                  >
                    <CheckCheck className='w-4 h-4' />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <NotificationList />

              {/* Footer */}
              {notifications.length > 0 && (
                <div className='p-3 border-t border-slate-200 bg-slate-50'>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setModalOpen(true);
                    }}
                    className='w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium'
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
