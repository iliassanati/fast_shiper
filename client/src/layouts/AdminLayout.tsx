// client/src/layouts/AdminLayout.tsx - FIXED WITH PHOTO REQUESTS
import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Box,
  Camera,
} from 'lucide-react';
import { useAdminAuthStore } from '@/stores/useAdminAuthStore';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className='w-5 h-5' />,
      href: '/admin/dashboard',
    },
    {
      id: 'packages',
      label: 'Packages',
      icon: <Package className='w-5 h-5' />,
      href: '/admin/packages',
    },
    {
      id: 'shipments',
      label: 'Shipments',
      icon: <Truck className='w-5 h-5' />,
      href: '/admin/shipments',
    },
    {
      id: 'consolidations',
      label: 'Consolidations',
      icon: <Box className='w-5 h-5' />,
      href: '/admin/consolidations',
    },
    {
      id: 'photo-requests',
      label: 'Photo Requests',
      icon: <Camera className='w-5 h-5' />,
      href: '/admin/photo-requests',
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className='w-5 h-5' />,
      href: '/admin/users',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <DollarSign className='w-5 h-5' />,
      href: '/admin/transactions',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className='w-5 h-5' />,
      href: '/admin/settings',
    },
  ];

  const isActivePath = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex'>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Section */}
        <div className='p-6 border-b border-slate-700'>
          <div className='flex items-center justify-between'>
            {sidebarOpen && (
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                  <Shield className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h2 className='font-bold text-white'>Admin Panel</h2>
                  <p className='text-xs text-blue-300'>Fast Shipper</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='p-2 hover:bg-slate-700 rounded-lg transition-colors'
            >
              {sidebarOpen ? (
                <X className='w-5 h-5 text-white' />
              ) : (
                <Menu className='w-5 h-5 text-white' />
              )}
            </button>
          </div>
        </div>

        {/* Admin Info */}
        {sidebarOpen && admin && (
          <div className='p-6 border-b border-slate-700'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xl text-white font-bold'>
                {admin.name.charAt(0)}
              </div>
              <div className='flex-1'>
                <p className='font-bold text-white text-sm'>{admin.name}</p>
                <p className='text-xs text-blue-300'>Administrator</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className='p-4 space-y-2 flex-1 overflow-y-auto'>
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActivePath(item.href)
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.icon}
              {sidebarOpen && (
                <span className='flex-1 text-left font-semibold'>
                  {item.label}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Logout */}
        {sidebarOpen && (
          <div className='p-4 border-t border-slate-700'>
            <button
              onClick={handleLogout}
              className='w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors'
            >
              <LogOut className='w-5 h-5' />
              <span className='font-semibold'>Logout</span>
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <div className='flex-1 min-h-screen'>
        {/* Top Header */}
        <header className='sticky top-0 z-30 bg-white bg-opacity-90 backdrop-blur-lg border-b border-slate-200 px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex-1 max-w-xl'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='text'
                  placeholder='Search packages, users, shipments...'
                  className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                />
              </div>
            </div>

            <div className='flex items-center gap-4 ml-6'>
              {/* Notifications */}
              <div className='relative'>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className='relative p-2 hover:bg-slate-100 rounded-lg transition-colors'
                >
                  <Bell className='w-6 h-6 text-slate-700' />
                  <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className='absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4'
                    >
                      <h3 className='font-bold text-slate-900 mb-3'>
                        Notifications
                      </h3>
                      <p className='text-sm text-slate-600'>
                        No new notifications
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='p-6'>{children}</main>
      </div>
    </div>
  );
}
