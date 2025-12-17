// client/src/pages/admin/AdminUsersPage_ENHANCED.tsx - WITH EDIT & DELETE
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
  Edit2,
  Trash2,
  CheckSquare,
  Square,
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

interface EditUserForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
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

  const [editUser, setEditUser] = useState<EditUserForm>({
    name: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
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

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      await apiHelpers.put(`/admin/users/${selectedUser.id}`, {
        name: editUser.name,
        phone: editUser.phone,
        address: {
          street: editUser.street,
          city: editUser.city,
          postalCode: editUser.postalCode,
          country: editUser.country,
        },
      });

      showNotification('success', 'User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await apiHelpers.delete(`/admin/users/${selectedUser.id}`);

      showNotification('success', 'User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    try {
      await apiHelpers.post('/admin/users/bulk-delete', {
        userIds: Array.from(selectedUsers),
      });

      showNotification(
        'success',
        `${selectedUsers.size} user(s) deleted successfully!`
      );
      setSelectedUsers(new Set());
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to delete users');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      phone: user.phone,
      street: user.address.street,
      city: user.address.city,
      postalCode: user.address.postalCode,
      country: user.address.country,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
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
          <div className='flex items-center gap-3'>
            {selectedUsers.size > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setShowDeleteModal(true)}
                className='px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2'
              >
                <Trash2 className='w-5 h-5' />
                Delete ({selectedUsers.size})
              </motion.button>
            )}
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

        {/* Bulk Actions Bar */}
        {users.length > 0 && (
          <div className='flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200'>
            <button
              onClick={toggleSelectAll}
              className='flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors'
            >
              {selectedUsers.size === users.length ? (
                <CheckSquare className='w-5 h-5 text-blue-600' />
              ) : (
                <Square className='w-5 h-5' />
              )}
              Select All ({users.length})
            </button>
            {selectedUsers.size > 0 && (
              <p className='text-sm text-slate-600'>
                {selectedUsers.size} user(s) selected
              </p>
            )}
          </div>
        )}

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
                className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border ${
                  selectedUsers.has(user.id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-slate-100'
                }`}
              >
                {/* Selection Checkbox */}
                <div className='flex items-start justify-between mb-4'>
                  <button
                    onClick={() => toggleUserSelection(user.id)}
                    className='p-1 hover:bg-slate-100 rounded transition-colors'
                  >
                    {selectedUsers.has(user.id) ? (
                      <CheckSquare className='w-5 h-5 text-blue-600' />
                    ) : (
                      <Square className='w-5 h-5 text-slate-400' />
                    )}
                  </button>

                  {/* Action Buttons */}
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => openEditModal(user)}
                      className='p-2 hover:bg-blue-100 rounded-lg transition-colors'
                      title='Edit user'
                    >
                      <Edit2 className='w-4 h-4 text-blue-600' />
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      className='p-2 hover:bg-red-100 rounded-lg transition-colors'
                      title='Delete user'
                    >
                      <Trash2 className='w-4 h-4 text-red-600' />
                    </button>
                  </div>
                </div>

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
              className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6'
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

        {/* Edit User Modal */}
        <AnimatePresence>
          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6'
              onClick={() => setShowEditModal(false)}
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
                    Edit User
                  </h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>

                <form onSubmit={handleEditUser} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Full Name
                    </label>
                    <input
                      type='text'
                      value={editUser.name}
                      onChange={(e) =>
                        setEditUser({ ...editUser, name: e.target.value })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Phone
                    </label>
                    <input
                      type='tel'
                      value={editUser.phone}
                      onChange={(e) =>
                        setEditUser({ ...editUser, phone: e.target.value })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Street
                    </label>
                    <input
                      type='text'
                      value={editUser.street}
                      onChange={(e) =>
                        setEditUser({ ...editUser, street: e.target.value })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      City
                    </label>
                    <input
                      type='text'
                      value={editUser.city}
                      onChange={(e) =>
                        setEditUser({ ...editUser, city: e.target.value })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Postal Code
                    </label>
                    <input
                      type='text'
                      value={editUser.postalCode}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          postalCode: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Country
                    </label>
                    <input
                      type='text'
                      value={editUser.country}
                      onChange={(e) =>
                        setEditUser({ ...editUser, country: e.target.value })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors'
                    />
                  </div>

                  <div className='flex gap-3 pt-4'>
                    <button
                      type='button'
                      onClick={() => setShowEditModal(false)}
                      className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all'
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6'
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className='bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl'
              >
                <div className='text-center'>
                  <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <AlertCircle className='w-8 h-8 text-red-600' />
                  </div>

                  <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                    Confirm Deletion
                  </h2>

                  {selectedUsers.size > 0 ? (
                    <p className='text-slate-600 mb-6'>
                      Are you sure you want to delete{' '}
                      <strong>{selectedUsers.size}</strong> user(s)? This action
                      cannot be undone.
                    </p>
                  ) : (
                    <p className='text-slate-600 mb-6'>
                      Are you sure you want to delete{' '}
                      <strong>{selectedUser?.name}</strong>? This action cannot
                      be undone.
                    </p>
                  )}

                  <div className='bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6'>
                    <p className='text-sm text-orange-800'>
                      ⚠️ Users with active packages or shipments cannot be
                      deleted.
                    </p>
                  </div>

                  <div className='flex gap-3'>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={
                        selectedUsers.size > 0
                          ? handleBulkDelete
                          : handleDeleteUser
                      }
                      className='flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors'
                    >
                      Delete
                    </button>
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
