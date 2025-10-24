// src/sections/dashboard/ShipmentsSection.tsx
import { motion } from 'framer-motion';
import { Check, MapPin, Truck } from 'lucide-react';
import { useShipmentStore } from '@/stores';

export default function ShipmentsSection() {
  const { shipments, getActiveShipments, getDeliveredShipments } =
    useShipmentStore();

  const activeShipments = getActiveShipments();
  const deliveredShipments = getDeliveredShipments();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-3xl font-bold text-slate-900'>My Shipments</h2>
        <p className='text-slate-600'>Track your international shipments</p>
      </div>

      {/* Active Shipments */}
      {activeShipments.length > 0 && (
        <div>
          <h3 className='text-xl font-bold text-slate-900 mb-4'>
            Active Shipments
          </h3>
          <div className='space-y-4'>
            {activeShipments.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <div className='flex items-center gap-3 mb-2'>
                      <Truck className='w-6 h-6 text-blue-600' />
                      <h4 className='font-bold text-slate-900 text-lg'>
                        {shipment.carrier}
                      </h4>
                    </div>
                    <p className='text-sm text-slate-600 font-mono'>
                      {shipment.trackingNumber}
                    </p>
                  </div>
                  <span className='px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold'>
                    In Transit
                  </span>
                </div>

                <div className='grid md:grid-cols-3 gap-4 mb-4'>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Shipped</p>
                    <p className='font-semibold text-slate-900'>
                      {shipment.shippedDate}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Est. Delivery</p>
                    <p className='font-semibold text-slate-900'>
                      {shipment.estimatedDelivery}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 mb-1'>Cost</p>
                    <p className='font-semibold text-slate-900'>
                      {shipment.cost}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-2 text-sm text-slate-600 mb-4'>
                  <MapPin className='w-4 h-4' />
                  <span>{shipment.destination}</span>
                </div>

                <motion.button
                  className='w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Track Shipment
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Past Shipments */}
      {deliveredShipments.length > 0 && (
        <div>
          <h3 className='text-xl font-bold text-slate-900 mb-4'>
            Past Shipments
          </h3>
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100'>
            {deliveredShipments.map((shipment) => (
              <div
                key={shipment.id}
                className='flex items-center justify-between py-4 border-b border-slate-100 last:border-0'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
                    <Check className='w-6 h-6 text-green-600' />
                  </div>
                  <div>
                    <p className='font-bold text-slate-900'>
                      {shipment.carrier}
                    </p>
                    <p className='text-sm text-slate-600'>
                      {shipment.trackingNumber}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-slate-900'>
                    Delivered
                  </p>
                  <p className='text-xs text-slate-500'>
                    {shipment.deliveredDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shipments.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-slate-600'>No shipments yet</p>
        </div>
      )}
    </div>
  );
}
