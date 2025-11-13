// client/src/pages/admin/AdminDashboardPage.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Box,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { useAdminDashboardStore } from '@/stores/useAdminDashboardStore';

export default function AdminDashboardPage() {
  const {
    stats,
    alerts,
    activities,
    loading,
    fetchStats,
    fetchAlerts,
    fetchActivities,
  } = useAdminDashboardStore();

  useEffect(() => {
    fetchStats();
    fetchAlerts();
    fetchActivities(10);

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchAlerts, fetchActivities]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      icon: <Users className='w-6 h-6' />,
      gradient: 'from-blue-500 to-cyan-500',
      change: `+${stats?.users.newToday || 0} today`,
    },
    {
      title: 'Packages in Storage',
      value: stats?.packages.inStorage || 0,
      icon: <Package className='w-6 h-6' />,
      gradient: 'from-orange-500 to-red-500',
      change: `${stats?.packages.today || 0} received today`,
    },
    {
      title: 'Active Shipments',
      value: stats?.shipments.active || 0,
      icon: <Truck className='w-6 h-6' />,
      gradient: 'from-green-500 to-emerald-500',
      change: `${stats?.shipments.today || 0} shipped today`,
    },
    {
      title: 'Monthly Revenue',
      value: `${stats?.revenue.month || 0} MAD`,
      icon: <DollarSign className='w-6 h-6' />,
      gradient: 'from-purple-500 to-pink-500',
      change: `${stats?.revenue.today || 0} MAD today`,
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className='w-5 h-5 text-red-500' />;
      case 'warning':
        return <Clock className='w-5 h-5 text-orange-500' />;
      default:
        return <CheckCircle className='w-5 h-5 text-blue-500' />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'package':
        return <Package className='w-5 h-5 text-blue-600' />;
      case 'shipment':
        return <Truck className='w-5 h-5 text-green-600' />;
      case 'transaction':
        return <DollarSign className='w-5 h-5 text-purple-600' />;
      default:
        return <Box className='w-5 h-5 text-slate-600' />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'package':
        return 'bg-blue-100';
      case 'shipment':
        return 'bg-green-100';
      case 'transaction':
        return 'bg-purple-100';
      default:
        return 'bg-slate-100';
    }
  };

  const formatActivityMessage = (activity: any) => {
    switch (activity.type) {
      case 'package':
        return `Package ${activity.data.trackingNumber} received from ${activity.data.retailer}`;
      case 'shipment':
        return `Shipment ${activity.data.trackingNumber} created via ${activity.data.carrier}`;
      case 'transaction':
        return `${activity.data.type} transaction completed: ${activity.data.amount} ${activity.data.currency}`;
      default:
        return 'Activity recorded';
    }
  };

  if (loading && !stats) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-slate-600 font-semibold'>Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Welcome Header */}
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>Admin Dashboard</h1>
          <p className='text-slate-600'>
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100'
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-white mb-4`}
              >
                {card.icon}
              </div>
              <h3 className='text-sm text-slate-600 mb-1'>{card.title}</h3>
              <p className='text-3xl font-bold text-slate-900 mb-2'>
                {typeof card.value === 'number'
                  ? card.value.toLocaleString()
                  : card.value}
              </p>
              <div className='flex items-center gap-1 text-xs text-green-600'>
                <TrendingUp className='w-3 h-3' />
                <span>{card.change}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Alerts Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
          >
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Alerts & Urgent Actions
            </h2>

            {alerts.length === 0 ? (
              <div className='text-center py-8'>
                <CheckCircle className='w-12 h-12 text-green-500 mx-auto mb-2' />
                <p className='text-slate-600'>All systems operating normally</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {alerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`p-4 rounded-xl border-2 ${
                      alert.type === 'error'
                        ? 'bg-red-50 border-red-200'
                        : alert.type === 'warning'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      {getAlertIcon(alert.type)}
                      <div className='flex-1'>
                        <p className='font-semibold text-slate-900 text-sm'>
                          {alert.message}
                        </p>
                        <button
                          onClick={() => (window.location.href = alert.link)}
                          className='text-xs text-blue-600 hover:text-blue-700 font-semibold mt-1'
                        >
                          {alert.action} →
                        </button>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          alert.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : alert.priority === 'urgent'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {alert.priority.toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
          >
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Quick Stats
            </h2>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600'>Total Packages</span>
                <span className='text-lg font-bold text-slate-900'>
                  {stats?.packages.total || 0}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600'>
                  Pending Consolidations
                </span>
                <span className='text-lg font-bold text-slate-900'>
                  {stats?.consolidations.pending || 0}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600'>Today's Revenue</span>
                <span className='text-lg font-bold text-green-600'>
                  {stats?.revenue.today || 0} MAD
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
        >
          <h2 className='text-xl font-bold text-slate-900 mb-4'>
            Recent Activity
          </h2>

          {activities.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-slate-600'>No recent activities</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {activities.slice(0, 10).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className='flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors'
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-slate-900'>
                      {formatActivityMessage(activity)}
                    </p>
                    <p className='text-xs text-slate-500'>
                      {new Date(activity.timestamp).toLocaleString()} •{' '}
                      {activity.data.userName || 'System'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
