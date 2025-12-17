// server/src/controllers/admin/adminShipmentController.ts - FIXED VERSION
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { Shipment } from '../../models/Shipment.js';
import { Package } from '../../models/Package.js';
import { Transaction } from '../../models/Transaction.js';
import { createNotification } from '../../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all shipments (admin view) - ENHANCED
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

    if (status) query.status = status;
    if (userId) query.userId = userId;

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { carrier: { $regex: search, $options: 'i' } },
      ];
    }

    const shipments = await Shipment.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageIds')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()
      .exec();

    // Fetch associated transactions for each shipment
    const shipmentsWithTransactions = await Promise.all(
      shipments.map(async (shipment) => {
        const transaction = await Transaction.findOne({
          relatedId: shipment._id,
          relatedModel: 'Shipment',
        }).lean();

        return {
          ...shipment,
          transaction: transaction
            ? {
                id: transaction._id,
                status: transaction.status,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
                completedAt: transaction.completedAt,
                createdAt: transaction.createdAt,
              }
            : null,
        };
      })
    );

    const total = await Shipment.countDocuments(query);

    sendSuccess(res, {
      shipments: shipmentsWithTransactions,
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
 * Get single shipment details - ENHANCED
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

    // Fetch transaction details
    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    }).populate('userId', 'name email');

    const shipmentData = {
      ...shipment.toObject(),
      transaction: transaction
        ? {
            id: transaction._id,
            status: transaction.status,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod,
            completedAt: transaction.completedAt,
            createdAt: transaction.createdAt,
            metadata: transaction.metadata,
          }
        : null,
    };

    sendSuccess(res, { shipment: shipmentData });
  } catch (error) {
    next(error);
  }
};

/**
 * ✅ FIXED: Approve shipment with proper payment check
 * POST /api/admin/shipments/:id/approve
 */
