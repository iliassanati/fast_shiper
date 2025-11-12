// client/src/stores/useShipmentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shipment, ShipmentStatus } from '@/types/client.types';
import { apiHelpers } from '@/lib/api';

interface ShipmentState {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;

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
}

export const useShipmentStore = create<ShipmentState>()(
  devtools((set, get) => ({
    shipments: [],
    loading: false,
    error: null,

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
    setShipments: (shipments) => set({ shipments }),

    addShipment: (shipment) =>
      set((state) => ({
        shipments: [...state.shipments, shipment],
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
          shipments: Shipment[];
          pagination: any;
        }>('/shipments', filters);

        set({ shipments: response.shipments, loading: false });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to fetch shipments',
          loading: false,
        });
        throw error;
      }
    },

    fetchShipmentById: async (id: string) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.get<{ shipment: Shipment }>(
          `/shipments/${id}`
        );

        // Update the shipment in the store
        get().updateShipment(id, response.shipment);
        set({ loading: false });
        return response.shipment;
      } catch (error: any) {
        set({
          error: error.message || 'Failed to fetch shipment',
          loading: false,
        });
        throw error;
      }
    },

    createShipment: async (shipmentData: any) => {
      set({ loading: true, error: null });
      try {
        const response = await apiHelpers.post<{ shipment: Shipment }>(
          '/shipments',
          shipmentData
        );

        get().addShipment(response.shipment);
        set({ loading: false });
        return response.shipment;
      } catch (error: any) {
        set({
          error: error.message || 'Failed to create shipment',
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
        const response = await apiHelpers.put<{ shipment: Shipment }>(
          `/shipments/${id}/status`,
          { status, trackingEvent }
        );

        get().updateShipment(id, response.shipment);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error.message || 'Failed to update shipment status',
          loading: false,
        });
        throw error;
      }
    },
  }))
);
