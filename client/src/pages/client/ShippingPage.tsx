import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ShippingWorkflow from '@/sections/workflows/ShippingWorkflow';
import {
  usePackageStore,
  useShipmentStore,
  useDashboardStore,
  useNotificationStore,
} from '@/stores';
import { apiHelpers } from '@/lib/api';

export default function ShippingPage() {
  const navigate = useNavigate();
  const { updatePackage, fetchPackages } = usePackageStore();
  const { addShipment, fetchShipments } = useShipmentStore();
  const { refreshStats } = useDashboardStore();
  const { addNotification } = useNotificationStore();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async (shipmentData: any) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      // Call backend API to create shipment
      const response = await apiHelpers.post('/shipments', shipmentData);

      // Update local package statuses
      shipmentData.packageIds.forEach((id: string) => {
        updatePackage(id, { status: 'shipped' });
      });

      // Add shipment to store
      addShipment(response.shipment);

      // Refresh data
      await Promise.all([refreshStats(), fetchPackages(), fetchShipments()]);

      // Show success notification
      addNotification(
        `Shipment created successfully! Tracking: ${response.shipment.trackingNumber}`,
        'success'
      );

      // Navigate to shipment details
      navigate(`/shipments/${response.shipment.id}`);
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      addNotification(
        error.response?.data?.error || 'Failed to create shipment',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <AnimatePresence>
        <ShippingWorkflow
          onClose={handleClose}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </AnimatePresence>
    </div>
  );
}
