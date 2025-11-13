// client/src/types/client.types.ts
export type PackageStatus =
  | 'received'
  | 'consolidated'
  | 'shipped'
  | 'in_transit'
  | 'delivered';
export type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Package {
  id: string;
  description: string;
  retailer: string;
  trackingNumber: string;
  weight: string;
  dimensions: string;
  photo: string;
  receivedDate: string;
  storageDay: number;
  status: PackageStatus;
  estimatedValue: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: ShipmentStatus;
  shippedDate: string | null;
  estimatedDelivery: string;
  deliveredDate: string | null;
  destination: string;
  packages: number;
  cost: string;
}

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  suiteNumber: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface USAddress {
  name: string;
  suite: string;
  street: string;
  city: string;
  country: string;
  phone: string;
}

export interface DashboardStats {
  totalPackages: number;
  inStorage: number;
  shipped: number;
  storageDaysLeft: number;
}
