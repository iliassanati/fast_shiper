// server/src/controllers/shipmentController.ts - FIXED VERSION
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { Shipment } from '../models/Shipment.js';
import { Package } from '../models/Package.js';
import { PhotoRequest } from '../models/PhotoRequest.js';
import { Consolidation } from '../models/Consolidation.js';
import { createNotification } from '../models/Notification.js';
import { createTransaction } from '../models/Transaction.js';
import { shippoService } from '../services/shippoService.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

/**
 * Get shipping rates from multiple carriers via Shippo
 * POST /api/shipments/get-rates
 */
export const getShippingRates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const {
      weight,
      dimensions,
      destinationCountryCode = 'MA',
      destinationCity,
      destinationPostalCode,
      destinationPhone, // 🔥 NEW
      declaredValue,
    } = req.body;

    console.log('📦 ========================================');
    console.log('📦 GET SHIPPING RATES REQUEST');
    console.log('📦 ========================================');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validations
    if (!weight || parseFloat(weight) <= 0) {
      sendError(res, 'Valid weight is required (must be greater than 0)', 400);
      return;
    }

    if (
      !dimensions ||
      !dimensions.length ||
      !dimensions.width ||
      !dimensions.height
    ) {
      sendError(
        res,
        'Valid dimensions are required (length, width, height)',
        400
      );
      return;
    }

    if (!destinationCity || destinationCity.trim().length === 0) {
      sendError(res, 'Destination city is required', 400);
      return;
    }

    if (!destinationPostalCode || destinationPostalCode.trim().length === 0) {
      sendError(res, 'Destination postal code is required', 400);
      return;
    }

    // 🔥 NEW VALIDATION
    if (!destinationPhone || destinationPhone.trim().length === 0) {
      sendError(
        res,
        'Destination phone number is required for carriers like DHL',
        400
      );
      return;
    }

    if (!shippoService.isConfigured()) {
      console.error('❌ Shippo service is not configured!');
      sendError(
        res,
        'Shipping service is not configured. Please contact support.',
        503
      );
      return;
    }

    console.log('✅ All validations passed');
    console.log('🚚 Fetching shipping rates for user:', req.user.userId);

    // Get rates from Shippo
    const rates = await shippoService.getRates({
      weight: parseFloat(weight),
      dimensions: {
        length: parseFloat(dimensions.length),
        width: parseFloat(dimensions.width),
        height: parseFloat(dimensions.height),
      },
      originCountryCode: 'US',
      destinationCountryCode,
      destinationCity: destinationCity.trim(),
      destinationPostalCode: destinationPostalCode.trim(),
      destinationPhone: destinationPhone.trim(), // 🔥 NEW
      declaredValue: declaredValue ? parseFloat(declaredValue) : undefined,
    });

    console.log(`✅ Retrieved ${rates.length} shipping rates`);

    if (rates.length === 0) {
      sendSuccess(
        res,
        { rates: [] },
        'No shipping rates available. Please verify your destination address and try again.',
        200
      );
      return;
    }

    sendSuccess(
      res,
      { rates },
      `Found ${rates.length} available shipping rates`
    );
  } catch (error: any) {
    console.error('❌ Error getting shipping rates:', error);

    let userMessage = 'Failed to get shipping rates';

    if (error.message.includes('not configured')) {
      userMessage =
        'Shipping service is temporarily unavailable. Please try again later.';
    } else if (
      error.message.includes('Destination') ||
      error.message.includes('phone')
    ) {
      userMessage = 'Please provide a valid destination phone number.';
    } else if (error.message.includes('Shippo')) {
      userMessage = error.message;
    }

    sendError(res, userMessage, 500);
  }
};

// 🔧 COMPLETE FIX for server/src/controllers/shipmentController.ts
// Replace the createNewShipment function with this

import { Request, Response } from 'express';
import { Shipment } from '../models/Shipment';
import { Package } from '../models/Package';
import { shippoService } from '../services/shippoService';
import mongoose from 'mongoose';

/**
 * Format country name to ISO 2-letter code
 */
function formatCountryCode(country: string): string {
  const countryMap: Record<string, string> = {
    Morocco: 'MA',
    'United States': 'US',
    USA: 'US',
    'United Kingdom': 'GB',
    UK: 'GB',
    France: 'FR',
    Germany: 'DE',
    Spain: 'ES',
    Italy: 'IT',
    Canada: 'CA',
    China: 'CN',
    Japan: 'JP',
    'South Korea': 'KR',
    Australia: 'AU',
    Brazil: 'BR',
    India: 'IN',
    Mexico: 'MX',
  };

  // If already 2-letter code, return as-is
  if (country.length === 2) {
    return country.toUpperCase();
  }

  // Look up in map
  const code = countryMap[country];
  if (code) {
    return code;
  }

  // Fallback
  console.warn(`⚠️ Unknown country: "${country}", using as-is`);
  return country;
}

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If doesn't start with +, try to add country code
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('212')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      cleaned = '+212' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Create a new shipment
 */
