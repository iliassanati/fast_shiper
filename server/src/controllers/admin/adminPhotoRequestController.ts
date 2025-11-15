// server/src/controllers/admin/adminPhotoRequestController.ts - FULLY FIXED
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { PhotoRequest } from '../../models/PhotoRequest.js';
import { Package } from '../../models/Package.js';
import { createNotification } from '../../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all photo requests (admin view)
 * GET /api/admin/photo-requests
 */
export const getAllPhotoRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { status, search, page = 1, limit = 20 } = req.query;

    console.log('📸 Admin fetching photo requests', { status, search });

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      // Search in user name, package tracking number, etc.
      // We'll do this with a more complex query after population
    }

    const photoRequests = await PhotoRequest.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await PhotoRequest.countDocuments(query);

    console.log(
      `✅ Found ${photoRequests.length} photo requests (total: ${total})`
    );

    sendSuccess(res, {
      photoRequests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching photo requests:', error);
    next(error);
  }
};

/**
 * Get photo request details
 * GET /api/admin/photo-requests/:id
 */
export const getPhotoRequestDetails = async (
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

    console.log(`📸 Admin fetching photo request details: ${id}`);

    const photoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email suiteNumber phone address')
      .populate('packageId');

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    console.log(`✅ Photo request found: ${photoRequest._id}`);

    sendSuccess(res, { photoRequest });
  } catch (error) {
    console.error('❌ Error fetching photo request details:', error);
    next(error);
  }
};

/**
 * Update photo request status
 * PUT /api/admin/photo-requests/:id/status
 */
export const updatePhotoRequestStatus = async (
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

    console.log(`📸 Admin updating photo request status: ${id} -> ${status}`);

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      sendError(
        res,
        'Invalid status. Must be one of: ' + validStatuses.join(', '),
        400
      );
      return;
    }

    const photoRequest = await PhotoRequest.findById(id).populate(
      'userId',
      'name email'
    );

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    const oldStatus = photoRequest.status;

    // Validate status transition
    if (oldStatus === 'completed' && status !== 'completed') {
      sendError(res, 'Cannot change status of completed request', 400);
      return;
    }

    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      sendError(res, 'Cannot change status of cancelled request', 400);
      return;
    }

    photoRequest.status = status;

    if (status === 'completed') {
      photoRequest.completedAt = new Date();
    }

    await photoRequest.save();

    console.log(`✅ Status updated: ${oldStatus} -> ${status}`);

    // Send notification based on status
    if (status !== oldStatus) {
      let notificationTitle = '';
      let notificationMessage = '';
      let priority: 'low' | 'normal' | 'high' = 'normal';

      switch (status) {
        case 'processing':
          notificationTitle = 'Photo Request Being Processed';
          notificationMessage =
            'Your photo request is now being processed by our team.';
          break;
        case 'completed':
          notificationTitle = 'Photos Ready!';
          notificationMessage =
            'Your requested photos are now available in your profile.';
          priority = 'high';
          break;
        case 'cancelled':
          notificationTitle = 'Photo Request Cancelled';
          notificationMessage = 'Your photo request has been cancelled.';
          break;
      }

      if (notificationMessage) {
        await createNotification({
          userId: photoRequest.userId,
          type: 'photo_request_complete',
          title: notificationTitle,
          message: notificationMessage,
          relatedId: photoRequest._id,
          relatedModel: 'PhotoRequest',
          priority: priority,
          actionUrl: `/profile`,
        });

        console.log(`✅ Notification sent to user`);
      }
    }

    // Reload with populated data
    const updatedPhotoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status');

    sendSuccess(
      res,
      { photoRequest: updatedPhotoRequest },
      'Status updated successfully'
    );
  } catch (error) {
    console.error('❌ Error updating photo request status:', error);
    next(error);
  }
};

/**
 * Upload photos for photo request
 * POST /api/admin/photo-requests/:id/photos
 */
