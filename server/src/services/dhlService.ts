// server/src/services/dhlService.ts
import axios from 'axios';
import type { IShipment } from '../types/index.js';

interface DHLShipmentRequest {
  shipment: IShipment;
  includeLabel?: boolean;
}

interface DHLShipmentResponse {
  shipmentTrackingNumber: string;
  trackingUrl: string;
  labelUrl?: string;
  dispatchConfirmationNumber: string;
  packages: Array<{
    referenceNumber: number;
    trackingNumber: string;
    trackingUrl: string;
  }>;
}

interface DHLRateRequest {
  weight: number; // in kg
  dimensions: {
    length: number; // in cm
    width: number;
    height: number;
  };
  originCountryCode: string;
  destinationCountryCode: string;
}

interface DHLRate {
  serviceCode: string;
  serviceName: string;
  totalPrice: {
    price: number;
    currency: string;
  };
  deliveryTime: string;
}

class DHLService {
  private apiUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private accountNumber: string;
  private shipperInfo: {
    name: string;
    company: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
  };

  constructor() {
    this.apiUrl =
      process.env.DHL_API_URL || 'https://api-sandbox.dhl.com/mydhlapi';
    this.apiKey = process.env.DHL_API_KEY || '';
    this.apiSecret = process.env.DHL_API_SECRET || '';
    this.accountNumber = process.env.DHL_ACCOUNT_NUMBER || '';

    this.shipperInfo = {
      name: process.env.DHL_SHIPPER_NAME || 'Fast Shipper Warehouse',
      company: process.env.DHL_SHIPPER_COMPANY || 'Fast Shipper LLC',
      street: process.env.DHL_SHIPPER_STREET || '123 Warehouse Street',
      city: process.env.DHL_SHIPPER_CITY || 'New York',
      postalCode: process.env.DHL_SHIPPER_POSTAL_CODE || '10001',
      country: process.env.DHL_SHIPPER_COUNTRY || 'US',
      phone: process.env.DHL_SHIPPER_PHONE || '+1-555-0100',
      email: process.env.DHL_SHIPPER_EMAIL || 'warehouse@fastshipper.com',
    };
  }

