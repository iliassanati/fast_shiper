import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Home,
  Truck,
  User,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Copy,
  Check,
  MapPin,
  Clock,
  Box,
  Zap,
  Calendar,
  Archive,
  ChevronRight,
  Camera,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockPackages = [
  {
    id: 'PKG001',
    trackingNumber: '1Z999AA10123456784',
    retailer: 'Amazon',
    status: 'received',
    receivedDate: '2025-10-08',
    weight: '2.5 kg',
    dimensions: '30x20x15 cm',
    storageDay: 3,
    estimatedValue: '$89.99',
    photo: '📦',
    description: 'Electronics - Wireless Headphones',
  },
  {
    id: 'PKG002',
    trackingNumber: '1Z999AA10123456785',
    retailer: 'eBay',
    status: 'received',
    receivedDate: '2025-10-09',
    weight: '1.2 kg',
    dimensions: '25x15x10 cm',
    storageDay: 2,
    estimatedValue: '$45.00',
    photo: '👟',
    description: 'Apparel - Nike Shoes',
  },
  {
    id: 'PKG003',
    trackingNumber: '1Z999AA10123456786',
    retailer: 'Best Buy',
    status: 'received',
    receivedDate: '2025-10-10',
    weight: '0.8 kg',
    dimensions: '20x15x5 cm',
    storageDay: 1,
    estimatedValue: '$129.99',
    photo: '📱',
    description: 'Electronics - Phone Case',
  },
  {
    id: 'PKG004',
    trackingNumber: '1Z999AA10123456787',
    retailer: 'Amazon',
    status: 'consolidated',
    receivedDate: '2025-10-05',
    weight: '3.5 kg',
    dimensions: '40x30x20 cm',
    storageDay: 6,
    estimatedValue: '$215.00',
    photo: '📦',
    description: 'Multiple Items (3 packages)',
  },
];

const mockShipments = [
  {
    id: 'SHP001',
    carrier: 'DHL Express',
    trackingNumber: 'DHL123456789MA',
    status: 'in_transit',
    shippedDate: '2025-10-09',
    estimatedDelivery: '2025-10-13',
    destination: 'Casablanca, Morocco',
    packages: 2,
    cost: '450 MAD',
  },
  {
    id: 'SHP002',
    carrier: 'DHL Express',
    trackingNumber: 'DHL987654321MA',
    status: 'delivered',
    shippedDate: '2025-10-01',
    deliveredDate: '2025-10-05',
    destination: 'Casablanca, Morocco',
    packages: 1,
    cost: '320 MAD',
  },
];

