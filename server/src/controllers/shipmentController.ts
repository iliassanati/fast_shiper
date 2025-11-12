// server/src/controllers/shipmentController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest, CreateShipmentDTO } from '../types/index.js';
import {
  Shipment,
  createShipment,
  findShipmentById,
  findShipmentsByUser,
  updateShipmentStatus,
} from '../models/Shipment.js';
import { findPackageById, updatePackageStatus } from '../models/Package.js';
import { createNotification } from '../models/Notification.js';
import { createTransaction } from '../models/Transaction.js';
import { calculateShippingCost } from '../utils/pricing.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

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
      sendForbidden(res);
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    const filters = {
      status: status as string | undefined,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };

    const shipments = await findShipmentsByUser(req.user.userId, filters);
    const total = await Shipment.countDocuments({
      userId: req.user.userId,
      ...(status && { status }),
    });

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
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Check ownership
    if (shipment.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    sendSuccess(res, { shipment });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new shipment
 * POST /api/shipments
 */
export const createNewShipment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const shipmentData: CreateShipmentDTO = req.body;

    // Validate packages exist and belong to user
    const packages = await Promise.all(
      shipmentData.packageIds.map((id) => findPackageById(id))
    );

    if (packages.some((pkg) => !pkg)) {
      sendError(res, 'One or more packages not found', 404);
      return;
    }

    if (packages.some((pkg) => pkg!.userId.toString() !== req.user!.userId)) {
      sendForbidden(res, 'Access denied to one or more packages');
      return;
    }

    // Check if packages are available for shipping
    const unavailable = packages.filter(
      (pkg) => pkg!.status !== 'received' && pkg!.status !== 'consolidated'
    );
    if (unavailable.length > 0) {
      sendError(res, 'Some packages are not available for shipping', 400);
      return;
    }

    // Calculate total weight and dimensions
    const totalWeight = packages.reduce(
      (sum, pkg) => sum + pkg!.weight.value,
      0
    );
    const dimensions = {
      length: Math.max(...packages.map((pkg) => pkg!.dimensions.length)),
      width: Math.max(...packages.map((pkg) => pkg!.dimensions.width)),
      height: packages.reduce((sum, pkg) => sum + pkg!.dimensions.height, 0),
      unit: 'cm' as const,
    };

    // Calculate costs
    const shippingCost = calculateShippingCost(
      totalWeight,
      dimensions,
      shipmentData.carrier
    );

    const insuranceCost = shipmentData.insurance?.coverage
      ? Math.ceil((shipmentData.insurance.coverage - 100) / 100) * 5
      : 0;

    // Generate tracking number
    const trackingNumber = `${shipmentData.carrier.toUpperCase()}${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate estimated delivery
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // Default 5 days

    // Create shipment
    const shipment = await createShipment({
      userId: req.user.userId,
      packageIds: shipmentData.packageIds,
      carrier: shipmentData.carrier as any,
      serviceLevel: shipmentData.serviceLevel,
      trackingNumber,
      status: 'pending',
      estimatedDelivery,
      destination: shipmentData.destination,
      weight: {
        total: totalWeight,
        unit: 'kg',
      },
      dimensions,
      cost: {
        shipping: shippingCost,
        insurance: insuranceCost,
        total: shippingCost + insuranceCost,
        currency: 'MAD',
      },
      insurance: {
        coverage: shipmentData.insurance?.coverage || 0,
        cost: insuranceCost,
      },
      customsInfo: shipmentData.customsInfo,
      trackingEvents: [
        {
          status: 'pending',
          location: 'Warehouse - USA',
          description: 'Shipment created and pending processing',
          timestamp: new Date(),
        },
      ],
    });

    // Update package statuses
    await Promise.all(
      shipmentData.packageIds.map((id) => updatePackageStatus(id, 'shipped'))
    );

    // Create transaction
    await createTransaction({
      userId: req.user.userId,
      type: 'shipping',
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      status: 'pending',
      amount: {
        value: shipment.cost.total,
        currency: 'MAD',
      },
      paymentMethod: 'card', // Default, should come from payment gateway
      description: `Shipping via ${shipment.carrier} - ${shipment.trackingNumber}`,
    });

    // Create notification
    await createNotification({
      userId: req.user.userId,
      type: 'shipment_update',
      title: 'Shipment Created',
      message: `Your shipment has been created and will be processed shortly.`,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: 'normal',
      actionUrl: `/shipments/${shipment._id}`,
    });

    sendSuccess(res, { shipment }, 'Shipment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment status
 * PUT /api/shipments/:id/status
 */
export const updateShipmentStatusById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { status, trackingEvent } = req.body;

    const shipment = await findShipmentById(id);

    if (!shipment) {
      sendNotFound(res, 'Shipment not found');
      return;
    }

    // Check ownership
    if (shipment.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    const updatedShipment = await updateShipmentStatus(
      id,
      status,
      trackingEvent
    );

    // Create notification for status changes
    if (status === 'in_transit') {
      await createNotification({
        userId: req.user.userId,
        type: 'shipment_update',
        title: 'Shipment In Transit',
        message: `Your shipment ${shipment.trackingNumber} is now in transit to Morocco.`,
        relatedId: shipment._id,
        relatedModel: 'Shipment',
        priority: 'normal',
        actionUrl: `/shipments/${shipment._id}`,
      });
    } else if (status === 'delivered') {
      await createNotification({
        userId: req.user.userId,
        type: 'shipment_update',
        title: 'Shipment Delivered',
        message: `Your shipment ${shipment.trackingNumber} has been delivered!`,
        relatedId: shipment._id,
        relatedModel: 'Shipment',
        priority: 'high',
        actionUrl: `/shipments/${shipment._id}`,
      });

      // Update package statuses to delivered
      await Promise.all(
        shipment.packageIds.map((pkgId) =>
          updatePackageStatus(pkgId.toString(), 'delivered')
        )
      );
    }

    sendSuccess(
      res,
      { shipment: updatedShipment },
      'Shipment status updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment statistics
 * GET /api/shipments/stats
 */
export const getShipmentStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const userId = req.user.userId;

    const [total, inTransit, delivered, totalCost] = await Promise.all([
      Shipment.countDocuments({ userId }),
      Shipment.countDocuments({ userId, status: 'in_transit' }),
      Shipment.countDocuments({ userId, status: 'delivered' }),
      Shipment.aggregate([
        { $match: { userId: userId as any } },
        { $group: { _id: null, total: { $sum: '$cost.total' } } },
      ]),
    ]);

    sendSuccess(res, {
      stats: {
        total,
        inTransit,
        delivered,
        totalSpent: totalCost[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
