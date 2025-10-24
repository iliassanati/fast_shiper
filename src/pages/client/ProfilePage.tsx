import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Copy, Edit2, Mail, MapPin, Phone, User } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuthStore, useNotificationStore } from '@/stores';

export default function ProfilePage() {
  const { user, usAddress, updateProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user || {});

  const copyAddress = () => {
    if (!usAddress) return;
    const text = `${usAddress.name}\n${usAddress.suite}\n${usAddress.street}\n${usAddress.city}`;
    navigator.clipboard.writeText(text);
    addNotification('US Address copied to clipboard!', 'success');
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      addNotification('Profile updated successfully!', 'success');
    } catch (error) {
      addNotification('Failed to update profile', 'error');
    }
  };

  return (
    <DashboardLayout activeSection="profile">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-600">Manage your account information</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">Personal Information</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </motion.div>

            {/* Moroccan Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <h3 className="font-bold text-slate-900 mb-4">Morocco Delivery Address</h3>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-700">{user?.address.street}</p>
                <p className="text-sm text-slate-700">{user?.address.city}, {user?.address.postalCode}</p>
                <p className="text-sm text-slate-700">{user?.address.country}</p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* US Address */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Your US Address</h3>
                <button
                  onClick={copyAddress}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {usAddress && (
                <div className="text-sm text-slate-700 space-y-1 font-mono">
                  <p className="font-bold">{usAddress.name}</p>
                  <p className="text-blue-600 font-bold">{usAddress.suite}</p>
                  <p>{usAddress.street}</p>
                  <p>{usAddress.city}</p>
                  <p>{usAddress.country}</p>
                </div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <h3 className="font-bold text-slate-900 mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Packages</span>
                  <span className="font-bold text-slate-900">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Shipments</span>
                  <span className="font-bold text-slate-900">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Member Since</span>
                  <span className="font-bold text-slate-900">Jan 2025</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}