import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Home,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Logo from '../components/common/Logo';
import { useLocation, useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection?: string;
}

interface MenuItem {
  id: string;
  icon: ReactNode;
  label: string;
  badge?: number | null;
  href: string;
}

export default function DashboardLayout({
  children,
  activeSection = 'overview',
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Inside component:
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active section from location
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'overview';
    if (path.startsWith('/packages')) return 'packages';
    if (path.startsWith('/shipments')) return 'shipments';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    return 'overview';
  };

  const userInfo = {
    name: 'Youssef El Amrani',
    email: 'youssef@example.com',
    suiteNumber: 'MA-1234',
    avatar: '👨',
  };

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      icon: <Home className='w-5 h-5' />,
      label: 'Overview',
      badge: null,
      href: '/dashboard',
    },
    {
      id: 'packages',
      icon: <Package className='w-5 h-5' />,
      label: 'Packages',
      badge: 3,
      href: '/packages',
    },
    {
      id: 'shipments',
      icon: <Truck className='w-5 h-5' />,
      label: 'Shipments',
      badge: 1,
      href: '/shipments',
    },
    {
      id: 'profile',
      icon: <User className='w-5 h-5' />,
      label: 'Profile',
      badge: null,
      href: '/profile',
    },
    {
      id: 'settings',
      icon: <Settings className='w-5 h-5' />,
      label: 'Settings',
      badge: null,
      href: '/settings',
    },
  ];

  const notifications = [
    {
      id: 1,
      message: 'New package received from Amazon',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      message: 'Shipment DHL123456789MA is in transit',
      time: '1 day ago',
      unread: true,
    },
    {
      id: 3,
      message: 'Package PKG001 has been in storage for 40 days',
      time: '2 days ago',
      unread: false,
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex'>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white shadow-2xl z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Section */}
        <div className='p-6 border-b border-slate-200'>
          <div className='flex items-center justify-between'>
            {sidebarOpen && <Logo showSubtitle />}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              {sidebarOpen ? (
                <X className='w-5 h-5' />
              ) : (
                <Menu className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className='p-6 border-b border-slate-200'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl'>
                {userInfo.avatar}
              </div>
              <div className='flex-1'>
                <p className='font-bold text-slate-900'>{userInfo.name}</p>
                <p className='text-xs text-slate-600'>{userInfo.email}</p>
              </div>
            </div>
            <div className='px-3 py-2 bg-blue-50 rounded-lg'>
              <p className='text-xs text-slate-600'>Suite Number</p>
              <p className='font-bold text-blue-600'>{userInfo.suiteNumber}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className='p-4 space-y-2'>
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                getActiveSection() === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.icon}
              {sidebarOpen && (
                <>
                  <span className='flex-1 text-left font-semibold'>
                    {item.label}
                  </span>
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeSection === item.id
                          ? 'bg-white text-blue-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Logout */}
        {sidebarOpen && (
          <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200'>
            <button className='w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors'>
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
                  placeholder='Search packages...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                />
              </div>
            </div>

            <div className='flex items-center gap-4 ml-6'>
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
                      <div className='space-y-2'>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 rounded-lg ${
                              notif.unread ? 'bg-blue-50' : 'bg-slate-50'
                            }`}
                          >
                            <p className='text-sm font-semibold text-slate-900'>
                              {notif.message}
                            </p>
                            <p className='text-xs text-slate-500 mt-1'>
                              {notif.time}
                            </p>
                          </div>
                        ))}
                      </div>
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
