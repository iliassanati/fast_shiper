// client/src/pages/client/ProfilePage.tsx - FIXED WITH SHIPPING ADDRESS EDITING
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

  // Address editing state - SEPARATE from profile
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

  // Handle profile save (name and phone only)
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

  // Handle address save (separate from profile)
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
    // Validation
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
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900'>My Profile</h1>
            <p className='text-slate-600'>
              Manage your account information and shipping address
            </p>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Main Profile Card */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-slate-900 flex items-center gap-2'>
                  <User className='w-5 h-5 text-blue-600' />
                  Personal Information
                </h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className='px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-2 transition-colors'
                  >
                    <Edit2 className='w-4 h-4' />
                    Edit
                  </button>
                ) : (
                  <div className='flex gap-2'>
                    <button
                      onClick={handleCancelProfile}
                      className='px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-2 transition-colors'
                      disabled={savingProfile}
                    >
                      <X className='w-4 h-4' />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50'
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Save className='w-4 h-4' />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className='space-y-6'>
                {/* Avatar & Name */}
                <div className='flex items-center gap-4'>
                  <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold'>
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
                        className='w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold'
                        placeholder='Your name'
                      />
                    ) : (
                      <h3 className='text-xl font-bold text-slate-900'>
                        {user.name}
                      </h3>
                    )}
                    <p className='text-slate-500'>Suite #{user.suiteNumber}</p>
                  </div>
                </div>

                {/* Email */}
                <div className='space-y-2'>
                  <label className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                    <Mail className='w-4 h-4' />
                    Email Address
                  </label>
                  <div className='flex items-center gap-3'>
                    <div className='flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900'>
                      {user.email}
                    </div>
                    <button
                      onClick={() => setShowEmailChange(true)}
                      className='px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors text-sm'
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className='space-y-2'>
                  <label className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                    <Phone className='w-4 h-4' />
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
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                      placeholder='+212 XXX XXX XXX'
                    />
                  ) : (
                    <div className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900'>
                      {user.phone || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Shipping Address (Morocco) - SEPARATE EDIT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-slate-900 flex items-center gap-2'>
                  <MapPin className='w-5 h-5 text-green-600' />
                  Shipping Address (Morocco)
                </h2>
                {!isEditingAddress ? (
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className='px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-semibold flex items-center gap-2 transition-colors'
                  >
                    <Edit2 className='w-4 h-4' />
                    Edit
                  </button>
                ) : (
                  <div className='flex gap-2'>
                    <button
                      onClick={handleCancelAddress}
                      className='px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-2 transition-colors'
                      disabled={savingAddress}
                    >
                      <X className='w-4 h-4' />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      className='px-4 py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50'
                      disabled={savingAddress}
                    >
                      {savingAddress ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Save className='w-4 h-4' />
                      )}
                      Save Address
                    </button>
                  </div>
                )}
              </div>

              <p className='text-sm text-slate-500 mb-4'>
                This is the address where your packages will be delivered in
                Morocco.
              </p>

              <div className='grid md:grid-cols-2 gap-4'>
                {/* Street */}
                <div className='md:col-span-2 space-y-2'>
                  <label className='text-sm font-semibold text-slate-700'>
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
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none'
                      placeholder='123 Main Street, Apt 4B'
                    />
                  ) : (
                    <div className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900'>
                      {user.address?.street || (
                        <span className='text-slate-400 italic'>
                          Not provided - click Edit to add
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* City */}
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-slate-700'>
                    City
                  </label>
                  {isEditingAddress ? (
                    <input
                      type='text'
                      value={addressData.city}
                      onChange={(e) =>
                        setAddressData({ ...addressData, city: e.target.value })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none'
                      placeholder='Casablanca'
                    />
                  ) : (
                    <div className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900'>
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
                  <label className='text-sm font-semibold text-slate-700'>
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
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none'
                      placeholder='20000'
                    />
                  ) : (
                    <div className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900'>
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
                  <label className='text-sm font-semibold text-slate-700'>
                    Country
                  </label>
                  <div className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 flex items-center gap-2'>
                    <span className='text-lg'>🇲🇦</span>
                    Morocco
                    <span className='text-xs text-slate-500 ml-auto'>
                      (Cannot be changed)
                    </span>
                  </div>
                </div>
              </div>

              {/* Address completion indicator */}
              {!user.address?.street && !isEditingAddress && (
                <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-semibold text-yellow-900'>
                        Complete your shipping address
                      </p>
                      <p className='text-sm text-yellow-800 mt-1'>
                        Add your Morocco shipping address to receive your
                        packages. This is required for delivery.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* US Warehouse Address */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-6 text-white'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-bold flex items-center gap-2'>
                  <Building2 className='w-5 h-5' />
                  Your US Address
                </h3>
                <button
                  onClick={copyUsAddress}
                  className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors'
                  title='Copy address'
                >
                  <Copy className='w-4 h-4' />
                </button>
              </div>

              {usAddress ? (
                <div className='space-y-1 text-sm'>
                  <p className='font-semibold'>{usAddress.name}</p>
                  <p className='text-blue-100'>{usAddress.suite}</p>
                  <p className='text-blue-100'>{usAddress.street}</p>
                  <p className='text-blue-100'>{usAddress.city}</p>
                  <p className='text-blue-100'>{usAddress.country}</p>
                  {usAddress.phone && (
                    <p className='text-blue-100 mt-2'>{usAddress.phone}</p>
                  )}
                </div>
              ) : (
                <p className='text-blue-100'>Loading address...</p>
              )}

              <div className='mt-4 pt-4 border-t border-white/20'>
                <p className='text-xs text-blue-100'>
                  Use this address when shopping from US stores. Your suite
                  number is unique to you.
                </p>
              </div>
            </motion.div>

            {/* Account Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl shadow-lg p-6'
            >
              <h3 className='font-bold text-slate-900 flex items-center gap-2 mb-4'>
                <Shield className='w-5 h-5 text-green-600' />
                Account Status
              </h3>

              <div className='space-y-3'>
                <div className='flex items-center justify-between py-2'>
                  <span className='text-slate-600'>Account Status</span>
                  <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1'>
                    <CheckCircle className='w-4 h-4' />
                    Active
                  </span>
                </div>

                <div className='flex items-center justify-between py-2'>
                  <span className='text-slate-600'>Member Since</span>
                  <span className='text-slate-900 font-semibold'>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>

                <div className='flex items-center justify-between py-2'>
                  <span className='text-slate-600'>Suite Number</span>
                  <span className='text-slate-900 font-mono font-bold'>
                    {user.suiteNumber}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-slate-50 rounded-2xl p-6 border border-slate-200'
            >
              <h3 className='font-bold text-slate-900 mb-2'>Need Help?</h3>
              <p className='text-sm text-slate-600 mb-4'>
                Contact our support team for any questions about your account or
                shipments.
              </p>
              <button
                onClick={() => (window.location.href = '/support')}
                className='w-full py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors'
              >
                Contact Support
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Email Change Modal */}
      <AnimatePresence>
        {showEmailChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setShowEmailChange(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6'
            >
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-bold text-slate-900'>
                  Change Email Address
                </h2>
                <button
                  onClick={() => setShowEmailChange(false)}
                  className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-slate-700'>
                    Current Email
                  </label>
                  <div className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500'>
                    {user.email}
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-slate-700'>
                    New Email Address
                  </label>
                  <input
                    type='email'
                    value={emailData.newEmail}
                    onChange={(e) =>
                      setEmailData({ ...emailData, newEmail: e.target.value })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                    placeholder='newemail@example.com'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-slate-700'>
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
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                    placeholder='newemail@example.com'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-slate-700'>
                    Current Password
                  </label>
                  <input
                    type='password'
                    value={emailData.password}
                    onChange={(e) =>
                      setEmailData({ ...emailData, password: e.target.value })
                    }
                    className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none'
                    placeholder='Enter your current password'
                  />
                  <p className='text-xs text-slate-500'>
                    For security, please enter your current password
                  </p>
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    onClick={() => setShowEmailChange(false)}
                    className='flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailChange}
                    disabled={changingEmail}
                    className='flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    {changingEmail ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Changing...
                      </>
                    ) : (
                      'Change Email'
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
