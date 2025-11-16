// server/src/services/dhlService.ts
import axios from 'axios';
import type { IShipment } from '../types/index.js';

interface DHLCredentials {
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  baseUrl: string;
}

interface DHLAddress {
  name: string;
  company?: string;
  street: string;
  city: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  email?: string;
}

interface DHLPackage {
  weight: number; // kg
  length: number; // cm
  width: number;
  height: number;
}

interface DHLShipmentRequest {
  shipment: IShipment;
  includeLabel?: boolean;
}

interface DHLRateRequest {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  originCountryCode: string;
  destinationCountryCode: string;
}

class DHLService {
  private credentials: DHLCredentials;
  private configured: boolean = false;

  constructor() {
    this.credentials = {
      apiKey: process.env.DHL_API_KEY || '',
      apiSecret: process.env.DHL_API_SECRET || '',
      accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
      baseUrl:
        process.env.DHL_API_URL || 'https://express.api.dhl.com/mydhlapi/test',
    };

    this.configured = !!(
      this.credentials.apiKey &&
      this.credentials.apiSecret &&
      this.credentials.accountNumber
    );

    if (this.configured) {
      console.log('✅ DHL Service configured successfully');
    } else {
      console.warn('⚠️ DHL Service not configured - missing credentials');
    }
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Get authentication headers for DHL API
   */
  private getAuthHeaders() {
    const auth = Buffer.from(
      `${this.credentials.apiKey}:${this.credentials.apiSecret}`
    ).toString('base64');

    return {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get shipping rates from DHL
   */
  async getRates(request: DHLRateRequest) {
    if (!this.configured) {
      throw new Error('DHL service is not configured');
    }

    try {
      const response = await axios.post(
        `${this.credentials.baseUrl}/rates`,
        {
          customerDetails: {
            shipperDetails: {
              postalCode: '10001',
              cityName: 'New York',
              countryCode: request.originCountryCode,
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
              number: this.credentials.accountNumber,
            },
          ],
          productCode: 'P', // Express Worldwide
          localProductCode: 'P',
          valueAddedServices: [
            {
              serviceCode: 'II', // Insurance
            },
          ],
          payerCountryCode: request.originCountryCode,
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
        },
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data.products.map((product: any) => ({
        productCode: product.productCode,
        productName: product.productName,
        totalPrice: product.totalPrice[0].price,
        currency: product.totalPrice[0].priceCurrency,
        deliveryTime: product.deliveryCapabilities?.totalTransitDays,
        serviceLevel: this.getServiceLevel(product.productCode),
      }));
    } catch (error: any) {
      console.error('DHL Rates Error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Failed to get DHL rates'
      );
    }
  }

  /**
   * Create DHL shipment and generate label
   */
  async createShipment(request: DHLShipmentRequest) {
    if (!this.configured) {
      throw new Error('DHL service is not configured');
    }

    const { shipment } = request;

    try {
      // Prepare shipment data for DHL API
      const dhlShipmentData = {
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
        accounts: [
          {
            typeCode: 'shipper',
            number: this.credentials.accountNumber,
          },
        ],
        customerDetails: {
          shipperDetails: {
            postalAddress: {
              postalCode: '10001',
              cityName: 'New York',
              countryCode: 'US',
              addressLine1: '123 Warehouse St',
            },
            contactInformation: {
              email: 'warehouse@fastshipper.com',
              phone: '+1234567890',
              companyName: 'Fast Shipper Inc',
              fullName: 'Fast Shipper Warehouse',
            },
          },
          receiverDetails: {
            postalAddress: {
              postalCode: shipment.destination.postalCode,
              cityName: shipment.destination.city,
              countryCode: 'MA',
              addressLine1: shipment.destination.street,
            },
            contactInformation: {
              email: 'customer@example.com',
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
              customerReferences: [
                {
                  value: shipment._id.toString(),
                  typeCode: 'CU',
                },
              ],
            },
          ],
          isCustomsDeclarable: true,
          declaredValue: shipment.insurance?.coverage || 100,
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
                  value: item.hsCode || '9999.99.99',
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
              number: `INV-${shipment._id}`,
              date: new Date().toISOString().split('T')[0],
            },
          },
          description: 'Personal Items',
          incoterm: 'DAP',
        },
        outputImageProperties: {
          imageOptions: [
            {
              typeCode: 'label',
              templateName: 'ECOM26_84_001',
              isRequested: request.includeLabel !== false,
            },
            {
              typeCode: 'waybillDoc',
              templateName: 'ARCH_8X4',
              isRequested: true,
            },
          ],
        },
      };

      const response = await axios.post(
        `${this.credentials.baseUrl}/shipments`,
        dhlShipmentData,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const shipmentData = response.data.packages[0];

      return {
        shipmentTrackingNumber: response.data.shipmentTrackingNumber,
        trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${response.data.shipmentTrackingNumber}`,
        labelUrl: shipmentData.documents?.find(
          (doc: any) => doc.typeCode === 'label'
        )?.content,
        waybillUrl: shipmentData.documents?.find(
          (doc: any) => doc.typeCode === 'waybillDoc'
        )?.content,
        estimatedDelivery:
          response.data.estimatedDeliveryDate?.deliveryDateTime,
      };
    } catch (error: any) {
      console.error(
        'DHL Shipment Creation Error:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || 'Failed to create DHL shipment'
      );
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string) {
    if (!this.configured) {
      throw new Error('DHL service is not configured');
    }

    try {
      const response = await axios.get(
        `${this.credentials.baseUrl}/track/shipments`,
        {
          params: {
            trackingNumber,
          },
          headers: this.getAuthHeaders(),
        }
      );

      const shipment = response.data.shipments[0];

      return {
        trackingNumber: shipment.id,
        status: this.mapDHLStatus(shipment.status.statusCode),
        events: shipment.events.map((event: any) => ({
          status: this.mapDHLStatus(event.statusCode),
          location: `${event.location?.address?.addressLocality || ''}, ${
            event.location?.address?.countryCode || ''
          }`,
          description: event.description,
          timestamp: new Date(event.timestamp),
        })),
        estimatedDelivery: shipment.estimatedDeliveryDate,
      };
    } catch (error: any) {
      console.error(
        'DHL Tracking Error:',
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || 'Failed to track DHL shipment'
      );
    }
  }

  /**
   * Map service level to DHL product code
   */
  private getProductCode(carrier: string, serviceLevel: string): string {
    const mapping: Record<string, string> = {
      express: 'P', // Express Worldwide
      standard: 'Y', // Economy Select
      priority: 'D', // Express 12:00
    };

    return mapping[serviceLevel.toLowerCase()] || 'P';
  }

  /**
   * Map product code to service level name
   */
  private getServiceLevel(productCode: string): string {
    const mapping: Record<string, string> = {
      P: 'Express Worldwide',
      Y: 'Economy Select',
      D: 'Express 12:00',
      T: 'Express 9:00',
      N: 'Domestic Express',
    };

    return mapping[productCode] || 'Express';
  }

  /**
   * Map DHL status to our internal status
   */
  private mapDHLStatus(dhlStatus: string): string {
    const mapping: Record<string, string> = {
      PU: 'pending', // Shipment information received
      PL: 'processing', // Picked up
      RCS: 'in_transit', // Received at DHL facility
      WC: 'in_transit', // With delivery courier
      OK: 'delivered', // Delivered
      DF: 'delivered', // Delivered to final destination
      DD: 'delivered', // Delivered, signed for
    };

    return mapping[dhlStatus] || 'in_transit';
  }
}

export const dhlService = new DHLService();
