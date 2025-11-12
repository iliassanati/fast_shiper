// server/src/controllers/consolidationController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest, CreateConsolidationDTO } from '../types/index.js';
import {
  Consolidation,
  createConsolidation,
  findConsolidationById,
  findConsolidationsByUser,
  updateConsolidationStatus,
} from '../models/Consolidation.js';
import { findPackageById, updatePackageStatus } from '../models/Package.js';
import { createNotification } from '../models/Notification.js';
import { createTransaction } from '../models/Transaction.js';
import { calculateConsolidationCost } from '../utils/pricing.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

/**
 * Get all consolidations for current user
 * GET /api/consolidations
 */
export const getConsolidations = async (
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

    const consolidations = await findConsolidationsByUser(
      req.user.userId,
      filters
    );
    const total = await Consolidation.countDocuments({
      userId: req.user.userId,
      ...(status && { status }),
    });

    sendSuccess(res, {
      consolidations,
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
 * Get single consolidation by ID
 * GET /api/consolidations/:id
 */
export const getConsolidationById = async (
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
    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Check ownership
    if (consolidation.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    sendSuccess(res, { consolidation });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new consolidation request
 * POST /api/consolidations
 */
export const createConsolidationRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const consolidationData: CreateConsolidationDTO = req.body;

    // Validate minimum packages
    if (consolidationData.packageIds.length < 2) {
      sendError(res, 'At least 2 packages required for consolidation', 400);
      return;
    }

    // Validate packages exist and belong to user
    const packages = await Promise.all(
      consolidationData.packageIds.map((id) => findPackageById(id))
    );

    if (packages.some((pkg) => !pkg)) {
      sendError(res, 'One or more packages not found', 404);
      return;
    }

    if (packages.some((pkg) => pkg!.userId.toString() !== req.user!.userId)) {
      sendForbidden(res, 'Access denied to one or more packages');
      return;
    }

    // Check if packages are available for consolidation
    const unavailable = packages.filter((pkg) => pkg!.status !== 'received');
    if (unavailable.length > 0) {
      sendError(res, 'Some packages are not available for consolidation', 400);
      return;
    }

    // Calculate total weight and volume
    const totalWeight = packages.reduce(
      (sum, pkg) => sum + pkg!.weight.value,
      0
    );
    const totalVolume = packages.reduce((sum, pkg) => {
      const dims = pkg!.dimensions;
      return sum + dims.length * dims.width * dims.height;
    }, 0);

    // Calculate costs
    const costs = calculateConsolidationCost(
      packages.length,
      consolidationData.preferences
    );

    // Calculate estimated completion (2-4 business days)
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 3);

    // Create consolidation
    const consolidation = await createConsolidation({
      userId: req.user.userId,
      packageIds: consolidationData.packageIds,
      status: 'pending',
      preferences: consolidationData.preferences,
      specialInstructions: consolidationData.specialInstructions || '',
      estimatedCompletion,
      cost: costs,
      beforeConsolidation: {
        totalWeight,
        totalVolume,
      },
      afterConsolidation: {
        weight: null,
        dimensions: {
          length: null,
          width: null,
          height: null,
        },
      },
    });

    // Update package statuses
    await Promise.all(
      consolidationData.packageIds.map((id) =>
        updatePackageStatus(id, 'consolidated')
      )
    );

    // Create transaction
    await createTransaction({
      userId: req.user.userId,
      type: 'consolidation',
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      status: 'pending',
      amount: {
        value: costs.total,
        currency: 'MAD',
      },
      paymentMethod: 'card',
      description: `Consolidation of ${packages.length} packages`,
    });

    // Create notification
    await createNotification({
      userId: req.user.userId,
      type: 'consolidation_complete',
      title: 'Consolidation Request Received',
      message: `Your consolidation request for ${packages.length} packages has been received and will be processed within 2-4 business days.`,
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'normal',
      actionUrl: `/consolidations/${consolidation._id}`,
    });

    sendSuccess(
      res,
      { consolidation },
      'Consolidation request created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update consolidation status
 * PUT /api/consolidations/:id
 */
export const updateConsolidation = async (
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
    const { status, afterConsolidation, resultingPackageId } = req.body;

    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Check ownership
    if (consolidation.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    // Update consolidation
    if (status) {
      await updateConsolidationStatus(id, status);
    }

    if (afterConsolidation) {
      consolidation.afterConsolidation = afterConsolidation;
    }

    if (resultingPackageId) {
      consolidation.resultingPackageId = resultingPackageId as any;
    }

    await consolidation.save();

    // Create notification if completed
    if (status === 'completed') {
      await createNotification({
        userId: req.user.userId,
        type: 'consolidation_complete',
        title: 'Consolidation Complete',
        message: `Your packages have been consolidated and are ready to ship!`,
        relatedId: consolidation._id,
        relatedModel: 'Consolidation',
        priority: 'high',
        actionUrl: `/consolidations/${consolidation._id}`,
      });
    }

    sendSuccess(res, { consolidation }, 'Consolidation updated successfully');
  } catch (error) {
    next(error);
  }
};
