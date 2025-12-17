// src/data/client/constants.ts

// Consolidation Pricing - UPDATED: CONSOLIDATION IS NOW FREE
export const CONSOLIDATION_PRICING = {
  FEE_PER_PACKAGE: 0, // FREE - No consolidation fees
  MAX_FEE: 0, // FREE - No cap needed

  // Photo Pricing
  BASIC_PHOTOS: 0, // Basic packaging photos are FREE (included)
  UNPACKED_PHOTOS_FEE: 0, // REMOVED - No longer offering unpacked photos during consolidation

  // Additional Services - UPDATED: Extra protection is $2, paid during shipment
  EXTRA_PROTECTION_FEE: 20, // 20 MAD (~$2) - will be added to shipment cost, not consolidation
} as const;

// Photo Request Pricing (for standalone photo requests, not consolidation)
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

// Storage - 30 days
export const STORAGE = {
  FREE_DAYS: 30, // 30 days free storage
  WARNING_THRESHOLD: 23, // Warn when 23 days reached (7 days remaining)
  CRITICAL_THRESHOLD: 7, // Critical warning when only 7 days left
} as const;

// Shipping
export const SHIPPING = {
  PROCESSING_TIME: {
    CONSOLIDATION: '2-4 business days',
    REPACK: '1-2 business days',
    PHOTO_REQUEST: 'Same or next business day',
  },
  DELIVERY_TIME: {
    EXPRESS: '3-5 business days',
    STANDARD: '5-7 business days',
  },
} as const;

// Dimensional Weight Formula (DHL)
export const DIMENSIONAL_WEIGHT = {
  DIVISOR: 5000, // L x W x H / 5000 (in cm)
} as const;

// Business Hours
export const BUSINESS_HOURS = {
  START: '9:00 AM EST',
  END: '5:00 PM EST',
  TIMEZONE: 'EST',
  DAYS: 'Monday - Friday',
} as const;

// Currency Conversion (approximate)
export const CURRENCY = {
  MAD_TO_USD: 0.1, // 1 MAD ≈ $0.10 USD
  USD_TO_MAD: 10, // 1 USD ≈ 10 MAD
} as const;
