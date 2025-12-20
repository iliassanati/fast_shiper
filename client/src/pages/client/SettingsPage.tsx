// src/pages/client/SettingsPage.tsx - OPTIMIZED UX/UI VERSION
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
  CheckCircle2,
  XCircle,
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
  // ENHANCED TOGGLE SWITCH COMPONENT
  // =================================================================
  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out ${
        checked
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
          : 'bg-slate-300'
      } ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-xl'
      } 
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    >
      <motion.div
        initial={false}
        animate={{
          x: checked ? 28 : 2,
          scale: checked ? 1.1 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md ${
          checked ? 'shadow-blue-200' : 'shadow-slate-300'
        }`}
      >
        {checked && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className='flex items-center justify-center w-full h-full'
          >
            <Check className='w-3 h-3 text-blue-600' />
          </motion.div>
        )}
      </motion.div>
    </button>
  );

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
          className='fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4'
          onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className='bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl'
          >
            <div className='flex flex-col items-center text-center mb-6'>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  confirmDialog.danger
                    ? 'bg-gradient-to-br from-red-100 to-red-50'
                    : 'bg-gradient-to-br from-blue-100 to-blue-50'
                }`}
              >
                {confirmDialog.danger ? (
                  <AlertCircle className='w-8 h-8 text-red-600' />
                ) : (
                  <Info className='w-8 h-8 text-blue-600' />
                )}
              </motion.div>
              <h3 className='font-bold text-xl text-slate-900 mb-2'>
                {confirmDialog.title}
              </h3>
              <p className='text-slate-600 leading-relaxed'>
                {confirmDialog.message}
              </p>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, isOpen: false })
                }
                className='flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all shadow-lg ${
                  confirmDialog.danger
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30'
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
  // ENHANCED SAVE BAR COMPONENT
  // =================================================================
  const SaveBar = ({
    hasChanges,
    onSave,
    onReset,
    isSaving,
  }: {
    hasChanges: boolean;
    onSave: () => void;
    onReset: () => void;
    isSaving: boolean;
  }) => (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className='fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4'
        >
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl shadow-blue-500/50 p-4'>
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div className='flex items-center gap-3 text-white'>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <AlertCircle className='w-5 h-5' />
                </motion.div>
                <span className='font-semibold'>You have unsaved changes</span>
              </div>
              <div className='flex gap-3 w-full sm:w-auto'>
                <button
                  onClick={onReset}
                  disabled={isSaving}
                  className='flex-1 sm:flex-none px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50'
                >
                  Reset
                </button>
                <motion.button
                  onClick={onSave}
                  disabled={isSaving}
                  className='flex-1 sm:flex-none px-8 py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className='w-5 h-5 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className='w-5 h-5' />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
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

      <div className='space-y-8 pb-24'>
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-2'
        >
          <h1 className='text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'>
            Settings
          </h1>
          <p className='text-lg text-slate-600'>
            Manage your account preferences and settings
          </p>
        </motion.div>

        {/* Enhanced Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-8'
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-3xl p-2 shadow-xl border border-slate-200/50 backdrop-blur-sm'
          >
            <TabsList className='grid w-full grid-cols-2 lg:grid-cols-4 gap-2'>
              <TabsTrigger
                value='notifications'
                className='gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 rounded-xl py-3'
              >
                <Bell className='w-4 h-4' />
                <span className='hidden sm:inline'>Notifications</span>
              </TabsTrigger>
              <TabsTrigger
                value='security'
                className='gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 rounded-xl py-3'
              >
                <Lock className='w-4 h-4' />
                <span className='hidden sm:inline'>Security</span>
              </TabsTrigger>
              <TabsTrigger
                value='payment'
                className='gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 rounded-xl py-3'
              >
                <CreditCard className='w-4 h-4' />
                <span className='hidden sm:inline'>Payment</span>
              </TabsTrigger>
              <TabsTrigger
                value='language'
                className='gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 rounded-xl py-3'
              >
                <Globe className='w-4 h-4' />
                <span className='hidden sm:inline'>Language</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* ============================================================ */}
          {/* NOTIFICATIONS TAB - ENHANCED */}
          {/* ============================================================ */}
          <TabsContent value='notifications'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Notification Channels */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                    <Mail className='w-5 h-5 text-white' />
                  </div>
                  <h3 className='font-bold text-xl text-slate-900'>
                    Notification Channels
                  </h3>
                </div>
                <div className='space-y-4'>
                  {[
                    {
                      icon: Mail,
                      key: 'email',
                      label: 'Email Notifications',
                      desc: 'Receive updates via email',
                      color: 'from-blue-500 to-blue-600',
                    },
                    {
                      icon: Smartphone,
                      key: 'sms',
                      label: 'SMS Notifications',
                      desc: 'Receive updates via SMS',
                      color: 'from-green-500 to-green-600',
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.key}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className='flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 transition-all hover:shadow-md'
                    >
                      <div className='flex items-center gap-4 flex-1'>
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
                        >
                          <item.icon className='w-6 h-6 text-white' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-900 mb-0.5'>
                            {item.label}
                          </p>
                          <p className='text-sm text-slate-600'>{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={
                          notifications[item.key as keyof NotificationSettings]
                        }
                        onChange={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]:
                              !notifications[
                                item.key as keyof NotificationSettings
                              ],
                          })
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Notification Types */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <h3 className='font-bold text-xl text-slate-900 mb-6'>
                  Notification Types
                </h3>
                <div className='space-y-4'>
                  {[
                    {
                      key: 'packageReceived',
                      label: 'Package Received',
                      desc: 'When a new package arrives at our warehouse',
                      icon: '📦',
                    },
                    {
                      key: 'shipmentUpdates',
                      label: 'Shipment Updates',
                      desc: 'Status updates on your shipments',
                      icon: '🚚',
                    },
                    {
                      key: 'promotions',
                      label: 'Promotions & Offers',
                      desc: 'Special deals and promotional offers',
                      icon: '🎁',
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Weekly Digest',
                      desc: 'Summary of your account activity',
                      icon: '📊',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className='flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 transition-all hover:shadow-md'
                    >
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='text-3xl'>{item.icon}</div>
                        <div className='flex-1'>
                          <p className='font-semibold text-slate-900 mb-0.5'>
                            {item.label}
                          </p>
                          <p className='text-sm text-slate-600'>{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={
                          notifications[item.key as keyof NotificationSettings]
                        }
                        onChange={() =>
                          setNotifications({
                            ...notifications,
                            [item.key]:
                              !notifications[
                                item.key as keyof NotificationSettings
                              ],
                          })
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Save Bar */}
              <SaveBar
                hasChanges={hasNotificationChanges}
                onSave={handleSaveNotifications}
                onReset={handleResetNotifications}
                isSaving={savingNotifications}
              />
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* SECURITY TAB - ENHANCED */}
          {/* ============================================================ */}
          <TabsContent value='security'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Change Password */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                    <Lock className='w-5 h-5 text-white' />
                  </div>
                  <h3 className='font-bold text-xl text-slate-900'>
                    Change Password
                  </h3>
                </div>
                <form onSubmit={handleChangePassword} className='space-y-5'>
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
                        className='w-full px-4 py-3.5 pr-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all'
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
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all'
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
                        className='w-full px-4 py-3.5 pr-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all'
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
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all'
                      >
                        {showPasswords.new ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>

                    {/* Enhanced Password Strength Indicator */}
                    {passwordForm.newPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className='mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50'
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <span className='text-sm font-semibold text-slate-700'>
                            Password Strength:
                          </span>
                          <span
                            className={`text-sm font-bold ${getPasswordStrength(
                              passwordForm.newPassword
                            ).color.replace('bg-', 'text-')}`}
                          >
                            {
                              getPasswordStrength(passwordForm.newPassword)
                                .label
                            }
                          </span>
                        </div>
                        <div className='h-2.5 bg-slate-200 rounded-full overflow-hidden'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                getPasswordStrength(passwordForm.newPassword)
                                  .strength
                              }%`,
                            }}
                            transition={{ duration: 0.3 }}
                            className={`h-full ${
                              getPasswordStrength(passwordForm.newPassword)
                                .color
                            }`}
                          />
                        </div>
                        {validatePassword(passwordForm.newPassword).length >
                          0 && (
                          <div className='mt-3 space-y-2'>
                            <p className='text-xs font-semibold text-slate-600'>
                              Password must include:
                            </p>
                            <div className='grid grid-cols-2 gap-2'>
                              {validatePassword(passwordForm.newPassword).map(
                                (error, i) => (
                                  <p
                                    key={i}
                                    className='text-xs text-slate-600 flex items-center gap-2'
                                  >
                                    <XCircle className='w-3.5 h-3.5 text-red-500' />
                                    {error}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
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
                        className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                          passwordForm.confirmPassword &&
                          passwordForm.newPassword !==
                            passwordForm.confirmPassword
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'
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
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all'
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className='w-5 h-5' />
                        ) : (
                          <Eye className='w-5 h-5' />
                        )}
                      </button>
                    </div>
                    <AnimatePresence>
                      {passwordForm.confirmPassword &&
                        passwordForm.newPassword !==
                          passwordForm.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className='text-sm text-red-600 mt-2 flex items-center gap-2 bg-red-50 p-3 rounded-lg'
                          >
                            <AlertCircle className='w-4 h-4' />
                            Passwords do not match
                          </motion.p>
                        )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type='submit'
                    disabled={
                      changingPassword ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      passwordForm.newPassword !== passwordForm.confirmPassword
                    }
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className='w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all'
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
                  </motion.button>
                </form>
              </motion.div>

              {/* Two-Factor Authentication */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center'>
                    <Shield className='w-5 h-5 text-white' />
                  </div>
                  <h3 className='font-bold text-xl text-slate-900'>
                    Two-Factor Authentication
                  </h3>
                </div>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className='flex flex-col sm:flex-row items-start justify-between gap-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50'
                >
                  <div className='flex items-start gap-4 flex-1'>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        twoFactorEnabled
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}
                    >
                      <Shield className='w-6 h-6 text-white' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        <p className='font-bold text-slate-900'>
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                        {twoFactorEnabled && (
                          <CheckCircle2 className='w-5 h-5 text-green-600' />
                        )}
                      </div>
                      <p className='text-sm text-slate-600 leading-relaxed'>
                        Add an extra layer of security to your account with 2FA
                        authentication
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleToggleTwoFactor}
                    disabled={enablingTwoFactor}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap shadow-md transition-all ${
                      twoFactorEnabled
                        ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-600 hover:from-red-200 hover:to-red-100 shadow-red-500/20'
                        : 'bg-gradient-to-r from-green-100 to-green-50 text-green-600 hover:from-green-200 hover:to-green-100 shadow-green-500/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {enablingTwoFactor ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : twoFactorEnabled ? (
                      'Disable'
                    ) : (
                      'Enable'
                    )}
                  </motion.button>
                </motion.div>

                <AnimatePresence>
                  {twoFactorEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl border border-green-200'
                    >
                      <p className='text-sm text-green-900 flex items-center gap-2 font-medium'>
                        <CheckCircle2 className='w-5 h-5' />
                        Two-factor authentication is active. Your account is
                        more secure!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Connected Devices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center'>
                    <Smartphone className='w-5 h-5 text-white' />
                  </div>
                  <h3 className='font-bold text-xl text-slate-900'>
                    Connected Devices
                  </h3>
                </div>
                <div className='space-y-4'>
                  {[
                    {
                      device: 'Chrome on MacBook Pro',
                      location: 'Casablanca, Morocco',
                      lastActive: '2 minutes ago',
                      current: true,
                      icon: '💻',
                    },
                    {
                      device: 'Safari on iPhone 13',
                      location: 'Casablanca, Morocco',
                      lastActive: '3 hours ago',
                      current: false,
                      icon: '📱',
                    },
                  ].map((device, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 transition-all hover:shadow-md'
                    >
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='text-3xl'>{device.icon}</div>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1 flex-wrap'>
                            <p className='font-semibold text-slate-900'>
                              {device.device}
                            </p>
                            {device.current && (
                              <span className='px-3 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-full text-xs font-bold shadow-sm'>
                                Current
                              </span>
                            )}
                          </div>
                          <p className='text-sm text-slate-600 mb-0.5'>
                            {device.location}
                          </p>
                          <p className='text-xs text-slate-500'>
                            {device.lastActive}
                          </p>
                        </div>
                      </div>
                      {!device.current && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className='px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-semibold transition-all'
                        >
                          Revoke
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* PAYMENT TAB - ENHANCED */}
          {/* ============================================================ */}
          <TabsContent value='payment'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Payment Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                      <CreditCard className='w-5 h-5 text-white' />
                    </div>
                    <h3 className='font-bold text-xl text-slate-900'>
                      Payment Methods
                    </h3>
                  </div>
                  <motion.button
                    onClick={() => setShowAddPayment(!showAddPayment)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all'
                  >
                    <Plus className='w-4 h-4' />
                    Add Method
                  </motion.button>
                </div>

                {paymentMethods.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='text-center py-16'
                  >
                    <div className='w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                      <CreditCard className='w-12 h-12 text-slate-400' />
                    </div>
                    <h4 className='font-bold text-lg text-slate-900 mb-2'>
                      No payment methods added
                    </h4>
                    <p className='text-slate-600 mb-6'>
                      Add a payment method to start making transactions
                    </p>
                    <motion.button
                      onClick={() => setShowAddPayment(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30'
                    >
                      Add Your First Payment Method
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className='space-y-4'>
                    {paymentMethods.map((method, index) => (
                      <motion.div
                        key={method.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 transition-all hover:shadow-md'
                      >
                        <div className='flex items-center gap-4'>
                          {method.type === 'card' ? (
                            <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30'>
                              <CreditCard className='w-7 h-7 text-white' />
                            </div>
                          ) : (
                            <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30'>
                              <span className='text-white font-bold text-lg'>
                                P
                              </span>
                            </div>
                          )}
                          <div>
                            {method.type === 'card' ? (
                              <>
                                <p className='font-bold text-slate-900 mb-1'>
                                  {method.brand} •••• {method.last4}
                                </p>
                                <p className='text-sm text-slate-600'>
                                  Expires {method.expiryMonth}/
                                  {method.expiryYear}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className='font-bold text-slate-900 mb-1'>
                                  PayPal
                                </p>
                                <p className='text-sm text-slate-600'>
                                  {method.email}
                                </p>
                              </>
                            )}
                          </div>
                          {method.isDefault && (
                            <span className='px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-full text-xs font-bold shadow-sm'>
                              Default
                            </span>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          {!method.isDefault && (
                            <motion.button
                              onClick={() => handleSetDefaultPayment(method.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className='px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold text-sm transition-all'
                            >
                              Set Default
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => handleRemovePayment(method.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all'
                          >
                            <Trash2 className='w-4 h-4' />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {showAddPayment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border-2 border-blue-200'
                    >
                      <div className='flex items-start justify-between mb-4'>
                        <div>
                          <p className='text-sm text-blue-900 mb-1 font-bold'>
                            Add New Payment Method
                          </p>
                          <p className='text-xs text-blue-800'>
                            Payment method addition will redirect you to a
                            secure Stripe/PayPal page.
                          </p>
                        </div>
                        <motion.button
                          onClick={() => setShowAddPayment(false)}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          className='p-1.5 hover:bg-blue-200 rounded-lg transition-all'
                        >
                          <X className='w-5 h-5 text-blue-600' />
                        </motion.button>
                      </div>
                      <div className='flex gap-3'>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className='flex-1 px-5 py-3 bg-white border-2 border-blue-300 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm'
                        >
                          Add Card
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className='flex-1 px-5 py-3 bg-white border-2 border-blue-300 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm'
                        >
                          Add PayPal
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Billing History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <h3 className='font-bold text-xl text-slate-900 mb-6'>
                  Billing History
                </h3>
                <div className='space-y-4'>
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
                  ].map((invoice, index) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 transition-all hover:shadow-md'
                    >
                      <div className='flex-1'>
                        <p className='font-bold text-slate-900 mb-1'>
                          {invoice.description}
                        </p>
                        <p className='text-sm text-slate-600'>
                          {invoice.id} • {invoice.date}
                        </p>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='font-bold text-lg text-slate-900 mb-1'>
                            {invoice.amount}
                          </p>
                          <span className='px-3 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-full text-xs font-bold shadow-sm'>
                            {invoice.status}
                          </span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className='p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all'
                        >
                          <Download className='w-4 h-4' />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* LANGUAGE TAB - ENHANCED */}
          {/* ============================================================ */}
          <TabsContent value='language'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-6'
            >
              {/* Language & Region */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                    <Globe className='w-5 h-5 text-white' />
                  </div>
                  <h3 className='font-bold text-xl text-slate-900'>
                    Language & Region
                  </h3>
                </div>

                <div className='space-y-5'>
                  {/* Language */}
                  <div>
                    <label className='block text-sm font-bold text-slate-700 mb-3'>
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
                      className='w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white font-medium'
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
                    <label className='block text-sm font-bold text-slate-700 mb-3'>
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
                      className='w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white font-medium'
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
                    <label className='block text-sm font-bold text-slate-700 mb-3'>
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
                      className='w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white font-medium'
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
                    <label className='block text-sm font-bold text-slate-700 mb-3'>
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
                      className='w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white font-medium'
                    >
                      {dateFormats.map((format) => (
                        <option key={format} value={format}>
                          {format} (Example: {new Date().toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-8 border-2 border-blue-200 shadow-lg'
              >
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center'>
                    <Eye className='w-5 h-5 text-white' />
                  </div>
                  <h4 className='font-bold text-xl text-blue-900'>Preview</h4>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {[
                    {
                      label: 'Language',
                      value:
                        languages.find(
                          (l) => l.code === languageSettings.language
                        )?.name || '',
                      icon: '🌍',
                    },
                    {
                      label: 'Currency',
                      value: `${
                        currencies.find(
                          (c) => c.code === languageSettings.currency
                        )?.symbol
                      } 450.00`,
                      icon: '💰',
                    },
                    {
                      label: 'Date',
                      value: new Date().toLocaleDateString(),
                      icon: '📅',
                    },
                    {
                      label: 'Time',
                      value: new Date().toLocaleTimeString(),
                      icon: '🕐',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className='p-4 bg-white rounded-xl border border-blue-200 shadow-sm'
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-xl'>{item.icon}</span>
                        <p className='text-xs font-bold text-blue-900'>
                          {item.label}
                        </p>
                      </div>
                      <p className='text-sm font-semibold text-slate-900'>
                        {item.value}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Save Bar */}
              <SaveBar
                hasChanges={hasLanguageChanges}
                onSave={handleSaveLanguage}
                onReset={handleResetLanguage}
                isSaving={savingLanguage}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