export const approveShipment = async (
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
    const { notes } = req.body;

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    if (shipment.status !== 'pending') {
      sendError(res, 'Only pending shipments can be approved', 400);
      return;
    }

    // ✅ CHECK: Verify payment status
    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    });

    if (!transaction) {
      sendError(res, 'No payment transaction found for this shipment', 400);
      return;
    }

    // ✅ IMPORTANT: Only approve if payment is completed OR COD
    const isPaymentValid =
      transaction.status === 'completed' ||
      transaction.paymentMethod === 'cash_on_delivery';

    if (!isPaymentValid) {
      sendError(
        res,
        `Cannot approve shipment - payment status is "${transaction.status}". Please confirm payment first.`,
        400
      );
      return;
    }

    // Update shipment status
    shipment.status = 'processing';
    if (notes) {
      shipment.notes = shipment.notes
        ? `${shipment.notes}\n\nAdmin Approval Note: ${notes}`
        : `Admin Approval Note: ${notes}`;
    }

    // Add tracking event
    shipment.trackingEvents.push({
      status: 'processing',
      location: 'Warehouse - USA',
      description: 'Shipment approved by admin and being prepared for dispatch',
      timestamp: new Date(),
    });

    await shipment.save();

    // Update transaction if it was COD
    if (
      transaction.paymentMethod === 'cash_on_delivery' &&
      transaction.status !== 'completed'
    ) {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.notes = 'COD shipment approved';
      await transaction.save();
    }

    // Notify user
    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Shipment Approved ✅',
      message: `Your shipment ${shipment.trackingNumber} has been approved and is being prepared for dispatch.`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'high',
      actionUrl: `/shipments/${shipment._id}`,
    });

    console.log(`✅ Shipment ${id} approved by admin`);

    sendSuccess(res, { shipment }, 'Shipment approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject shipment
 * POST /api/admin/shipments/:id/reject
 */
export const rejectShipment = async (
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
    const { reason } = req.body;

    if (!reason) {
      sendError(res, 'Rejection reason is required', 400);
      return;
    }

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Update shipment status
    shipment.status = 'cancelled';
    shipment.notes = shipment.notes
      ? `${shipment.notes}\n\nRejection Reason: ${reason}`
      : `Rejection Reason: ${reason}`;

    // Add tracking event
    shipment.trackingEvents.push({
      status: 'cancelled',
      location: 'Warehouse - USA',
      description: `Shipment rejected by admin: ${reason}`,
      timestamp: new Date(),
    });

    await shipment.save();

    // Update transaction status
    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    });

    if (transaction) {
      transaction.status = 'cancelled';
      transaction.notes = `Shipment rejected: ${reason}`;
      await transaction.save();
    }

    // Return packages to available status
    await Package.updateMany(
      { _id: { $in: shipment.packageIds } },
      { $set: { status: 'received', shipmentId: null } }
    );

    // Notify user
    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Shipment Rejected',
      message: `Your shipment request has been rejected. Reason: ${reason}. Your packages have been returned to storage. Please contact support for assistance.`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'high',
      actionUrl: `/shipments/${shipment._id}`,
    });

    console.log(`❌ Shipment ${id} rejected by admin`);

    sendSuccess(res, { shipment }, 'Shipment rejected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status
 * PUT /api/admin/shipments/:id/payment-status
 */
export const updatePaymentStatus = async (
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
    const { status, notes } = req.body;

    const validStatuses = [
      'pending',
      'completed',
      'failed',
      'refunded',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      sendError(res, 'Invalid payment status', 400);
      return;
    }

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    });

    if (!transaction) {
      sendError(res, 'No transaction found for this shipment', 404);
      return;
    }

    // Update transaction status
    const oldStatus = transaction.status;
    transaction.status = status as any;

    if (status === 'completed') {
      transaction.completedAt = new Date();
    }

    if (notes) {
      transaction.notes = notes;
    }

    await transaction.save();

    // Notify user
    let notificationMessage = '';
    if (status === 'completed') {
      notificationMessage = `Payment for shipment ${shipment.trackingNumber} has been confirmed. Your shipment will be processed shortly.`;
    } else if (status === 'failed') {
      notificationMessage = `Payment for shipment ${shipment.trackingNumber} failed. Please update your payment method or contact support.`;
    } else if (status === 'refunded') {
      notificationMessage = `Payment for shipment ${shipment.trackingNumber} has been refunded.`;
    }

    if (notificationMessage) {
      await createNotification({
        userId: shipment.userId,
        type: 'payment_update',
        title: 'Payment Status Update',
        message: notificationMessage,
        relatedId: transaction._id,
        relatedModel: 'Transaction',
        priority: 'high',
        actionUrl: `/shipments/${shipment._id}`,
      });
    }

    console.log(
      `💳 Payment status updated for shipment ${id}: ${oldStatus} -> ${status}`
    );

    sendSuccess(res, { transaction }, 'Payment status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Send custom notification to user
 * POST /api/admin/shipments/:id/notify
 */
export const sendCustomNotification = async (
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
    const { title, message, priority = 'normal' } = req.body;

    if (!title || !message) {
      sendError(res, 'Title and message are required', 400);
      return;
    }

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title,
      message,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: priority as any,
      actionUrl: `/shipments/${shipment._id}`,
    });

    console.log(`📧 Custom notification sent to user for shipment ${id}`);

    sendSuccess(res, null, 'Notification sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create DHL shipping label
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

    if (!dhlService.isConfigured()) {
      sendError(
        res,
        'DHL service is not configured. Please contact system administrator.',
        500
      );
      return;
    }

    if (shipment.notes?.includes('DHL Label:')) {
      sendError(res, 'DHL label already exists for this shipment', 400);
      return;
    }

    if (shipment.status !== 'processing') {
      sendError(
        res,
        'Shipment must be approved (processing status) before creating label',
        400
      );
      return;
    }

    console.log('📦 Creating DHL label for shipment:', shipment._id);

    const dhlResponse = await dhlService.createShipment(shipment as any, {
      includeLabel: true,
      paperless: true,
    });

    console.log('✅ DHL shipment created:', dhlResponse.shipmentTrackingNumber);

    shipment.trackingNumber = dhlResponse.shipmentTrackingNumber;
    shipment.status = 'in_transit';
    shipment.shippedDate = new Date();

    shipment.trackingEvents.push({
      status: 'in_transit',
      location: 'DHL Facility - USA',
      description: `Package handed over to DHL - Tracking: ${dhlResponse.shipmentTrackingNumber}`,
      timestamp: new Date(),
    });

    const labelInfo = [
      `DHL Label Created: ${new Date().toISOString()}`,
      `Tracking: ${dhlResponse.shipmentTrackingNumber}`,
      `Label URL: ${dhlResponse.labelUrl || 'N/A'}`,
      `Waybill URL: ${dhlResponse.waybillUrl || 'N/A'}`,
      `Estimated Delivery: ${dhlResponse.estimatedDelivery || 'N/A'}`,
    ].join('\n');

    shipment.notes = shipment.notes
      ? `${shipment.notes}\n\n--- DHL SHIPMENT INFO ---\n${labelInfo}`
      : `--- DHL SHIPMENT INFO ---\n${labelInfo}`;

    if (dhlResponse.estimatedDelivery) {
      shipment.estimatedDelivery = new Date(dhlResponse.estimatedDelivery);
    }

    await shipment.save();

    await Package.updateMany(
      { _id: { $in: shipment.packageIds } },
      { $set: { status: 'in_transit' } }
    );

    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Shipment In Transit 🚚',
      message: `Your shipment is now in transit! DHL Tracking: ${dhlResponse.shipmentTrackingNumber}. Track your package for real-time updates.`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'high',
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
          waybillUrl: dhlResponse.waybillUrl,
          estimatedDelivery: dhlResponse.estimatedDelivery,
        },
      },
      'DHL shipping label created successfully'
    );
  } catch (error: any) {
    console.error('❌ DHL Label Creation Error:', error);
    sendError(res, error.message || 'Failed to create DHL label', 500);
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
      paymentStats,
    ] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Shipment.aggregate([
        { $group: { _id: '$carrier', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Shipment.countDocuments({
        status: 'delivered',
        actualDelivery: { $gte: today },
      }),
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
      Shipment.aggregate([
        {
          $match: {
            status: { $in: ['processing', 'in_transit', 'delivered'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cost.total' },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            relatedModel: 'Shipment',
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount.value' },
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

    const avgDays = avgDeliveryTime[0]?.avgTime
      ? Math.round(avgDeliveryTime[0].avgTime / (1000 * 60 * 60 * 24))
      : 0;

    const paymentBreakdown: Record<string, { count: number; total: number }> =
      {};
    paymentStats.forEach((item) => {
      paymentBreakdown[item._id] = {
        count: item.count,
        total: item.total,
      };
    });

    sendSuccess(res, {
      statistics: {
        total,
        byStatus: statusBreakdown,
        byCarrier: carrierBreakdown,
        deliveredToday,
        avgDeliveryDays: avgDays,
        totalRevenue: totalRevenue[0]?.total || 0,
        payments: paymentBreakdown,
      },
    });
  } catch (error) {
    next(error);
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

    const updated = await updateShipmentStatus(id, status);

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

    shipment.trackingEvents.push({
      status,
      location,
      description,
      timestamp: new Date(),
    });

    await shipment.save();

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

/**
 * Get DHL rates for admin
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

    const { weight, dimensions, destinationPostalCode, destinationCity } =
      req.body;

    if (!weight || !dimensions) {
      sendError(res, 'Weight and dimensions are required', 400);
      return;
    }

    if (!dhlService.isConfigured()) {
      sendError(res, 'DHL service is not configured', 500);
      return;
    }

    const rates = await dhlService.getRates({
      weight,
      dimensions,
      originCountryCode: 'US',
      destinationCountryCode: 'MA',
      destinationPostalCode,
      destinationCity,
    });

    sendSuccess(res, { rates });
  } catch (error: any) {
    console.error('DHL Rates Error:', error);
    sendError(res, error.message || 'Failed to get DHL rates', 500);
  }
};
