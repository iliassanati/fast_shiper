import type { UserInfo, USAddress, DashboardStats } from '@/types/client.types';

export const mockUserInfo: UserInfo = {
  id: 'USER001',
  name: 'Youssef El Amrani',
  email: 'youssef@example.com',
  suiteNumber: 'MA-1234',
  avatar: '👨',
  phone: '+212 6XX-XXXXXX',
  address: {
    street: '123 Rue Mohammed V, Apt 4B',
    city: 'Casablanca',
    postalCode: '20000',
    country: 'Morocco',
  },
};

export const mockUSAddress: USAddress = {
  name: mockUserInfo.name,
  suite: `Suite ${mockUserInfo.suiteNumber}`,
  street: '123 Warehouse Drive',
  city: 'Wilmington, DE 19801',
  country: 'United States',
  phone: '+1 (555) 123-4567',
};

export const mockDashboardStats: DashboardStats = {
  totalPackages: 4,
  inStorage: 3,
  shipped: 2,
  storageDaysLeft: 42,
};
