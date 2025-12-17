// client/src/pages/client/ClientDashboardPage.tsx - COMPREHENSIVE FIX
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
  const { updateStatsFromPackages, loading: statsLoading } =
    useDashboardStore();
  const {
    packages,
    fetchPackages,
    loading: packagesLoading,
    initialized: packagesInitialized,
  } = usePackageStore();
  const { fetchShipments, loading: shipmentsLoading } = useShipmentStore();
  const { fetchNotifications } = useNotificationStore();

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchData = async () => {
        try {
          console.log('🔄 Fetching dashboard data for user:', user.email);

          // Fetch all data in parallel
          await Promise.all([
            fetchPackages({ limit: 100, forceRefresh: true }),
            fetchShipments({ limit: 100 }),
            fetchNotifications({ limit: 10 }),
          ]);

          // Stats will be updated from packages in the effect below
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
    fetchPackages,
    fetchShipments,
    fetchNotifications,
  ]);

  // Update stats whenever packages change
  useEffect(() => {
    if (packages.length > 0 || packagesInitialized) {
      console.log('📊 Updating stats from packages:', packages.length);
      updateStatsFromPackages(packages);
    }
  }, [packages, packagesInitialized, updateStatsFromPackages]);

  // Show loading screen while data is being fetched
  const isLoading =
    (statsLoading || packagesLoading || shipmentsLoading) &&
    !packagesInitialized;

  if (isLoading) {
    return <LoadingScreen loadingText='Loading your dashboard...' />;
  }

  return (
    <DashboardLayout activeSection='overview'>
      <OverviewSection />
    </DashboardLayout>
  );
}
