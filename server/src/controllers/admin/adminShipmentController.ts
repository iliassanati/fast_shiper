// server/src/controllers/admin/adminShipmentController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { Shipment } from '../../models/Shipment.js';
import { Package } from '../../models/Package.js';
import { Transaction } from '../../models/Transaction.js';
import { User } from '../../models/User.js';
import { createNotification } from '../../models/Notification.js';
import { shippoService } from '../../services/shippoService.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all shipments with enhanced filters and transaction data
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

    const {
      status,
      userId,
      carrier,
      search,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

    // Status filter
    if (status) query.status = status;

    // User filter
    if (userId) query.userId = userId;

    // Carrier filter
    if (carrier) query.carrier = carrier;

    // Payment status filter
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Search filter
    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'recipientInfo.name': { $regex: search, $options: 'i' } },
        { 'recipientInfo.phone': { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const shipments = await Shipment.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packages', 'trackingNumber description retailer')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()
      .exec();

    // Fetch associated transactions
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
 * Get single shipment with full details
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
    const shipment = await Shipment.findById(id)
      .populate('userId', 'name email suiteNumber phone address')
      .populate('packages')
      .lean();

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Fetch transaction
    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    }).populate('userId', 'name email');

    // Get tracking info if available
    let trackingInfo = null;
    if (shipment.trackingNumber && shipment.carrier) {
      try {
        trackingInfo = await shippoService.trackShipment(
          shipment.trackingNumber,
          shipment.carrier
        );
      } catch (error) {
        console.log('Could not fetch tracking info:', error);
      }
    }

    sendSuccess(res, {
      shipment: {
        ...shipment,
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
        trackingInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping rates (admin can check rates for any destination)
 * POST /api/admin/shipments/get-rates
 */
export const getShippingRates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const {
      weight,
      dimensions,
      destinationCountryCode = 'MA',
      destinationCity,
      destinationPostalCode,
      destinationPhone,
      declaredValue,
    } = req.body;

    // Validations
    if (!weight || parseFloat(weight) <= 0) {
      sendError(res, 'Valid weight is required', 400);
      return;
    }

    if (
      !dimensions ||
      !dimensions.length ||
      !dimensions.width ||
      !dimensions.height
    ) {
      sendError(res, 'Valid dimensions required', 400);
      return;
    }

    if (!destinationCity) {
      sendError(res, 'Destination city is required', 400);
      return;
    }

    if (!destinationPhone) {
      sendError(res, 'Destination phone is required', 400);
      return;
    }

    if (!shippoService.isConfigured()) {
      sendError(res, 'Shippo service not configured', 503);
      return;
    }

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
      destinationPostalCode: destinationPostalCode?.trim() || '',
      destinationPhone: destinationPhone.trim(),
      declaredValue: declaredValue ? parseFloat(declaredValue) : undefined,
    });

    sendSuccess(res, { rates }, `Found ${rates.length} available rates`);
  } catch (error: any) {
    console.error('Error getting rates:', error);
    sendError(res, error.message || 'Failed to get rates', 500);
  }
};

/**
 * Create shipment for a user (admin-initiated)
 * POST /api/admin/shipments
 */
