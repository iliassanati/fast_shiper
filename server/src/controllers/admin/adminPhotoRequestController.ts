// server/src/controllers/admin/adminPhotoRequestController.ts - COMPLETE FIXED VERSION
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { PhotoRequest } from '../../models/PhotoRequest.js';
import { createNotification } from '../../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';
import { sendPhotoRequestCompletionEmail } from '../../services/emailService.js';

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

    console.log('📸 Admin fetching photo requests', {
      status,
      search,
      page,
      limit,
    });

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const photoRequests = await PhotoRequest.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()
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
      .populate('packageId')
      .lean();

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
      .populate('packageId', 'trackingNumber retailer description status')
      .lean();

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
// Update the uploadPhotos function (around line 200)
export const uploadPhotos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('📸 ========================================');
    console.log('📸 UPLOAD PHOTOS REQUEST RECEIVED');
    console.log('📸 ========================================');

    if (!req.isAdmin) {
      console.log('❌ Not admin');
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { photos } = req.body;

    console.log(`📸 Admin uploading photos for request ${id}`);
    console.log(`📸 Number of photos:`, photos?.length || 0);

    // Validation
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      sendError(res, 'At least one photo is required', 400);
      return;
    }

    // Validate each photo
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (!photo.url || typeof photo.url !== 'string') {
        sendError(res, `Photo at index ${i} must have a valid URL string`, 400);
        return;
      }
    }

    // Find photo request
    const photoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email')
      .populate('packageId');

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Add photos
    const uploadedPhotos = photos.map((photo: any, index: number) => ({
      url: photo.url,
      description: photo.description || `Photo ${index + 1}`,
      uploadedAt: new Date(),
    }));

    photoRequest.photos.push(...uploadedPhotos);

    // ✅ AUTO-COMPLETE STATUS when photos are uploaded
    const oldStatus = photoRequest.status;
    photoRequest.status = 'completed';
    photoRequest.completedAt = new Date();

    await photoRequest.save();

    console.log(`✅ Uploaded ${photos.length} photos successfully`);
    console.log(`✅ Status updated: ${oldStatus} -> completed`);

    // ✅ SEND EMAIL NOTIFICATION TO CUSTOMER
    const user = photoRequest.userId as any;
    const pkg = photoRequest.packageId as any;

    if (user && pkg) {
      try {
        await sendPhotoRequestCompletionEmail(user, photoRequest, pkg);
        console.log(`✅ Completion email sent to ${user.email}`);
      } catch (emailError) {
        console.error('⚠️ Email failed but request completed:', emailError);
      }
    }

    // ✅ SEND COMPLETION NOTIFICATION
    await createNotification({
      userId: photoRequest.userId,
      type: 'photo_request_complete',
      title: '📸 Your Package Photos Are Ready!',
      message: `Your requested photos for package ${pkg.trackingNumber} are now available. ${photos.length} photo(s) uploaded. The $2.00 fee will be added to your shipment invoice.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'high',
      actionUrl: `/packages/${pkg._id}`,
    });

    // Reload with populated data
    const updatedPhotoRequest = await PhotoRequest.findById(id)
      .populate('userId', 'name email suiteNumber phone')
      .populate('packageId', 'trackingNumber retailer description status')
      .lean();

    console.log('📸 ========================================');
    console.log('📸 UPLOAD COMPLETE & EMAIL SENT');
    console.log('📸 ========================================');

    sendSuccess(
      res,
      { photoRequest: updatedPhotoRequest },
      `${photos.length} photo(s) uploaded successfully. Request marked as completed and customer notified.`
    );
  } catch (error) {
    console.error('❌ ERROR UPLOADING PHOTOS:', error);
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
    console.log('📝 ========================================');
    console.log('📝 ADD INFORMATION REPORT');
    console.log('📝 ========================================');

    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { report } = req.body;

    console.log(`📝 Admin adding information report for request ${id}`);
    console.log(`📝 Report length: ${report?.length || 0} characters`);

    if (!report || typeof report !== 'string' || report.trim().length === 0) {
      console.log('❌ Invalid report');
      sendError(res, 'Report text is required and cannot be empty', 400);
      return;
    }

    const photoRequest = await PhotoRequest.findById(id).populate(
      'userId',
      'name email'
    );

    if (!photoRequest) {
      console.log('❌ Photo request not found');
      sendNotFound(res, 'Photo request not found');
      return;
    }

    console.log('✅ Photo request found');
    console.log('   - Request type:', photoRequest.requestType);
    console.log('   - Current status:', photoRequest.status);

    // Check if request type includes information
    if (photoRequest.requestType === 'photos') {
      console.log('❌ Request type is photos-only');
      sendError(
        res,
        'This photo request does not include information request',
        400
      );
      return;
    }

    // Check if request is in valid state
    if (photoRequest.status === 'cancelled') {
      console.log('❌ Request is cancelled');
      sendError(res, 'Cannot add report to cancelled request', 400);
      return;
    }

    photoRequest.informationReport = report.trim();

    // Update status if needed
    const oldStatus = photoRequest.status;
    if (photoRequest.status === 'pending') {
      photoRequest.status = 'processing';
      console.log(`✅ Status updated from pending to processing`);
    }

    await photoRequest.save();

    console.log(`✅ Information report added`);
    console.log(`   - Status: ${oldStatus} -> ${photoRequest.status}`);

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
      .populate('packageId', 'trackingNumber retailer description status')
      .lean();

    console.log('📝 ========================================');
    console.log('📝 REPORT ADDED SUCCESSFULLY');
    console.log('📝 ========================================');

    sendSuccess(
      res,
      { photoRequest: updatedPhotoRequest },
      'Report added successfully'
    );
  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERROR ADDING REPORT');
    console.error('❌ ========================================');
    console.error('❌ Error:', error);
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
      PhotoRequest.countDocuments(),
      PhotoRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      PhotoRequest.aggregate([
        { $group: { _id: null, avg: { $avg: '$additionalPhotos' } } },
      ]),
      PhotoRequest.aggregate([
        { $match: { status: 'completed' } },
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
