// server/src/controllers/admin/adminConsolidationController.ts - FIXED VERSION
import type { NextFunction, Response } from 'express';
import { Consolidation } from '../../models/Consolidation.js';
import { createNotification } from '../../models/Notification.js';
import { createPackage, Package } from '../../models/Package.js';
import type { AuthRequest } from '../../types/index.js';
import {
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../../utils/responses.js';
import { sendConsolidationCompleteEmail } from '../../services/emailService.js';

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

    if (status) query.status = status;
    if (userId) query.userId = userId;

    console.log('📦 Fetching consolidations with query:', query);

    const consolidations = await Consolidation.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate({
        path: 'packageIds',
        select: 'trackingNumber retailer description status weight dimensions',
      })
      .populate({
        path: 'resultingPackageId',
        select: 'trackingNumber status weight dimensions',
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

    consolidation.status = status;

    if (status === 'completed') {
      consolidation.actualCompletion = new Date();
    }

    await consolidation.save();

    console.log(`✅ Status updated successfully`);

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

    const updated = await Consolidation.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds')
      .populate('resultingPackageId');

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
    const { photos } = req.body;

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

    photos.forEach((photo: { url: string; type: string }) => {
      consolidation.photos.push({
        url: photo.url,
        type: photo.type as any,
        uploadedAt: new Date(),
      });
    });

    await consolidation.save();

    console.log('✅ Photos uploaded successfully');

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
      .populate('packageIds')
      .populate('resultingPackageId');

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
 * 🔥 FIXED: Photo type mapping + Email notification
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
    console.log('📦 Request data:', { weight, dimensions, notes });

    // Validate required fields
    if (
      !weight ||
      !dimensions ||
      !dimensions.length ||
      !dimensions.width ||
      !dimensions.height
    ) {
      sendError(
        res,
        'Weight and complete dimensions (length, width, height) are required',
        400
      );
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

    // Fetch original packages
    const originalPackages = await Package.find({
      _id: { $in: consolidation.packageIds },
    });

    console.log(`📦 Found ${originalPackages.length} original packages`);

    const packageDescriptions = originalPackages
      .map((pkg) => `${pkg.description} (${pkg.retailer})`)
      .join(', ');

    // 🔥 FIX: Map consolidation photo types to valid package types
    // Consolidation uses: 'before', 'unpacked', 'after'
    // Package accepts: 'basic', 'unpacked', 'detailed', 'damage'
    const mappedPhotos = consolidation.photos
      .filter((p) => p.type === 'after')
      .map((p) => ({
        url: p.url,
        type: 'detailed' as const, // Map 'after' to 'detailed'
        uploadedAt: p.uploadedAt,
      }));

    // Create consolidated package
    const consolidatedPackage = await createPackage({
      userId: consolidation.userId._id,
      trackingNumber: `CONS-${Date.now()}`,
      retailer: 'Consolidated',
      description: `Consolidated package: ${packageDescriptions}`,
      status: 'received',
      receivedDate: new Date(),
      weight: { value: weight, unit: 'kg' },
      dimensions: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        unit: 'cm',
      },
      storageDay: 0,
      estimatedValue: {
        amount: originalPackages.reduce(
          (sum, pkg) => sum + (pkg.estimatedValue?.amount || 0),
          0
        ),
        currency: 'USD',
      },
      photos: mappedPhotos,
      consolidationId: consolidation._id,
      isConsolidatedResult: true,
      originalPackageIds: consolidation.packageIds as any,
      notes:
        notes ||
        `Consolidated from ${consolidation.packageIds.length} packages`,
    });

    await consolidatedPackage.save();
    console.log(
      `✅ Created resulting package: ${consolidatedPackage.trackingNumber}`
    );

    // Update consolidation
    consolidation.afterConsolidation = { weight, dimensions };
    consolidation.status = 'completed';
    consolidation.actualCompletion = new Date();
    consolidation.resultingPackageId = consolidatedPackage._id as any;
    if (notes) consolidation.notes = notes;

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

    // Update original packages
    await Package.updateMany(
      { _id: { $in: consolidation.packageIds } },
      { $set: { status: 'consolidated', consolidationId: consolidation._id } }
    );
    console.log('✅ Updated original package statuses');

    // Notify user via in-app notification
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

    // 🔥 NEW: Send completion email
    try {
      await sendConsolidationCompleteEmail(
        consolidation.userId as any,
        consolidation as any,
        consolidatedPackage as any,
        originalPackages as any[]
      );
      console.log('✅ Consolidation completion email sent');
    } catch (emailError) {
      console.error('⚠️ Email failed but consolidation completed:', emailError);
    }

    // Reload with populated fields
    const completed = await Consolidation.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('packageIds')
      .populate('resultingPackageId');

    sendSuccess(
      res,
      { consolidation: completed, resultingPackage: consolidatedPackage },
      'Consolidation completed successfully'
    );
  } catch (error) {
    console.error('❌ Error completing consolidation:', error);
    console.error('Stack trace:', (error as Error).stack);
    sendError(
      res,
      `Failed to complete consolidation: ${(error as Error).message}`,
      500
    );
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
        Consolidation.countDocuments(),
        Consolidation.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
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

    if (consolidation.status === 'completed') {
      sendError(res, 'Cannot delete completed consolidations', 400);
      return;
    }

    await Package.updateMany(
      { _id: { $in: consolidation.packageIds } },
      { $set: { status: 'received', consolidationId: null } }
    );

    consolidation.status = 'cancelled';
    await consolidation.save();

    console.log('✅ Consolidation cancelled');

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
