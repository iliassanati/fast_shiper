// src/pages/client/SettingsPage.tsx - ENHANCED VERSION
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CreditCard,
  Lock,
  Globe,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Shield,
  Trash2,
  Plus,
  X,
  Download,
  Info,
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore, useNotificationStore } from '@/stores';

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  packageReceived: boolean;
  shipmentUpdates: boolean;
  promotions: boolean;
  weeklyDigest: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  danger?: boolean;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Active tab state
  const [activeTab, setActiveTab] = useState('notifications');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    danger: false,
  });

  // Loading states
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);

  // =================================================================
  // NOTIFICATIONS TAB STATE
  // =================================================================
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    packageReceived: true,
    shipmentUpdates: true,
    promotions: false,
    weeklyDigest: true,
  });

  const [hasNotificationChanges, setHasNotificationChanges] = useState(false);
  const [originalNotifications, setOriginalNotifications] =
    useState<NotificationSettings>(notifications);

  useEffect(() => {
    const hasChanges =
      JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
    setHasNotificationChanges(hasChanges);
  }, [notifications, originalNotifications]);

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOriginalNotifications(notifications);
      setHasNotificationChanges(false);
      addNotification('Notification preferences saved successfully', 'success');
    } catch (error) {
      addNotification('Failed to save notification preferences', 'error');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleResetNotifications = () => {
    setNotifications(originalNotifications);
    setHasNotificationChanges(false);
  };

  // =================================================================
  // SECURITY TAB STATE
  // =================================================================
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [enablingTwoFactor, setEnablingTwoFactor] = useState(false);

  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: 'bg-slate-200' };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    if (strength < 40) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength < 70)
      return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 90) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    return errors;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    const passwordErrors = validatePassword(passwordForm.newPassword);
    if (passwordErrors.length > 0) {
      addNotification(
        `Password must contain: ${passwordErrors.join(', ')}`,
        'error'
      );
      return;
    }

    setChangingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      addNotification('Password changed successfully', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      addNotification('Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = () => {
    setConfirmDialog({
      isOpen: true,
      title: twoFactorEnabled
        ? 'Disable Two-Factor Authentication?'
        : 'Enable Two-Factor Authentication?',
      message: twoFactorEnabled
        ? 'Your account will be less secure without 2FA. Are you sure you want to disable it?'
        : "Adding 2FA will make your account more secure. You'll need an authenticator app.",
      confirmText: twoFactorEnabled ? 'Disable' : 'Enable',
      danger: twoFactorEnabled,
      onConfirm: async () => {
        setEnablingTwoFactor(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setTwoFactorEnabled(!twoFactorEnabled);
          addNotification(
            `Two-factor authentication ${
              !twoFactorEnabled ? 'enabled' : 'disabled'
            }`,
            'success'
          );
        } catch (error) {
          addNotification(
            'Failed to update two-factor authentication',
            'error'
          );
        } finally {
          setEnablingTwoFactor(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // =================================================================
  // PAYMENT TAB STATE
  // =================================================================
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'paypal',
      email: 'youssef@example.com',
      isDefault: false,
    },
  ]);

  const [showAddPayment, setShowAddPayment] = useState(false);

  const handleSetDefaultPayment = async (id: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPaymentMethods((prev) =>
        prev.map((pm) => ({ ...pm, isDefault: pm.id === id }))
      );
      addNotification('Default payment method updated', 'success');
    } catch (error) {
      addNotification('Failed to update default payment method', 'error');
    }
  };

  const handleRemovePayment = (id: string) => {
    const method = paymentMethods.find((pm) => pm.id === id);
    if (method?.isDefault && paymentMethods.length > 1) {
      addNotification(
        'Cannot remove default payment method. Set another as default first.',
        'warning'
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Remove Payment Method?',
      message:
        'Are you sure you want to remove this payment method? This action cannot be undone.',
      confirmText: 'Remove',
      danger: true,
      onConfirm: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
          addNotification('Payment method removed', 'success');
        } catch (error) {
          addNotification('Failed to remove payment method', 'error');
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // =================================================================
  // LANGUAGE TAB STATE
  // =================================================================
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    dateFormat: 'MM/DD/YYYY',
  });

  const [hasLanguageChanges, setHasLanguageChanges] = useState(false);
  const [originalLanguageSettings, setOriginalLanguageSettings] =
    useState(languageSettings);

  useEffect(() => {
    const hasChanges =
      JSON.stringify(languageSettings) !==
      JSON.stringify(originalLanguageSettings);
    setHasLanguageChanges(hasChanges);
  }, [languageSettings, originalLanguageSettings]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' },
  ];

  const currencies = [
    { code: 'MAD', name: 'Moroccan Dirham (MAD)', symbol: 'د.م.' },
    { code: 'USD', name: 'US Dollar (USD)', symbol: '$' },
    { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  ];

  const timezones = [
    'Africa/Casablanca',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
  ];

  const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

  const handleSaveLanguage = async () => {
    setSavingLanguage(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOriginalLanguageSettings(languageSettings);
      setHasLanguageChanges(false);
      addNotification('Language preferences saved successfully', 'success');
    } catch (error) {
      addNotification('Failed to save language preferences', 'error');
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleResetLanguage = () => {
    setLanguageSettings(originalLanguageSettings);
    setHasLanguageChanges(false);
  };

  // =================================================================
  // CONFIRMATION DIALOG COMPONENT
  // =================================================================
  const ConfirmationDialog = () => (
    <AnimatePresence>
      {confirmDialog.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-6'
          onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className='bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl'
          >
            <div className='flex items-start gap-4 mb-4'>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmDialog.danger ? 'bg-red-100' : 'bg-blue-100'
                }`}
              >
                {confirmDialog.danger ? (
                  <AlertCircle className='w-6 h-6 text-red-600' />
                ) : (
                  <Info className='w-6 h-6 text-blue-600' />
                )}
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-slate-900 mb-2'>
                  {confirmDialog.title}
                </h3>
                <p className='text-sm text-slate-600'>
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, isOpen: false })
                }
                className='px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold'
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-white rounded-lg font-semibold ${
                  confirmDialog.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <DashboardLayout activeSection='settings'>
      <ConfirmationDialog />

      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>Settings</h1>
          <p className='text-slate-600'>
            Manage your account preferences and settings
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <div className='bg-white rounded-2xl p-2 shadow-lg border border-slate-100'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='notifications' className='gap-2'>
                <Bell className='w-4 h-4' />
                <span className='hidden sm:inline'>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value='security' className='gap-2'>
                <Lock className='w-4 h-4' />
                <span className='hidden sm:inline'>Security</span>
              </TabsTrigger>
              <TabsTrigger value='payment' className='gap-2'>
                <CreditCard className='w-4 h-4' />
                <span className='hidden sm:inline'>Payment</span>
              </TabsTrigger>
              <TabsTrigger value='language' className='gap-2'>
                <Globe className='w-4 h-4' />
                <span className='hidden sm:inline'>Language</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ============================================================ */}
          {/* NOTIFICATIONS TAB */}
          {/* ============================================================ */}
          <TabsContent value='notifications'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Notification Channels */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <Mail className='w-5 h-5 text-blue-600' />
                  Notification Channels
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-slate-50 rounded-xl'>
                    <div className='flex-1'>
                      <p className='font-semibold text-slate-900'>
                        Email Notifications
                      </p>
                      <p className='text-sm text-slate-600'>
                        Receive updates via email
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          email: !notifications.email,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications.email ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.email
                            ? 'translate-x-6'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className='flex items-center justify-between p-4 bg-slate-50 rounded-xl'>
                    <div className='flex-1'>
                      <p className='font-semibold text-slate-900'>
                        SMS Notifications
                      </p>
                      <p className='text-sm text-slate-600'>
                        Receive updates via SMS
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          sms: !notifications.sms,
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications.sms ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.sms ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4'>
                  Notification Types
                </h3>
                <div className='space-y-4'>
                  {[
                    {
                      key: 'packageReceived',
                      label: 'Package Received',
                      desc: 'When a new package arrives at our warehouse',
                    },
                    {
                      key: 'shipmentUpdates',
                      label: 'Shipment Updates',
                      desc: 'Status updates on your shipments',
                    },
                    {
                      key: 'promotions',
                      label: 'Promotions & Offers',
                      desc: 'Special deals and promotional offers',
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Weekly Digest',
                      desc: 'Summary of your account activity',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className='flex items-center justify-between p-4 bg-slate-50 rounded-xl'
                    >
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-900'>
                          {item.label}
                        </p>
                        <p className='text-sm text-slate-600'>{item.desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]:
                              !notifications[
                                item.key as keyof NotificationSettings
                              ],
                          })
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof NotificationSettings]
                            ? 'bg-blue-600'
                            : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications[
                              item.key as keyof NotificationSettings
                            ]
                              ? 'translate-x-6'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <AnimatePresence>
                {hasNotificationChanges && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='flex justify-between items-center bg-blue-50 border-2 border-blue-200 rounded-xl p-4'
                  >
                    <div className='flex items-center gap-2 text-blue-900'>
                      <AlertCircle className='w-5 h-5' />
                      <span className='font-semibold'>
                        You have unsaved changes
                      </span>
                    </div>
                    <div className='flex gap-3'>
                      <button
                        onClick={handleResetNotifications}
                        className='px-4 py-2 text-slate-700 hover:bg-white rounded-lg font-semibold'
                      >
                        Reset
                      </button>
                      <motion.button
                        onClick={handleSaveNotifications}
                        disabled={savingNotifications}
                        className='px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingNotifications ? (
                          <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className='w-4 h-4' />
                            Save Changes
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* SECURITY TAB */}
          {/* ============================================================ */}
          <TabsContent value='security'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Change Password */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <Lock className='w-5 h-5 text-blue-600' />
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Current Password
                    </label>
                    <div className='relative'>
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='Enter current password'
                        required
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            current: !showPasswords.current,
                          })
                        }
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPasswords.current ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      New Password
                    </label>
                    <div className='relative'>
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                        placeholder='Enter new password'
                        required
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new,
                          })
                        }
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPasswords.new ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordForm.newPassword && (
                      <div className='mt-3'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-xs font-semibold text-slate-600'>
                            Password Strength:
                          </span>
                          <span
                            className={`text-xs font-bold ${getPasswordStrength(
                              passwordForm.newPassword
                            ).color.replace('bg-', 'text-')}`}
                          >
                            {
                              getPasswordStrength(passwordForm.newPassword)
                                .label
                            }
                          </span>
                        </div>
                        <div className='h-2 bg-slate-200 rounded-full overflow-hidden'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                getPasswordStrength(passwordForm.newPassword)
                                  .strength
                              }%`,
                            }}
                            className={`h-full ${
                              getPasswordStrength(passwordForm.newPassword)
                                .color
                            }`}
                          />
                        </div>
                        {validatePassword(passwordForm.newPassword).length >
                          0 && (
                          <div className='mt-2 space-y-1'>
                            {validatePassword(passwordForm.newPassword).map(
                              (error, i) => (
                                <p
                                  key={i}
                                  className='text-xs text-slate-600 flex items-center gap-1'
                                >
                                  <span className='w-1 h-1 bg-slate-400 rounded-full' />
                                  {error}
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Confirm New Password
                    </label>
                    <div className='relative'>
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none ${
                          passwordForm.confirmPassword &&
                          passwordForm.newPassword !==
                            passwordForm.confirmPassword
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 focus:border-blue-500'
                        }`}
                        placeholder='Confirm new password'
                        required
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                    {passwordForm.confirmPassword &&
                      passwordForm.newPassword !==
                        passwordForm.confirmPassword && (
                        <p className='text-xs text-red-600 mt-1 flex items-center gap-1'>
                          <AlertCircle className='w-3 h-3' />
                          Passwords do not match
                        </p>
                      )}
                  </div>

                  <button
                    type='submit'
                    disabled={
                      changingPassword ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      passwordForm.newPassword !== passwordForm.confirmPassword
                    }
                    className='w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className='w-5 h-5 animate-spin' />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Check className='w-5 h-5' />
                        Change Password
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <Shield className='w-5 h-5 text-green-600' />
                  Two-Factor Authentication
                </h3>
                <div className='flex flex-col sm:flex-row items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl'>
                  <div className='flex-1'>
                    <p className='font-semibold text-slate-900 mb-1'>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                    <p className='text-sm text-slate-600'>
                      Add an extra layer of security to your account with 2FA
                      authentication
                    </p>
                  </div>
                  <button
                    onClick={handleToggleTwoFactor}
                    disabled={enablingTwoFactor}
                    className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap ${
                      twoFactorEnabled
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {enablingTwoFactor ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : twoFactorEnabled ? (
                      'Disable'
                    ) : (
                      'Enable'
                    )}
                  </button>
                </div>

                {twoFactorEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='mt-4 p-4 bg-green-50 rounded-xl'
                  >
                    <p className='text-sm text-green-900 flex items-center gap-2'>
                      <Check className='w-4 h-4' />
                      Two-factor authentication is active. Your account is more
                      secure!
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Connected Devices */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <Smartphone className='w-5 h-5 text-purple-600' />
                  Connected Devices
                </h3>
                <div className='space-y-3'>
                  {[
                    {
                      device: 'Chrome on MacBook Pro',
                      location: 'Casablanca, Morocco',
                      lastActive: '2 minutes ago',
                      current: true,
                    },
                    {
                      device: 'Safari on iPhone 13',
                      location: 'Casablanca, Morocco',
                      lastActive: '3 hours ago',
                      current: false,
                    },
                  ].map((device, i) => (
                    <div
                      key={i}
                      className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl'
                    >
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1 flex-wrap'>
                          <p className='font-semibold text-slate-900'>
                            {device.device}
                          </p>
                          {device.current && (
                            <span className='px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                              Current
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-slate-600'>
                          {device.location}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {device.lastActive}
                        </p>
                      </div>
                      {!device.current && (
                        <button className='text-red-600 hover:text-red-700 text-sm font-semibold'>
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* PAYMENT TAB */}
          {/* ============================================================ */}
          <TabsContent value='payment'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Payment Methods */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4'>
                  <h3 className='font-bold text-slate-900 flex items-center gap-2'>
                    <CreditCard className='w-5 h-5 text-blue-600' />
                    Payment Methods
                  </h3>
                  <button
                    onClick={() => setShowAddPayment(!showAddPayment)}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2'
                  >
                    <Plus className='w-4 h-4' />
                    Add Method
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className='text-center py-12'>
                    <CreditCard className='w-16 h-16 text-slate-300 mx-auto mb-4' />
                    <p className='text-slate-600 mb-4'>
                      No payment methods added
                    </p>
                    <button
                      onClick={() => setShowAddPayment(true)}
                      className='px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700'
                    >
                      Add Your First Payment Method
                    </button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl'
                      >
                        <div className='flex items-center gap-4'>
                          {method.type === 'card' ? (
                            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0'>
                              <CreditCard className='w-6 h-6 text-white' />
                            </div>
                          ) : (
                            <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0'>
                              <span className='text-white font-bold text-sm'>
                                P
                              </span>
                            </div>
                          )}
                          <div>
                            {method.type === 'card' ? (
                              <>
                                <p className='font-semibold text-slate-900'>
                                  {method.brand} •••• {method.last4}
                                </p>
                                <p className='text-sm text-slate-600'>
                                  Expires {method.expiryMonth}/
                                  {method.expiryYear}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className='font-semibold text-slate-900'>
                                  PayPal
                                </p>
                                <p className='text-sm text-slate-600'>
                                  {method.email}
                                </p>
                              </>
                            )}
                          </div>
                          {method.isDefault && (
                            <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                              Default
                            </span>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          {!method.isDefault && (
                            <button
                              onClick={() => handleSetDefaultPayment(method.id)}
                              className='px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-sm'
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePayment(method.id)}
                            className='p-2 text-red-600 hover:bg-red-50 rounded-lg'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {showAddPayment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <p className='text-sm text-blue-900 mb-1 font-semibold'>
                            Add New Payment Method
                          </p>
                          <p className='text-xs text-blue-800'>
                            Payment method addition will redirect you to a
                            secure Stripe/PayPal page.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddPayment(false)}
                          className='p-1 hover:bg-blue-100 rounded'
                        >
                          <X className='w-4 h-4 text-blue-600' />
                        </button>
                      </div>
                      <div className='flex gap-2'>
                        <button className='flex-1 px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 rounded-lg font-semibold hover:bg-blue-50'>
                          Add Card
                        </button>
                        <button className='flex-1 px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 rounded-lg font-semibold hover:bg-blue-50'>
                          Add PayPal
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Billing History */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4'>
                  Billing History
                </h3>
                <div className='space-y-3'>
                  {[
                    {
                      id: 'INV-001',
                      date: '2025-10-15',
                      description: 'Shipping to Morocco',
                      amount: '450 MAD',
                      status: 'paid',
                    },
                    {
                      id: 'INV-002',
                      date: '2025-10-08',
                      description: 'Package Consolidation',
                      amount: '150 MAD',
                      status: 'paid',
                    },
                    {
                      id: 'INV-003',
                      date: '2025-10-01',
                      description: 'Shipping to Morocco',
                      amount: '320 MAD',
                      status: 'paid',
                    },
                  ].map((invoice) => (
                    <div
                      key={invoice.id}
                      className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl'
                    >
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-900'>
                          {invoice.description}
                        </p>
                        <p className='text-sm text-slate-600'>
                          {invoice.id} • {invoice.date}
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='font-bold text-slate-900'>
                            {invoice.amount}
                          </p>
                          <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold'>
                            {invoice.status}
                          </span>
                        </div>
                        <button className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg'>
                          <Download className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* LANGUAGE TAB */}
          {/* ============================================================ */}
          <TabsContent value='language'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Language & Region */}
              <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
                <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <Globe className='w-5 h-5 text-blue-600' />
                  Language & Region
                </h3>

                <div className='space-y-4'>
                  {/* Language */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Display Language
                    </label>
                    <select
                      value={languageSettings.language}
                      onChange={(e) =>
                        setLanguageSettings({
                          ...languageSettings,
                          language: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Currency
                    </label>
                    <select
                      value={languageSettings.currency}
                      onChange={(e) =>
                        setLanguageSettings({
                          ...languageSettings,
                          currency: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Timezone
                    </label>
                    <select
                      value={languageSettings.timezone}
                      onChange={(e) =>
                        setLanguageSettings({
                          ...languageSettings,
                          timezone: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      {timezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className='block text-sm font-semibold text-slate-700 mb-2'>
                      Date Format
                    </label>
                    <select
                      value={languageSettings.dateFormat}
                      onChange={(e) =>
                        setLanguageSettings({
                          ...languageSettings,
                          dateFormat: e.target.value,
                        })
                      }
                      className='w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none'
                    >
                      {dateFormats.map((format) => (
                        <option key={format} value={format}>
                          {format} (Example: {new Date().toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className='bg-blue-50 rounded-xl p-6 border border-blue-200'>
                <h4 className='font-bold text-blue-900 mb-3'>Preview</h4>
                <div className='space-y-2 text-sm'>
                  <p className='text-blue-800'>
                    <span className='font-semibold'>Language:</span>{' '}
                    {
                      languages.find(
                        (l) => l.code === languageSettings.language
                      )?.name
                    }
                  </p>
                  <p className='text-blue-800'>
                    <span className='font-semibold'>Currency:</span>{' '}
                    {
                      currencies.find(
                        (c) => c.code === languageSettings.currency
                      )?.symbol
                    }{' '}
                    450.00
                  </p>
                  <p className='text-blue-800'>
                    <span className='font-semibold'>Date:</span>{' '}
                    {new Date().toLocaleDateString()}
                  </p>
                  <p className='text-blue-800'>
                    <span className='font-semibold'>Time:</span>{' '}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <AnimatePresence>
                {hasLanguageChanges && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='flex justify-between items-center bg-blue-50 border-2 border-blue-200 rounded-xl p-4'
                  >
                    <div className='flex items-center gap-2 text-blue-900'>
                      <AlertCircle className='w-5 h-5' />
                      <span className='font-semibold'>
                        You have unsaved changes
                      </span>
                    </div>
                    <div className='flex gap-3'>
                      <button
                        onClick={handleResetLanguage}
                        className='px-4 py-2 text-slate-700 hover:bg-white rounded-lg font-semibold'
                      >
                        Reset
                      </button>
                      <motion.button
                        onClick={handleSaveLanguage}
                        disabled={savingLanguage}
                        className='px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingLanguage ? (
                          <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className='w-4 h-4' />
                            Save Changes
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
