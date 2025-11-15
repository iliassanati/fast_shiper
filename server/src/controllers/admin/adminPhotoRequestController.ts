// server/src/controllers/admin/adminPhotoRequestController.ts
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

    const query: any = {};

    if (status) {
      query.status = status;
    }

    // Build query
    const photoRequests = await PhotoRequest.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await PhotoRequest.countDocuments(query);

    console.log(`✅ Found ${photoRequests.length} photo requests`);

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

    const photoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email suiteNumber phone address')
      .populate('packageId');

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

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

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const photoRequest = await PhotoRequest.findById(id).populate('userId');

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    const oldStatus = photoRequest.status;
    photoRequest.status = status;

    if (status === 'completed') {
      photoRequest.completedAt = new Date();
    }

    await photoRequest.save();

    // Notify user
    if (status !== oldStatus) {
      let notificationMessage = '';
      let notificationTitle = '';

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
          priority: status === 'completed' ? 'high' : 'normal',
          actionUrl: `/profile`,
        });
      }
    }

    console.log(
      `✅ Photo request ${id} status updated: ${oldStatus} → ${status}`
    );

    sendSuccess(res, { photoRequest }, 'Status updated successfully');
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

    if (!Array.isArray(photos) || photos.length === 0) {
      sendError(res, 'Photos array is required', 400);
      return;
    }

    const photoRequest = await PhotoRequest.findById(id).populate('userId');

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Add photos
    const uploadedPhotos = photos.map((photo: any) => ({
      url: photo.url,
      description: photo.description || '',
      uploadedAt: new Date(),
    }));

    photoRequest.photos.push(...uploadedPhotos);
    await photoRequest.save();

    console.log(`✅ Uploaded ${photos.length} photos for request ${id}`);

    // Notify user
    await createNotification({
      userId: photoRequest.userId,
      type: 'photo_request_complete',
      title: 'New Photos Added',
      message: `${photos.length} new photo(s) have been added to your request.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    sendSuccess(res, { photoRequest }, 'Photos uploaded successfully');
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

    if (!report || typeof report !== 'string') {
      sendError(res, 'Report text is required', 400);
      return;
    }

    const photoRequest = await PhotoRequest.findById(id).populate('userId');

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    photoRequest.informationReport = report;
    await photoRequest.save();

    console.log(`✅ Added information report for request ${id}`);

    // Notify user
    await createNotification({
      userId: photoRequest.userId,
      type: 'photo_request_complete',
      title: 'Package Information Report Ready',
      message: 'Your package inspection report is now available.',
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    sendSuccess(res, { photoRequest }, 'Report added successfully');
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

    sendSuccess(res, {
      statistics: {
        total,
        byStatus: statusBreakdown,
        avgPhotosRequested: Math.round(avgPhotos[0]?.avg || 0),
        revenue: {
          total: revenueData[0]?.total || 0,
          completedRequests: revenueData[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    next(error);
  }
};
