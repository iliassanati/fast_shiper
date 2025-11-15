// server/src/controllers/photoRequestController.ts - COMPLETE VERSION WITH PAYMENT
import type { Response, NextFunction } from 'express';
import type { AuthRequest, CreatePhotoRequestDTO } from '../types/index.js';
import {
  PhotoRequest,
  createPhotoRequest,
  findPhotoRequestById,
  findPhotoRequestsByUser,
} from '../models/PhotoRequest.js';
import { findPackageById } from '../models/Package.js';
import { createNotification } from '../models/Notification.js';
import { Transaction } from '../models/Transaction.js';
import { calculatePhotoRequestCost } from '../utils/pricing.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

/**
 * Get all photo requests for current user
 * GET /api/photo-requests
 */
export const getPhotoRequests = async (
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

    console.log('📸 Fetching photo requests for user:', req.user.userId);

    const filters = {
      status: status as string | undefined,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };

    const photoRequests = await findPhotoRequestsByUser(
      req.user.userId,
      filters
    );

    const total = await PhotoRequest.countDocuments({
      userId: req.user.userId,
      ...(status && { status }),
    });

    console.log('✅ Found', photoRequests.length, 'photo requests');

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
 * Get single photo request by ID
 * GET /api/photo-requests/:id
 */
export const getPhotoRequestById = async (
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
    const photoRequest = await findPhotoRequestById(id);

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    if (photoRequest.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    sendSuccess(res, { photoRequest });
  } catch (error) {
    console.error('❌ Error fetching photo request:', error);
    next(error);
  }
};

/**
 * Create new photo request (WITHOUT payment - payment is separate step)
 * POST /api/photo-requests
 */
export const createNewPhotoRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const requestData: CreatePhotoRequestDTO = req.body;

    console.log('📸 Creating photo request:', {
      userId: req.user.userId,
      packageId: requestData.packageId,
    });

    // Validate package exists and belongs to user
    const pkg = await findPackageById(requestData.packageId);

    if (!pkg) {
      console.log('❌ Package not found:', requestData.packageId);
      sendNotFound(res, 'Package not found');
      return;
    }

    const packageUserId = (pkg.userId as any)._id
      ? (pkg.userId as any)._id.toString()
      : pkg.userId.toString();

    if (packageUserId !== req.user.userId.toString()) {
      console.log('❌ Access denied - package ownership mismatch');
      sendForbidden(res, 'This package does not belong to you');
      return;
    }

    // Check package status
    if (pkg.status !== 'received') {
      console.log('❌ Invalid package status:', pkg.status);
      sendError(
        res,
        'Photo requests can only be made for packages in storage',
        400
      );
      return;
    }

    // Calculate costs
    const costs = calculatePhotoRequestCost(
      requestData.additionalPhotos,
      requestData.requestType
    );

    console.log('💰 Calculated costs:', costs);

    // Create photo request with status 'pending_payment'
    const photoRequest = await createPhotoRequest({
      userId: req.user.userId,
      packageId: requestData.packageId,
      requestType: requestData.requestType,
      status: 'pending', // Will change to 'processing' after payment
      additionalPhotos: requestData.additionalPhotos,
      specificRequests: requestData.specificRequests || [],
      customInstructions: requestData.customInstructions || '',
      cost: costs,
    });

    console.log('✅ Photo request created:', photoRequest._id);

    // Create transaction for payment (status: pending)
    const transaction = await Transaction.create({
      userId: req.user.userId,
      type: 'photo_request',
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      status: 'pending',
      amount: {
        value: costs.total,
        currency: 'MAD',
      },
      paymentMethod: 'card',
      description: `Photo request for package - ${requestData.additionalPhotos} photos`,
    });

    console.log('✅ Transaction created:', transaction._id);

    sendSuccess(
      res,
      {
        photoRequest,
        transaction: {
          id: transaction._id,
          amount: costs.total,
          currency: 'MAD',
        },
      },
      'Photo request created. Please confirm payment to proceed.',
      201
    );
  } catch (error) {
    console.error('❌ Error creating photo request:', error);
    next(error);
  }
};