export async function createNewShipment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🚚 Creating shipment for user:', userId);

    const requestData = req.body;
    console.log('📦 Package IDs:', requestData.packageIds);

    // ✅ VALIDATE required fields
    if (!requestData.packageIds || requestData.packageIds.length === 0) {
      return res
        .status(400)
        .json({ error: 'At least one package is required' });
    }

    if (!requestData.destination) {
      return res.status(400).json({ error: 'Destination address is required' });
    }

    if (!requestData.rateObjectId) {
      return res.status(400).json({ error: 'Rate object ID is required' });
    }

    // ======================================
    // 🔥 FORMAT DATA FOR SHIPPO API
    // ======================================

    const addressTo = {
      name: requestData.destination.fullName,
      street1: requestData.destination.street,
      street2: '',
      city: requestData.destination.city,
      state: requestData.destination.state || '',
      zip: requestData.destination.postalCode || '',
      country: 'MA',
      phone: requestData.destination.phone,
      email: requestData.destination.email || '',
      validate: false,
    };

    const addressFrom = {
      name: 'Fast Shipper Warehouse',
      street1: '123 Warehouse St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'US',
      phone: '+13055551234',
      email: 'warehouse@fastshipper.com',
      validate: false,
    };

    // Get total weight and dimensions from packages
    const packages = await Package.find({
      _id: { $in: requestData.packageIds },
    });

    let totalWeight = packages.reduce(
      (sum, pkg) => sum + (pkg.weight?.value || 0),
      0
    );

    // Convert kg to lb if needed
    if (totalWeight > 0) {
      totalWeight = totalWeight * 2.20462; // kg to lb
    } else {
      totalWeight = 2.5; // default
    }

    const parcels = [
      {
        length: String(requestData.dimensions?.length || 12),
        width: String(requestData.dimensions?.width || 10),
        height: String(requestData.dimensions?.height || 8),
        distance_unit: 'in',
        weight: String(totalWeight.toFixed(2)),
        mass_unit: 'lb',
      },
    ];

    // Create customs declaration if international
    let customsDeclaration = null;
    const isInternational = addressTo.country !== 'US';

    if (
      isInternational &&
      requestData.customsInfo &&
      requestData.customsInfo.length > 0
    ) {
      customsDeclaration = {
        contents_type: 'MERCHANDISE',
        contents_explanation: 'Personal items',
        non_delivery_option: 'RETURN',
        certify: true,
        certify_signer: addressTo.name,
        incoterm: 'DDU',
        items: requestData.customsInfo.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          net_weight: String(item.weight || 0.5),
          mass_unit: 'kg',
          value_amount: String(item.value),
          value_currency: 'USD',
          origin_country: item.countryOfOrigin || 'US',
          tariff_number: item.hsCode || '',
        })),
        eel_pfc: 'NOEEI 30.37(a)',
      };
    }

    const shippoData: any = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: parcels,
      rate: requestData.rateObjectId,
      metaData: {
        user_id: userId.substring(0, 24), // Truncate if needed
        pkg_count: String(requestData.packageIds.length), // Just the count, not IDs
        carrier: requestData.carrier.substring(0, 10), // Shorten carrier name}
        // metadata: {
        //   userId: userId,
        //   packageIds: requestData.packageIds.join(','),
        //   carrier: requestData.carrier,
        //   serviceLevel: requestData.serviceLevel,
      },
    };

    if (customsDeclaration) {
      shippoData.customs_declaration = customsDeclaration;
    }

    if (requestData.insurance?.enabled && requestData.insurance.coverage > 0) {
      shippoData.insurance_amount = String(requestData.insurance.coverage);
      shippoData.insurance_currency = 'USD';
    }

    console.log('✅ Final Shippo data ready');

    // ======================================
    // 🚀 CREATE SHIPPO SHIPMENT
    // ======================================

    const shippoShipment = await shippoService.createShipment(shippoData);

    console.log('✅ Shippo shipment created:', {
      objectId: shippoShipment.object_id,
      trackingNumber: shippoShipment.tracking_number,
      status: shippoShipment.status,
    });

    // ======================================
    // 💾 SAVE TO DATABASE
    // ======================================

    // Update packages status
    await Package.updateMany(
      { _id: { $in: requestData.packageIds } },
      { status: 'shipped' }
    );

    // Create shipment record
    // Create shipment record
    const newShipment = await Shipment.create({
      user: userId,
      packages: requestData.packageIds,
      trackingNumber: shippoShipment.tracking_number || 'PENDING',
      carrier: requestData.carrier,
      serviceLevelName: requestData.serviceLevel,
      status: shippoShipment.status === 'SUCCESS' ? 'in_transit' : 'pending',
      recipientInfo: {
        name: requestData.destination.fullName, // fullName → name
        address: requestData.destination.street, // street → address
        city: requestData.destination.city,
        state: requestData.destination.state || '',
        postalCode: requestData.destination.postalCode,
        country: requestData.destination.country,
        phone: requestData.destination.phone,
        email: requestData.destination.email || '',
      },
      dimensions: requestData.dimensions || {
        length: 12,
        width: 10,
        height: 8,
      },
      weight: totalWeight,
      declaredValue: requestData.insurance?.coverage || 0,
      shippingCost: requestData.cost?.shipping || 0,
      photoRequestFees: requestData.cost?.photoRequests || 0,
      protectionFee: requestData.cost?.protection || 0,
      totalCost: requestData.cost?.total || 0,
      paymentStatus: requestData.payment ? 'paid' : 'pending',
      paymentIntentId: requestData.payment?.transactionId,
      labelUrl: shippoShipment.label_url,
      trackingUrl: shippoShipment.tracking_url_provider,
      estimatedDelivery: shippoShipment.eta,
      shippoTransactionId: shippoShipment.object_id,
    });

    console.log('✅ Shipment saved to database:', newShipment._id);

    // ======================================
    // 💰 CREATE TRANSACTION RECORD
    // ======================================

    // 🔥 NEW: Create transaction for admin tracking
    await createTransaction({
      userId: userId,
      type: 'shipping',
      relatedId: newShipment._id,
      relatedModel: 'Shipment',
      status: requestData.payment ? 'completed' : 'pending',
      amount: {
        value: requestData.cost?.total || 0,
        currency: 'USD',
      },
      paymentMethod: requestData.payment?.paymentMethod || 'pending',
      description: `Shipment ${newShipment.trackingNumber} - ${requestData.carrier}`,
      metadata: {
        carrier: requestData.carrier,
        serviceLevel: requestData.serviceLevel,
        trackingNumber: newShipment.trackingNumber,
        packageCount: requestData.packageIds.length,
        paymentTransactionId: requestData.payment?.transactionId,
      },
      completedAt: requestData.payment ? new Date() : undefined,
    });

    console.log('✅ Transaction record created');

    // ======================================
    // 📤 RESPOND TO FRONTEND
    // ======================================

    return res.status(201).json({
      success: true,
      data: {
        shipment: {
          id: newShipment._id,
          trackingNumber: newShipment.trackingNumber,
          labelUrl: newShipment.labelUrl,
          trackingUrl: newShipment.trackingUrl,
          carrier: newShipment.carrier,
          status: newShipment.status,
          estimatedDelivery: newShipment.estimatedDelivery,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating shipment:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create shipment',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

/**
 * Get all shipments for current user
 * GET /api/shipments
 */
export const getShipments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    const filters: any = {
      userId: req.user.userId,
    };

    if (status) {
      filters.status = status;
    }

    const shipments = await Shipment.find(filters)
      .populate('packageIds', 'description retailer trackingNumber')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Shipment.countDocuments(filters);

    sendSuccess(res, {
      shipments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('❌ Error getting shipments:', error);
    sendError(res, error.message || 'Failed to get shipments', 500);
  }
};

/**
 * Get single shipment by ID
 * GET /api/shipments/:id
 */
export const getShipmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;

    const shipment = await Shipment.findOne({
      _id: id,
      userId: req.user.userId,
    }).populate('packageIds');

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    sendSuccess(res, { shipment });
  } catch (error: any) {
    console.error('❌ Error getting shipment:', error);
    sendError(res, error.message || 'Failed to get shipment', 500);
  }
};

/**
 * Track shipment
 * GET /api/shipments/:id/track
 */
export const trackShipment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;

    const shipment = await Shipment.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Get tracking from Shippo
    const tracking = await shippoService.trackShipment(
      shipment.trackingNumber,
      shipment.carrier
    );

    // Update shipment status if changed
    const newStatus = tracking.trackingStatus.status as any;
    if (newStatus !== shipment.status) {
      shipment.status = newStatus;

      if (newStatus === 'delivered' && !shipment.actualDelivery) {
        shipment.actualDelivery = new Date();

        // Create delivery notification
        await createNotification({
          userId: req.user.userId,
          type: 'shipment_update',
          title: 'Package Delivered!',
          message: `Your shipment (${shipment.trackingNumber}) has been delivered.`,
          relatedId: shipment._id,
          relatedModel: 'Shipment',
          priority: 'high',
          actionUrl: `/shipments/${shipment._id}`,
        } as any);
      }

      await shipment.save();
    }

    sendSuccess(res, {
      shipment,
      tracking,
    });
  } catch (error: any) {
    console.error('❌ Error tracking shipment:', error);
    sendError(res, error.message || 'Failed to track shipment', 500);
  }
};

/**
 * Download shipping label
 * GET /api/shipments/:id/label
 */
export const downloadLabel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;

    const shipment = await Shipment.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    if (!shipment.labelUrl) {
      sendError(res, 'Label URL not found for this shipment', 404);
      return;
    }

    sendSuccess(res, {
      labelUrl: shipment.labelUrl,
      trackingNumber: shipment.trackingNumber,
    });
  } catch (error: any) {
    console.error('❌ Error downloading label:', error);
    sendError(res, error.message || 'Failed to download label', 500);
  }
};
