// server/src/controllers/admin/adminConsolidationController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
  Consolidation,
  findConsolidationById,
  updateConsolidationStatus,
} from '../../models/Consolidation.js';
import { Package, findPackageById } from '../../models/Package.js';
import { createNotification } from '../../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all consolidations (admin view)
 * GET /api/admin/consolidations
 */
export const getAllConsolidations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { status, userId, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    const consolidations = await Consolidation.find(query)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Consolidation.countDocuments(query);

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
 * Get single consolidation
 * GET /api/admin/consolidations/:id
 */
export const getConsolidationDetails = async (
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
    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    sendSuccess(res, { consolidation });
  } catch (error) {
    next(error);
  }
};

/**
 * Update consolidation status
 * PUT /api/admin/consolidations/:id/status
 */
export const updateConsolidationStatusById = async (
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

    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Update status
    const updated = await updateConsolidationStatus(id, status);

    // Create notification based on status
    let notificationMessage = '';
    let notificationTitle = '';

    if (status === 'processing') {
      notificationTitle = 'Consolidation In Progress';
      notificationMessage =
        'Your consolidation request is now being processed.';
    } else if (status === 'completed') {
      notificationTitle = 'Consolidation Complete';
      notificationMessage =
        'Your packages have been consolidated and are ready to ship!';
    } else if (status === 'cancelled') {
      notificationTitle = 'Consolidation Cancelled';
      notificationMessage = 'Your consolidation request has been cancelled.';
    }

    if (notificationMessage) {
      await createNotification({
        userId: consolidation.userId,
        type: 'consolidation_complete',
        title: notificationTitle,
        message: notificationMessage,
        relatedId: consolidation._id,
        relatedModel: 'Consolidation',
        priority: status === 'completed' ? 'high' : 'normal',
        actionUrl: `/consolidations/${consolidation._id}`,
      });
    }

    sendSuccess(res, { consolidation: updated }, 'Status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload consolidation photos
 * POST /api/admin/consolidations/:id/photos
 */
export const uploadConsolidationPhotos = async (
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
    const { photos } = req.body; // Array of { url, type }

    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Add photos
    photos.forEach((photo: { url: string; type: string }) => {
      consolidation.photos.push({
        url: photo.url,
        type: photo.type as any,
        uploadedAt: new Date(),
      });
    });

    await consolidation.save();

    // Notify user
    await createNotification({
      userId: consolidation.userId,
      type: 'consolidation_complete',
      title: 'Consolidation Photos Available',
      message: 'Photos of your consolidation are now available.',
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'normal',
      actionUrl: `/consolidations/${consolidation._id}`,
    });

    sendSuccess(res, { consolidation }, 'Photos uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Complete consolidation and create resulting package
 * POST /api/admin/consolidations/:id/complete
 */
export const completeConsolidation = async (
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
    const { weight, dimensions, notes } = req.body;

    const consolidation = await findConsolidationById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    if (consolidation.status === 'completed') {
      sendError(res, 'Consolidation already completed', 400);
      return;
    }

    // Update consolidation with final measurements
    consolidation.afterConsolidation = {
      weight,
      dimensions,
    };
    consolidation.status = 'completed';
    consolidation.actualCompletion = new Date();
    if (notes) {
      consolidation.notes = notes;
    }

    await consolidation.save();

    // Create a new consolidated package
    const firstPackage = await findPackageById(
      consolidation.packageIds[0].toString()
    );

    if (firstPackage) {
      const consolidatedPackage = new Package({
        userId: consolidation.userId,
        trackingNumber: `CONS-${Date.now()}`,
        retailer: 'Consolidated',
        description: `Consolidated package (${consolidation.packageIds.length} items)`,
        status: 'received',
        receivedDate: new Date(),
        weight: {
          value: weight,
          unit: 'kg',
        },
        dimensions: {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          unit: 'cm',
        },
        storageDay: 0,
        estimatedValue: {
          amount: 0, // Will be calculated
          currency: 'USD',
        },
        photos: consolidation.photos.filter((p) => p.type === 'after'),
        consolidationId: consolidation._id,
        notes: `Consolidated from ${consolidation.packageIds.length} packages`,
      });

      await consolidatedPackage.save();

      // Link the resulting package
      consolidation.resultingPackageId = consolidatedPackage._id as any;
      await consolidation.save();

      // Update original packages status
      await Package.updateMany(
        { _id: { $in: consolidation.packageIds } },
        { $set: { status: 'consolidated', consolidationId: consolidation._id } }
      );
    }

    // Notify user
    await createNotification({
      userId: consolidation.userId,
      type: 'consolidation_complete',
      title: 'Consolidation Complete!',
      message: `Your ${consolidation.packageIds.length} packages have been consolidated and are ready to ship.`,
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'high',
      actionUrl: `/consolidations/${consolidation._id}`,
    });

    sendSuccess(res, { consolidation }, 'Consolidation completed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get consolidation statistics
 * GET /api/admin/consolidations/statistics
 */
export const getConsolidationStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const [total, byStatus, avgProcessingTime, todayCompleted] =
      await Promise.all([
        // Total consolidations
        Consolidation.countDocuments(),

        // By status
        Consolidation.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // Average processing time
        Consolidation.aggregate([
          {
            $match: {
              status: 'completed',
              actualCompletion: { $exists: true },
            },
          },
          {
            $project: {
              processingTime: {
                $subtract: ['$actualCompletion', '$createdAt'],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: '$processingTime' },
            },
          },
        ]),

        // Completed today
        Consolidation.countDocuments({
          status: 'completed',
          actualCompletion: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }),
      ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    // Convert milliseconds to days
    const avgDays = avgProcessingTime[0]?.avgTime
      ? Math.round(avgProcessingTime[0].avgTime / (1000 * 60 * 60 * 24))
      : 0;

    sendSuccess(res, {
      statistics: {
        total,
        byStatus: statusBreakdown,
        avgProcessingDays: avgDays,
        completedToday: todayCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};
