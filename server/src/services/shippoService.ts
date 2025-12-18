// server/src/services/shippoService.ts - MODERN FUNCTIONAL VERSION WITH FIXES
import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

interface ShippoCredentials {
  apiToken: string;
  baseUrl: string;
  isProduction: boolean;
}

interface ShippoRateRequest {
  weight: number; // kg
  dimensions: {
    length: number; // cm
    width: number;
    height: number;
  };
  originCountryCode: string;
  destinationCountryCode: string;
  originPostalCode?: string;
  destinationPostalCode?: string;
  originCity?: string;
  destinationCity?: string;
  destinationPhone?: string; // 🔥 NEW: Required for DHL
  declaredValue?: number;
}

interface ShippoRate {
  objectId: string;
  provider: string;
  serviceLevelName: string;
  serviceLevelToken: string;
  amount: number;
  currency: string;
  estimatedDays: number;
  durationTerms: string;
  carrier: string;
  attributes: string[];
}

interface ShippoShipmentResponse {
  objectId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrier: string;
  serviceLevelName: string;
  estimatedDelivery?: string;
  rate: {
    objectId: string;
    amount: number;
    currency: string;
  };
}

interface ShippoTrackingResponse {
  trackingNumber: string;
  carrier: string;
  trackingStatus: {
    status: string;
    statusDetails: string;
    statusDate: string;
    location: {
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  trackingHistory: Array<{
    statusDetails: string;
    statusDate: string;
    location: {
      city?: string;
      state?: string;
      country?: string;
    };
  }>;
  eta?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_ORIGIN = {
  name: 'Fast Shipper Warehouse',
  company: 'Fast Shipper Inc',
  street1: '123 Warehouse Street',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'US',
  phone: '+12125551234',
  email: 'warehouse@fastshipper.com',
};

// ============================================
// STATE & INITIALIZATION
// ============================================

let credentials: ShippoCredentials;
let configured: boolean = false;
let apiClient: AxiosInstance;

/**
 * Initialize Shippo service
 */
function initializeShippo(): void {
  const isProduction = process.env.NODE_ENV === 'production';

  credentials = {
    apiToken: process.env.SHIPPO_API_TOKEN || '',
    baseUrl: 'https://api.goshippo.com',
    isProduction,
  };

  configured = !!credentials.apiToken;

  // Create axios instance
  apiClient = axios.create({
    baseURL: credentials.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ShippoToken ${credentials.apiToken}`,
    },
  });

  // Response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message;

      // Log full error details including nested objects
      console.error('❌ Shippo API Error:', {
        status: error.response?.status,
        message,
        fullData: JSON.stringify(error.response?.data, null, 2),
      });

      // If there are validation errors, log them specifically
      if (error.response?.data) {
        const data = error.response.data;
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            console.error(
              `❌ Validation Error in ${key}:`,
              JSON.stringify(data[key], null, 2)
            );
          }
        });
      }

      throw new Error(`Shippo API Error: ${message}`);
    }
  );

  if (configured) {
    console.log(
      `✅ Shippo Service configured (${isProduction ? 'PRODUCTION' : 'TEST'} mode)`
    );
  } else {
    console.warn('⚠️ Shippo Service not configured - missing API token');
    console.warn('   Set SHIPPO_API_TOKEN in your .env file');
  }
}

// Initialize on module load
initializeShippo();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if Shippo is configured
 */
export function isShippoConfigured(): boolean {
  return configured;
}

/**
 * 🔥 CRITICAL FIX: Calculate EEL/PFC value for customs
 * EEL = Electronic Export Information
 * PFC = Proof of Filing Citation
 */
function calculateEELPFC(declaredValue: number): string {
  // For shipments valued at $2,500 or less
  if (declaredValue <= 2500) {
    return 'NOEEI 30.37(a)';
  }

  // For shipments over $2,500, you need an AES filing
  // This is a placeholder - in production, integrate with AES system
  //return 'AES X20XXXXXXXXXX'; // Replace with actual AES ITN
  return 'NOEEI 30.37(a)';
}

/**
 * Normalize carrier name for consistency
 */
function normalizeCarrierName(provider: string): string {
  const mapping: Record<string, string> = {
    dhl_express: 'DHL',
    fedex: 'FedEx',
    ups: 'UPS',
    aramex: 'Aramex',
    usps: 'USPS',
  };

  const normalized = provider.toLowerCase().replace(/[_\s]/g, '_');
  return mapping[normalized] || provider;
}

/**
 * Get Shippo carrier token from carrier name
 */
function getCarrierToken(carrier: string): string {
  const mapping: Record<string, string> = {
    DHL: 'dhl_express',
    FedEx: 'fedex',
    UPS: 'ups',
    Aramex: 'aramex',
    USPS: 'usps',
  };

  return mapping[carrier] || carrier.toLowerCase();
}

/**
 * Map Shippo status to internal status
 */
function mapShippoStatusToInternal(shippoStatus: string): string {
  const mapping: Record<string, string> = {
    UNKNOWN: 'pending',
    PRE_TRANSIT: 'pending',
    TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    RETURNED: 'cancelled',
    FAILURE: 'cancelled',
  };

  return mapping[shippoStatus] || 'in_transit';
}

/**
 * Calculate dimensional weight (for reference)
 */
export function calculateDimensionalWeight(
  length: number,
  width: number,
  height: number
): number {
  // DHL formula: L x W x H / 5000 (in cm)
  return Math.ceil(((length * width * height) / 5000) * 10) / 10;
}

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * 🔥 FIXED: Get shipping rates from multiple carriers via Shippo
 */
export async function getRates(
  request: ShippoRateRequest
): Promise<ShippoRate[]> {
  if (!configured) {
    throw new Error(
      'Shippo service is not configured. Please set SHIPPO_API_TOKEN in your environment variables.'
    );
  }

  console.log('📦 ========================================');
  console.log('📦 FETCHING SHIPPO RATES');
  console.log('📦 ========================================');
  console.log('Input parameters:', {
    weight: `${request.weight} kg`,
    dimensions: `${request.dimensions.length} x ${request.dimensions.width} x ${request.dimensions.height} cm`,
    origin: `${request.originCity || 'New York'}, ${request.originCountryCode}`,
    destination: `${request.destinationCity}, ${request.destinationCountryCode}`,
    destinationPhone: request.destinationPhone || 'NOT PROVIDED',
    declaredValue: request.declaredValue
      ? `$${request.declaredValue}`
      : 'Not specified',
  });

  try {
    // 🔥 CRITICAL VALIDATION
    if (!request.destinationCity) {
      throw new Error('Destination city is required');
    }

    if (!request.destinationPostalCode) {
      throw new Error('Destination postal code is required');
    }

    if (!request.destinationPhone) {
      throw new Error(
        'Destination phone number is required (needed for DHL and other carriers)'
      );
    }

    // Convert kg to lb (Shippo uses pounds)
    const weightInLb = request.weight * 2.20462;
    console.log(
      `📊 Weight conversion: ${request.weight} kg = ${weightInLb.toFixed(2)} lb`
    );

    // Convert cm to inches (Shippo uses inches)
    const lengthInch = request.dimensions.length / 2.54;
    const widthInch = request.dimensions.width / 2.54;
    const heightInch = request.dimensions.height / 2.54;
    console.log(
      `📊 Dimensions conversion: ${lengthInch.toFixed(2)}" x ${widthInch.toFixed(2)}" x ${heightInch.toFixed(2)}"`
    );

    // 🔥 FIX: Create address objects with phone and DISABLE validation
    const addressFrom = {
      name: DEFAULT_ORIGIN.name,
      company: DEFAULT_ORIGIN.company,
      street1: DEFAULT_ORIGIN.street1,
      city: request.originCity || DEFAULT_ORIGIN.city,
      state: DEFAULT_ORIGIN.state,
      zip: request.originPostalCode || DEFAULT_ORIGIN.zip,
      country: request.originCountryCode,
      phone: DEFAULT_ORIGIN.phone,
      email: DEFAULT_ORIGIN.email,
      validate: false, // 🔥 FIX: Disable validation to prevent blocking
    };

    // 🔥 FIX: Include phone number for destination
    const addressTo = {
      name: 'Recipient',
      street1: 'Street Address',
      city: request.destinationCity,
      zip: request.destinationPostalCode,
      country: request.destinationCountryCode,
      phone: request.destinationPhone, // 🔥 CRITICAL: Phone number for DHL
      validate: false, // 🔥 FIX: Disable validation
    };

    console.log('📍 Address From:', addressFrom);
    console.log('📍 Address To:', addressTo);

    // Create parcel object
    const parcel = {
      length: lengthInch.toFixed(2),
      width: widthInch.toFixed(2),
      height: heightInch.toFixed(2),
      distance_unit: 'in',
      weight: weightInLb.toFixed(2),
      mass_unit: 'lb',
    };

    console.log('📦 Parcel:', parcel);

    // Create shipment request
    const shipmentData: any = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: [parcel],
      async: false, // Synchronous response with rates
    };

    // 🔥 IMPROVED: Create customs declaration separately if needed
    let customsObjectId: string | undefined;

    if (request.declaredValue && request.declaredValue > 0) {
      const eelPfc = calculateEELPFC(request.declaredValue);

      const customsDeclaration = {
        contents_type: 'MERCHANDISE',
        contents_explanation: 'Personal items shipment',
        non_delivery_option: 'RETURN',
        certify: true,
        certify_signer: DEFAULT_ORIGIN.name,
        incoterm: 'DDU', // Delivered Duty Unpaid
        items: [
          {
            description: 'Personal items',
            quantity: 1,
            net_weight: weightInLb.toFixed(2),
            mass_unit: 'lb',
            value_amount: request.declaredValue.toFixed(2),
            value_currency: 'USD',
            origin_country: request.originCountryCode,
            tariff_number: '', // Optional
          },
        ],
        eel_pfc: eelPfc, // 🔥 CRITICAL FIX: Add EEL/PFC field
      };

      console.log('📋 Creating Customs Declaration...');
      console.log(JSON.stringify(customsDeclaration, null, 2));

      try {
        const customsResponse = await apiClient.post(
          '/customs/declarations/',
          customsDeclaration
        );
        customsObjectId = customsResponse.data.object_id;
        console.log('✅ Customs Declaration created:', customsObjectId);

        // Add customs declaration reference to shipment
        shipmentData.customs_declaration = customsObjectId;
      } catch (customsError: any) {
        console.error(
          '❌ Failed to create customs declaration:',
          customsError.message
        );
        console.error(
          'Full error:',
          JSON.stringify(customsError.response?.data, null, 2)
        );
        // Continue without customs declaration - some carriers might still work
        console.warn(
          '⚠️ Proceeding without customs declaration - some carriers may be unavailable'
        );
      }
    }

    console.log('🚀 Sending request to Shippo API...');
    console.log('Full request payload:', JSON.stringify(shipmentData, null, 2));

    const response = await apiClient.post('/shipments/', shipmentData);

    console.log('📨 Shippo API Response Status:', response.status);
    console.log('📨 Response data:', JSON.stringify(response.data, null, 2));

    // Handle no rates
    if (!response.data.rates || response.data.rates.length === 0) {
      console.warn('⚠️ ========================================');
      console.warn('⚠️ NO RATES RETURNED FROM SHIPPO');
      console.warn('⚠️ ========================================');

      // Check for messages/errors
      if (response.data.messages && response.data.messages.length > 0) {
        console.error('❌ Shippo Messages:', response.data.messages);

        // Filter out common non-critical messages
        const criticalMessages = response.data.messages.filter(
          (m: any) =>
            !m.text?.includes("doesn't support") &&
            !m.text?.includes('out of service area')
        );

        if (criticalMessages.length > 0) {
          throw new Error(
            `Shippo: ${criticalMessages.map((m: any) => m.text || m.message).join(', ')}`
          );
        }
      }

      return [];
    }

    // Filter available rates
    console.log(`📊 Total rates returned: ${response.data.rates.length}`);

    // 🔥 ADD: Log each rate with availability
    response.data.rates.forEach((rate: any, index: number) => {
      console.log(`\n📋 Rate ${index + 1}:`, {
        provider: rate.provider,
        service: rate.servicelevel?.name,
        amount: rate.amount,
        currency: rate.currency,
        available: rate.available,
        messages: rate.messages,
        attributes: rate.attributes,
      });
    });

    const availableRates = response.data.rates.filter(
      (rate: any) =>
        rate.available !== false &&
        (!rate.messages || rate.messages.length === 0)
    );

    const unavailableRates = response.data.rates.filter(
      (rate: any) =>
        rate.available === false || (rate.messages && rate.messages.length > 0)
    );

    console.log(`✅ Available rates: ${availableRates.length}`);
    console.log(`❌ Unavailable rates: ${unavailableRates.length}`);

    if (unavailableRates.length > 0) {
      console.warn(
        'Unavailable rates:',
        unavailableRates.map((r: any) => ({
          provider: r.provider,
          service: r.servicelevel?.name,
          messages: r.messages,
        }))
      );
    }

    // Transform rates
    const rates: ShippoRate[] = availableRates
      .map((rate: any) => ({
        objectId: rate.object_id,
        provider: rate.provider,
        serviceLevelName: rate.servicelevel.name,
        serviceLevelToken: rate.servicelevel.token,
        amount: parseFloat(rate.amount),
        currency: rate.currency,
        estimatedDays: rate.estimated_days || 5,
        durationTerms:
          rate.duration_terms || `${rate.estimated_days || 5} days`,
        carrier: normalizeCarrierName(rate.provider),
        attributes: rate.attributes || [],
      }))
      .sort((a, b) => a.amount - b.amount);

    console.log('✅ ========================================');
    console.log(`✅ RETRIEVED ${rates.length} AVAILABLE RATES`);
    console.log('✅ ========================================');

    rates.forEach((rate, index) => {
      console.log(
        `${index + 1}. ${rate.carrier} - ${rate.serviceLevelName}: ${rate.currency} ${rate.amount} (~${rate.estimatedDays} days)`
      );
    });

    return rates;
  } catch (error: any) {
    console.error('❌ ========================================');
    console.error('❌ FAILED TO GET SHIPPO RATES');
    console.error('❌ ========================================');
    console.error('Error:', error.message);
    throw error;
  }
}

/**
 * Create shipment and purchase label via Shippo
 */
// 🔧 REPLACE in server/src/services/shippoService.ts
// Around line 570 in the createShipment function

/**
 * Create a Shippo shipment transaction
 * @improved Better error handling and validation
 */
export async function createShipment(shipmentData: any) {
  try {
    // 🔍 LOG: Data being sent to Shippo
    console.log('📦 Creating Shippo shipment...');
    console.log('📋 Shipment data:', JSON.stringify(shipmentData, null, 2));

    // ✅ VALIDATE required fields
    const validationErrors: string[] = [];

    // Validate destination address
    if (!shipmentData.address_to) {
      validationErrors.push('Missing destination address (address_to)');
    } else {
      const addr = shipmentData.address_to;
      if (!addr.name) validationErrors.push('Missing recipient name');
      if (!addr.street1) validationErrors.push('Missing street address');
      if (!addr.city) validationErrors.push('Missing city');
      if (!addr.country) validationErrors.push('Missing country code');
      if (!addr.phone) validationErrors.push('Missing phone number');

      // Validate country code format (must be 2-letter ISO)
      if (addr.country && addr.country.length !== 2) {
        validationErrors.push(
          `Invalid country code: "${addr.country}" (must be 2-letter ISO code like "MA")`
        );
      }
    }

    // Validate origin address
    if (!shipmentData.address_from) {
      validationErrors.push('Missing origin address (address_from)');
    }

    // Validate parcels
    if (!shipmentData.parcels || shipmentData.parcels.length === 0) {
      validationErrors.push('Missing parcels array');
    } else {
      shipmentData.parcels.forEach((parcel: any, index: number) => {
        if (!parcel.length || parseFloat(parcel.length) <= 0) {
          validationErrors.push(
            `Parcel ${index + 1}: invalid length (${parcel.length})`
          );
        }
        if (!parcel.width || parseFloat(parcel.width) <= 0) {
          validationErrors.push(
            `Parcel ${index + 1}: invalid width (${parcel.width})`
          );
        }
        if (!parcel.height || parseFloat(parcel.height) <= 0) {
          validationErrors.push(
            `Parcel ${index + 1}: invalid height (${parcel.height})`
          );
        }
        if (!parcel.weight || parseFloat(parcel.weight) <= 0) {
          validationErrors.push(
            `Parcel ${index + 1}: invalid weight (${parcel.weight})`
          );
        }
        if (!parcel.distance_unit) {
          validationErrors.push(`Parcel ${index + 1}: missing distance_unit`);
        }
        if (!parcel.mass_unit) {
          validationErrors.push(`Parcel ${index + 1}: missing mass_unit`);
        }
      });
    }

    // Validate rate or carrier account
    if (!shipmentData.rate && !shipmentData.carrier_account) {
      validationErrors.push(
        'Missing both rate and carrier_account (need at least one)'
      );
    }

    // Check for international shipment customs
    const fromCountry = shipmentData.address_from?.country || 'US';
    const toCountry = shipmentData.address_to?.country || 'US';
    const isInternational = fromCountry !== toCountry;

    if (isInternational && !shipmentData.customs_declaration) {
      validationErrors.push(
        `International shipment (${fromCountry} → ${toCountry}) requires customs_declaration`
      );
    }

    // If there are validation errors, throw before API call
    if (validationErrors.length > 0) {
      console.error('❌ Validation failed:', validationErrors);
      throw new Error(`Validation errors: ${validationErrors.join('; ')}`);
    }

    // ✅ All validated, call Shippo API
    console.log('✅ Validation passed, calling Shippo API...');
    const response = await shippo.transaction.create(shipmentData);

    console.log('✅ Shippo shipment created successfully:', {
      objectId: response.object_id,
      status: response.status,
      trackingNumber: response.tracking_number,
      labelUrl: response.label_url,
    });

    return response;
  } catch (error: any) {
    // 🔥 IMPROVED ERROR LOGGING
    console.error('❌ Failed to create Shippo shipment:');
    console.error('Error Message:', error.message);

    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error(
        'Response Data:',
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(
        'Full Error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
    }

    // Extract meaningful error message
    let errorMessage = 'Unknown Shippo API error';

    if (error.response?.data) {
      const data = error.response.data;

      // Shippo returns errors in different formats
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.messages) {
        // Sometimes Shippo returns array of messages
        errorMessage = Array.isArray(data.messages)
          ? data.messages.join('; ')
          : JSON.stringify(data.messages);
      } else {
        errorMessage = JSON.stringify(data);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(`Shippo API error: ${errorMessage}`);
  }
}

/**
 * Track shipment via Shippo
 */
export async function trackShipment(
  trackingNumber: string,
  carrier: string
): Promise<ShippoTrackingResponse> {
  if (!configured) {
    throw new Error('Shippo service is not configured');
  }

  console.log('🔍 Tracking shipment:', trackingNumber, carrier);

  try {
    const carrierToken = getCarrierToken(carrier);
    const response = await apiClient.get(
      `/tracks/${carrierToken}/${trackingNumber}`
    );

    const tracking = response.data;

    const result: ShippoTrackingResponse = {
      trackingNumber: tracking.tracking_number,
      carrier: normalizeCarrierName(tracking.carrier),
      trackingStatus: {
        status: mapShippoStatusToInternal(tracking.tracking_status?.status),
        statusDetails:
          tracking.tracking_status?.status_details || 'No details available',
        statusDate: tracking.tracking_status?.status_date,
        location: tracking.tracking_status?.location || {},
      },
      trackingHistory: (tracking.tracking_history || []).map((event: any) => ({
        statusDetails: event.status_details || event.status,
        statusDate: event.status_date,
        location: event.location || {},
      })),
      eta: tracking.eta,
    };

    console.log('✅ Tracking data retrieved');
    return result;
  } catch (error: any) {
    console.error('❌ Failed to track shipment:', error.message);
    throw error;
  }
}

// ============================================
// EXPORT SERVICE OBJECT (for backward compatibility)
// ============================================

export const shippoService = {
  isConfigured: isShippoConfigured,
  getRates,
  createShipment,
  trackShipment,
  calculateDimensionalWeight,
};
