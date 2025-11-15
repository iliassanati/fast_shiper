// server/src/controllers/admin/adminConsolidationController.ts - FIXED VERSION
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

    console.log('📦 Fetching consolidations with query:', query);

    const consolidations = await Consolidation.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate({
        path: 'packageIds',
        select: 'trackingNumber retailer description status weight dimensions',
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()
      .exec();

    const total = await Consolidation.countDocuments(query);

    console.log(`✅ Found ${consolidations.length} consolidations`);

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
    console.log('🔍 Fetching consolidation:', id);

    const consolidation = await Consolidation.findById(id)
      .populate('userId', 'name email suiteNumber phone')
      .populate({
        path: 'packageIds',
        select:
          'trackingNumber retailer description status weight dimensions estimatedValue',
      })
      .populate({
        path: 'resultingPackageId',
        select: 'trackingNumber status weight dimensions',
      })
      .lean();

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    console.log('✅ Consolidation found');
    sendSuccess(res, { consolidation });
  } catch (error) {
    console.error('❌ Error fetching consolidation:', error);
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

    console.log(`🔄 Updating consolidation ${id} status to: ${status}`);

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      sendError(res, 'Invalid status value', 400);
      return;
    }

    const consolidation = await Consolidation.findById(id).populate(
      'userId',
      'name email'
    );

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Update status
    consolidation.status = status;

    if (status === 'completed') {
      consolidation.actualCompletion = new Date();
    }

    await consolidation.save();

    console.log(`✅ Status updated successfully`);

    // Create notification based on status
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
      case 'processing':
        notificationTitle = 'Consolidation In Progress';
        notificationMessage =
          'Your consolidation request is now being processed.';
        break;
      case 'completed':
        notificationTitle = 'Consolidation Complete';
        notificationMessage =
          'Your packages have been consolidated and are ready to ship!';
        break;
      case 'cancelled':
        notificationTitle = 'Consolidation Cancelled';
        notificationMessage = 'Your consolidation request has been cancelled.';
        // Revert package statuses back to received
        await Package.updateMany(
          { _id: { $in: consolidation.packageIds } },
          { $set: { status: 'received', consolidationId: null } }
        );
        break;
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
      console.log('✅ Notification sent to user');
    }

    // Reload with populated fields
    const updated = await Consolidation.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds');

    sendSuccess(res, { consolidation: updated }, 'Status updated successfully');
  } catch (error) {
    console.error('❌ Error updating status:', error);
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

    console.log(
      `📸 Uploading ${photos?.length || 0} photos for consolidation ${id}`
    );

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      sendError(res, 'Photos array is required', 400);
      return;
    }

    const consolidation = await Consolidation.findById(id);

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

    console.log('✅ Photos uploaded successfully');

    // Notify user
    await createNotification({
      userId: consolidation.userId,
      type: 'consolidation_complete',
      title: 'Consolidation Photos Available',
      message: `Photos of your consolidation are now available to view.`,
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'normal',
      actionUrl: `/consolidations/${consolidation._id}`,
    });

    const updated = await Consolidation.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds');

    sendSuccess(
      res,
      { consolidation: updated },
      'Photos uploaded successfully'
    );
  } catch (error) {
    console.error('❌ Error uploading photos:', error);
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
    const { weight, dimensions, notes, photos } = req.body;

    console.log(`✅ Completing consolidation ${id}`);

    // Validate required fields
    if (!weight || !dimensions) {
      sendError(res, 'Weight and dimensions are required', 400);
      return;
    }

    const consolidation = await Consolidation.findById(id).populate(
      'userId',
      'name email suiteNumber'
    );

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

    // Add photos if provided
    if (photos && Array.isArray(photos)) {
      photos.forEach((photo: { url: string; type: string }) => {
        consolidation.photos.push({
          url: photo.url,
          type: photo.type as any,
          uploadedAt: new Date(),
        });
      });
    }

    await consolidation.save();

    console.log('✅ Consolidation data updated');

    // Create a new consolidated package
    const consolidatedPackage = new Package({
      userId: consolidation.userId._id,
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
        amount: 0, // Can be calculated from original packages if needed
        currency: 'USD',
      },
      photos: consolidation.photos.filter((p) => p.type === 'after'),
      consolidationId: consolidation._id,
      notes:
        notes ||
        `Consolidated from ${consolidation.packageIds.length} packages`,
    });

    await consolidatedPackage.save();

    console.log(
      `✅ Created resulting package: ${consolidatedPackage.trackingNumber}`
    );

    // Link the resulting package
    consolidation.resultingPackageId = consolidatedPackage._id as any;
    await consolidation.save();

    // Update original packages status to consolidated
    await Package.updateMany(
      { _id: { $in: consolidation.packageIds } },
      { $set: { status: 'consolidated', consolidationId: consolidation._id } }
    );

    console.log('✅ Updated original package statuses');

    // Notify user
    await createNotification({
      userId: consolidation.userId._id,
      type: 'consolidation_complete',
      title: 'Consolidation Complete!',
      message: `Your ${consolidation.packageIds.length} packages have been consolidated into one package (${consolidatedPackage.trackingNumber}). Ready to ship!`,
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'high',
      actionUrl: `/packages/${consolidatedPackage._id}`,
    });

    console.log('✅ Notification sent');

    // Reload with all populated fields
    const completed = await Consolidation.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds')
      .populate('resultingPackageId');

    sendSuccess(
      res,
      {
        consolidation: completed,
        resultingPackage: consolidatedPackage,
      },
      'Consolidation completed successfully'
    );
  } catch (error) {
    console.error('❌ Error completing consolidation:', error);
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

    console.log('📊 Fetching consolidation statistics');

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

    console.log('✅ Statistics calculated');

    sendSuccess(res, {
      statistics: {
        total,
        byStatus: statusBreakdown,
        avgProcessingDays: avgDays,
        completedToday: todayCompleted,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    next(error);
  }
};

/**
 * Delete/Cancel consolidation
 * DELETE /api/admin/consolidations/:id
 */
export const deleteConsolidation = async (
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

    console.log(`🗑️ Deleting consolidation ${id}`);

    const consolidation = await Consolidation.findById(id);

    if (!consolidation) {
      sendNotFound(res, 'Consolidation not found');
      return;
    }

    // Can only delete/cancel if not completed
    if (consolidation.status === 'completed') {
      sendError(res, 'Cannot delete completed consolidations', 400);
      return;
    }

    // Revert package statuses
    await Package.updateMany(
      { _id: { $in: consolidation.packageIds } },
      { $set: { status: 'received', consolidationId: null } }
    );

    // Mark as cancelled instead of deleting
    consolidation.status = 'cancelled';
    await consolidation.save();

    console.log('✅ Consolidation cancelled');

    // Notify user
    await createNotification({
      userId: consolidation.userId,
      type: 'consolidation_complete',
      title: 'Consolidation Cancelled',
      message: 'Your consolidation request has been cancelled by admin.',
      relatedId: consolidation._id,
      relatedModel: 'Consolidation',
      priority: 'normal',
      actionUrl: '/packages',
    });

    sendSuccess(res, null, 'Consolidation cancelled successfully');
  } catch (error) {
    console.error('❌ Error deleting consolidation:', error);
    next(error);
  }
};
