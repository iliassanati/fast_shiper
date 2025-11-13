// server/src/controllers/admin/adminShipmentController.ts - WITH DHL INTEGRATION
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
  Shipment,
  findShipmentById,
  updateShipmentStatus,
} from '../../models/Shipment.js';
import { Package } from '../../models/Package.js';
import { createNotification } from '../../models/Notification.js';
import { dhlService } from '../../services/dhlService.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all shipments (admin view)
 * GET /api/admin/shipments
 */
export const getAllShipments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { status, userId, search, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { carrier: { $regex: search, $options: 'i' } },
      ];
    }

    const shipments = await Shipment.find(query)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Shipment.countDocuments(query);

    sendSuccess(res, {
      shipments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single shipment details
 * GET /api/admin/shipments/:id
 */
export const getShipmentDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    sendSuccess(res, { shipment });
  } catch (error) {
    next(error);
  }
};

/**
 * Create DHL shipping label - NEW
 * POST /api/admin/shipments/:id/create-label
 */
export const createDHLLabel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Check if DHL is configured
    if (!dhlService.isConfigured()) {
      sendError(
        res,
        'DHL service is not configured. Please add DHL credentials to environment variables.',
        500
      );
      return;
    }

    // Check if label already exists
    if (shipment.status !== 'pending' && shipment.status !== 'processing') {
      sendError(
        res,
        'Can only create labels for pending or processing shipments',
        400
      );
      return;
    }

    console.log('📦 Creating DHL label for shipment:', shipment._id);

    // Create DHL shipment
    const dhlResponse = await dhlService.createShipment({
      shipment: shipment as any,
      includeLabel: true,
    });

    console.log('✅ DHL shipment created:', dhlResponse.shipmentTrackingNumber);

    // Update shipment with DHL tracking number
    shipment.trackingNumber = dhlResponse.shipmentTrackingNumber;
    shipment.status = 'processing';

    // Add tracking event
    shipment.trackingEvents.push({
      status: 'label_created',
      location: 'Warehouse - USA',
      description: 'DHL shipping label created',
      timestamp: new Date(),
    });

    // Store label URL in notes (or create a new field for this)
    if (dhlResponse.labelUrl) {
      shipment.notes = `${shipment.notes}\n\nDHL Label: ${dhlResponse.labelUrl}`;
    }

    await shipment.save();

    // Notify user
    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Shipping Label Created',
      message: `Your shipment has been processed and a DHL shipping label has been created. Tracking: ${dhlResponse.shipmentTrackingNumber}`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'normal',
      actionUrl: `/shipments/${shipment._id}`,
    });

    sendSuccess(
      res,
      {
        shipment,
        dhl: {
          trackingNumber: dhlResponse.shipmentTrackingNumber,
          trackingUrl: dhlResponse.trackingUrl,
          labelUrl: dhlResponse.labelUrl,
        },
      },
      'DHL shipping label created successfully'
    );
  } catch (error: any) {
    console.error('DHL Label Creation Error:', error);
    sendError(res, error.message || 'Failed to create DHL label', 500);
  }
};

/**
 * Get DHL shipping rates - NEW
 * POST /api/admin/shipments/get-rates
 */
export const getDHLRates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { weight, dimensions } = req.body;

    if (!weight || !dimensions) {
      sendError(res, 'Weight and dimensions are required', 400);
      return;
    }

    // Check if DHL is configured
    if (!dhlService.isConfigured()) {
      sendError(res, 'DHL service is not configured', 500);
      return;
    }

    const rates = await dhlService.getRates({
      weight,
      dimensions,
      originCountryCode: 'US',
      destinationCountryCode: 'MA',
    });

    sendSuccess(res, { rates });
  } catch (error: any) {
    console.error('DHL Rates Error:', error);
    sendError(res, error.message || 'Failed to get DHL rates', 500);
  }
};

/**
 * Update shipment status
 * PUT /api/admin/shipments/:id/status
 */
