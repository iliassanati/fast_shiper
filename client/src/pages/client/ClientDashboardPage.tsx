import { useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import OverviewSection from '@/sections/dashboard/OverviewSection';
import {
  useAuthStore,
  useDashboardStore,
  usePackageStore,
  useShipmentStore,
  useNotificationStore,
} from '@/stores';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function ClientDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { fetchStats, loading: statsLoading } = useDashboardStore();
  const {
    fetchPackages,
    loading: packagesLoading,
    initialized: packagesInitialized,
  } = usePackageStore();
  const {
    fetchShipments,
    loading: shipmentsLoading,
    initialized: shipmentsInitialized,
  } = useShipmentStore();
  const { fetchNotifications } = useNotificationStore();

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch all data in parallel
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchStats(),
            !packagesInitialized && fetchPackages({ limit: 100 }),
            !shipmentsInitialized && fetchShipments({ limit: 100 }),
            fetchNotifications({ limit: 10 }),
          ]);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      };

      fetchData();
    }
  }, [isAuthenticated, user]);

  // Show loading screen while data is being fetched
  const isLoading =
    statsLoading ||
    (packagesLoading && !packagesInitialized) ||
    (shipmentsLoading && !shipmentsInitialized);

  if (isLoading) {
    return <LoadingScreen loadingText='Loading your dashboard...' />;
  }

  return (
    <DashboardLayout activeSection='overview'>
      <OverviewSection />
    </DashboardLayout>
  );
}