  /**
   * Get Base64 encoded credentials for DHL API
   */
  private getAuthHeader(): string {
    const credentials = `${this.apiKey}:${this.apiSecret}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Create a shipping label with DHL
   */
  async createShipment(
    request: DHLShipmentRequest
  ): Promise<DHLShipmentResponse> {
    try {
      const { shipment, includeLabel = true } = request;

      // Prepare DHL API request
      const dhlRequest = {
        plannedShippingDateAndTime: new Date().toISOString(),
        pickup: {
          isRequested: false,
        },
        productCode: this.getProductCode(
          shipment.carrier,
          shipment.serviceLevel
        ),
        localProductCode: this.getProductCode(
          shipment.carrier,
          shipment.serviceLevel
        ),
        getRateEstimates: false,
        accounts: [
          {
            typeCode: 'shipper',
            number: this.accountNumber,
          },
        ],
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: this.shipperInfo.postalCode,
              cityName: this.shipperInfo.city,
              countryCode: this.shipperInfo.country,
              addressLine1: this.shipperInfo.street,
            },
            contactInformation: {
              email: this.shipperInfo.email,
              phone: this.shipperInfo.phone,
              companyName: this.shipperInfo.company,
              fullName: this.shipperInfo.name,
            },
          },
          receiverDetails: {
            postalAddress: {
              postalCode: shipment.destination.postalCode,
              cityName: shipment.destination.city,
              countryCode: 'MA', // Morocco
              addressLine1: shipment.destination.street,
            },
            contactInformation: {
              email: 'customer@example.com', // Get from user
              phone: shipment.destination.phone,
              companyName: '',
              fullName: shipment.destination.fullName,
            },
          },
        },
        content: {
          packages: [
            {
              weight: shipment.weight.total,
              dimensions: {
                length: shipment.dimensions.length,
                width: shipment.dimensions.width,
                height: shipment.dimensions.height,
              },
            },
          ],
          isCustomsDeclarable: true,
          declaredValue: this.calculateTotalValue(shipment.customsInfo),
          declaredValueCurrency: 'USD',
          exportDeclaration: {
            lineItems: shipment.customsInfo.map((item, index) => ({
              number: index + 1,
              description: item.description,
              price: item.value,
              quantity: {
                value: item.quantity,
                unitOfMeasurement: 'PCS',
              },
              commodityCodes: [
                {
                  typeCode: 'outbound',
                  value: item.hsCode || '999999',
                },
              ],
              exportReasonType: 'permanent',
              manufacturerCountry: item.countryOfOrigin,
              weight: {
                netValue: shipment.weight.total / shipment.customsInfo.length,
                grossValue: shipment.weight.total / shipment.customsInfo.length,
              },
            })),
            invoice: {
              number: `INV-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
            },
          },
          description: 'Personal effects',
          incoterm: 'DAP',
        },
        outputImageProperties: includeLabel
          ? {
              printerDPI: 300,
              encodingFormat: 'pdf',
              imageOptions: [
                {
                  typeCode: 'label',
                  templateName: 'ECOM26_A6_001',
                  isRequested: true,
                },
                {
                  typeCode: 'waybillDoc',
                  templateName: 'ARCH_8X4',
                  isRequested: true,
                },
              ],
            }
          : undefined,
      };

      // Make API call to DHL
      const response = await axios.post(
        `${this.apiUrl}/shipments`,
        dhlRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      // Extract response data
      const data = response.data;
      const shipmentResponse: DHLShipmentResponse = {
        shipmentTrackingNumber: data.shipmentTrackingNumber,
        trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${data.shipmentTrackingNumber}&brand=DHL`,
        dispatchConfirmationNumber: data.dispatchConfirmationNumber,
        packages: data.packages.map((pkg: any) => ({
          referenceNumber: pkg.referenceNumber,
          trackingNumber: pkg.trackingNumber,
          trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${pkg.trackingNumber}&brand=DHL`,
        })),
      };

      // Add label URL if available
      if (data.documents && data.documents.length > 0) {
        const labelDoc = data.documents.find(
          (doc: any) => doc.typeCode === 'label'
        );
        if (labelDoc) {
          shipmentResponse.labelUrl = labelDoc.content; // Base64 PDF
        }
      }

      return shipmentResponse;
    } catch (error: any) {
      console.error('DHL API Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to create DHL shipment'
      );
    }
  }

  /**
   * Get shipping rates from DHL
   */
  async getRates(request: DHLRateRequest): Promise<DHLRate[]> {
    try {
      const ratesRequest = {
        customerDetails: {
          shipperDetails: {
            postalCode: this.shipperInfo.postalCode,
            cityName: this.shipperInfo.city,
            countryCode: this.shipperInfo.country,
          },
          receiverDetails: {
            postalCode: '20000',
            cityName: 'Casablanca',
            countryCode: request.destinationCountryCode,
          },
        },
        accounts: [
          {
            typeCode: 'shipper',
            number: this.accountNumber,
          },
        ],
        plannedShippingDateAndTime: new Date().toISOString(),
        unitOfMeasurement: 'metric',
        isCustomsDeclarable: true,
        monetaryAmount: [
          {
            typeCode: 'declaredValue',
            value: 100,
            currency: 'USD',
          },
        ],
        requestAllValueAddedServices: false,
        packages: [
          {
            weight: request.weight,
            dimensions: {
              length: request.dimensions.length,
              width: request.dimensions.width,
              height: request.dimensions.height,
            },
          },
        ],
      };

      const response = await axios.post(`${this.apiUrl}/rates`, ratesRequest, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.getAuthHeader()}`,
        },
      });

      const products = response.data.products || [];
      return products.map((product: any) => ({
        serviceCode: product.productCode,
        serviceName: product.productName,
        totalPrice: {
          price: product.totalPrice[0]?.price || 0,
          currency: product.totalPrice[0]?.currency || 'USD',
        },
        deliveryTime: product.deliveryCapabilities?.deliveryTypeCode || 'QDDC',
      }));
    } catch (error: any) {
      console.error(
        'DHL Rates API Error:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get DHL rates'
      );
    }
  }

  /**
   * Track a shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/shipments/${trackingNumber}/tracking`,
        {
          headers: {
            Authorization: `Basic ${this.getAuthHeader()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        'DHL Tracking API Error:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || 'Failed to track shipment'
      );
    }
  }

  /**
   * Get DHL product code based on carrier and service level
   */
  private getProductCode(carrier: string, serviceLevel: string): string {
    // DHL Express product codes
    const productCodes: Record<string, string> = {
      'express-worldwide': 'P',
      'express-12:00': 'T',
      'express-9:00': 'Y',
      'economy-select': 'W',
      'domestic-express': 'N',
    };

    return productCodes[serviceLevel.toLowerCase()] || 'P'; // Default to Worldwide Express
  }

  /**
   * Calculate total declared value
   */
  private calculateTotalValue(customsInfo: IShipment['customsInfo']): number {
    return customsInfo.reduce(
      (total, item) => total + item.value * item.quantity,
      0
    );
  }

  /**
   * Validate DHL configuration
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret && this.accountNumber);
  }
}

export const dhlService = new DHLService();