export const createShipmentForUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const {
      userId,
      packageIds,
      destination,
      rateObjectId,
      carrier,
      serviceLevel,
      insurance,
      customsInfo,
      cost,
      notes,
    } = req.body;

    // Validate required fields
    if (!userId || !packageIds || packageIds.length === 0) {
      sendError(res, 'User ID and package IDs are required', 400);
      return;
    }

    if (!destination || !rateObjectId) {
      sendError(res, 'Destination and rate are required', 400);
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Verify packages
    const packages = await Package.find({
      _id: { $in: packageIds },
      userId: userId,
    });

    if (packages.length !== packageIds.length) {
      sendError(res, 'Some packages not found or do not belong to user', 400);
      return;
    }

    // Check package status
    const unshippablePackages = packages.filter(
      (pkg) => pkg.status !== 'received' && pkg.status !== 'consolidated'
    );

    if (unshippablePackages.length > 0) {
      sendError(
        res,
        `Cannot ship packages with status: ${unshippablePackages.map((p) => p.status).join(', ')}`,
        400
      );
      return;
    }

    // Calculate total weight
    let totalWeight = packages.reduce(
      (sum, pkg) => sum + (pkg.weight?.value || 0),
      0
    );
    totalWeight = totalWeight * 2.20462; // kg to lb

    // Format addresses
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

    const addressTo = {
      name: destination.fullName,
      street1: destination.street,
      city: destination.city,
      state: destination.state || '',
      zip: destination.postalCode || '',
      country: destination.country,
      phone: destination.phone,
      email: destination.email || user.email,
      validate: false,
    };

    // Create parcel
    const parcels = [
      {
        length: String(destination.dimensions?.length || 12),
        width: String(destination.dimensions?.width || 10),
        height: String(destination.dimensions?.height || 8),
        distance_unit: 'in',
        weight: String(totalWeight.toFixed(2)),
        mass_unit: 'lb',
      },
    ];

    // Prepare Shippo data
    const shippoData: any = {
      address_from: addressFrom,
      address_to: addressTo,
      parcels: parcels,
      rate: rateObjectId,
      metadata: {
        userId: userId.substring(0, 50),
        pkg_count: String(packageIds.length),
        carrier: carrier,
        adminCreated: 'true',
      },
    };

    // Add customs if international
    if (customsInfo && customsInfo.length > 0) {
      shippoData.customs_declaration = {
        contents_type: 'MERCHANDISE',
        contents_explanation: 'Personal items',
        non_delivery_option: 'RETURN',
        certify: true,
        certify_signer: addressTo.name,
        incoterm: 'DDU',
        items: customsInfo.map((item: any) => ({
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

    // Add insurance if enabled
    if (insurance?.enabled && insurance.coverage > 0) {
      shippoData.insurance_amount = String(insurance.coverage);
      shippoData.insurance_currency = 'USD';
    }

    console.log('Creating Shippo shipment...');
    const shippoShipment = await shippoService.createShipment(shippoData);

    // Update packages
    await Package.updateMany(
      { _id: { $in: packageIds } },
      { status: 'shipped' }
    );

    // Create shipment record
    const newShipment = await Shipment.create({
      userId: userId,
      packages: packageIds,
      trackingNumber: shippoShipment.tracking_number || 'PENDING',
      carrier: carrier,
      serviceLevelName: serviceLevel,
      status: shippoShipment.status === 'SUCCESS' ? 'in_transit' : 'pending',
      recipientInfo: {
        name: destination.fullName,
        address: destination.street,
        city: destination.city,
        state: destination.state || '',
        postalCode: destination.postalCode,
        country: destination.country,
        phone: destination.phone,
        email: destination.email || user.email,
      },
      dimensions: destination.dimensions || {
        length: 12,
        width: 10,
        height: 8,
      },
      weight: totalWeight,
      declaredValue: insurance?.coverage || 0,
      shippingCost: cost?.shipping || 0,
      photoRequestFees: cost?.photoRequests || 0,
      protectionFee: cost?.protection || 0,
      totalCost: cost?.total || 0,
      paymentStatus: 'pending',
      labelUrl: shippoShipment.label_url,
      trackingUrl: shippoShipment.tracking_url_provider,
      estimatedDelivery: shippoShipment.eta,
      shippoTransactionId: shippoShipment.object_id,
    });

    // Create transaction
    await Transaction.create({
      userId: userId,
      type: 'shipping',
      relatedId: newShipment._id,
      relatedModel: 'Shipment',
      status: 'pending',
      amount: {
        value: cost?.total || 0,
        currency: 'USD',
      },
      paymentMethod: 'pending',
      description: `Admin-created shipment ${newShipment.trackingNumber}`,
      metadata: {
        carrier: carrier,
        serviceLevel: serviceLevel,
        trackingNumber: newShipment.trackingNumber,
        packageCount: packageIds.length,
        adminCreated: true,
      },
      notes: notes || 'Created by admin',
    });

    // Notify user
    await createNotification({
      userId: userId,
      type: 'shipment_update',
      title: 'Shipment Created',
      message: `A shipment has been created for your packages. Tracking: ${newShipment.trackingNumber}`,
      relatedId: newShipment._id,
      relatedModel: 'Shipment',
      priority: 'high',
      actionUrl: `/shipments/${newShipment._id}`,
    } as any);

    sendSuccess(
      res,
      {
        shipment: {
          id: newShipment._id,
          trackingNumber: newShipment.trackingNumber,
          labelUrl: newShipment.labelUrl,
          trackingUrl: newShipment.trackingUrl,
          carrier: newShipment.carrier,
          status: newShipment.status,
        },
      },
      'Shipment created successfully',
      201
    );
  } catch (error: any) {
    console.error('Error creating shipment:', error);
    sendError(res, error.message || 'Failed to create shipment', 500);
  }
};

/**
 * Approve shipment with payment verification
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

    const shipment = await Shipment.findById(id).populate('userId');

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    if (shipment.status !== 'pending') {
      sendError(res, 'Only pending shipments can be approved', 400);
      return;
    }

    // Check payment
    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    });

    if (!transaction) {
      sendError(res, 'No transaction found for this shipment', 400);
      return;
    }

    const isPaymentValid =
      transaction.status === 'completed' ||
      transaction.paymentMethod === 'cash_on_delivery';

    if (!isPaymentValid) {
      sendError(
        res,
        `Cannot approve - payment status is "${transaction.status}"`,
        400
      );
      return;
    }

    // Update shipment
    shipment.status = 'in_transit';
    if (notes) {
      shipment.notes = notes;
    }
    await shipment.save();

    // Update transaction if COD
    if (
      transaction.paymentMethod === 'cash_on_delivery' &&
      transaction.status !== 'completed'
    ) {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();
    }

    // Notify user
    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Shipment Approved ✅',
      message: `Your shipment ${shipment.trackingNumber} has been approved and is in transit.`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'high',
      actionUrl: `/shipments/${shipment._id}`,
    } as any);

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

    const shipment = await Shipment.findById(id).populate('userId');

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    shipment.status = 'cancelled';
    shipment.notes = `Rejected: ${reason}`;
    await shipment.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { relatedId: shipment._id, relatedModel: 'Shipment' },
      { status: 'cancelled', notes: `Shipment rejected: ${reason}` }
    );

    // Return packages to storage
    await Package.updateMany(
      { _id: { $in: shipment.packages } },
      { status: 'received' }
    );

    // Notify user
    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: 'Shipment Rejected',
      message: `Your shipment was rejected. Reason: ${reason}`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'high',
      actionUrl: `/shipments/${shipment._id}`,
    } as any);

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

    const shipment = await Shipment.findById(id).populate('userId');
    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    const transaction = await Transaction.findOne({
      relatedId: shipment._id,
      relatedModel: 'Shipment',
    });

    if (!transaction) {
      sendError(res, 'No transaction found', 404);
      return;
    }

    transaction.status = status as any;
    if (status === 'completed') {
      transaction.completedAt = new Date();
    }
    if (notes) {
      transaction.notes = notes;
    }
    await transaction.save();

    // Notify user
    let message = '';
    if (status === 'completed') {
      message = `Payment confirmed for shipment ${shipment.trackingNumber}`;
    } else if (status === 'failed') {
      message = `Payment failed for shipment ${shipment.trackingNumber}`;
    }

    if (message) {
      await createNotification({
        userId: shipment.userId,
        type: 'payment_update',
        title: 'Payment Status Update',
        message,
        relatedId: transaction._id,
        relatedModel: 'Transaction',
        priority: 'high',
        actionUrl: `/shipments/${shipment._id}`,
      } as any);
    }

    sendSuccess(res, { transaction }, 'Payment status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Track shipment
 * GET /api/admin/shipments/:id/track
 */
export const trackShipment = async (
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
    const shipment = await Shipment.findById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    if (!shipment.trackingNumber || !shipment.carrier) {
      sendError(res, 'Tracking information not available', 400);
      return;
    }

    const tracking = await shippoService.trackShipment(
      shipment.trackingNumber,
      shipment.carrier
    );

    sendSuccess(res, { tracking });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    sendError(res, error.message || 'Failed to track shipment', 500);
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
      byPaymentStatus,
      deliveredToday,
      avgDeliveryTime,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Shipment.aggregate([
        { $group: { _id: '$carrier', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Shipment.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      ]),
      Shipment.countDocuments({
        status: 'delivered',
        deliveredAt: { $gte: today },
      }),
      Shipment.aggregate([
        {
          $match: {
            status: 'delivered',
            deliveredAt: { $exists: true },
            createdAt: { $exists: true },
          },
        },
        {
          $project: {
            deliveryTime: { $subtract: ['$deliveredAt', '$createdAt'] },
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
            status: { $in: ['in_transit', 'delivered'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalCost' },
          },
        },
      ]),
      Transaction.countDocuments({
        relatedModel: 'Shipment',
        status: 'pending',
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const carrierBreakdown = byCarrier.map((item) => ({
      carrier: item._id,
      count: item.count,
    }));

    const paymentBreakdown: Record<string, number> = {};
    byPaymentStatus.forEach((item) => {
      paymentBreakdown[item._id] = item.count;
    });

    const avgDays = avgDeliveryTime[0]?.avgTime
      ? Math.round(avgDeliveryTime[0].avgTime / (1000 * 60 * 60 * 24))
      : 0;

    sendSuccess(res, {
      statistics: {
        total,
        byStatus: statusBreakdown,
        byCarrier: carrierBreakdown,
        byPaymentStatus: paymentBreakdown,
        deliveredToday,
        avgDeliveryDays: avgDays,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update shipments
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

    const { shipmentIds, status, paymentStatus, notes } = req.body;

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
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
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
 * Send custom notification
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

    const shipment = await Shipment.findById(id);
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
    } as any);

    sendSuccess(res, null, 'Notification sent successfully');
  } catch (error) {
    next(error);
  }
};
