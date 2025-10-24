// User Types
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  suiteNumber: string;
  avatar: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

// Package Types
export type PackageStatus =
  | 'received'
  | 'consolidated'
  | 'shipped'
  | 'in_transit'
  | 'delivered';

export interface Package {
  id: string;
  trackingNumber: string;
  retailer: string;
  status: PackageStatus;
  receivedDate: string;
  weight: string;
  dimensions: string;
  storageDay: number;
  estimatedValue: string;
  photo: string;
  description: string;
}

// Shipment Types
export type ShipmentStatus = 'in_transit' | 'delivered' | 'pending';

export interface Shipment {
  id: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shippedDate: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  destination: string;
  packages: number;
  cost: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalPackages: number;
  inStorage: number;
  shipped: number;
  storageDaysLeft: number;
}

// US Address
export interface USAddress {
  name: string;
  suite: string;
  street: string;
  city: string;
  country: string;
  phone: string;
}

// Notification
export interface Notification {
  id: number;
  message: string;
  time: string;
  unread: boolean;
}

// Consolidation Types
export interface ConsolidationRequest {
  id: string;
  packageIds: string[];
  removePackaging: boolean;
  addProtection: boolean;
  specialInstructions: string;
  requestUnpackedPhotos: boolean; // New: for unpacked photo pricing
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  estimatedCompletion: string;
  totalCost: number;
}

// Photo Request Types
export type PhotoRequestType = 'photos' | 'information' | 'both';

export interface PhotoRequest {
  id: string;
  packageId: string;
  requestType: PhotoRequestType;
  additionalPhotos: number;
  specificRequests: string[];
  customInstructions: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  totalCost: number;
}

// Customs Info
export interface CustomsInfo {
  description: string;
  quantity: number;
  value: number;
  hsCode?: string;
  countryOfOrigin: string;
}

// Shipping Types
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CarrierService {
  id: string;
  name: string;
  delivery: string;
  price: number;
  features: string[];
}

export interface Carrier {
  id: string;
  name: string;
  logo: string;
  serviceLevels: CarrierService[];
}
