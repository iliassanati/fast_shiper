import { useNavigate } from 'react-router-dom';
import ConsolidationWorkflow from '@/sections/workflows/ConsolidationWorkflow';
import {
  usePackageStore,
  useDashboardStore,
  useNotificationStore,
} from '@/stores';

export default function ConsolidationPage() {
  const navigate = useNavigate();
  const { updatePackage } = usePackageStore();
  const { refreshStats } = useDashboardStore();
  const { addNotification } = useNotificationStore();

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSubmit = async (selectedPackageIds: string[]) => {
    try {
      // Update all selected packages to 'consolidated' status
      selectedPackageIds.forEach((id) => {
        updatePackage(id, { status: 'consolidated' });
      });

      // Refresh dashboard stats
      await refreshStats();

      // Add success notification
      addNotification(
        `Successfully consolidated ${selectedPackageIds.length} packages!`,
        'success'
      );

      // Navigate back
      navigate('/dashboard');
    } catch (error) {
      addNotification('Failed to consolidate packages', 'error');
    }
  };

  return (
    <ConsolidationWorkflow onClose={handleClose} onSubmit={handleSubmit} />
  );
}
