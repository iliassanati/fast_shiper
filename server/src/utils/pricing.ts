// server/src/utils/pricing.ts
/**
 * Pricing utility for calculating consolidation, shipping, and other costs
 */

// Consolidation Pricing (in MAD)
export const CONSOLIDATION_PRICING = {
  FEE_PER_PACKAGE: 50, // 50 MAD per package (~$5)
  MAX_FEE: 250, // 250 MAD cap (~$25)
  BASIC_PHOTOS: 0, // Basic packaging photos are FREE
  UNPACKED_PHOTOS_FEE: 20, // 20 MAD (~$2) for unpacked/detailed photos
  EXTRA_PROTECTION_FEE: 25, // 25 MAD for extra protection
} as const;

// Photo Request Pricing
export const PHOTO_REQUEST_PRICING = {
  FIRST_PHOTO: 40, // 40 MAD (~$4) for first additional photo
  ADDITIONAL_PHOTO: 10, // 10 MAD per additional photo (~$1)
  INFORMATION_REQUEST: 10, // 10 MAD (~$1) for information request
  MAX_PHOTOS: 10, // Maximum 10 additional photos
} as const;

// Insurance Pricing
export const INSURANCE_PRICING = {
  FREE_COVERAGE: 100, // Free insurance up to $100 USD
  COST_PER_100: 5, // 5 MAD per $100 value
  MAX_COVERAGE_MULTIPLIER: 1.0, // Can insure up to 100% of declared value
} as const;

/**
 * Calculate consolidation cost
 */
export interface ConsolidationPreferences {
  removePackaging?: boolean;
  addProtection?: boolean;
  requestUnpackedPhotos?: boolean;
}

export function calculateConsolidationCost(
  packageCount: number,
  preferences: ConsolidationPreferences = {}
): {
  base: number;
  protection: number;
  photos: number;
  total: number;
  currency: string;
} {
  // Base consolidation fee (capped at MAX_FEE)
  const base = Math.min(
    packageCount * CONSOLIDATION_PRICING.FEE_PER_PACKAGE,
    CONSOLIDATION_PRICING.MAX_FEE
  );

  // Extra protection fee
  const protection = preferences.addProtection
    ? CONSOLIDATION_PRICING.EXTRA_PROTECTION_FEE
    : 0;

  // Unpacked photos fee
  const photos = preferences.requestUnpackedPhotos
    ? CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE
    : 0;

  const total = base + protection + photos;

  return {
    base,
    protection,
    photos,
    total,
    currency: 'MAD',
  };
}

/**
 * Calculate photo request cost
 */
export function calculatePhotoRequestCost(
  numberOfPhotos: number,
  includeInformation: boolean = false
): {
  photosCost: number;
  informationCost: number;
  total: number;
  currency: string;
} {
  // Validate number of photos
  const validPhotoCount = Math.min(
    Math.max(0, numberOfPhotos),
    PHOTO_REQUEST_PRICING.MAX_PHOTOS
  );

  let photosCost = 0;
  if (validPhotoCount > 0) {
    // First photo costs more
    photosCost = PHOTO_REQUEST_PRICING.FIRST_PHOTO;

    // Additional photos
    if (validPhotoCount > 1) {
      photosCost +=
        (validPhotoCount - 1) * PHOTO_REQUEST_PRICING.ADDITIONAL_PHOTO;
    }
  }

  const informationCost = includeInformation
    ? PHOTO_REQUEST_PRICING.INFORMATION_REQUEST
    : 0;

  const total = photosCost + informationCost;

  return {
    photosCost,
    informationCost,
    total,
    currency: 'MAD',
  };
}

/**
 * Calculate insurance cost
 */