export const uploadPhotos = async (
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
    const { photos } = req.body; // Array of { url, description }

    console.log(`📸 Admin uploading photos for request ${id}`);
    console.log(`📸 Number of photos:`, photos?.length || 0);

    if (!Array.isArray(photos) || photos.length === 0) {
      sendError(
        res,
        'Photos array is required and must contain at least one photo',
        400
      );
      return;
    }

    // Validate photo format
    for (const photo of photos) {
      if (!photo.url || typeof photo.url !== 'string') {
        sendError(res, 'Each photo must have a valid URL', 400);
        return;
      }
    }

    const photoRequest = await PhotoRequest.findById(id).populate(
      'userId',
      'name email'
    );

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Check if request is in valid state for photo uploads
    if (photoRequest.status === 'cancelled') {
      sendError(res, 'Cannot add photos to cancelled request', 400);
      return;
    }

    if (photoRequest.status === 'completed') {
      console.log('⚠️ Adding photos to already completed request');
    }

    // Add photos
    const uploadedPhotos = photos.map((photo: any) => ({
      url: photo.url,
      description: photo.description || '',
      uploadedAt: new Date(),
    }));

    photoRequest.photos.push(...uploadedPhotos);

    // If request was pending and payment was completed, move to processing
    if (photoRequest.status === 'pending') {
      photoRequest.status = 'processing';
      console.log(`✅ Status updated from pending to processing`);
    }

    await photoRequest.save();

    console.log(`✅ Uploaded ${photos.length} photos for request ${id}`);
    console.log(
      `✅ Request now has ${photoRequest.photos.length} total photos`
    );

    // Notify user
    await createNotification({
      userId: photoRequest.userId,
      type: 'photo_request_complete',
      title: 'New Photos Added',
      message: `${photos.length} new photo(s) have been added to your photo request.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    console.log(`✅ Notification sent to user`);

    // Reload with populated data
    const updatedPhotoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status');

    sendSuccess(
      res,
      { photoRequest: updatedPhotoRequest },
      'Photos uploaded successfully'
    );
  } catch (error) {
    console.error('❌ Error uploading photos:', error);
    next(error);
  }
};

/**
 * Add information report
 * POST /api/admin/photo-requests/:id/report
 */
export const addInformationReport = async (
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
    const { report } = req.body;

    console.log(`📝 Admin adding information report for request ${id}`);

    if (!report || typeof report !== 'string' || report.trim().length === 0) {
      sendError(res, 'Report text is required and cannot be empty', 400);
      return;
    }

    const photoRequest = await PhotoRequest.findById(id).populate(
      'userId',
      'name email'
    );

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Check if request type includes information
    if (photoRequest.requestType === 'photos') {
      sendError(
        res,
        'This photo request does not include information request',
        400
      );
      return;
    }

    // Check if request is in valid state
    if (photoRequest.status === 'cancelled') {
      sendError(res, 'Cannot add report to cancelled request', 400);
      return;
    }

    photoRequest.informationReport = report.trim();

    // If request was pending and payment was completed, move to processing
    if (photoRequest.status === 'pending') {
      photoRequest.status = 'processing';
      console.log(`✅ Status updated from pending to processing`);
    }

    await photoRequest.save();

    console.log(`✅ Information report added for request ${id}`);

    // Notify user
    await createNotification({
      userId: photoRequest.userId,
      type: 'photo_request_complete',
      title: 'Package Information Report Ready',
      message:
        'Your package inspection report is now available in your profile.',
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    console.log(`✅ Notification sent to user`);

    // Reload with populated data
    const updatedPhotoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status');

    sendSuccess(
      res,
      { photoRequest: updatedPhotoRequest },
      'Report added successfully'
    );
  } catch (error) {
    console.error('❌ Error adding report:', error);
    next(error);
  }
};

/**
 * Get photo request statistics
 * GET /api/admin/photo-requests/statistics
 */
export const getPhotoRequestStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    console.log('📊 Admin fetching photo request statistics');

    const [total, byStatus, avgPhotos, revenueData] = await Promise.all([
      // Total photo requests
      PhotoRequest.countDocuments(),

      // Requests by status
      PhotoRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Average photos requested
      PhotoRequest.aggregate([
        { $group: { _id: null, avg: { $avg: '$additionalPhotos' } } },
      ]),

      // Revenue from photo requests
      PhotoRequest.aggregate([
        {
          $match: { status: 'completed' },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$cost.total' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const statistics = {
      total,
      byStatus: statusBreakdown,
      avgPhotosRequested: Math.round(avgPhotos[0]?.avg || 0),
      revenue: {
        total: revenueData[0]?.total || 0,
        completedRequests: revenueData[0]?.count || 0,
        currency: 'MAD',
      },
    };

    console.log('✅ Statistics calculated:', statistics);

    sendSuccess(res, { statistics });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    next(error);
  }
};
