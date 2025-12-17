import { useState, useCallback } from 'react';
import { apiHelpers } from '@/lib/api';
import { useNotificationStore } from '@/stores';

interface CarrierRate {
  productCode: string;
  productName: string;
  totalPrice: number;
  currency: string;
  deliveryTime: number;
  serviceLevel: string;
}

export function useShippingRates() {
  const [rates, setRates] = useState<CarrierRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  const fetchRates = useCallback(
    async (params: {
      weight: number;
      dimensions: { length: number; width: number; height: number };
      destinationPostalCode?: string;
      destinationCity?: string;
      declaredValue?: number;
    }) => {
      setLoading(true);
      setError(null);
      setRates([]);

      try {
        console.log('🚚 Fetching shipping rates...', params);

        const response = await apiHelpers.post<{ rates: CarrierRate[] }>(
          '/shipments/get-rates',
          {
            ...params,
            originCountryCode: 'US',
            destinationCountryCode: 'MA',
          }
        );

        console.log('✅ Rates received:', response.rates.length);
        setRates(response.rates);

        if (response.rates.length === 0) {
          const msg = 'No shipping rates available at this time';
          setError(msg);
          addNotification(msg, 'warning');
        } else {
          addNotification(
            `Found ${response.rates.length} shipping options`,
            'success'
          );
        }

        return response.rates;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          'Failed to load shipping rates';
        console.error('❌ Failed to fetch rates:', errorMessage);
        setError(errorMessage);
        addNotification(errorMessage, 'error');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [addNotification]
  );

  return {
    rates,
    loading,
    error,
    fetchRates,
  };
}