/**
 * Confirm payment for photo request
 * POST /api/photo-requests/:id/confirm-payment
 */
export const confirmPayment = async (
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
    const { paymentMethod = 'card' } = req.body;

    console.log('💳 Confirming payment for photo request:', id);

    const photoRequest = await findPhotoRequestById(id);

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    if (photoRequest.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    if (photoRequest.status !== 'pending') {
      sendError(res, 'Photo request is not pending payment', 400);
      return;
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      userId: req.user.userId,
    });

    if (!transaction) {
      sendError(res, 'Transaction not found', 404);
      return;
    }

    if (transaction.status === 'completed') {
      sendError(res, 'Payment already completed', 400);
      return;
    }

    // Update transaction status (in real app, this would happen after payment gateway confirmation)
    transaction.status = 'completed';
    transaction.paymentMethod = paymentMethod;
    transaction.completedAt = new Date();
    await transaction.save();

    console.log('✅ Transaction completed:', transaction._id);

    // Update photo request status to 'processing'
    photoRequest.status = 'processing';
    await photoRequest.save();

    console.log('✅ Photo request status updated to processing');

    // Create notification for user
    await createNotification({
      userId: req.user.userId,
      type: 'photo_request_complete',
      title: 'Payment Confirmed',
      message: `Your photo request has been confirmed. We'll process it within 1 business day.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    // Create notification for admin (system notification)
    await createNotification({
      userId: req.user.userId, // In real app, this would be admin user ID
      type: 'photo_request_complete',
      title: 'New Photo Request',
      message: `New photo request received and paid. Requires processing.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'high',
      actionUrl: `/admin/photo-requests/${photoRequest._id}`,
    });

    console.log('✅ Notifications created');

    sendSuccess(
      res,
      { photoRequest, transaction },
      'Payment confirmed successfully. Your request is now being processed.'
    );
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    next(error);
  }
};

/**
 * Update photo request (admin - add photos/complete)
 * PUT /api/photo-requests/:id
 */
export const updatePhotoRequest = async (
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
    const { status, photos, informationReport } = req.body;

    console.log('📸 Updating photo request:', id, 'Status:', status);

    const photoRequest = await findPhotoRequestById(id);

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Update fields
    if (status) {
      photoRequest.status = status;
      if (status === 'completed') {
        photoRequest.completedAt = new Date();

        console.log('✅ Photo request completed');

        // Create notification
        await createNotification({
          userId: photoRequest.userId,
          type: 'photo_request_complete',
          title: 'Photos Ready!',
          message: `Your requested photos are now available in your profile.`,
          relatedId: photoRequest._id,
          relatedModel: 'PhotoRequest',
          priority: 'high',
          actionUrl: `/profile`,
        });
      }
    }

    if (photos) {
      photoRequest.photos = photos;
      console.log('✅ Added', photos.length, 'photos');
    }

    if (informationReport) {
      photoRequest.informationReport = informationReport;
      console.log('✅ Added information report');
    }

    await photoRequest.save();

    console.log('✅ Photo request updated successfully');

    sendSuccess(res, { photoRequest }, 'Photo request updated successfully');
  } catch (error) {
    console.error('❌ Error updating photo request:', error);
    next(error);
  }
};

/**
 * Cancel photo request (before payment)
 * DELETE /api/photo-requests/:id
 */
export const cancelPhotoRequest = async (
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

    const photoRequest = await findPhotoRequestById(id);

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    if (photoRequest.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    // Can only cancel if pending or processing
    if (!['pending', 'processing'].includes(photoRequest.status)) {
      sendError(res, 'Cannot cancel completed photo request', 400);
      return;
    }

    // Update status to cancelled
    photoRequest.status = 'cancelled';
    await photoRequest.save();

    // Cancel transaction if exists
    await Transaction.updateOne(
      {
        relatedId: photoRequest._id,
        relatedModel: 'PhotoRequest',
      },
      { status: 'cancelled' }
    );

    console.log('✅ Photo request cancelled:', id);

    sendSuccess(res, null, 'Photo request cancelled successfully');
  } catch (error) {
    console.error('❌ Error cancelling photo request:', error);
    next(error);
  }
};
