// client/src/stores/useAdminShipmentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiHelpers } from '@/lib/api';

interface ShipmentUser {
  name: string;
  email: string;
  suiteNumber: string;
  phone: string;
}

interface ShipmentPackage {
  trackingNumber: string;
  description: string;
  retailer: string;
}

interface ShipmentTransaction {
  id: string;
  status: string;
  amount: {
    value: number;
    currency: string;
  };
  paymentMethod: string;
  completedAt: string | null;
  createdAt: string;
}

export interface AdminShipment {
  _id: string;
  userId: ShipmentUser;
  packages: ShipmentPackage[];
  trackingNumber: string;
  carrier: string;
  serviceLevelName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
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
  declaredValue: number;
  shippingCost: number;
  photoRequestFees: number;
  protectionFee: number;
  totalCost: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  labelUrl?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  transaction: ShipmentTransaction | null;
  trackingInfo?: any;
  createdAt: string;
  updatedAt: string;
}

interface ShipmentStatistics {
  total: number;
  byStatus: Record<string, number>;
  byCarrier: Array<{ carrier: string; count: number }>;
  byPaymentStatus: Record<string, number>;
  deliveredToday: number;
  avgDeliveryDays: number;
  totalRevenue: number;
  pendingPayments: number;
}

interface ShipmentFilters {
  status?: string;
  userId?: string;
  carrier?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AdminShipmentState {
  shipments: AdminShipment[];
  selectedShipment: AdminShipment | null;
  statistics: ShipmentStatistics | null;
  loading: boolean;
  error: string | null;
  filters: ShipmentFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Actions
  fetchShipments: (filters?: ShipmentFilters) => Promise<void>;
  fetchShipmentById: (id: string) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  approveShipment: (id: string, notes?: string) => Promise<void>;
  rejectShipment: (id: string, reason: string) => Promise<void>;
  updatePaymentStatus: (
    id: string,
    status: string,
    notes?: string
  ) => Promise<void>;
  trackShipment: (id: string) => Promise<void>;
  sendNotification: (
    id: string,
    title: string,
    message: string,
    priority?: string
  ) => Promise<void>;
  bulkUpdate: (shipmentIds: string[], updates: any) => Promise<void>;
  setFilters: (filters: ShipmentFilters) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialFilters: ShipmentFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const initialState = {
  shipments: [],
  selectedShipment: null,
  statistics: null,
  loading: false,
  error: null,
  filters: initialFilters,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

export const useAdminShipmentStore = create<AdminShipmentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchShipments: async (filters) => {
        set({ loading: true, error: null });
        try {
          const currentFilters = { ...get().filters, ...filters };
          set({ filters: currentFilters });

          console.log(
            '📦 Fetching admin shipments with filters:',
            currentFilters
          );

          const response = await apiHelpers.get<{
            shipments: AdminShipment[];
            pagination: any;
          }>('/admin/shipments', currentFilters);

          console.log(`✅ Loaded ${response.shipments.length} shipments`);

          set({
            shipments: response.shipments,
            pagination: response.pagination,
            loading: false,
          });
        } catch (error: any) {
          console.error('❌ Error fetching shipments:', error);
          set({
            error: error.message || 'Failed to fetch shipments',
            loading: false,
          });
        }
      },

      fetchShipmentById: async (id: string) => {
        set({ loading: true, error: null });
        try {
          console.log('🔍 Fetching shipment details:', id);

          const response = await apiHelpers.get<{ shipment: AdminShipment }>(
            `/admin/shipments/${id}`
          );

          console.log('✅ Shipment loaded:', response.shipment);

          set({
            selectedShipment: response.shipment,
            loading: false,
          });
        } catch (error: any) {
          console.error('❌ Error fetching shipment:', error);
          set({
            error: error.message || 'Failed to fetch shipment',
            loading: false,
          });
        }
      },

      fetchStatistics: async () => {
        set({ loading: true, error: null });
        try {
          console.log('📊 Fetching shipment statistics...');

          const response = await apiHelpers.get<{
            statistics: ShipmentStatistics;
          }>('/admin/shipments/statistics');

          console.log('✅ Statistics loaded');

          set({
            statistics: response.statistics,
            loading: false,
          });
        } catch (error: any) {
          console.error('❌ Error fetching statistics:', error);
          set({
            error: error.message || 'Failed to fetch statistics',
            loading: false,
          });
        }
      },

      approveShipment: async (id: string, notes?: string) => {
        set({ loading: true, error: null });
        try {
          console.log('✅ Approving shipment:', id);

          await apiHelpers.post(`/admin/shipments/${id}/approve`, { notes });

          // Refresh shipment data
          await get().fetchShipmentById(id);
          await get().fetchShipments();

          console.log('✅ Shipment approved successfully');
        } catch (error: any) {
          console.error('❌ Error approving shipment:', error);
          set({
            error: error.message || 'Failed to approve shipment',
            loading: false,
          });
          throw error;
        }
      },

      rejectShipment: async (id: string, reason: string) => {
        set({ loading: true, error: null });
        try {
          console.log('❌ Rejecting shipment:', id);

          await apiHelpers.post(`/admin/shipments/${id}/reject`, { reason });

          // Refresh shipment data
          await get().fetchShipmentById(id);
          await get().fetchShipments();

          console.log('✅ Shipment rejected successfully');
        } catch (error: any) {
          console.error('❌ Error rejecting shipment:', error);
          set({
            error: error.message || 'Failed to reject shipment',
            loading: false,
          });
          throw error;
        }
      },

      updatePaymentStatus: async (
        id: string,
        status: string,
        notes?: string
      ) => {
        set({ loading: true, error: null });
        try {
          console.log('💰 Updating payment status:', id, status);

          await apiHelpers.put(`/admin/shipments/${id}/payment-status`, {
            status,
            notes,
          });

          // Refresh shipment data
          await get().fetchShipmentById(id);
          await get().fetchShipments();

          console.log('✅ Payment status updated successfully');
        } catch (error: any) {
          console.error('❌ Error updating payment status:', error);
          set({
            error: error.message || 'Failed to update payment status',
            loading: false,
          });
          throw error;
        }
      },

      trackShipment: async (id: string) => {
        set({ loading: true, error: null });
        try {
          console.log('🔍 Tracking shipment:', id);

          const response = await apiHelpers.get<{ tracking: any }>(
            `/admin/shipments/${id}/track`
          );

          // Update selected shipment with tracking info
          set((state) => ({
            selectedShipment: state.selectedShipment
              ? {
                  ...state.selectedShipment,
                  trackingInfo: response.tracking,
                }
              : null,
            loading: false,
          }));

          console.log('✅ Tracking info loaded');
        } catch (error: any) {
          console.error('❌ Error tracking shipment:', error);
          set({
            error: error.message || 'Failed to track shipment',
            loading: false,
          });
        }
      },

      sendNotification: async (
        id: string,
        title: string,
        message: string,
        priority: string = 'normal'
      ) => {
        set({ loading: true, error: null });
        try {
          console.log('📧 Sending notification for shipment:', id);

          await apiHelpers.post(`/admin/shipments/${id}/notify`, {
            title,
            message,
            priority,
          });

          console.log('✅ Notification sent successfully');
          set({ loading: false });
        } catch (error: any) {
          console.error('❌ Error sending notification:', error);
          set({
            error: error.message || 'Failed to send notification',
            loading: false,
          });
          throw error;
        }
      },

      bulkUpdate: async (shipmentIds: string[], updates: any) => {
        set({ loading: true, error: null });
        try {
          console.log('📦 Bulk updating shipments:', shipmentIds.length);

          await apiHelpers.post('/admin/shipments/bulk-update', {
            shipmentIds,
            ...updates,
          });

          // Refresh shipments
          await get().fetchShipments();

          console.log('✅ Bulk update successful');
        } catch (error: any) {
          console.error('❌ Error bulk updating:', error);
          set({
            error: error.message || 'Failed to bulk update',
            loading: false,
          });
          throw error;
        }
      },

      setFilters: (filters: ShipmentFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialFilters });
      },

      reset: () => set(initialState),
    }),
    { name: 'admin-shipment-store' }
  )
);
