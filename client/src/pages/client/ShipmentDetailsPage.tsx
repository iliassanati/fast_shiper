// src/pages/client/ShipmentDetailsPage.tsx
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
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useShipmentStore } from '@/stores';

export default function ShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getShipmentById } = useShipmentStore();
  const [shipment, setShipment] = useState(getShipmentById(id || ''));

  useEffect(() => {
    if (id) {
      const shipmentData = getShipmentById(id);
      setShipment(shipmentData);
    }
  }, [id, getShipmentById]);

  if (!shipment) {
    return (
      <DashboardLayout>
        <div className='text-center py-20'>
          <Truck className='w-16 h-16 text-slate-400 mx-auto mb-4' />
          <h2 className='text-2xl font-bold text-slate-900 mb-2'>
            Shipment Not Found
          </h2>
          <p className='text-slate-600 mb-6'>
            The shipment you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/shipments')}
            className='px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700'
          >
            Back to Shipments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Mock tracking timeline based on status
  const getTrackingTimeline = () => {
    const timeline = [
      {
        status: 'completed',
        title: 'Package Prepared',
        description: 'Your shipment has been prepared at our warehouse',
        date: shipment.shippedDate,
        time: '09:00 AM',
      },
      {
        status: 'completed',
        title: 'Picked Up by Carrier',
        description: `${shipment.carrier} has picked up your package`,
        date: shipment.shippedDate,
        time: '02:30 PM',
      },
    ];

    if (shipment.status === 'in_transit') {
      timeline.push({
        status: 'current',
        title: 'In Transit',
        description: 'Your package is on its way to Morocco',
        date: new Date().toISOString().split('T')[0],
        time: 'Ongoing',
      });
      timeline.push({
        status: 'pending',
        title: 'Out for Delivery',
        description: 'Package will be delivered soon',
        date: shipment.estimatedDelivery || '',
        time: 'Pending',
      });
      timeline.push({
        status: 'pending',
        title: 'Delivered',
        description: 'Package delivered to your address',
        date: shipment.estimatedDelivery || '',
        time: 'Pending',
      });
    } else if (shipment.status === 'delivered') {
      timeline.push(
        {
          status: 'completed',
          title: 'In Transit',
          description: 'Package was in transit to Morocco',
          date: shipment.shippedDate,
          time: '03:00 PM',
        },
        {
          status: 'completed',
          title: 'Out for Delivery',
          description: 'Package was out for delivery',
          date: shipment.deliveredDate || '',
          time: '08:00 AM',
        },
        {
          status: 'completed',
          title: 'Delivered',
          description: 'Package successfully delivered',
          date: shipment.deliveredDate || '',
          time: '11:30 AM',
        }
      );
    }

    return timeline;
  };

  const trackingTimeline = getTrackingTimeline();

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/shipments')}
              className='p-2 hover:bg-slate-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-slate-900'>
                Shipment Details
              </h1>
              <p className='text-slate-600'>ID: {shipment.id}</p>
            </div>
          </div>
          <div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                shipment.status === 'in_transit'
                  ? 'bg-blue-100 text-blue-700'
                  : shipment.status === 'delivered'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {shipment.status === 'in_transit'
                ? 'In Transit'
                : shipment.status === 'delivered'
                ? 'Delivered'
                : 'Pending'}
            </span>
          </div>
        </div>

        <div className='grid lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Tracking Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-6'>
                Tracking Timeline
              </h3>

              <div className='relative'>
                {trackingTimeline.map((item, index) => (
                  <div key={index} className='flex gap-4 pb-8 last:pb-0'>
                    {/* Timeline Line */}
                    <div className='flex flex-col items-center'>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'completed'
                            ? 'bg-green-500'
                            : item.status === 'current'
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                        }`}
                      >
                        {item.status === 'completed' ? (
                          <Check className='w-5 h-5 text-white' />
                        ) : (
                          <div className='w-3 h-3 bg-white rounded-full' />
                        )}
                      </div>
                      {index < trackingTimeline.length - 1 && (
                        <div
                          className={`w-0.5 h-full my-2 ${
                            item.status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-slate-300'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className='flex-1 pb-4'>
                      <h4 className='font-bold text-slate-900 mb-1'>
                        {item.title}
                      </h4>
                      <p className='text-sm text-slate-600 mb-2'>
                        {item.description}
                      </p>
                      <p className='text-xs text-slate-500'>
                        {item.date} • {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-4'>
                Shipment Information
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <Truck className='w-4 h-4' />
                    <span className='text-sm'>Carrier</span>
                  </div>
                  <p className='font-bold text-slate-900'>{shipment.carrier}</p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <PackageIcon className='w-4 h-4' />
                    <span className='text-sm'>Packages</span>
                  </div>
                  <p className='font-bold text-slate-900'>
                    {shipment.packages} package(s)
                  </p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <Calendar className='w-4 h-4' />
                    <span className='text-sm'>Shipped Date</span>
                  </div>
                  <p className='font-bold text-slate-900'>
                    {shipment.shippedDate}
                  </p>
                </div>

                <div className='p-4 bg-slate-50 rounded-xl'>
                  <div className='flex items-center gap-2 text-slate-600 mb-2'>
                    <Calendar className='w-4 h-4' />
                    <span className='text-sm'>
                      {shipment.status === 'delivered'
                        ? 'Delivered Date'
                        : 'Est. Delivery'}
                    </span>
                  </div>
                  <p className='font-bold text-slate-900'>
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
              <h3 className='font-bold text-slate-900 mb-4'>Tracking Number</h3>
              <div className='p-4 bg-blue-50 rounded-xl'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-blue-700 mb-1'>
                      {shipment.carrier} Tracking
                    </p>
                    <p className='font-mono font-bold text-blue-900 text-lg'>
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <button className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700'>
                    Copy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-blue-600' />
                Delivery Address
              </h3>
              <div className='text-sm text-slate-700 space-y-1'>
                <p className='font-semibold'>{shipment.destination}</p>
                <p className='text-slate-600'>Morocco</p>
              </div>
            </motion.div>

            {/* Cost */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200'
            >
              <h3 className='font-bold text-slate-900 mb-2'>Total Cost</h3>
              <p className='text-3xl font-bold text-green-600'>
                {shipment.cost}
              </p>
              <p className='text-sm text-slate-600 mt-1'>Paid</p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
            >
              <h3 className='font-bold text-slate-900 mb-4'>Actions</h3>
              <div className='space-y-3'>
                <button className='w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'>
                  <Download className='w-5 h-5' />
                  Download Invoice
                </button>
                <button className='w-full px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors'>
                  Contact Support
                </button>
              </div>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className='bg-blue-50 rounded-2xl p-6 border border-blue-200'
            >
              <div className='flex items-start gap-3'>
                <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                <div>
                  <h4 className='font-bold text-blue-900 mb-2'>
                    Track with Carrier
                  </h4>
                  <p className='text-sm text-blue-800 mb-3'>
                    For the most up-to-date tracking information, visit{' '}
                    {shipment.carrier}'s website.
                  </p>
                  <button className='text-sm font-semibold text-blue-600 hover:text-blue-700'>
                    Visit {shipment.carrier} →
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
