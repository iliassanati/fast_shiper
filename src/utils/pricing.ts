// src/utils/pricing.ts
import {
  CONSOLIDATION_PRICING,
  PHOTO_REQUEST_PRICING,
  INSURANCE_PRICING,
  DIMENSIONAL_WEIGHT,
  CURRENCY,
} from '@/data/client/constants';

/**
 * Calculate consolidation fee based on number of packages
 */
export const calculateConsolidationFee = (
  packageCount: number,
  requestUnpackedPhotos: boolean = false
): number => {
  const baseFee = Math.min(
    packageCount * CONSOLIDATION_PRICING.FEE_PER_PACKAGE,
    CONSOLIDATION_PRICING.MAX_FEE
  );

  const unpackedPhotosFee = requestUnpackedPhotos
    ? CONSOLIDATION_PRICING.UNPACKED_PHOTOS_FEE
    : 0;

  return baseFee + unpackedPhotosFee;
};

/**
 * Calculate photo request cost
 */
export const calculatePhotoRequestCost = (
  photoCount: number,
  includeInformation: boolean = false
): number => {
  let cost = 0;

  if (photoCount > 0) {
    cost += PHOTO_REQUEST_PRICING.FIRST_PHOTO;
    if (photoCount > 1) {
      cost += (photoCount - 1) * PHOTO_REQUEST_PRICING.ADDITIONAL_PHOTO;
    }
  }

  if (includeInformation) {
    cost += PHOTO_REQUEST_PRICING.INFORMATION_REQUEST;
  }

  return cost;
};

/**
 * Calculate insurance cost
 */
export const calculateInsuranceCost = (declaredValue: number): number => {
  if (declaredValue <= INSURANCE_PRICING.FREE_COVERAGE) {
    return 0;
  }

  const additionalValue = declaredValue - INSURANCE_PRICING.FREE_COVERAGE;
  return Math.ceil(additionalValue / 100) * INSURANCE_PRICING.COST_PER_100;
};

/**
 * Calculate dimensional weight
 */
export const calculateDimensionalWeight = (
  length: number,
  width: number,
  height: number
): number => {
  return (length * width * height) / DIMENSIONAL_WEIGHT.DIVISOR;
};

/**
 * Convert MAD to USD
 */
export const madToUsd = (mad: number): number => {
  return mad * CURRENCY.MAD_TO_USD;
};

/**
 * Convert USD to MAD
 */
export const usdToMad = (usd: number): number => {
  return usd * CURRENCY.USD_TO_MAD;
};

/**
 * Format price in MAD
 */
export const formatMAD = (amount: number): string => {
  return `${amount.toFixed(0)} MAD`;
};

/**
 * Format price in USD
 */
export const formatUSD = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Calculate estimated savings from consolidation
 */
export const calculateConsolidationSavings = (
  packageCount: number,
  separateShippingCostPerPackage: number = 350
): number => {
  if (packageCount < 2) return 0;

  const separateTotal = packageCount * separateShippingCostPerPackage;
  const consolidatedTotal = 450; // Estimated consolidated shipping
  const consolidationFee = calculateConsolidationFee(packageCount, false);

  return Math.max(0, separateTotal - (consolidatedTotal + consolidationFee));
};
