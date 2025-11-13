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
/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Submits the consolidation form and updates the selected packages to 'consolidated' status
   * Refreshes the dashboard stats and adds a success notification
   * Navigates back to the dashboard page
   *
   * @param {string[]} selectedPackageIds The IDs of the packages to consolidate
   */
/*******  bb2f7708-1f29-450e-8ae0-2eb19e451879  *******/    navigate('/dashboard');
  };

  const handleSubmit = async (
    selectedPackageIds: string[],
    preferences: any,
    specialInstructions: string
  ) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      // Call backend API to create consolidation
      const response = await apiHelpers.post('/consolidations', {
        packageIds: selectedPackageIds,
        preferences,
        specialInstructions,
      });

      // Update local package statuses
      selectedPackageIds.forEach((id) => {
        updatePackage(id, { status: 'consolidated' });
      });

      // Refresh data
      await Promise.all([refreshStats(), fetchPackages()]);

      // Show success notification
      addNotification(
        `Successfully consolidated ${selectedPackageIds.length} packages!`,
        'success'
      );

      // Navigate back
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating consolidation:', error);
      addNotification(
        error.response?.data?.error || 'Failed to consolidate packages',
        'error'
      );
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
