// client/src/pages/client/ConsolidationPage.tsx - FIXED VERSION
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsolidationWorkflow from '@/sections/workflows/ConsolidationWorkflow';
import {
  usePackageStore,
  useDashboardStore,
  useNotificationStore,
} from '@/stores';
import { apiHelpers } from '@/lib/api';

export default function ConsolidationPage() {
  const navigate = useNavigate();
  const { updatePackage, fetchPackages } = usePackageStore();
  const { refreshStats } = useDashboardStore();
  const { addNotification } = useNotificationStore();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async (
    selectedPackageIds: string[],
    preferences: any,
    specialInstructions: string
  ) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      console.log('📦 Creating consolidation request...', {
        packageIds: selectedPackageIds,
        preferences,
        specialInstructions,
      });

      // Call backend API to create consolidation
      const response = await apiHelpers.post('/consolidations', {
        packageIds: selectedPackageIds,
        preferences,
        specialInstructions: specialInstructions || '',
      });

      console.log('✅ Consolidation created successfully:', response);

      // Update local package statuses
      for (const id of selectedPackageIds) {
        updatePackage(id, { status: 'consolidated' });
      }

      // Refresh data
      await Promise.all([refreshStats(), fetchPackages({ limit: 100 })]);

      // Show success notification
      addNotification({
        id: Date.now().toString(),
        type: 'consolidation_complete',
        title: 'Consolidation Request Submitted',
        message: `Successfully consolidated ${selectedPackageIds.length} packages! We'll start processing them within 2-4 business days.`,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/dashboard',
      });

      console.log('✅ Consolidation flow completed');

      // Don't navigate - let the workflow show confirmation step
    } catch (error: any) {
      console.error('❌ Error creating consolidation:', error);

      const errorMessage =
        error?.message ||
        error?.response?.data?.error ||
        'Failed to consolidate packages. Please try again.';

      addNotification({
        id: Date.now().toString(),
        type: 'consolidation_complete',
        title: 'Consolidation Failed',
        message: errorMessage,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/dashboard',
      });

      // Show error alert as well
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConsolidationWorkflow
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}
