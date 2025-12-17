// server/src/types/index.ts - CORRECTED VERSION
import type { Request } from 'express';
import { Types } from 'mongoose';

// User Types
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  suiteNumber: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Omit password for responses
export type UserResponse = Omit<IUser, 'password'>;

// Request with authenticated user or admin
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
  isAdmin?: boolean;
}

// Auth DTOs
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Package Types - FIXED with missing fields
export interface IPackage {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  trackingNumber: string;
  retailer: string;
  status: 'received' | 'consolidated' | 'shipped' | 'in_transit' | 'delivered';
  receivedDate: Date;
  weight: {
    value: number;
    unit: 'kg' | 'lb';
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  storageDay: number;
  estimatedValue: {
    amount: number;
    currency: 'USD' | 'MAD';
  };
  photos: Array<{
    url: string;
    type: 'basic' | 'unpacked' | 'detailed' | 'damage';
    uploadedAt: Date;
  }>;
  description: string;
  consolidationId?: Types.ObjectId;
  shipmentId?: Types.ObjectId;
  notes: string;
  // ADDED: Missing fields
  isConsolidatedResult?: boolean;
  originalPackageIds?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Shipment Types
export interface IShipment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  packageIds: Types.ObjectId[];
  carrier: 'DHL' | 'FedEx' | 'Aramex' | 'UPS';
  serviceLevel: string;
  trackingNumber: string;
  status: 'pending' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  shippedDate: Date | null;
  estimatedDelivery: Date;
  actualDelivery: Date | null;
  destination: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  weight: {
    total: number;
    unit: 'kg' | 'lb';
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  cost: {
    shipping: number;
    insurance: number;
    total: number;
    currency: 'MAD' | 'USD';
  };
  insurance: {
    coverage: number;
    cost: number;
  };
  customsInfo: Array<{
    description: string;
    quantity: number;
    value: number;
    hsCode?: string;
    countryOfOrigin: string;
  }>;
  trackingEvents: Array<{
    status: string;
    location: string;
    description: string;
    timestamp: Date;
  }>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Consolidation Types
export interface IConsolidation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  packageIds: Types.ObjectId[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  preferences: {
    removePackaging: boolean;
    addProtection: boolean;
    requestUnpackedPhotos: boolean;
  };
  specialInstructions: string;
  estimatedCompletion: Date;
  actualCompletion: Date | null;
  resultingPackageId: Types.ObjectId | null;
  cost: {
    base: number;
    protection: number;
    photos: number;
    total: number;
    currency: 'MAD' | 'USD';
  };
  beforeConsolidation: {
    totalWeight: number;
    totalVolume: number;
  };
  afterConsolidation: {
    weight: number | null;
    dimensions: {
      length: number | null;
      width: number | null;
      height: number | null;
    };
  };
  photos: Array<{
    url: string;
    type: 'before' | 'unpacked' | 'after';
    uploadedAt: Date;
  }>;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Photo Request Types
export interface IPhotoRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  packageId: Types.ObjectId;
  requestType: 'photos' | 'information' | 'both';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  additionalPhotos: number;
  specificRequests: string[];
  customInstructions: string;
  cost: {
    photos: number;
    information: number;
    total: number;
    currency: 'MAD' | 'USD';
  };
  completedAt: Date | null;
  photos: Array<{
    url: string;
    description: string;
    uploadedAt: Date;
  }>;
  informationReport: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types - FIXED with missing notes field
export interface ITransaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type:
    | 'consolidation'
    | 'shipping'
    | 'photo_request'
    | 'insurance'
    | 'storage_fee'
    | 'refund';
  relatedId: Types.ObjectId;
  relatedModel: 'Consolidation' | 'Shipment' | 'PhotoRequest' | 'Package';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount: {
    value: number;
    currency: 'MAD' | 'USD';
  };
  paymentMethod:
    | 'card'
    | 'paypal'
    | 'bank_transfer'
    | 'cash'
    | 'cash_on_delivery';
  paymentDetails: {
    last4: string;
    brand: string;
    transactionId?: string;
  };
  description: string;
  invoice: {
    number?: string;
    url: string;
    generatedAt: Date | null;
  };
  refund: {
    amount: number;
    reason: string;
    processedAt: Date | null;
  };
  completedAt: Date | null;
  metadata: Record<string, any>;
  // ADDED: Missing notes field
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type:
    | 'package_received'
    | 'shipment_update'
    | 'consolidation_complete'
    | 'photo_request_complete'
    | 'payment_received'
    | 'storage_warning';
  title: string;
  message: string;
  read: boolean;
  readAt: Date | null;
  relatedId: Types.ObjectId | null;
  relatedModel:
    | 'Package'
    | 'Shipment'
    | 'Consolidation'
    | 'PhotoRequest'
    | 'Transaction'
    | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for API requests
export interface CreatePackageDTO {
  trackingNumber: string;
  retailer: string;
  description: string;
  weight: {
    value: number;
    unit: 'kg' | 'lb';
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  estimatedValue: {
    amount: number;
    currency: 'USD' | 'MAD';
  };
  notes?: string;
}

// FIXED: Added missing fields to CreateShipmentDTO
export interface CreateShipmentDTO {
  packageIds: string[];
  carrier: string;
  serviceLevel: string;
  destination: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  customsInfo: Array<{
    description: string;
    quantity: number;
    value: number;
    hsCode?: string;
    countryOfOrigin: string;
  }>;
  insurance?: {
    coverage: number;
  };
  // ADDED: Missing cost field
  cost?: {
    shipping: number;
  };
  // ADDED: Missing payment field
  payment?: {
    method: 'card' | 'paypal' | 'bank_transfer' | 'cash' | 'cash_on_delivery';
    transactionId?: string;
    timestamp?: Date;
  };
}

export interface CreateConsolidationDTO {
  packageIds: string[];
  preferences: {
    removePackaging: boolean;
    addProtection: boolean;
    requestUnpackedPhotos: boolean;
  };
  specialInstructions?: string;
}

export interface CreatePhotoRequestDTO {
  packageId: string;
  requestType: 'photos' | 'information' | 'both';
  additionalPhotos: number;
  specificRequests?: string[];
  customInstructions?: string;
}

// server/src/types/index.ts
import { Types } from 'mongoose';

export interface IShipment {
  _id?: Types.ObjectId | string;
  user: Types.ObjectId | string;
  packages: Types.ObjectId[] | string[];
  consolidation?: Types.ObjectId | string;
  trackingNumber?: string;
  carrier?: string;
  serviceLevelName?: string;
  status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  recipientInfo: {
    name: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
    email?: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  declaredValue?: number;
  shippingCost?: number;
  photoRequestFees?: number;
  protectionFee?: number;
  totalCost?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  labelUrl?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date | string;
  deliveredAt?: Date;
  shippoTransactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPackage {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  trackingNumber: string;
  carrier?: string;
  description?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue?: number;
  status: 'warehouse' | 'consolidated' | 'shipped' | 'delivered';
  warehouseLocation?: string;
  arrivedAt?: Date;
  consolidationId?: Types.ObjectId | string;
  shipmentId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPhotoRequest {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  packageId: Types.ObjectId | string;
  requestType: 'inspection' | 'damage' | 'verification';
  notes?: string;
  photos?: string[];
  status: 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  paidAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConsolidation {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  packages: Types.ObjectId[] | string[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  addProtection: boolean;
  removeShoeBoxes?: boolean;
  instructions?: string;
  totalWeight?: number;
  totalDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id?: Types.ObjectId | string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  stripeCustomerId?: string;
  defaultShippingAddress?: {
    name: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Stripe types
export interface IPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer?: string;
  metadata?: Record<string, string>;
}

// Request types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    stripeCustomerId?: string;
  };
}
