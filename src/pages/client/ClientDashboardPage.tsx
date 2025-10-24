import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import OverviewSection from '@/sections/dashboard/OverviewSection';
import PackagesSection from '@/sections/dashboard/PackagesSection';
import ShipmentsSection from '@/sections/dashboard/ShipmentsSection';
import {
  useAuthStore,
  useDashboardStore,
  usePackageStore,
  useShipmentStore,
} from '@/stores';

type Section = 'overview' | 'packages' | 'shipments' | 'profile' | 'settings';

export default function ClientDashboardPage() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const { user } = useAuthStore();
  const { fetchStats } = useDashboardStore();
  const { fetchPackages } = usePackageStore();
  const { fetchShipments } = useShipmentStore();

  // Fetch data on mount
  useEffect(() => {
    fetchStats();
    fetchPackages();
    fetchShipments();
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'packages':
        return <PackagesSection />;
      case 'shipments':
        return <ShipmentsSection />;
      case 'profile':
        return (
          <div className='text-center py-20'>
            <h2 className='text-2xl font-bold text-slate-900 mb-2'>
              Profile Section
            </h2>
            <p className='text-slate-600'>Coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className='text-center py-20'>
            <h2 className='text-2xl font-bold text-slate-900 mb-2'>
              Settings Section
            </h2>
            <p className='text-slate-600'>Coming soon...</p>
          </div>
        );
      default:
        return <OverviewSection />;
    }
  };

  return (
    <DashboardLayout activeSection={activeSection}>
      {renderSection()}
    </DashboardLayout>
  );
}
