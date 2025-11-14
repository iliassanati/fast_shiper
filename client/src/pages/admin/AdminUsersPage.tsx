// client/src/pages/admin/AdminUsersPage.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  DollarSign,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiHelpers } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  suiteNumber: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  stats: {
    packages: number;
    shipments: number;
    totalSpent: number;
  };
}

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [newUser, setNewUser] = useState<NewUserForm>({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<NewUserForm>>({});

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiHelpers.get<{ users: User[] }>(
        `/admin/users${searchQuery ? `?search=${searchQuery}` : ''}`
      );
      setUsers(data.users);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewUserForm> = {};

    if (!newUser.name || newUser.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!newUser.email || !/^\S+@\S+\.\S+$/.test(newUser.email)) {
      errors.email = 'Valid email is required';
    }

    if (!newUser.password || newUser.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!newUser.phone || newUser.phone.length < 10) {
      errors.phone = 'Valid phone number is required';
    }

    if (!newUser.city) {
      errors.city = 'City is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Use the auth register endpoint
      await apiHelpers.post('/auth/register', newUser);

      showNotification('success', 'User created successfully!');
      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
      });
      fetchUsers();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create user');
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    try {
      const data = await apiHelpers.get<{ user: User }>(
        `/admin/users/${userId}`
      );
      setSelectedUser(data.user);
    } catch (error: any) {
      showNotification('error', 'Failed to fetch user details');
    }
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg ${
                notification.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className='flex items-center gap-3'>
                {notification.type === 'success' ? (
                  <Check className='w-5 h-5' />
                ) : (
                  <AlertCircle className='w-5 h-5' />
                )}
                <p className='font-semibold'>{notification.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>Users</h1>
            <p className='text-slate-600'>Manage customer accounts</p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className='px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus className='w-5 h-5' />
            Create User
          </motion.button>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400' />
          <input
            type='text'
            placeholder='Search by name, email, or suite number...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
          />
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-2xl shadow-lg'>
            <Users className='w-16 h-16 text-slate-300 mx-auto mb-4' />
            <p className='text-slate-600 font-semibold'>No users found</p>
          </div>
        ) : (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleViewUserDetails(user.id)}
                className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100 cursor-pointer'
              >
                {/* User Avatar */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl text-white font-bold'>
                    {user.name.charAt(0)}
                  </div>
                  <span className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold'>
                    {user.suiteNumber}
                  </span>
                </div>

                {/* User Info */}
                <h3 className='font-bold text-slate-900 text-lg mb-1'>
                  {user.name}
                </h3>

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-slate-600'>
                    <Mail className='w-4 h-4' />
                    <span className='truncate'>{user.email}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-slate-600'>
                    <Phone className='w-4 h-4' />
                    <span>{user.phone}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-slate-600'>
                    <MapPin className='w-4 h-4' />
                    <span>{user.address.city}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className='grid grid-cols-3 gap-2 pt-4 border-t border-slate-100'>
                  <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 text-blue-600 mb-1'>
                      <Package className='w-4 h-4' />
                    </div>
                    <p className='text-xl font-bold text-slate-900'>
                      {user.stats.packages}
                    </p>
                    <p className='text-xs text-slate-500'>Packages</p>
                  </div>
                  <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 text-green-600 mb-1'>
                      <Truck className='w-4 h-4' />
                    </div>
                    <p className='text-xl font-bold text-slate-900'>
                      {user.stats.shipments}
                    </p>
                    <p className='text-xs text-slate-500'>Shipments</p>
                  </div>
                  <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 text-purple-600 mb-1'>
                      <DollarSign className='w-4 h-4' />
                    </div>
                    <p className='text-xl font-bold text-slate-900'>
                      {user.stats.totalSpent}
                    </p>
                    <p className='text-xs text-slate-500'>MAD</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create User Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6'
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className='bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl'
              >
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold text-slate-900'>
                    Create New User
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.name
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                      placeholder='John Doe'
                    />
                    {formErrors.name && (
                      <p className='text-red-500 text-xs mt-1'>
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Email
                    </label>
                    <input
                      type='email'
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.email
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                      placeholder='john@example.com'
                    />
                    {formErrors.email && (
                      <p className='text-red-500 text-xs mt-1'>
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Password
                    </label>
                    <input
                      type='password'
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.password
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                      placeholder='••••••••'
                    />
                    {formErrors.password && (
                      <p className='text-red-500 text-xs mt-1'>
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Phone
                    </label>
                    <input
                      type='tel'
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.phone
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                      placeholder='+212 6XX-XXXXXX'
                    />
                    {formErrors.phone && (
                      <p className='text-red-500 text-xs mt-1'>
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      City
                    </label>
                    <input
                      type='text'
                      value={newUser.city}
                      onChange={(e) =>
                        setNewUser({ ...newUser, city: e.target.value })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                        formErrors.city
                          ? 'border-red-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                      placeholder='Casablanca'
                    />
                    {formErrors.city && (
                      <p className='text-red-500 text-xs mt-1'>
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div className='flex gap-3 pt-4'>
                    <button
                      type='button'
                      onClick={() => setShowCreateModal(false)}
                      className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all'
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Details Modal */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6'
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className='bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'
              >
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-2xl font-bold text-slate-900'>
                    User Details
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>

                <div className='space-y-6'>
                  {/* User Info */}
                  <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6'>
                    <div className='flex items-center gap-4 mb-4'>
                      <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl text-white font-bold'>
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className='text-2xl font-bold text-slate-900'>
                          {selectedUser.name}
                        </h3>
                        <p className='text-blue-600 font-semibold'>
                          Suite: {selectedUser.suiteNumber}
                        </p>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-slate-700'>
                        <Mail className='w-5 h-5' />
                        <span>{selectedUser.email}</span>
                      </div>
                      <div className='flex items-center gap-2 text-slate-700'>
                        <Phone className='w-5 h-5' />
                        <span>{selectedUser.phone}</span>
                      </div>
                      <div className='flex items-center gap-2 text-slate-700'>
                        <MapPin className='w-5 h-5' />
                        <span>
                          {selectedUser.address.city},{' '}
                          {selectedUser.address.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* US Address */}
                  <div className='bg-slate-50 rounded-xl p-6'>
                    <h4 className='font-bold text-slate-900 mb-3'>
                      US Shipping Address
                    </h4>
                    <div className='bg-white rounded-lg p-4 font-mono text-sm text-slate-700 space-y-1'>
                      <p className='font-bold'>{selectedUser.name}</p>
                      <p className='text-blue-600 font-bold text-lg'>
                        {selectedUser.suiteNumber}
                      </p>
                      <p>123 Warehouse Street</p>
                      <p>Delaware, DE 19701</p>
                      <p>United States</p>
                      <p>Phone: +1 (302) 555-0123</p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='bg-blue-50 rounded-xl p-4 text-center'>
                      <Package className='w-8 h-8 text-blue-600 mx-auto mb-2' />
                      <p className='text-3xl font-bold text-slate-900'>
                        {selectedUser?.stats?.packages}
                      </p>
                      <p className='text-sm text-slate-600'>Packages</p>
                    </div>
                    <div className='bg-green-50 rounded-xl p-4 text-center'>
                      <Truck className='w-8 h-8 text-green-600 mx-auto mb-2' />
                      <p className='text-3xl font-bold text-slate-900'>
                        {selectedUser?.stats?.shipments}
                      </p>
                      <p className='text-sm text-slate-600'>Shipments</p>
                    </div>
                    <div className='bg-purple-50 rounded-xl p-4 text-center'>
                      <DollarSign className='w-8 h-8 text-purple-600 mx-auto mb-2' />
                      <p className='text-3xl font-bold text-slate-900'>
                        {selectedUser?.stats?.totalSpent}
                      </p>
                      <p className='text-sm text-slate-600'>MAD Spent</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
