// client/src/types/client.types.ts - Type definitions

export type PackageStatus =
  | 'received'
  | 'consolidated'
  | 'shipped'
  | 'in_transit'
  | 'delivered';

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
  // Consolidation fields
  isConsolidatedResult?: boolean;
  originalPackageIds?: string[];
  consolidationId?: string | null;
  notes?: string;
}

export interface DashboardStats {
  totalPackages: number;
  inStorage: number;
  shipped: number;
  storageDaysLeft: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  shippedDate: string;
  estimatedDelivery: string;
  deliveredDate?: string;
  destination: string;
  cost: string;
  weight: string;
  dimensions: string;
  packageIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  suiteNumber: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface USAddress {
  name: string;
  suite: string;
  street: string;
  city: string;
  country: string;
  phone: string;
}

export interface ConsolidationRequest {
  id: string;
  packageIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  preferences: {
    removePackaging: boolean;
    addProtection: boolean;
    requestUnpackedPhotos: boolean;
  };
  specialInstructions?: string;
  cost: {
    total: number;
    currency: string;
  };
  estimatedCompletion: string;
  createdAt: string;
}

export interface PhotoRequest {
  id: string;
  packageId: string;
  requestType: 'photos' | 'information' | 'both';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  additionalPhotos: number;
  specificRequests: string[];
  customInstructions?: string;
  cost: {
    total: number;
    currency: string;
  };
  photos: Array<{
    url: string;
    description: string;
    uploadedAt: string;
  }>;
  informationReport?: string;
  createdAt: string;
  completedAt?: string;
}
