// server/src/services/shippoService.ts - FIXED VERSION WITH BETTER LOGGING
import axios, { AxiosInstance } from 'axios';
import type { IShipment } from '../types/index.js';

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

class ShippoService {
  private credentials: ShippoCredentials;
  private configured: boolean = false;
  private apiClient: AxiosInstance;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.credentials = {
      apiToken: process.env.SHIPPO_API_TOKEN || '',
      baseUrl: 'https://api.goshippo.com',
      isProduction,
    };

    this.configured = !!this.credentials.apiToken;

    // Create axios instance
    this.apiClient = axios.create({
      baseURL: this.credentials.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ShippoToken ${this.credentials.apiToken}`,
      },
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const message =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message;
        console.error('❌ Shippo API Error:', {
          status: error.response?.status,
          message,
          data: error.response?.data,
        });
        throw new Error(`Shippo API Error: ${message}`);
      }
    );

    if (this.configured) {
      console.log(
        `✅ Shippo Service configured (${isProduction ? 'PRODUCTION' : 'TEST'} mode)`
      );
    } else {
      console.warn('⚠️ Shippo Service not configured - missing API token');
      console.warn('   Set SHIPPO_API_TOKEN in your .env file');
    }
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Get shipping rates from multiple carriers via Shippo
   */
  async getRates(request: ShippoRateRequest): Promise<ShippoRate[]> {
    if (!this.configured) {
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
      destination: `${request.destinationCity || 'Casablanca'}, ${request.destinationCountryCode}`,
      declaredValue: request.declaredValue
        ? `$${request.declaredValue}`
        : 'Not specified',
    });

    try {
      // CRITICAL FIX: Validate required fields
      if (!request.destinationCity) {
        throw new Error('Destination city is required');
      }

      if (!request.destinationPostalCode) {
        throw new Error('Destination postal code is required');
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

      // FIXED: Create proper address objects with validation
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
        validate: true, // ADDED: Ask Shippo to validate address
      };

      // FIXED: Properly format destination address
      const addressTo = {
        name: 'Recipient', // Will be replaced with actual recipient name during shipment creation
        street1: 'Street Address', // Generic - will be replaced with actual address
        city: request.destinationCity,
        zip: request.destinationPostalCode,
        country: request.destinationCountryCode,
        validate: true, // ADDED: Ask Shippo to validate address
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

      // Optional: Add customs declaration for international shipments
      if (request.declaredValue && request.declaredValue > 0) {
        const customsDeclaration = {
          contents_type: 'MERCHANDISE',
          contents_explanation: 'Personal items',
          non_delivery_option: 'RETURN',
          certify: true,
          certify_signer: DEFAULT_ORIGIN.name,
          items: [
            {
              description: 'Personal items',
              quantity: 1,
              net_weight: weightInLb.toFixed(2),
              mass_unit: 'lb',
              value_amount: request.declaredValue.toFixed(2),
              value_currency: 'USD',
              origin_country: request.originCountryCode,
            },
          ],
        };
        shipmentData.customs_declaration = customsDeclaration;
        console.log('📋 Customs Declaration:', customsDeclaration);
      }

      console.log('🚀 Sending request to Shippo API...');
      console.log(
        'Full request payload:',
        JSON.stringify(shipmentData, null, 2)
      );

      const response = await this.apiClient.post('/shipments/', shipmentData);

      console.log('📨 Shippo API Response Status:', response.status);
      console.log('📨 Response data:', JSON.stringify(response.data, null, 2));

      // FIXED: Better error handling for no rates
      if (!response.data.rates || response.data.rates.length === 0) {
        console.warn('⚠️ ========================================');
        console.warn('⚠️ NO RATES RETURNED FROM SHIPPO');
        console.warn('⚠️ ========================================');

        // Check for messages/errors in response
        if (response.data.messages && response.data.messages.length > 0) {
          console.error('❌ Shippo Messages:', response.data.messages);
          throw new Error(
            `Shippo: ${response.data.messages.map((m: any) => m.text || m.message).join(', ')}`
          );
        }

        // Check address validation results
        if (response.data.address_from?.validation_results) {
          console.warn(
            '⚠️ Origin Address Validation:',
            response.data.address_from.validation_results
          );
        }
        if (response.data.address_to?.validation_results) {
          console.warn(
            '⚠️ Destination Address Validation:',
            response.data.address_to.validation_results
          );
        }

        console.warn('Possible reasons:');
        console.warn('1. Invalid destination address');
        console.warn('2. Carriers dont service this route');
        console.warn('3. Package dimensions/weight outside carrier limits');
        console.warn('4. Shippo account issues');

        return [];
      }

      // FIXED: Better rate filtering and logging
      console.log(`📊 Total rates returned: ${response.data.rates.length}`);

      const availableRates = response.data.rates.filter(
        (rate: any) => rate.available
      );
      const unavailableRates = response.data.rates.filter(
        (rate: any) => !rate.available
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

      // Filter and transform rates
      const rates: ShippoRate[] = availableRates
        .map((rate: any) => ({
          objectId: rate.object_id,
          provider: rate.provider,
          serviceLevelName: rate.servicelevel.name,
          serviceLevelToken: rate.servicelevel.token,
          amount: parseFloat(rate.amount),
          currency: rate.currency,
          estimatedDays: rate.estimated_days || rate.duration_terms || 5,
          durationTerms: rate.duration_terms || `${rate.estimated_days} days`,
          carrier: this.normalizeCarrierName(rate.provider),
          attributes: rate.attributes || [],
        }))
        .sort((a: any, b: any) => a.amount - b.amount); // Sort by price

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
      console.error('Full error:', error);
      throw error;
    }
  }

  /**
   * Create shipment and purchase label via Shippo
   */
  async createShipment(
    shipment: IShipment,
    rateObjectId: string
  ): Promise<ShippoShipmentResponse> {
    if (!this.configured) {
      throw new Error('Shippo service is not configured');
    }

    console.log('📦 Creating Shippo shipment with rate:', rateObjectId);

    try {
      // Purchase the label using the selected rate
      const transactionResponse = await this.apiClient.post('/transactions/', {
        rate: rateObjectId,
        label_file_type: 'PDF',
        async: false,
      });

      const transaction = transactionResponse.data;

      if (transaction.status !== 'SUCCESS') {
        throw new Error(
          `Shipment creation failed: ${transaction.messages?.join(', ') || 'Unknown error'}`
        );
      }

      const result: ShippoShipmentResponse = {
        objectId: transaction.object_id,
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        labelUrl: transaction.label_url,
        carrier: this.normalizeCarrierName(transaction.rate.provider),
        serviceLevelName: transaction.rate.servicelevel.name,
        estimatedDelivery: transaction.eta,
        rate: {
          objectId: transaction.rate.object_id,
          amount: parseFloat(transaction.rate.amount),
          currency: transaction.rate.currency,
        },
      };

      console.log('✅ Shippo shipment created:', result.trackingNumber);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to create Shippo shipment:', error.message);
      throw error;
    }
  }

  /**
   * Track shipment via Shippo
   */
  async trackShipment(
    trackingNumber: string,
    carrier: string
  ): Promise<ShippoTrackingResponse> {
    if (!this.configured) {
      throw new Error('Shippo service is not configured');
    }

    console.log('🔍 Tracking shipment:', trackingNumber, carrier);

    try {
      const carrierToken = this.getCarrierToken(carrier);
      const response = await this.apiClient.get(
        `/tracks/${carrierToken}/${trackingNumber}`
      );

      const tracking = response.data;

      const result: ShippoTrackingResponse = {
        trackingNumber: tracking.tracking_number,
        carrier: this.normalizeCarrierName(tracking.carrier),
        trackingStatus: {
          status: this.mapShippoStatusToInternal(
            tracking.tracking_status?.status
          ),
          statusDetails:
            tracking.tracking_status?.status_details || 'No details available',
          statusDate: tracking.tracking_status?.status_date,
          location: tracking.tracking_status?.location || {},
        },
        trackingHistory: (tracking.tracking_history || []).map(
          (event: any) => ({
            statusDetails: event.status_details || event.status,
            statusDate: event.status_date,
            location: event.location || {},
          })
        ),
        eta: tracking.eta,
      };

      console.log('✅ Tracking data retrieved');
      return result;
    } catch (error: any) {
      console.error('❌ Failed to track shipment:', error.message);
      throw error;
    }
  }

  /**
   * Normalize carrier name for consistency
   */
  private normalizeCarrierName(provider: string): string {
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
  private getCarrierToken(carrier: string): string {
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
  private mapShippoStatusToInternal(shippoStatus: string): string {
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
  public calculateDimensionalWeight(
    length: number,
    width: number,
    height: number
  ): number {
    // Shippo uses carrier-specific formulas, but for reference:
    // DHL formula: L x W x H / 5000 (in cm)
    return Math.ceil(((length * width * height) / 5000) * 10) / 10;
  }
}

export const shippoService = new ShippoService();
``;
