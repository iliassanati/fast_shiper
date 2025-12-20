// client/src/pages/client/ProfilePage_OPTIMIZED.tsx - ENHANCED UX/UI VERSION
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuthStore, useNotificationStore } from '@/stores';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Copy,
  Shield,
  CheckCircle,
  AlertCircle,
  Building2,
  Loader2,
  Check,
  Calendar,
  Package,
  Truck,
  Clock,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiHelpers } from '@/lib/api';

interface ProfileFormData {
  name: string;
  phone: string;
}

interface AddressFormData {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface EmailChangeData {
  newEmail: string;
  confirmEmail: string;
  password: string;
}

export default function ProfilePage() {
  const { user, usAddress, refreshUser } = useAuthStore();
  const { showToast } = useNotificationStore();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    phone: '',
  });

  // Address editing state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressData, setAddressData] = useState<AddressFormData>({
    street: '',
    city: '',
    postalCode: '',
    country: 'Morocco',
  });

  // Email change state
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailData, setEmailData] = useState<EmailChangeData>({
    newEmail: '',
    confirmEmail: '',
    password: '',
  });
  const [changingEmail, setChangingEmail] = useState(false);

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
      });
      setAddressData({
        street: user.address?.street || '',
        city: user.address?.city || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || 'Morocco',
      });
    }
  }, [user]);

  // Copy US address to clipboard
  const copyUsAddress = () => {
    if (usAddress) {
      const addressText = `${usAddress.name}
${usAddress.suite}
${usAddress.street}
${usAddress.city}
${usAddress.country}`;
      navigator.clipboard.writeText(addressText);
      showToast('US address copied to clipboard!', 'success');
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiHelpers.put('/auth/profile', {
        name: profileData.name,
        phone: profileData.phone,
      });

      await refreshUser();
      showToast('Profile updated successfully!', 'success');
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle address save
  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      await apiHelpers.put('/auth/profile', {
        address: addressData,
      });

      await refreshUser();
      showToast('Shipping address updated successfully!', 'success');
      setIsEditingAddress(false);
    } catch (error: any) {
      console.error('Error updating address:', error);
      showToast(error.message || 'Failed to update address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!emailData.newEmail || !emailData.confirmEmail || !emailData.password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      showToast('Email addresses do not match', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.newEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (emailData.newEmail === user?.email) {
      showToast('New email is the same as current email', 'warning');
      return;
    }

    setChangingEmail(true);
    try {
      await apiHelpers.put('/auth/email', {
        newEmail: emailData.newEmail,
        password: emailData.password,
      });

      await refreshUser();
      showToast('Email updated successfully!', 'success');
      setShowEmailChange(false);
      setEmailData({ newEmail: '', confirmEmail: '', password: '' });
    } catch (error: any) {
      console.error('Error changing email:', error);
      showToast(error.message || 'Failed to change email', 'error');
    } finally {
      setChangingEmail(false);
    }
  };

  // Cancel profile editing
  const handleCancelProfile = () => {
    setIsEditingProfile(false);
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  };

  // Cancel address editing
  const handleCancelAddress = () => {
    setIsEditingAddress(false);
    if (user) {
      setAddressData({
        street: user.address?.street || '',
        city: user.address?.city || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || 'Morocco',
      });
    }
  };

  if (!user) {
    return (
      <DashboardLayout activeSection='profile'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600'>Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeSection='profile'>
      <div className='space-y-6'>
        {/* Enhanced Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'
        >
          <div>
            <h1 className='text-4xl font-bold text-slate-900 mb-2'>
              My Profile
            </h1>
            <p className='text-slate-600'>
              Manage your account information and preferences
            </p>
          </div>

          {/* Quick Stats */}
          <div className='flex gap-3'>
            <div className='px-4 py-2 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl'>
              <p className='text-xs text-blue-600 font-semibold mb-1'>
                Suite Number
              </p>
              <p className='text-lg font-bold text-blue-900 font-mono'>
                {user.suiteNumber}
              </p>
            </div>
            <div className='px-4 py-2 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl'>
              <p className='text-xs text-green-600 font-semibold mb-1'>
                Member Since
              </p>
              <p className='text-lg font-bold text-green-900'>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Main Profile Cards */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Personal Information Card - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'
            >
              {/* Card Header with Gradient */}
              <div className='bg-gradient-to-r from-blue-600 to-cyan-600 p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                      <User className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-white'>
                        Personal Information
                      </h2>
                      <p className='text-blue-100 text-sm'>
                        Your account details
                      </p>
                    </div>
                  </div>
                  {!isEditingProfile ? (
                    <motion.button
                      onClick={() => setIsEditingProfile(true)}
                      className='px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 transition-all'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit2 className='w-4 h-4' />
                      Edit
                    </motion.button>
                  ) : (
                    <div className='flex gap-2'>
                      <motion.button
                        onClick={handleCancelProfile}
                        className='px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 transition-all'
                        disabled={savingProfile}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className='w-4 h-4' />
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleSaveProfile}
                        className='px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50'
                        disabled={savingProfile}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {savingProfile ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          <Save className='w-4 h-4' />
                        )}
                        Save
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className='p-6 space-y-6'>
                {/* Avatar & Name */}
                <div className='flex items-center gap-4'>
                  <div className='w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg'>
                    {user.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </div>
                  <div className='flex-1'>
                    {isEditingProfile ? (
                      <input
                        type='text'
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-xl font-bold transition-all'
                        placeholder='Your name'
                      />
                    ) : (
                      <>
                        <h3 className='text-2xl font-bold text-slate-900 mb-1'>
                          {user.name}
                        </h3>
                        <p className='text-slate-500 flex items-center gap-2'>
                          <Package className='w-4 h-4' />
                          Suite #{user.suiteNumber}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className='space-y-2'>
                  <label className='flex items-center gap-2 text-sm font-bold text-slate-700'>
                    <Mail className='w-4 h-4 text-blue-600' />
                    Email Address
                  </label>
                  <div className='flex items-center gap-3'>
                    <div className='flex-1 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium'>
                      {user.email}
                    </div>
                    <motion.button
                      onClick={() => setShowEmailChange(true)}
                      className='px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit2 className='w-4 h-4' />
                      Change
                    </motion.button>
                  </div>
                </div>

                {/* Phone */}
                <div className='space-y-2'>
                  <label className='flex items-center gap-2 text-sm font-bold text-slate-700'>
                    <Phone className='w-4 h-4 text-green-600' />
                    Phone Number
                  </label>
                  {isEditingProfile ? (
                    <input
                      type='tel'
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all'
                      placeholder='+212 XXX XXX XXX'
                    />
                  ) : (
                    <div className='px-4 py-3 bg-gradient-to-r from-slate-50 to-green-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium'>
                      {user.phone || (
                        <span className='text-slate-400 italic'>
                          Not provided
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Shipping Address Card - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'
            >
              {/* Card Header with Gradient */}
              <div className='bg-gradient-to-r from-green-600 to-emerald-600 p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                      <MapPin className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-white'>
                        Shipping Address
                      </h2>
                      <p className='text-green-100 text-sm'>
                        Where your packages will be delivered in Morocco 🇲🇦
                      </p>
                    </div>
                  </div>
                  {!isEditingAddress ? (
                    <motion.button
                      onClick={() => setIsEditingAddress(true)}
                      className='px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 transition-all'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit2 className='w-4 h-4' />
                      Edit
                    </motion.button>
                  ) : (
                    <div className='flex gap-2'>
                      <motion.button
                        onClick={handleCancelAddress}
                        className='px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 transition-all'
                        disabled={savingAddress}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className='w-4 h-4' />
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleSaveAddress}
                        className='px-4 py-2 bg-white text-green-600 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50'
                        disabled={savingAddress}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {savingAddress ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          <Save className='w-4 h-4' />
                        )}
                        Save Address
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className='p-6'>
                <div className='grid md:grid-cols-2 gap-4'>
                  {/* Street */}
                  <div className='md:col-span-2 space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Street Address
                    </label>
                    {isEditingAddress ? (
                      <input
                        type='text'
                        value={addressData.street}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            street: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-all'
                        placeholder='123 Main Street, Apt 4B'
                      />
                    ) : (
                      <div className='px-4 py-3 bg-gradient-to-r from-slate-50 to-green-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium'>
                        {user.address?.street || (
                          <span className='text-slate-400 italic flex items-center gap-2'>
                            <AlertCircle className='w-4 h-4' />
                            Not provided - click Edit to add
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className='space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      City
                    </label>
                    {isEditingAddress ? (
                      <input
                        type='text'
                        value={addressData.city}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            city: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-all'
                        placeholder='Casablanca'
                      />
                    ) : (
                      <div className='px-4 py-3 bg-gradient-to-r from-slate-50 to-green-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium'>
                        {user.address?.city || (
                          <span className='text-slate-400 italic'>
                            Not provided
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Postal Code */}
                  <div className='space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Postal Code
                    </label>
                    {isEditingAddress ? (
                      <input
                        type='text'
                        value={addressData.postalCode}
                        onChange={(e) =>
                          setAddressData({
                            ...addressData,
                            postalCode: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-all'
                        placeholder='20000'
                      />
                    ) : (
                      <div className='px-4 py-3 bg-gradient-to-r from-slate-50 to-green-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium'>
                        {user.address?.postalCode || (
                          <span className='text-slate-400 italic'>
                            Not provided
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Country (Read-only) */}
                  <div className='md:col-span-2 space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Country
                    </label>
                    <div className='px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-slate-900 font-bold'>
                        <span className='text-2xl'>🇲🇦</span>
                        Morocco
                      </div>
                      <span className='text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-semibold'>
                        Default
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address completion warning */}
                {!user.address?.street && !isEditingAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl'
                  >
                    <div className='flex items-start gap-3'>
                      <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                      <div>
                        <p className='font-bold text-yellow-900 mb-1'>
                          Complete Your Shipping Address
                        </p>
                        <p className='text-sm text-yellow-800'>
                          Add your Morocco delivery address to receive packages.
                          This is required before shipping.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Enhanced */}
          <div className='space-y-6'>
            {/* US Warehouse Address - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 rounded-2xl shadow-xl overflow-hidden'
            >
              <div className='p-6 text-white'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                      <Building2 className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h3 className='font-bold text-lg'>Your US Address</h3>
                      <p className='text-blue-100 text-xs'>
                        Warehouse location
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={copyUsAddress}
                    className='p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all shadow-lg'
                    title='Copy address'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Copy className='w-5 h-5' />
                  </motion.button>
                </div>

                {usAddress ? (
                  <div className='space-y-2 text-sm bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20'>
                    <p className='font-bold text-white'>{usAddress.name}</p>
                    <p className='text-blue-100 font-semibold'>
                      {usAddress.suite}
                    </p>
                    <p className='text-blue-100'>{usAddress.street}</p>
                    <p className='text-blue-100'>{usAddress.city}</p>
                    <p className='text-blue-100'>{usAddress.country}</p>
                    {usAddress.phone && (
                      <p className='text-blue-100 mt-3 pt-3 border-t border-white/20'>
                        📞 {usAddress.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className='bg-white/10 backdrop-blur-sm rounded-xl p-4'>
                    <Loader2 className='w-6 h-6 animate-spin text-white mx-auto' />
                  </div>
                )}

                <div className='mt-4 pt-4 border-t border-white/20'>
                  <p className='text-xs text-blue-100 leading-relaxed'>
                    💡 Use this address when shopping from US stores. Your suite
                    number is unique to your account.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Account Status - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'
            >
              <div className='bg-gradient-to-r from-green-600 to-emerald-600 p-4'>
                <h3 className='font-bold text-white flex items-center gap-2'>
                  <Shield className='w-5 h-5' />
                  Account Status
                </h3>
              </div>

              <div className='p-6 space-y-4'>
                {/* Active Status */}
                <div className='flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200'>
                  <span className='text-slate-700 font-semibold'>
                    Account Status
                  </span>
                  <span className='px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md'>
                    <CheckCircle className='w-4 h-4' />
                    Active
                  </span>
                </div>

                {/* Member Since */}
                <div className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
                  <div className='flex items-center gap-2 text-slate-700'>
                    <Calendar className='w-4 h-4 text-blue-600' />
                    <span className='font-semibold'>Member Since</span>
                  </div>
                  <span className='text-slate-900 font-bold'>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>

                {/* Suite Number */}
                <div className='flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200'>
                  <div className='flex items-center gap-2 text-slate-700'>
                    <Package className='w-4 h-4 text-purple-600' />
                    <span className='font-semibold'>Suite Number</span>
                  </div>
                  <span className='text-slate-900 font-mono font-bold text-lg'>
                    {user.suiteNumber}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions - New */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200'
            >
              <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Star className='w-5 h-5 text-yellow-500' />
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <motion.button
                  onClick={() => (window.location.href = '/packages')}
                  className='w-full py-3 bg-white border-2 border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-between group'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex items-center gap-2'>
                    <Package className='w-5 h-5' />
                    View Packages
                  </div>
                  <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                </motion.button>

                <motion.button
                  onClick={() => (window.location.href = '/shipments')}
                  className='w-full py-3 bg-white border-2 border-green-200 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all flex items-center justify-between group'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex items-center gap-2'>
                    <Truck className='w-5 h-5' />
                    Track Shipments
                  </div>
                  <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                </motion.button>

                <motion.button
                  onClick={() => (window.location.href = '/settings')}
                  className='w-full py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-between group'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex items-center gap-2'>
                    <Shield className='w-5 h-5' />
                    Settings
                  </div>
                  <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                </motion.button>
              </div>
            </motion.div>

            {/* Help Card - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center'>
                  <AlertCircle className='w-5 h-5 text-white' />
                </div>
                <h3 className='font-bold text-slate-900'>Need Help?</h3>
              </div>
              <p className='text-sm text-slate-700 mb-4 leading-relaxed'>
                Our support team is ready to help with any questions about your
                account or shipments.
              </p>
              <motion.button
                onClick={() => (window.location.href = '/support')}
                className='w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition-all'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact Support
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Email Change Modal - Enhanced */}
      <AnimatePresence>
        {showEmailChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setShowEmailChange(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden'
            >
              {/* Modal Header */}
              <div className='bg-gradient-to-r from-blue-600 to-cyan-600 p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                      <Mail className='w-5 h-5 text-white' />
                    </div>
                    <h2 className='text-xl font-bold text-white'>
                      Change Email Address
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEmailChange(false)}
                    className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                  >
                    <X className='w-5 h-5 text-white' />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className='p-6 space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-bold text-slate-700'>
                    Current Email
                  </label>
                  <div className='px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-500 font-medium'>
                    {user.email}
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-bold text-slate-700'>
                    New Email Address
                  </label>
                  <input
                    type='email'
                    value={emailData.newEmail}
                    onChange={(e) =>
                      setEmailData({ ...emailData, newEmail: e.target.value })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all'
                    placeholder='newemail@example.com'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-bold text-slate-700'>
                    Confirm New Email
                  </label>
                  <input
                    type='email'
                    value={emailData.confirmEmail}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        confirmEmail: e.target.value,
                      })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all'
                    placeholder='newemail@example.com'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-bold text-slate-700'>
                    Current Password
                  </label>
                  <input
                    type='password'
                    value={emailData.password}
                    onChange={(e) =>
                      setEmailData({ ...emailData, password: e.target.value })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all'
                    placeholder='Enter your current password'
                  />
                  <p className='text-xs text-slate-500 flex items-center gap-1'>
                    <Shield className='w-3 h-3' />
                    For security, please enter your current password
                  </p>
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    onClick={() => setShowEmailChange(false)}
                    className='flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailChange}
                    disabled={changingEmail}
                    className='flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    {changingEmail ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Check className='w-4 h-4' />
                        Change Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
