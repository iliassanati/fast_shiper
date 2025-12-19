// client/src/hooks/useSavedAddresses.ts
import { useState, useEffect } from 'react';

export interface SavedAddress {
  id: string;
  label: string; // e.g., "Home", "Work", "Mom's House"
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'saved_addresses';

export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  // Load addresses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const addressesWithDates = parsed.map((addr: any) => ({
          ...addr,
          createdAt: new Date(addr.createdAt),
          updatedAt: new Date(addr.updatedAt),
        }));
        setAddresses(addressesWithDates);
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save addresses to localStorage whenever they change
  const saveToStorage = (newAddresses: SavedAddress[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    } catch (error) {
      console.error('Error saving addresses:', error);
      throw new Error('Failed to save address');
    }
  };

  // Add a new address
  const addAddress = (
    addressData: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>
  ): SavedAddress => {
    const requiredFields = [
      'label',
      'fullName',
      'street',
      'city',
      'country',
      'phone',
    ];
    const missingFields = requiredFields.filter(
      (field) => !addressData[field]?.trim()
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // ✅ Validate phone format
    if (!/^\+?[\d\s-()]+$/.test(addressData.phone)) {
      throw new Error('Invalid phone number format');
    }
    const newAddress: SavedAddress = {
      ...addressData,
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let updatedAddresses = [...addresses, newAddress];

    // If this is set as default, unset other defaults
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((addr) =>
        addr.id === newAddress.id ? addr : { ...addr, isDefault: false }
      );
    }

    // If this is the first address, make it default
    if (updatedAddresses.length === 1) {
      updatedAddresses[0].isDefault = true;
    }

    saveToStorage(updatedAddresses);
    return newAddress;
  };

  // Update an existing address
  const updateAddress = (
    id: string,
    updates: Partial<Omit<SavedAddress, 'id' | 'createdAt'>>
  ): SavedAddress | null => {
    const index = addresses.findIndex((addr) => addr.id === id);
    if (index === -1) {
      console.error('Address not found:', id);
      return null;
    }

    let updatedAddresses = [...addresses];
    updatedAddresses[index] = {
      ...updatedAddresses[index],
      ...updates,
      updatedAt: new Date(),
    };

    // If this is set as default, unset other defaults
    if (updates.isDefault) {
      updatedAddresses = updatedAddresses.map((addr) =>
        addr.id === id ? addr : { ...addr, isDefault: false }
      );
    }

    saveToStorage(updatedAddresses);
    return updatedAddresses[index];
  };

  // Delete an address
  const deleteAddress = (id: string): boolean => {
    const filtered = addresses.filter((addr) => addr.id !== id);

    // If we deleted the default address and there are others, make the first one default
    const wasDefault = addresses.find((addr) => addr.id === id)?.isDefault;
    if (wasDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    saveToStorage(filtered);
    return true;
  };

  // Get default address
  const getDefaultAddress = (): SavedAddress | null => {
    return addresses.find((addr) => addr.isDefault) || addresses[0] || null;
  };

  // Set an address as default
  const setDefaultAddress = (id: string): boolean => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
      updatedAt: addr.id === id ? new Date() : addr.updatedAt,
    }));

    saveToStorage(updatedAddresses);
    return true;
  };

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
    setDefaultAddress,
  };
}
