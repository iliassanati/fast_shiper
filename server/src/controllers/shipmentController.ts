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
      declaredValue,
    } = req.body;

    console.log('📦 ========================================');
    console.log('📦 GET SHIPPING RATES REQUEST');
    console.log('📦 ========================================');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // FIXED: Better validation with specific error messages
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

    // FIXED: Check if Shippo is configured
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

    // FIXED: Better error messages for users
    let userMessage = 'Failed to get shipping rates';

    if (error.message.includes('not configured')) {
      userMessage =
        'Shipping service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('Destination')) {
      userMessage =
        'Invalid destination address. Please check your city and postal code.';
    } else if (error.message.includes('Shippo')) {
      userMessage = error.message;
    }

    sendError(res, userMessage, 500);
  }
};

/**
 * Create a new shipment
 * POST /api/shipments
 */
export const createNewShipment = async (
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
      packageIds,
      destination,
      carrier,
      serviceLevel,
      rateObjectId,
      insurance,
      customsInfo,
      cost,
      payment,
      notes,
    } = req.body;

    // Validate required fields
    if (!packageIds || packageIds.length === 0) {
      sendError(res, 'At least one package is required', 400);
      return;
    }

    if (!destination) {
      sendError(res, 'Destination information is required', 400);
      return;
    }

    if (!rateObjectId) {
      sendError(res, 'Rate object ID is required for shipment creation', 400);
      return;
    }

    if (!payment) {
      sendError(res, 'Payment information is required', 400);
      return;
    }

    console.log('🚚 Creating shipment for user:', req.user.userId);
    console.log('📦 Package IDs:', packageIds);

    // 1. Verify packages belong to user and are in 'received' status
    const packages = await Package.find({
      _id: { $in: packageIds },
      userId: req.user.userId,
    });

    if (packages.length !== packageIds.length) {
      sendError(res, 'Some packages not found or do not belong to you', 404);
      return;
    }

    // Check all packages are in received status
    const invalidPackages = packages.filter((pkg) => pkg.status !== 'received');
    if (invalidPackages.length > 0) {
      sendError(
        res,
        `Cannot ship packages that are not in storage. ${invalidPackages.length} package(s) have invalid status.`,
        400
      );
      return;
    }

    // 2. Calculate total weight and dimensions
    const totalWeight = packages.reduce(
      (sum, pkg) => sum + (pkg.weight?.value || 0),
      0
    );

    const maxLength = Math.max(
      ...packages.map((pkg) => pkg.dimensions?.length || 0)
    );
    const maxWidth = Math.max(
      ...packages.map((pkg) => pkg.dimensions?.width || 0)
    );
    const totalHeight = packages.reduce(
      (sum, pkg) => sum + (pkg.dimensions?.height || 0),
      0
    );

    // 3. Check for unpaid photo requests
    const unpaidPhotoRequests = await PhotoRequest.find({
      packageId: { $in: packageIds },
      'billing.charged': false,
    });

    const photoRequestFee = unpaidPhotoRequests.length * 2; // $2 per photo request

    // 4. Check for consolidation with extra protection
    let protectionFee = 0;
    if (packages[0].consolidationId) {
      const consolidation = await Consolidation.findById(
        packages[0].consolidationId
      );
      if (consolidation?.preferences.addProtection) {
        protectionFee = 2; // $2 for extra protection
      }
    }

    console.log('💰 Fees:', {
      shipping: cost.shipping,
      photoRequests: photoRequestFee,
      protection: protectionFee,
      insurance: cost.insurance || 0,
    });

    // 5. Calculate total declared value
    const declaredValue = packages.reduce(
      (sum, pkg) => sum + (pkg.estimatedValue?.amount || 0),
      0
    );

    // 6. Create shipment via Shippo (purchase label)
    console.log('🌐 Creating Shippo shipment with rate:', rateObjectId);

    // Build shipment data for Shippo
    const shippoShipmentData = {
      userId: req.user.userId,
      packageIds,
      carrier,
      serviceLevel,
      destination,
      weight: { total: totalWeight, unit: 'kg' as const },
      dimensions: {
        length: maxLength,
        width: maxWidth,
        height: totalHeight,
        unit: 'cm' as const,
      },
      cost: {
        shipping: cost.shipping,
        insurance: cost.insurance || 0,
        total: cost.total + photoRequestFee + protectionFee,
        currency: cost.currency || 'USD',
      },
      insurance: insurance || { coverage: 0, cost: 0 },
      customsInfo: customsInfo || [],
      notes: notes || '',
    };

    const shippoShipment = await shippoService.createShipment(
      shippoShipmentData as any,
      rateObjectId
    );

    console.log('✅ Shippo shipment created:', shippoShipment.trackingNumber);

    // 7. Calculate estimated delivery
    const estimatedDeliveryDate = shippoShipment.estimatedDelivery
      ? new Date(shippoShipment.estimatedDelivery)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    // 8. Create shipment record in database (using correct schema)
    const shipment = new Shipment({
      userId: req.user.userId,
      packageIds: packageIds,
      trackingNumber: shippoShipment.trackingNumber,
      carrier: shippoShipment.carrier,
      serviceLevel: shippoShipment.serviceLevelName,
      status: 'pending',
      shippedDate: null,
      estimatedDelivery: estimatedDeliveryDate,
      actualDelivery: null,
      labelUrl: shippoShipment.labelUrl,
      trackingUrl: shippoShipment.trackingUrl,
      destination: {
        fullName: destination.fullName,
        street: destination.street,
        city: destination.city,
        postalCode: destination.postalCode,
        country: destination.country || 'Morocco',
        phone: destination.phone,
      },
      weight: {
        total: totalWeight,
        unit: 'kg',
      },
      dimensions: {
        length: maxLength,
        width: maxWidth,
        height: totalHeight,
        unit: 'cm',
      },
      cost: {
        shipping: cost.shipping,
        insurance: cost.insurance || 0,
        total: cost.total + photoRequestFee + protectionFee,
        currency: cost.currency || 'USD',
      },
      insurance: {
        coverage: insurance?.coverage || 0,
        cost: cost.insurance || 0,
      },
      customsInfo: customsInfo || [],
      trackingEvents: [],
      notes: `Payment: ${payment.method} (${payment.transactionId})\n${notes || ''}`,
    });

    await shipment.save();

    console.log('💾 Shipment saved to database:', shipment._id);

    // 9. Update package statuses to 'shipped'
    await Package.updateMany(
      { _id: { $in: packageIds } },
      {
        $set: {
          status: 'shipped',
          shipmentId: shipment._id,
        },
      }
    );

    console.log(`📦 Updated ${packageIds.length} packages to shipped status`);

    // 10. Mark photo requests as charged
    if (unpaidPhotoRequests.length > 0) {
      await PhotoRequest.updateMany(
        {
          packageId: { $in: packageIds },
          'billing.charged': false,
        },
        {
          $set: {
            'billing.charged': true,
            'billing.chargedAt': new Date(),
            'billing.shipmentId': shipment._id,
          },
        }
      );

      console.log(
        `📸 Marked ${unpaidPhotoRequests.length} photo requests as charged`
      );
    }

    // 11. Create transaction record
    const transaction = await createTransaction({
      userId: req.user.userId,
      type: 'shipping',
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      status: 'completed',
      amount: {
        value: shipment.cost.total,
        currency: cost.currency || 'USD',
      },
      paymentMethod: payment.method,
      description: `Shipping for ${packageIds.length} package(s) to ${destination.city}, ${destination.country}`,
      metadata: {
        trackingNumber: shippoShipment.trackingNumber,
        carrier: shippoShipment.carrier,
        packageCount: packageIds.length,
        photoRequestFees: photoRequestFee,
        protectionFee: protectionFee,
        transactionId: payment.transactionId,
      },
      completedAt: new Date(),
    } as any);

    console.log('💳 Transaction created:', transaction._id);

    // 12. Create notification for user
    await createNotification({
      userId: req.user.userId,
      type: 'shipment_update',
      title: 'Shipment Created Successfully',
      message: `Your ${packageIds.length} package(s) have been shipped via ${shippoShipment.carrier}. Tracking number: ${shippoShipment.trackingNumber}`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'normal',
      actionUrl: `/shipments/${shipment._id}`,
    } as any);

    console.log('✅ Shipment creation complete!');

    // Return response
    sendSuccess(
      res,
      {
        shipment: {
          id: shipment._id,
          trackingNumber: shippoShipment.trackingNumber,
          carrier: shippoShipment.carrier,
          status: shipment.status,
          estimatedDelivery: shipment.estimatedDelivery,
          labelUrl: shippoShipment.labelUrl,
          trackingUrl: shippoShipment.trackingUrl,
        },
        tracking: {
          number: shippoShipment.trackingNumber,
          url: shippoShipment.trackingUrl,
          carrier: shippoShipment.carrier,
        },
        label: {
          url: shippoShipment.labelUrl,
        },
        cost: {
          shipping: cost.shipping,
          insurance: cost.insurance || 0,
          photoRequests: photoRequestFee,
          protection: protectionFee,
          total: shipment.cost.total,
          currency: cost.currency || 'USD',
        },
      },
      'Shipment created successfully',
      201
    );
  } catch (error: any) {
    console.error('❌ Error creating shipment:', error);
    sendError(res, error.message || 'Failed to create shipment', 500);
  }
};

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
