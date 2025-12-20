// client/src/pages/client/ShipmentDetailsPage_OPTIMIZED.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Check,
  Download,
  Info,
  MapPin,
  Package as PackageIcon,
  Truck,
  DollarSign,
  Scale,
  Ruler,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  User,
  Home,
  Sparkles,
  TrendingUp,
  Box,
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useShipmentStore, useNotificationStore } from '@/stores';

export default function ShipmentDetailsPageOptimized() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getShipmentById } = useShipmentStore();
  const { showToast } = useNotificationStore();
  const [shipment, setShipment] = useState(getShipmentById(id || ''));
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Fetch shipment
  useEffect(() => {
    if (id) {
      const loadShipment = async () => {
        try {
          console.log('📦 Loading shipment details:', id);
          const shipmentData = await getShipmentById(id);
          setShipment(shipmentData);
          console.log('✅ Shipment loaded:', shipmentData);
        } catch (error) {
          console.error('❌ Failed to load shipment:', error);
          setShipment(null);
        }
      };
      loadShipment();
    }
  }, [id, getShipmentById]);

  // Copy tracking number
  const copyTrackingNumber = () => {
    if (shipment?.trackingNumber) {
      navigator.clipboard.writeText(shipment.trackingNumber);
      setCopiedTracking(true);
      showToast('Tracking number copied!', 'success');
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  // Track externally
  const handleTrackExternal = () => {
    if (!shipment) return;
    const trackingUrls: Record<string, string> = {
      DHL: `https://www.dhl.com/tracking?tracking-id=${shipment.trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${shipment.trackingNumber}`,
      UPS: `https://www.ups.com/track?tracknum=${shipment.trackingNumber}`,
      Aramex: `https://www.aramex.com/track/results?q=${shipment.trackingNumber}`,
    };
    const url =
      trackingUrls[shipment.carrier] ||
      `https://www.google.com/search?q=${shipment.trackingNumber}`;
    window.open(url, '_blank');
  };

  // Not found state
  if (!shipment) {
    return (
      <DashboardLayout activeSection='shipments'>
        <div className='text-center py-20'>
          <div className='w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg'>
            <AlertCircle className='w-12 h-12 text-red-500' />
          </div>
          <h3 className='text-2xl font-bold text-slate-900 mb-2'>
            Shipment Not Found
          </h3>
          <p className='text-slate-600 mb-8'>
            The shipment you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => navigate('/shipments')}
            className='px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-bold hover:shadow-lg transition-all'
          >
            Back to Shipments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Status config
  const getStatusConfig = (status: string) => {
    const configs = {
      in_transit: {
        gradient: 'from-orange-600 to-red-600',
        bg: 'from-orange-50 to-red-50',
        text: 'text-orange-800',
        border: 'border-orange-300',
        label: 'In Transit',
        icon: Truck,
      },
      delivered: {
        gradient: 'from-green-600 to-emerald-600',
        bg: 'from-green-50 to-emerald-50',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Delivered',
        icon: CheckCircle,
      },
      pending: {
        gradient: 'from-yellow-600 to-orange-600',
        bg: 'from-yellow-50 to-orange-50',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Pending',
        icon: Clock,
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = getStatusConfig(shipment.status);
  const StatusIcon = statusConfig.icon;

  // Mock tracking timeline
  const getTrackingTimeline = () => {
    const timeline = [
      {
        status: 'completed',
        title: 'Package Prepared',
        description: 'Your shipment has been prepared at our warehouse',
        date: shipment.shippedDate,
        time: '09:00 AM',
        icon: PackageIcon,
      },
      {
        status: 'completed',
        title: 'Picked Up by Carrier',
        description: `${shipment.carrier} has picked up your package`,
        date: shipment.shippedDate,
        time: '02:30 PM',
        icon: Truck,
      },
    ];

    if (shipment.status === 'in_transit') {
      timeline.push({
        status: 'current',
        title: 'In Transit',
        description: 'Your package is on its way to Morocco',
        date: new Date().toISOString().split('T')[0],
        time: 'Ongoing',
        icon: Truck,
      });
      timeline.push({
        status: 'pending',
        title: 'Out for Delivery',
        description: 'Package will be delivered soon',
        date: shipment.estimatedDelivery || '',
        time: 'Pending',
        icon: Truck,
      });
      timeline.push({
        status: 'pending',
        title: 'Delivered',
        description: 'Package delivered to your address',
        date: shipment.estimatedDelivery || '',
        time: 'Pending',
        icon: CheckCircle,
      });
    } else if (shipment.status === 'delivered') {
      timeline.push(
        {
          status: 'completed',
          title: 'In Transit',
          description: 'Package was in transit to Morocco',
          date: shipment.shippedDate,
          time: '03:00 PM',
          icon: Truck,
        },
        {
          status: 'completed',
          title: 'Out for Delivery',
          description: 'Package was out for delivery',
          date: shipment.deliveredDate || '',
          time: '08:00 AM',
          icon: Truck,
        },
        {
          status: 'completed',
          title: 'Delivered',
          description: 'Package successfully delivered',
          date: shipment.deliveredDate || '',
          time: '11:30 AM',
          icon: CheckCircle,
        }
      );
    }

    return timeline;
  };

  const trackingTimeline = getTrackingTimeline();

  return (
    <DashboardLayout activeSection='shipments'>
      <div className='space-y-6'>
        {/* ========== ENHANCED HEADER ========== */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <motion.button
              onClick={() => navigate('/shipments')}
              className='p-3 hover:bg-slate-100 rounded-xl transition-colors group'
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className='w-6 h-6 text-slate-600 group-hover:text-slate-900' />
            </motion.button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight text-left'>
                Shipment Details
              </h1>
              <div className='flex items-center gap-3 mt-2'>
                <span className='flex items-center gap-2 text-slate-600'>
                  <Truck className='w-4 h-4' />
                  <span className='font-medium'>{shipment.carrier}</span>
                </span>
                <span className='text-slate-600'>•</span>
                <span className='flex items-center gap-2 text-slate-600'>
                  <Box className='w-4 h-4' />
                  <span>{shipment.packages} package(s)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-6 py-3 rounded-2xl ${statusConfig.bg} border-2 border-opacity-50 shadow-md bg-gradient-to-br`}
          >
            <div className='flex items-center gap-3'>
              <div className={`${statusConfig.text}`}>
                <StatusIcon className='w-5 h-5' />
              </div>
              <div className='text-left'>
                <p className={`font-bold ${statusConfig.text} text-lg`}>
                  {statusConfig.label}
                </p>
                <p className='text-sm text-slate-600'>
                  {shipment.status === 'delivered'
                    ? shipment.deliveredDate
                    : `Est: ${shipment.estimatedDelivery}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* ========== MAIN CONTENT ========== */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Tracking Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100'
            >
              <div className='p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white'>
                <h2 className='font-bold text-slate-900 text-xl flex items-center gap-3'>
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${statusConfig.gradient} rounded-xl flex items-center justify-center shadow-md`}
                  >
                    <TrendingUp className='w-5 h-5 text-white' />
                  </div>
                  Tracking Timeline
                </h2>
              </div>

              <div className='p-6'>
                <div className='relative'>
                  {trackingTimeline.map((item, index) => {
                    const TimelineIcon = item.icon;
                    return (
                      <div key={index} className='flex gap-4 pb-8 last:pb-0'>
                        {/* Timeline Line */}
                        <div className='flex flex-col items-center'>
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                              item.status === 'completed'
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                : item.status === 'current'
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse'
                                : 'bg-gradient-to-br from-slate-200 to-slate-300'
                            }`}
                          >
                            {item.status === 'completed' ? (
                              <Check className='w-6 h-6 text-white' />
                            ) : (
                              <TimelineIcon
                                className={`w-6 h-6 ${
                                  item.status === 'current'
                                    ? 'text-white'
                                    : 'text-slate-400'
                                }`}
                              />
                            )}
                          </div>
                          {index < trackingTimeline.length - 1 && (
                            <div
                              className={`w-1 h-full my-2 rounded-full ${
                                item.status === 'completed'
                                  ? 'bg-gradient-to-b from-green-500 to-emerald-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className='flex-1 pb-4'>
                          <h4 className='text-xl font-bold text-slate-900 mb-1'>
                            {item.title}
                          </h4>
                          <p className='text-sm text-slate-600 mb-2 leading-relaxed'>
                            {item.description}
                          </p>
                          <div className='flex items-center gap-2 text-xs text-slate-500'>
                            <Calendar className='w-3 h-3' />
                            <span>
                              {item.date} • {item.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Shipment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h2 className='text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md'>
                  <Info className='w-5 h-5 text-white' />
                </div>
                Shipment Information
              </h2>
              <div className='grid md:grid-cols-2 gap-4'>
                <div className='p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
                  <div className='flex items-center gap-2 text-blue-700 mb-2'>
                    <Truck className='w-5 h-5' />
                    <span className='text-sm font-bold'>Carrier</span>
                  </div>
                  <p className='text-xl font-black text-blue-900'>
                    {shipment.carrier}
                  </p>
                </div>

                <div className='p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200'>
                  <div className='flex items-center gap-2 text-purple-700 mb-2'>
                    <PackageIcon className='w-5 h-5' />
                    <span className='text-sm font-bold'>Packages</span>
                  </div>
                  <p className='text-xl font-black text-purple-900'>
                    {shipment.packages} package(s)
                  </p>
                </div>

                <div className='p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200'>
                  <div className='flex items-center gap-2 text-orange-700 mb-2'>
                    <Calendar className='w-5 h-5' />
                    <span className='text-sm font-bold'>Shipped Date</span>
                  </div>
                  <p className='text-xl font-black text-orange-900'>
                    {shipment.shippedDate}
                  </p>
                </div>

                <div className='p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200'>
                  <div className='flex items-center gap-2 text-green-700 mb-2'>
                    <Calendar className='w-5 h-5' />
                    <span className='text-sm font-bold'>
                      {shipment.status === 'delivered'
                        ? 'Delivered'
                        : 'Est. Delivery'}
                    </span>
                  </div>
                  <p className='text-xl font-black text-green-900'>
                    {shipment.deliveredDate || shipment.estimatedDelivery}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tracking Number */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='text-2xl font-bold text-slate-900 mb-4'>
                Tracking Number
              </h3>
              <div className='p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200'>
                <div className='flex items-center justify-between flex-wrap gap-4'>
                  <div>
                    <p className='text-sm text-blue-700 mb-1 font-bold'>
                      {shipment.carrier} Tracking
                    </p>
                    <p className='font-mono text-2xl font-black text-blue-900'>
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <motion.button
                      onClick={copyTrackingNumber}
                      className='px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copiedTracking ? (
                        <>
                          <Check className='w-5 h-5' />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className='w-5 h-5' />
                          Copy
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleTrackExternal}
                      className='px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ExternalLink className='w-5 h-5' />
                      Track on {shipment.carrier}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ========== SIDEBAR ========== */}
          <div className='space-y-6'>
            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md'>
                  <MapPin className='w-5 h-5 text-white' />
                </div>
                Delivery Address
              </h3>
              <div className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200'>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-start gap-2'>
                    <Home className='w-4 h-4 text-green-700 mt-0.5 flex-shrink-0' />
                    <p className='font-bold text-green-900'>
                      {shipment.destination}
                    </p>
                  </div>
                  <div className='flex items-start gap-2'>
                    <MapPin className='w-4 h-4 text-green-700 mt-0.5 flex-shrink-0' />
                    <p className='text-green-800'>Morocco</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cost Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg'
            >
              <h3 className='text-xl font-bold text-green-900 mb-2 flex items-center gap-2'>
                <DollarSign className='w-5 h-5' />
                Total Cost
              </h3>
              <p className='text-4xl font-black text-green-600 mb-2'>
                {shipment.cost}
              </p>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-600 rounded-full animate-pulse' />
                <p className='text-sm font-bold text-green-800'>Paid</p>
              </div>
            </motion.div>

            {/* Package Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md'>
                  <Sparkles className='w-5 h-5 text-white' />
                </div>
                Package Details
              </h3>
              <div className='space-y-3'>
                <div className='p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200'>
                  <div className='flex items-center gap-2 text-slate-600 mb-1'>
                    <Scale className='w-4 h-4' />
                    <span className='text-xs font-bold'>Weight</span>
                  </div>
                  <p className='text-lg font-black text-slate-900'>
                    {shipment.weight}
                  </p>
                </div>

                <div className='p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200'>
                  <div className='flex items-center gap-2 text-slate-600 mb-1'>
                    <Ruler className='w-4 h-4' />
                    <span className='text-xs font-bold'>Dimensions</span>
                  </div>
                  <p className='text-lg font-black text-slate-900'>
                    {shipment.dimensions}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='text-xl font-bold text-slate-900 mb-4'>Actions</h3>
              <div className='space-y-3'>
                <motion.button
                  onClick={() =>
                    showToast('Invoice download coming soon', 'info')
                  }
                  className='w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className='w-5 h-5' />
                  Download Invoice
                </motion.button>

                <motion.button
                  onClick={() => navigate('/support')}
                  className='w-full px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact Support
                </motion.button>
              </div>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200'
            >
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md'>
                  <Info className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h4 className='font-bold text-blue-900 mb-2 text-lg'>
                    Track with Carrier
                  </h4>
                  <p className='text-sm text-blue-800 mb-3 leading-relaxed'>
                    For the most up-to-date tracking information, visit{' '}
                    {shipment.carrier}'s website directly.
                  </p>
                  <button
                    onClick={handleTrackExternal}
                    className='text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors'
                  >
                    Visit {shipment.carrier}
                    <ExternalLink className='w-4 h-4' />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