type Section = 'overview' | 'packages' | 'shipments' | 'profile' | 'settings';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userInfo = {
    name: 'Youssef El Amrani',
    email: 'youssef@example.com',
    suiteNumber: 'MA-1234',
    avatar: '👨',
  };
  const usAddress = {
    name: userInfo.name,
    suite: `Suite ${userInfo.suiteNumber}`,
    street: '123 Warehouse Drive',
    city: 'Wilmington, DE 19801',
    country: 'United States',
    phone: '+1 (555) 123-4567',
  };
  const stats = {
    totalPackages: mockPackages.length,
    inStorage: mockPackages.filter((p) => p.status === 'received').length,
    shipped: mockShipments.length,
    storageDaysLeft: 42,
  };

  const copyAddress = () => {
    const addressText = `${usAddress.name}\n${usAddress.suite}\n${usAddress.street}\n${usAddress.city}\n${usAddress.country}`;
    navigator.clipboard.writeText(addressText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

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

  const menuItems = [
    {
      id: 'overview',
      icon: <Home className='w-5 h-5' />,
      label: 'Overview',
      badge: null,
    },
    {
      id: 'packages',
      icon: <Package className='w-5 h-5' />,
      label: 'Packages',
      badge: stats.inStorage,
    },
    {
      id: 'shipments',
      icon: <Truck className='w-5 h-5' />,
      label: 'Shipments',
      badge: 1,
    },
    {
      id: 'profile',
      icon: <User className='w-5 h-5' />,
      label: 'Profile',
      badge: null,
    },
    {
      id: 'settings',
      icon: <Settings className='w-5 h-5' />,
      label: 'Settings',
      badge: null,
    },
  ];

  const OverviewSection = () => (
    <div className='space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden'
      >
        <div className='absolute inset-0 bg-white opacity-10'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className='relative z-10'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>
                Welcome back, {userInfo.name.split(' ')[0]}! 👋
              </h1>
              <p className='text-blue-100'>
                You have {stats.inStorage} packages waiting
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className='text-6xl'
            >
              📦
            </motion.div>
          </div>
          <motion.button
            className='px-6 py-3 bg-white text-blue-600 rounded-full font-bold shadow-lg flex items-center gap-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/shipping')}
          >
            <Zap className='w-5 h-5' />
            Ship Now
          </motion.button>
        </div>
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[
          {
            icon: <Package className='w-6 h-6' />,
            label: 'Total Packages',
            value: stats.totalPackages,
            gradient: 'from-blue-500 to-cyan-500',
          },
          {
            icon: <Archive className='w-6 h-6' />,
            label: 'In Storage',
            value: stats.inStorage,
            gradient: 'from-purple-500 to-pink-500',
          },
          {
            icon: <Truck className='w-6 h-6' />,
            label: 'Shipped',
            value: stats.shipped,
            gradient: 'from-orange-500 to-red-500',
          },
          {
            icon: <Clock className='w-6 h-6' />,
            label: 'Days Left',
            value: stats.storageDaysLeft,
            gradient: 'from-green-500 to-emerald-500',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100'
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white mb-4`}
            >
              {stat.icon}
            </div>
            <p className='text-sm text-slate-600 mb-1'>{stat.label}</p>
            <p className='text-3xl font-bold text-slate-900'>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200'
      >
        <div className='flex items-start justify-between mb-4'>
          <div>
            <h3 className='text-xl font-bold text-slate-900 mb-1'>
              Your US Shipping Address
            </h3>
            <p className='text-sm text-slate-600'>
              Use this address for all your US purchases
            </p>
          </div>
          <motion.button
            onClick={copyAddress}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copiedAddress ? (
              <Check className='w-4 h-4' />
            ) : (
              <Copy className='w-4 h-4' />
            )}
            {copiedAddress ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>
        <div className='bg-white rounded-xl p-4 font-mono text-slate-800 space-y-1'>
          <p className='font-bold'>{usAddress.name}</p>
          <p className='text-blue-600 font-bold text-lg'>{usAddress.suite}</p>
          <p>{usAddress.street}</p>
          <p>{usAddress.city}</p>
          <p>{usAddress.country}</p>
          <p className='text-slate-600'>Phone: {usAddress.phone}</p>
        </div>
        <p className='text-xs text-slate-500 mt-3'>
          💡 Always include suite number ({userInfo.suiteNumber})
        </p>
      </motion.div>

      <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-slate-900'>Recent Packages</h3>
          <button
            onClick={() => setActiveSection('packages')}
            className='text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1'
          >
            View All
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
        <div className='space-y-3'>
          {mockPackages.slice(0, 3).map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className='flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer'
              onClick={() => setSelectedPackage(pkg)}
            >
              <div className='flex items-center gap-4'>
                <div className='text-4xl'>{pkg.photo}</div>
                <div>
                  <p className='font-bold text-slate-900'>{pkg.description}</p>
                  <p className='text-sm text-slate-600'>
                    From {pkg.retailer} • {pkg.weight}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pkg.status === 'received'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {pkg.status === 'received' ? 'In Storage' : 'Consolidated'}
                </span>
                <p className='text-xs text-slate-500 mt-1'>
                  Day {pkg.storageDay}/45
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className='grid md:grid-cols-3 gap-6'>
        {[
          {
            icon: <Zap className='w-6 h-6' />,
            title: 'Ship Now',
            desc: 'Create a new shipment',
            gradient: 'from-orange-500 to-red-500',
            link: '/shipping',
          },
          {
            icon: <Box className='w-6 h-6' />,
            title: 'Consolidate',
            desc: 'Combine packages',
            gradient: 'from-blue-500 to-cyan-500',
            link: '/consolidation',
          },
          {
            icon: <Camera className='w-6 h-6' />,
            title: 'Request Photos',
            desc: 'Additional photos',
            gradient: 'from-purple-500 to-pink-500',
            link: '/request',
          },
        ].map((action, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 text-left'
            onClick={() => navigate(action.link)}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center text-white mb-4`}
            >
              {action.icon}
            </div>
            <h4 className='font-bold text-slate-900 mb-1'>{action.title}</h4>
            <p className='text-sm text-slate-600'>{action.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const PackagesSection = () => (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold text-slate-900'>My Packages</h2>
          <p className='text-slate-600'>Manage and ship your packages</p>
        </div>
        <motion.button
          className='px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2'
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap className='w-5 h-5' />
          Ship Selected
        </motion.button>
      </div>

      <div className='flex gap-3 flex-wrap'>
        {['All', 'Received', 'Consolidated', 'Shipped'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {mockPackages.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            onClick={() => setSelectedPackage(pkg)}
            className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 cursor-pointer'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='text-5xl'>{pkg.photo}</div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  pkg.status === 'received'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {pkg.status === 'received' ? 'In Storage' : 'Consolidated'}
              </span>
            </div>
            <h3 className='font-bold text-slate-900 mb-2'>{pkg.description}</h3>
            <div className='space-y-2 text-sm text-slate-600'>
              <div className='flex items-center gap-2'>
                <ShoppingBag className='w-4 h-4' />
                <span>{pkg.retailer}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Package className='w-4 h-4' />
                <span>
                  {pkg.weight} • {pkg.dimensions}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4' />
                <span>Received {pkg.receivedDate}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='w-4 h-4' />
                <span>Day {pkg.storageDay} of 45</span>
              </div>
            </div>
            <div className='mt-4 pt-4 border-t border-slate-100'>
              <button className='w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors'>
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const ShipmentsSection = () => (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold text-slate-900'>My Shipments</h2>
        <p className='text-slate-600'>Track your international shipments</p>
      </div>

      <div>
        <h3 className='text-xl font-bold text-slate-900 mb-4'>
          Active Shipments
        </h3>
        <div className='space-y-4'>
          {mockShipments
            .filter((s) => s.status === 'in_transit')
            .map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <div className='flex items-center gap-3 mb-2'>
                      <Truck className='w-6 h-6 text-blue-600' />
                      <h4 className='font-bold text-slate-900 text-lg'>
                        {shipment.carrier}
                      </h4>
                    </div>
                    <p className='text-sm text-slate-600 font-mono'>
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <span className='px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold'>
                    In Transit
                  </span>
                </div>
                <div className='grid md:grid-cols-3 gap-4 mb-4'>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Shipped</p>
                    <p className='font-semibold text-slate-900'>
                      {shipment.shippedDate}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Est. Delivery</p>
                    <p className='font-semibold text-slate-900'>
                      {shipment.estimatedDelivery}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Cost</p>
                    <p className='font-semibold text-slate-900'>
                      {shipment.cost}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 text-sm text-slate-600 mb-4'>
                  <MapPin className='w-4 h-4' />
                  <span>{shipment.destination}</span>
                </div>
                <motion.button
                  className='w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Track Shipment
                </motion.button>
              </motion.div>
            ))}
        </div>
      </div>

      <div>
        <h3 className='text-xl font-bold text-slate-900 mb-4'>
          Past Shipments
        </h3>
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
          {mockShipments
            .filter((s) => s.status === 'delivered')
            .map((shipment) => (
              <div
                key={shipment.id}
                className='flex items-center justify-between py-4 border-b border-slate-100 last:border-0'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
                    <Check className='w-6 h-6 text-green-600' />
                  </div>
                  <div>
                    <p className='font-bold text-slate-900'>
                      {shipment.carrier}
                    </p>
                    <p className='text-sm text-slate-600'>
                      {shipment.trackingNumber}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-slate-900'>
                    Delivered
                  </p>
                  <p className='text-xs text-slate-500'>
                    {shipment.deliveredDate}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex'>
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white shadow-2xl z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className='p-6 border-b border-slate-200'>
          <div className='flex items-center justify-between'>
            {sidebarOpen && (
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
                  <Package className='w-6 h-6 text-white' />
                </div>
                <div>
                  <span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                    Shipzy
                  </span>
                  <p className='text-xs text-slate-600'>Dashboard</p>
                </div>
              </div>
            )}
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

        <nav className='p-4 space-y-2'>
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveSection(item.id as Section)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSection === item.id
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

        {sidebarOpen && (
          <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200'>
            <button className='w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors'>
              <LogOut className='w-5 h-5' />
              <span className='font-semibold'>Logout</span>
            </button>
          </div>
        )}
      </motion.aside>

      <div className='flex-1 min-h-screen'>
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

        <main className='p-6'>
          <AnimatePresence mode='wait'>
            {activeSection === 'overview' && <OverviewSection key='overview' />}
            {activeSection === 'packages' && <PackagesSection key='packages' />}
            {activeSection === 'shipments' && (
              <ShipmentsSection key='shipments' />
            )}
            {activeSection === 'profile' && (
              <div key='profile' className='text-center py-20'>
                <User className='w-16 h-16 text-slate-400 mx-auto mb-4' />
                <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                  Profile Section
                </h2>
                <p className='text-slate-600'>Coming soon...</p>
              </div>
            )}
            {activeSection === 'settings' && (
              <div key='settings' className='text-center py-20'>
                <Settings className='w-16 h-16 text-slate-400 mx-auto mb-4' />
                <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                  Settings Section
                </h2>
                <p className='text-slate-600'>Coming soon...</p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-6'
            onClick={() => setSelectedPackage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl'
            >
              <div className='flex items-start justify-between mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                    {selectedPackage.description}
                  </h2>
                  <p className='text-slate-600'>
                    Package ID: {selectedPackage.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>

              <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-12 mb-6 text-center'>
                <div className='text-8xl mb-4'>{selectedPackage.photo}</div>
                <p className='text-sm text-slate-600'>Package Photo</p>
              </div>

              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <p className='text-xs text-slate-600 mb-1'>Retailer</p>
                  <p className='font-bold text-slate-900'>
                    {selectedPackage.retailer}
                  </p>
                </div>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <p className='text-xs text-slate-600 mb-1'>Tracking</p>
                  <p className='font-bold text-slate-900 text-sm'>
                    {selectedPackage.trackingNumber}
                  </p>
                </div>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <p className='text-xs text-slate-600 mb-1'>Weight</p>
                  <p className='font-bold text-slate-900'>
                    {selectedPackage.weight}
                  </p>
                </div>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <p className='text-xs text-slate-600 mb-1'>Dimensions</p>
                  <p className='font-bold text-slate-900'>
                    {selectedPackage.dimensions}
                  </p>
                </div>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <p className='text-xs text-slate-600 mb-1'>Received</p>
                  <p className='font-bold text-slate-900'>
                    {selectedPackage.receivedDate}
                  </p>
                </div>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <p className='text-xs text-slate-600 mb-1'>Storage</p>
                  <p className='font-bold text-slate-900'>
                    {selectedPackage.storageDay}/45 days
                  </p>
                </div>
              </div>

              <div className='flex gap-3'>
                <motion.button
                  className='flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ship This Package
                </motion.button>
                <motion.button
                  className='flex-1 py-3 bg-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-200'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Add to Consolidation
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
