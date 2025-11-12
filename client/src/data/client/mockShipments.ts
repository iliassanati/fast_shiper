import type { Shipment } from '@/types/client.types';

export const mockShipments: Shipment[] = [
  {
    id: 'SHP001',
    carrier: 'DHL Express',
    trackingNumber: 'DHL123456789MA',
    status: 'in_transit',
    shippedDate: '2025-10-09',
    estimatedDelivery: '2025-10-13',
    destination: 'Casablanca, Morocco',
    packages: 2,
    cost: '450 MAD',
  },
  {
    id: 'SHP002',
    carrier: 'DHL Express',
    trackingNumber: 'DHL987654321MA',
    status: 'delivered',
    shippedDate: '2025-10-01',
    deliveredDate: '2025-10-05',
    destination: 'Casablanca, Morocco',
    packages: 1,
    cost: '320 MAD',
  },
];