export function calculateInsuranceCost(
  declaredValue: number,
  currency: 'USD' | 'MAD' = 'USD'
): {
  declaredValue: number;
  freeCoverage: number;
  insuredAmount: number;
  cost: number;
  currency: string;
} {
  // Convert to USD if necessary (approximate rate: 1 USD = 10 MAD)
  const valueInUSD = currency === 'MAD' ? declaredValue / 10 : declaredValue;

  // Free coverage up to $100
  if (valueInUSD <= INSURANCE_PRICING.FREE_COVERAGE) {
    return {
      declaredValue: valueInUSD,
      freeCoverage: valueInUSD,
      insuredAmount: valueInUSD,
      cost: 0,
      currency: 'MAD',
    };
  }

  // Calculate insurance cost for value above free coverage
  const insuredAmount = Math.min(
    valueInUSD,
    valueInUSD * INSURANCE_PRICING.MAX_COVERAGE_MULTIPLIER
  );

  const valueToCover = insuredAmount - INSURANCE_PRICING.FREE_COVERAGE;
  const cost = Math.ceil(valueToCover / 100) * INSURANCE_PRICING.COST_PER_100;

  return {
    declaredValue: valueInUSD,
    freeCoverage: INSURANCE_PRICING.FREE_COVERAGE,
    insuredAmount,
    cost,
    currency: 'MAD',
  };
}

/**
 * Estimate shipping savings from consolidation
 */
export function estimateConsolidationSavings(
  packageCount: number,
  averageWeightPerPackage: number = 2 // kg
): {
  separateShippingCost: number;
  consolidatedShippingCost: number;
  consolidationFee: number;
  totalSavings: number;
  currency: string;
} {
  // Rough estimate: individual package shipping ~350 MAD each
  const separateShippingCost = packageCount * 350;

  // Consolidated shipping estimate (increases with total weight)
  const totalWeight = packageCount * averageWeightPerPackage;
  const consolidatedShippingCost = Math.min(450 + totalWeight * 20, 1500);

  // Consolidation fee
  const consolidationFee = Math.min(
    packageCount * CONSOLIDATION_PRICING.FEE_PER_PACKAGE,
    CONSOLIDATION_PRICING.MAX_FEE
  );

  // Total cost with consolidation vs without
  const totalWithConsolidation = consolidatedShippingCost + consolidationFee;
  const totalSavings = separateShippingCost - totalWithConsolidation;

  return {
    separateShippingCost,
    consolidatedShippingCost,
    consolidationFee,
    totalSavings: Math.max(0, totalSavings), // Never negative
    currency: 'MAD',
  };
}

/**
 * Calculate dimensional weight (for shipping)
 */
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number,
  unit: 'cm' | 'in' = 'cm'
): number {
  // Convert to cm if needed
  let l = length;
  let w = width;
  let h = height;

  if (unit === 'in') {
    l = length * 2.54;
    w = width * 2.54;
    h = height * 2.54;
  }

  // DHL formula: L x W x H / 5000
  const dimensionalWeight = (l * w * h) / 5000;

  return Math.ceil(dimensionalWeight * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate billable weight (higher of actual vs dimensional)
 */
export function calculateBillableWeight(
  actualWeight: number,
  dimensions: { length: number; width: number; height: number },
  unit: 'cm' | 'in' = 'cm'
): {
  actualWeight: number;
  dimensionalWeight: number;
  billableWeight: number;
  unit: string;
} {
  const dimensionalWeight = calculateDimensionalWeight(
    dimensions.length,
    dimensions.width,
    dimensions.height,
    unit
  );

  const billableWeight = Math.max(actualWeight, dimensionalWeight);

  return {
    actualWeight,
    dimensionalWeight,
    billableWeight,
    unit: 'kg',
  };
}

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

export default {
  CONSOLIDATION_PRICING,
  PHOTO_REQUEST_PRICING,
  INSURANCE_PRICING,
  calculateConsolidationCost,
  calculatePhotoRequestCost,
  calculateInsuranceCost,
  estimateConsolidationSavings,
  calculateDimensionalWeight,
  calculateBillableWeight,
  calculateShippingCost,
};
