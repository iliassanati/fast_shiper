// client/src/pages/client/ShippingPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
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
  const { showToast } = useNotificationStore();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    navigate('/packages');
  };

  const handleSubmit = async (shipmentData: any) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      console.log('🚚 Creating shipment with data:', shipmentData);

      // Call backend API to create shipment
      const response = await apiHelpers.post<{ shipment: any }>(
        '/shipments',
        shipmentData
      );

      console.log('✅ Shipment created:', response.shipment);

      // Update local package statuses
      shipmentData.packageIds.forEach((id: string) => {
        updatePackage(id, { status: 'shipped' });
      });

      // Add shipment to store
      addShipment(response.shipment);

      // Refresh data
      await Promise.all([
        refreshStats(),
        fetchPackages({ limit: 100 }),
        fetchShipments({ limit: 100 }),
      ]);

      // Show success notification
      showToast(
        `Shipment created successfully! Tracking: ${response.shipment.trackingNumber}`,
        'success'
      );

      // Navigate to shipment details
      navigate(`/shipments/${response.shipment._id || response.shipment.id}`);
    } catch (error: any) {
      console.error('❌ Error creating shipment:', error);
      showToast(
        error.response?.data?.error ||
          error.message ||
          'Failed to create shipment',
        'error'
      );
      throw error; // Re-throw to let workflow handle it
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout activeSection='packages'>
      <ShippingWorkflow
        onClose={handleClose}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </DashboardLayout>
  );
}
