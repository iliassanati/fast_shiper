// server/src/controllers/consolidationController.ts - FIXED OWNERSHIP CHECK
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
 * Helper function to extract userId from package (handles populated and non-populated)
 */
function getPackageUserId(pkg: any): string {
  // If userId is populated (has _id property), use that
  if (pkg.userId._id) {
    return pkg.userId._id.toString();
  }
  // Otherwise, userId is the raw ObjectId
  return pkg.userId.toString();
}

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
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    console.log('🔍 Fetching consolidations for user:', req.user.userId);

    const filters = {
      status: status as string | undefined,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };

    // 🔥 FIX: Ensure we only get consolidations for THIS user
    const consolidations = await findConsolidationsByUser(
      req.user.userId,
      filters
    );

    const countQuery: any = { userId: req.user.userId };
    if (status) {
      countQuery.status = status;
    }
    const total = await Consolidation.countDocuments(countQuery);

    console.log(
      `✅ Found ${consolidations.length} consolidations for user ${req.user.userId}`
    );

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
    console.error('❌ Error fetching consolidations:', error);
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
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;
    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // 🔥 FIX: Check ownership
    console.log('🔍 Checking consolidation ownership:', {
      consolidationUserId: consolidation.userId.toString(),
      authUserId: req.user.userId,
      match: consolidation.userId.toString() === req.user.userId,
    });

    if (consolidation.userId.toString() !== req.user.userId) {
      console.log('❌ Access denied - consolidation ownership mismatch');
      sendForbidden(res, 'Access denied to this consolidation');
      return;
    }

    sendSuccess(res, { consolidation });
  } catch (error) {
    console.error('❌ Error fetching consolidation:', error);
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
      sendForbidden(res, 'Authentication required');
      return;
    }

    const consolidationData: CreateConsolidationDTO = req.body;

    console.log('📦 Creating consolidation for user:', req.user.userId);
    console.log('📦 Request data:', consolidationData);

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

    console.log('🔍 Checking package ownership...');
    console.log('📦 Auth user ID:', req.user.userId);
    console.log(
      '📦 Package user IDs:',
      packages.map((pkg) => ({
        packageId: pkg!._id.toString(),
        userId: getPackageUserId(pkg),
        userInfo: pkg!.userId,
      }))
    );

    // 🔥 CRITICAL FIX: Check ownership for ALL packages
    // Handle both populated and non-populated userId
    const unauthorized = packages.filter((pkg) => {
      const pkgUserId = getPackageUserId(pkg);
      const isOwner = pkgUserId === req.user!.userId;

      if (!isOwner) {
        console.log(
          `❌ Package ${pkg!._id} - Owner: ${pkgUserId}, Auth User: ${req.user!.userId}`
        );
      }

      return !isOwner;
    });

    if (unauthorized.length > 0) {
      console.log(
        '❌ Access denied - user does not own all packages:',
        unauthorized.map((p) => ({
          id: p!._id,
          owner: getPackageUserId(p),
          authUser: req.user!.userId,
        }))
      );
      sendForbidden(
        res,
        'Access denied: You do not own one or more of these packages'
      );
      return;
    }

    console.log(
      '✅ All packages owned by user - proceeding with consolidation'
    );

    // Check if packages are available for consolidation
    const unavailable = packages.filter((pkg) => pkg!.status !== 'received');
    if (unavailable.length > 0) {
      console.log(
        '❌ Some packages not available:',
        unavailable.map((p) => ({ id: p!._id, status: p!.status }))
      );
      sendError(
        res,
        `Some packages are not available for consolidation. Only packages with "received" status can be consolidated.`,
        400
      );
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

    // Calculate costs using pricing utility
    const costs = calculateConsolidationCost(
      packages.length,
      consolidationData.preferences || {}
    );

    console.log('💰 Calculated costs:', costs);

    // Calculate estimated completion (2-4 business days = 3 days average)
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 3);

    // Create consolidation
    const consolidation = await createConsolidation({
      userId: req.user.userId,
      packageIds: consolidationData.packageIds,
      status: 'pending',
      preferences: {
        removePackaging: consolidationData.preferences?.removePackaging ?? true,
        addProtection: consolidationData.preferences?.addProtection ?? false,
        requestUnpackedPhotos:
          consolidationData.preferences?.requestUnpackedPhotos ?? false,
      },
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

    console.log('✅ Consolidation created:', consolidation._id);

    // Update package statuses to "consolidated"
    await Promise.all(
      consolidationData.packageIds.map((id) =>
        updatePackageStatus(id, 'consolidated')
      )
    );

    console.log('✅ Package statuses updated to "consolidated"');

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

    console.log('✅ Transaction created');

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

    console.log('✅ Notification created');

    sendSuccess(
      res,
      { consolidation },
      'Consolidation request created successfully',
      201
    );
  } catch (error) {
    console.error('❌ Error creating consolidation:', error);
    next(error);
  }
};

/**
 * Update consolidation status (admin mainly, but users can cancel)
 * PUT /api/consolidations/:id
 */
export const updateConsolidation = async (
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
    const { status, afterConsolidation, resultingPackageId } = req.body;

    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // 🔥 FIX: Check ownership
    if (consolidation.userId.toString() !== req.user.userId) {
      console.log('❌ Access denied - consolidation ownership mismatch');
      sendForbidden(res, 'Access denied to this consolidation');
      return;
    }

    // Users can only cancel their own consolidations if still pending
    if (status && status !== 'cancelled') {
      sendForbidden(
        res,
        'Users can only cancel pending consolidations. Other status updates are admin-only.'
      );
      return;
    }

    // Update consolidation
    if (status === 'cancelled' && consolidation.status === 'pending') {
      await updateConsolidationStatus(id, 'cancelled');

      // Revert package statuses back to "received"
      const packages = consolidation.packageIds as any[];
      await Promise.all(
        packages.map((pkgId) =>
          updatePackageStatus(pkgId.toString(), 'received')
        )
      );

      console.log('✅ Consolidation cancelled and packages reverted');
    } else if (afterConsolidation) {
      consolidation.afterConsolidation = afterConsolidation;
      await consolidation.save();
    } else if (resultingPackageId) {
      consolidation.resultingPackageId = resultingPackageId as any;
      await consolidation.save();
    }

    sendSuccess(res, { consolidation }, 'Consolidation updated successfully');
  } catch (error) {
    console.error('❌ Error updating consolidation:', error);
    next(error);
  }
};

/**
 * Cancel consolidation (user can cancel pending consolidations)
 * DELETE /api/consolidations/:id
 */
export const cancelConsolidation = async (
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
    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Check ownership
    if (consolidation.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied to this consolidation');
      return;
    }

    // Can only cancel pending consolidations
    if (consolidation.status !== 'pending') {
      sendError(res, 'Only pending consolidations can be cancelled', 400);
      return;
    }

    // Update status
    await updateConsolidationStatus(id, 'cancelled');

    // Revert package statuses
    const packages = consolidation.packageIds as any[];
    await Promise.all(
      packages.map((pkgId) => updatePackageStatus(pkgId.toString(), 'received'))
    );

    // Create notification
    await createNotification({
      userId: req.user.userId,
      type: 'consolidation_complete',
      title: 'Consolidation Cancelled',
      message: 'Your consolidation request has been cancelled.',
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'normal',
      actionUrl: '/packages',
    });

    sendSuccess(res, null, 'Consolidation cancelled successfully');
  } catch (error) {
    console.error('❌ Error cancelling consolidation:', error);
    next(error);
  }
};
