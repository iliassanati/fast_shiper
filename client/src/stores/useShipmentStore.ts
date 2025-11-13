// client/src/stores/useShipmentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shipment, ShipmentStatus } from '@/types/client.types';
import { apiHelpers } from '@/lib/api';

interface ShipmentState {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Getters
  getShipmentById: (id: string) => Shipment | undefined;
  getActiveShipments: () => Shipment[];
  getDeliveredShipments: () => Shipment[];

  // Actions
  setShipments: (shipments: Shipment[]) => void;
  addShipment: (shipment: Shipment) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;
  fetchShipments: (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchShipmentById: (id: string) => Promise<Shipment>;
  createShipment: (shipmentData: any) => Promise<Shipment>;
  updateShipmentStatus: (
    id: string,
    status: ShipmentStatus,
    trackingEvent?: any
  ) => Promise<void>;
  reset: () => void;
}

const initialState = {
  shipments: [],
  loading: false,
  error: null,
  initialized: false,
};

export const useShipmentStore = create<ShipmentState>()(
  devtools((set, get) => ({
    ...initialState,

    // Getters
    getShipmentById: (id) => {
      return get().shipments.find((shipment) => shipment.id === id);
    },

    getActiveShipments: () => {
      return get().shipments.filter(
        (shipment) =>
          shipment.status === 'in_transit' || shipment.status === 'pending'
      );
    },

    getDeliveredShipments: () => {
      return get().shipments.filter(
        (shipment) => shipment.status === 'delivered'
      );
    },

    // Actions
    setShipments: (shipments) => set({ shipments, initialized: true }),

    addShipment: (shipment) =>
      set((state) => ({
        shipments: [shipment, ...state.shipments],
      })),

    updateShipment: (id, updates) =>
      set((state) => ({
        shipments: state.shipments.map((shipment) =>
          shipment.id === id ? { ...shipment, ...updates } : shipment
        ),
      })),

    fetchShipments: async (filters) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{
          shipments: any[];
          pagination: any;
        }>('/shipments', filters);

        // Transform backend data to frontend format
        const shipments = response.shipments.map((s: any) => ({
          id: s._id || s.id,
          trackingNumber: s.trackingNumber,
          carrier: s.carrier,
          status: s.status,
          shippedDate: s.shippedDate
            ? new Date(s.shippedDate).toISOString().split('T')[0]
            : null,
          estimatedDelivery: new Date(s.estimatedDelivery)
            .toISOString()
            .split('T')[0],
          deliveredDate: s.actualDelivery
            ? new Date(s.actualDelivery).toISOString().split('T')[0]
            : null,
          destination: s.destination.city,
          packages: s.packageIds.length,
          cost: `${s.cost.total} ${s.cost.currency}`,
        }));

        set({ shipments, loading: false, initialized: true });
      } catch (error: any) {
        console.error('Error fetching shipments:', error);
        set({
          error: error.response?.data?.error || 'Failed to fetch shipments',
          loading: false,
          initialized: true,
        });
      }
    },

    fetchShipmentById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{ shipment: any }>(
          `/shipments/${id}`
        );

        const s = response.shipment;
        const transformedShipment: Shipment = {
          id: s._id || s.id,
          trackingNumber: s.trackingNumber,
          carrier: s.carrier,
          status: s.status,
          shippedDate: s.shippedDate
            ? new Date(s.shippedDate).toISOString().split('T')[0]
            : null,
          estimatedDelivery: new Date(s.estimatedDelivery)
            .toISOString()
            .split('T')[0],
          deliveredDate: s.actualDelivery
            ? new Date(s.actualDelivery).toISOString().split('T')[0]
            : null,
          destination: s.destination.city,
          packages: s.packageIds.length,
          cost: `${s.cost.total} ${s.cost.currency}`,
        };

        get().updateShipment(id, transformedShipment);
        set({ loading: false });
        return transformedShipment;
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to fetch shipment',
          loading: false,
        });
        throw error;
      }
    },

    createShipment: async (shipmentData: any) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.post<{ shipment: any }>(
          '/shipments',
          shipmentData
        );

        const s = response.shipment;
        const transformedShipment: Shipment = {
          id: s._id || s.id,
          trackingNumber: s.trackingNumber,
          carrier: s.carrier,
          status: s.status,
          shippedDate: s.shippedDate
            ? new Date(s.shippedDate).toISOString().split('T')[0]
            : null,
          estimatedDelivery: new Date(s.estimatedDelivery)
            .toISOString()
            .split('T')[0],
          deliveredDate: s.actualDelivery
            ? new Date(s.actualDelivery).toISOString().split('T')[0]
            : null,
          destination: s.destination.city,
          packages: s.packageIds.length,
          cost: `${s.cost.total} ${s.cost.currency}`,
        };

        get().addShipment(transformedShipment);
        set({ loading: false });
        return transformedShipment;
      } catch (error: any) {
        set({
          error: error.response?.data?.error || 'Failed to create shipment',
          loading: false,
        });
        throw error;
      }
    },

    updateShipmentStatus: async (
      id: string,
      status: ShipmentStatus,
      trackingEvent?: any
    ) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.put<{ shipment: any }>(
          `/shipments/${id}/status`,
          { status, trackingEvent }
        );

        const s = response.shipment;
        const transformedShipment: Partial<Shipment> = {
          status: s.status,
          shippedDate: s.shippedDate
            ? new Date(s.shippedDate).toISOString().split('T')[0]
            : null,
          deliveredDate: s.actualDelivery
            ? new Date(s.actualDelivery).toISOString().split('T')[0]
            : null,
        };

        get().updateShipment(id, transformedShipment);
        set({ loading: false });
      } catch (error: any) {
        set({
          error:
            error.response?.data?.error || 'Failed to update shipment status',
          loading: false,
        });
        throw error;
      }
    },

    reset: () => set(initialState),
  }))
);
