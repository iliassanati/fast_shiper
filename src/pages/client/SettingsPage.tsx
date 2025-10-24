import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CreditCard, Lock, MapPin, Globe } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    packageReceived: true,
    shipmentUpdates: true,
    promotions: false,
  });

  return (
    <DashboardLayout activeSection='settings'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>Settings</h1>
          <p className='text-slate-600'>Manage your account preferences</p>
        </div>

        <Tabs defaultValue='notifications' className='space-y-6'>
          <TabsList>
            <TabsTrigger value='notifications'>Notifications</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
            <TabsTrigger value='payment'>Payment</TabsTrigger>
            <TabsTrigger value='language'>Language</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value='notifications'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-6'>
                Notification Preferences
              </h3>
              <div className='space-y-4'>
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className='flex items-center justify-between p-4 bg-slate-50 rounded-xl'
                  >
                    <span className='font-semibold text-slate-700 capitalize'>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <button
                      onClick={() =>
                        setNotifications({ ...notifications, [key]: !value })
                      }
                      className={`w-12 h-6 rounded-full transition-colors ${
                        value ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value='security'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-6'>
                Security Settings
              </h3>
              <div className='space-y-4'>
                <button className='w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3'>
                  <Lock className='w-5 h-5 text-blue-600' />
                  <span className='font-semibold'>Change Password</span>
                </button>
                <button className='w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left flex items-center gap-3'>
                  <Lock className='w-5 h-5 text-blue-600' />
                  <span className='font-semibold'>
                    Enable Two-Factor Authentication
                  </span>
                </button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Add other tabs similarly */}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
