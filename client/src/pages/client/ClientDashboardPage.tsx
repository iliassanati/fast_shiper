// client/src/pages/client/ClientDashboardPage.tsx - FIXED VERSION
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
  const { fetchPackages, loading: packagesLoading } = usePackageStore();
  const { fetchShipments, loading: shipmentsLoading } = useShipmentStore();
  const { fetchNotifications } = useNotificationStore();

  // Fetch data on mount - ALWAYS fetch to ensure fresh data
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchData = async () => {
        try {
          console.log('🔄 Fetching dashboard data for user:', user.email);

          // ALWAYS fetch packages and shipments (remove initialized check)
          await Promise.all([
            fetchStats(),
            fetchPackages({ limit: 100 }),
            fetchShipments({ limit: 100 }),
            fetchNotifications({ limit: 10 }),
          ]);

          console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
          console.error('❌ Error fetching dashboard data:', error);
        }
      };

      fetchData();
    }
  }, [
    isAuthenticated,
    user,
    fetchStats,
    fetchPackages,
    fetchShipments,
    fetchNotifications,
  ]);

  // Show loading screen while data is being fetched
  const isLoading = statsLoading || packagesLoading || shipmentsLoading;

  if (isLoading) {
    return <LoadingScreen loadingText='Loading your dashboard...' />;
  }

  return (
    <DashboardLayout activeSection='overview'>
      <OverviewSection />
    </DashboardLayout>
  );
}