export const updateShipmentStatusById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Update status
    const updated = await updateShipmentStatus(id, status);

    // Create notification based on status
    let notificationMessage = '';
    let notificationTitle = '';

    if (status === 'processing') {
      notificationTitle = 'Shipment Processing';
      notificationMessage = `Your shipment ${shipment.trackingNumber} is being prepared.`;
    } else if (status === 'in_transit') {
      notificationTitle = 'Shipment In Transit';
      notificationMessage = `Your shipment ${shipment.trackingNumber} is on its way to Morocco!`;
    } else if (status === 'delivered') {
      notificationTitle = 'Shipment Delivered';
      notificationMessage = `Your shipment ${shipment.trackingNumber} has been delivered!`;

      // Update package statuses
      await Package.updateMany(
        { _id: { $in: shipment.packageIds } },
        { $set: { status: 'delivered' } }
      );
    }

    if (notificationMessage) {
      await createNotification({
        userId: shipment.userId,
        type: 'shipment_update',
        title: notificationTitle,
        message: notificationMessage,
        relatedId: shipment._id,
        relatedModel: 'Shipment',
        priority: status === 'delivered' ? 'high' : 'normal',
        actionUrl: `/shipments/${shipment._id}`,
      });
    }

    sendSuccess(res, { shipment: updated }, 'Status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add tracking event
 * POST /api/admin/shipments/:id/tracking
 */
export const addTrackingEvent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { status, location, description } = req.body;

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Add tracking event
    shipment.trackingEvents.push({
      status,
      location,
      description,
      timestamp: new Date(),
    });

    await shipment.save();

    // Notify user about tracking update
    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Tracking Update',
      message: `${description} - ${location}`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'normal',
      actionUrl: `/shipments/${shipment._id}`,
    });

    sendSuccess(res, { shipment }, 'Tracking event added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment details
 * PUT /api/admin/shipments/:id
 */
export const updateShipmentDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Update allowed fields
    const allowedUpdates = [
      'carrier',
      'serviceLevel',
      'estimatedDelivery',
      'weight',
      'dimensions',
      'cost',
      'notes',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (shipment as any)[field] = updates[field];
      }
    });

    await shipment.save();

    sendSuccess(res, { shipment }, 'Shipment updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment statistics
 * GET /api/admin/shipments/statistics
 */
export const getShipmentStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      total,
      byStatus,
      byCarrier,
      deliveredToday,
      avgDeliveryTime,
      totalRevenue,
    ] = await Promise.all([
      // Total shipments
      Shipment.countDocuments(),

      // By status
      Shipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

      // By carrier
      Shipment.aggregate([
        { $group: { _id: '$carrier', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Delivered today
      Shipment.countDocuments({
        status: 'delivered',
        actualDelivery: { $gte: today },
      }),

      // Average delivery time
      Shipment.aggregate([
        {
          $match: {
            status: 'delivered',
            actualDelivery: { $exists: true },
            shippedDate: { $exists: true },
          },
        },
        {
          $project: {
            deliveryTime: {
              $subtract: ['$actualDelivery', '$shippedDate'],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$deliveryTime' },
          },
        },
      ]),

      // Total revenue
      Shipment.aggregate([
        {
          $match: {
            status: { $in: ['in_transit', 'delivered'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cost.total' },
          },
        },
      ]),
    ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const carrierBreakdown = byCarrier.map((item) => ({
      carrier: item._id,
      count: item.count,
    }));

    // Convert milliseconds to days
    const avgDays = avgDeliveryTime[0]?.avgTime
      ? Math.round(avgDeliveryTime[0].avgTime / (1000 * 60 * 60 * 24))
      : 0;

    sendSuccess(res, {
      statistics: {
        total,
        byStatus: statusBreakdown,
        byCarrier: carrierBreakdown,
        deliveredToday,
        avgDeliveryDays: avgDays,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update shipment status
 * POST /api/admin/shipments/bulk-update
 */
export const bulkUpdateShipments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { shipmentIds, status, notes } = req.body;

    if (
      !shipmentIds ||
      !Array.isArray(shipmentIds) ||
      shipmentIds.length === 0
    ) {
      sendError(res, 'Shipment IDs are required', 400);
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;

    const result = await Shipment.updateMany(
      { _id: { $in: shipmentIds } },
      { $set: updateData }
    );

    sendSuccess(
      res,
      { updated: result.modifiedCount },
      `${result.modifiedCount} shipment(s) updated successfully`
    );
  } catch (error) {
    next(error);
  }
};
