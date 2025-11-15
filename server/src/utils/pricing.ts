// server/src/utils/pricing.ts

interface ConsolidationPreferences {
  removePackaging: boolean;
  addProtection: boolean;
  requestUnpackedPhotos: boolean;
}

/**
 * Calculate consolidation cost
 */
export const calculateConsolidationCost = (
  packageCount: number,
  preferences: ConsolidationPreferences
) => {
  const FEE_PER_PACKAGE = 25; // MAD
  const MAX_FEE = 100; // MAD
  const PROTECTION_FEE = 30; // MAD
  const UNPACKED_PHOTOS_FEE = 20; // MAD

  const baseFee = Math.min(packageCount * FEE_PER_PACKAGE, MAX_FEE);
  const protectionFee = preferences.addProtection ? PROTECTION_FEE : 0;
  const photosFee = preferences.requestUnpackedPhotos ? UNPACKED_PHOTOS_FEE : 0;

  return {
    base: baseFee,
    protection: protectionFee,
    photos: photosFee,
    total: baseFee + protectionFee + photosFee,
    currency: 'MAD' as const,
  };
};

/**
 * Calculate photo request cost
 */
// server/src/utils/pricing.ts
/**
 * Calculate photo request costs
 */
export const calculatePhotoRequestCost = (
  additionalPhotos: number,
  requestType: 'photos' | 'information' | 'both'
): {
  photos: number;
  information: number;
  total: number;
  currency: string;
} => {
  const PHOTO_COST = 20; // MAD per photo
  const INFORMATION_COST = 10; // MAD

  let photosCost = 0;
  let informationCost = 0;

  if (requestType === 'photos' || requestType === 'both') {
    photosCost = additionalPhotos * PHOTO_COST;
  }

  if (requestType === 'information' || requestType === 'both') {
    informationCost = INFORMATION_COST;
  }

  return {
    photos: photosCost,
    information: informationCost,
    total: photosCost + informationCost,
    currency: 'MAD',
  };
};

/**
 * Calculate shipping cost
 */
export const calculateShippingCost = (
  weight: number,
  dimensions: { length: number; width: number; height: number },
  carrier: string
): number => {
  // Simple pricing model - in production, this would integrate with carrier APIs
  const BASE_RATE = 50; // MAD per kg
  const DIMENSIONAL_WEIGHT_DIVISOR = 5000;

  // Calculate dimensional weight
  const dimensionalWeight =
    (dimensions.length * dimensions.width * dimensions.height) /
    DIMENSIONAL_WEIGHT_DIVISOR;

  // Use the greater of actual weight or dimensional weight
  const chargeableWeight = Math.max(weight, dimensionalWeight);

  // Base calculation
  let cost = chargeableWeight * BASE_RATE;

  // Carrier multipliers
  const carrierMultipliers: Record<string, number> = {
    DHL: 1.2,
    FedEx: 1.15,
    Aramex: 1.0,
    UPS: 1.18,
  };

  cost *= carrierMultipliers[carrier] || 1.0;

  return Math.round(cost);
};
