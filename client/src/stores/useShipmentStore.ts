// src/stores/useShipmentStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Shipment, ShipmentStatus } from '@/types/client.types';

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
  fetchShipments: () => Promise<void>;
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

    fetchShipments: async () => {
      set({ loading: true, error: null });
      try {
        // TODO: Replace with API call
        // const response = await shipmentAPI.getShipments();

        const { mockShipments } = await import('@/data/client/mockShipments');
        set({ shipments: mockShipments, loading: false });
      } catch (error) {
        set({
          error: 'Failed to fetch shipments',
          loading: false,
        });
        throw error;
      }
    },
  }))
);
