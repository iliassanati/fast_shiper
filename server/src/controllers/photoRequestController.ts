// server/src/controllers/photoRequestController.ts - FINAL FIXED VERSION
import type { Response, NextFunction } from 'express';
import type { AuthRequest, CreatePhotoRequestDTO } from '../types/index.js';
import mongoose from 'mongoose';
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
 * Helper function to extract userId as string from potentially populated field
 */
const extractUserId = (userIdField: any): string => {
  if (!userIdField) return '';

  // If it's a populated object with _id
  if (typeof userIdField === 'object' && userIdField._id) {
    return userIdField._id.toString();
  }

  // If it's already a string
  if (typeof userIdField === 'string') {
    return userIdField;
  }

  // If it's an ObjectId
  return userIdField.toString();
};

/**
 * Helper function to compare user IDs
 */
const userIdsMatch = (userId1: any, userId2: any): boolean => {
  const id1 = extractUserId(userId1);
  const id2 = extractUserId(userId2);

  console.log('🔍 Comparing user IDs:');
  console.log('  - ID 1:', id1);
  console.log('  - ID 2:', id2);
  console.log('  - Match:', id1 === id2);

  return id1 === id2;
};

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
      sendForbidden(res, 'Authentication required');
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
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid photo request ID', 400);
      return;
    }

    const photoRequest = await findPhotoRequestById(id);

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Check ownership using helper
    if (!userIdsMatch(photoRequest.userId, req.user.userId)) {
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
      requestType: requestData.requestType,
      additionalPhotos: requestData.additionalPhotos,
    });

    // Validate request data
    if (!requestData.packageId) {
      sendError(res, 'Package ID is required', 400);
      return;
    }

    if (!requestData.requestType) {
      sendError(res, 'Request type is required', 400);
      return;
    }

    if (!['photos', 'information', 'both'].includes(requestData.requestType)) {
      sendError(res, 'Invalid request type', 400);
      return;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(requestData.packageId)) {
      sendError(res, 'Invalid package ID format', 400);
      return;
    }

    // Validate package exists and belongs to user
    const pkg = await findPackageById(requestData.packageId);

    if (!pkg) {
      console.log('❌ Package not found:', requestData.packageId);
      sendNotFound(res, 'Package not found');
      return;
    }

    // Check package ownership using helper
    console.log('📸 Checking package ownership...');
    if (!userIdsMatch(pkg.userId, req.user.userId)) {
      console.log('❌ Package ownership check failed');
      sendForbidden(res, 'This package does not belong to you');
      return;
    }
    console.log('✅ Package ownership verified');

    // Check package status
    if (pkg.status !== 'received') {
      console.log('❌ Invalid package status:', pkg.status);
      sendError(
        res,
        'Photo requests can only be made for packages in storage (status: received)',
        400
      );
      return;
    }

    // Validate additionalPhotos
    const additionalPhotos = Number(requestData.additionalPhotos) || 0;
    if (
      (requestData.requestType === 'photos' ||
        requestData.requestType === 'both') &&
      additionalPhotos < 1
    ) {
      sendError(res, 'At least 1 additional photo is required', 400);
      return;
    }

    // Calculate costs
    const costs = calculatePhotoRequestCost(
      additionalPhotos,
      requestData.requestType
    );

    console.log('💰 Calculated costs:', costs);

    // Create photo request with status 'pending'
    // IMPORTANT: Store userId as ObjectId, not string
    const photoRequest = await createPhotoRequest({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      packageId: requestData.packageId,
      requestType: requestData.requestType,
      status: 'pending',
      additionalPhotos: additionalPhotos,
      specificRequests: requestData.specificRequests || [],
      customInstructions: requestData.customInstructions || '',
      cost: costs,
    });

    console.log('✅ Photo request created:', photoRequest._id);
    console.log('   - User ID stored:', photoRequest.userId);

    // Create transaction for payment (status: pending)
    const transaction = await Transaction.create({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      type: 'photo_request',
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      status: 'pending',
      amount: {
        value: costs.total,
        currency: 'MAD',
      },
      paymentMethod: 'card',
      description: `Photo request - ${additionalPhotos} photos`,
    });

    console.log('✅ Transaction created:', transaction._id);

    // Return response with proper structure
    sendSuccess(
      res,
      {
        photoRequest: {
          _id: photoRequest._id.toString(),
          id: photoRequest._id.toString(),
          userId: photoRequest.userId.toString(),
          packageId: photoRequest.packageId,
          requestType: photoRequest.requestType,
          status: photoRequest.status,
          additionalPhotos: photoRequest.additionalPhotos,
          cost: photoRequest.cost,
          createdAt: photoRequest.createdAt,
        },
        transaction: {
          _id: transaction._id.toString(),
          id: transaction._id.toString(),
          amount: costs.total,
          currency: 'MAD',
          status: 'pending',
        },
      },
      'Photo request created successfully. Please confirm payment to proceed.',
      201
    );
  } catch (error: any) {
    console.error('❌ Error creating photo request:', error);
    console.error('Error stack:', error.stack);
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
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;
    const { paymentMethod = 'card' } = req.body;

    console.log('💳 ========================================');
    console.log('💳 Confirming payment for photo request');
    console.log('💳 Request ID:', id);
    console.log('💳 User from token:', req.user.userId);
    console.log('💳 ========================================');

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId format');
      sendError(res, 'Invalid photo request ID', 400);
      return;
    }

    // Find photo request WITHOUT population to avoid issues
    const photoRequest = await PhotoRequest.findById(id);

    if (!photoRequest) {
      console.log('❌ Photo request not found:', id);
      sendNotFound(res, 'Photo request not found');
      return;
    }

    console.log('✅ Photo request found');
    console.log('   - Photo request userId:', photoRequest.userId);
    console.log('   - Photo request userId type:', typeof photoRequest.userId);
    console.log('   - Token userId:', req.user.userId);
    console.log('   - Token userId type:', typeof req.user.userId);

    // Check ownership using helper
    if (!userIdsMatch(photoRequest.userId, req.user.userId)) {
      console.log('❌ Ownership check failed');
      sendForbidden(res, 'Access denied to this photo request');
      return;
    }

    console.log('✅ Ownership verified');

    // Check status
    if (photoRequest.status !== 'pending') {
      console.log('❌ Invalid status:', photoRequest.status);
      sendError(
        res,
        `Cannot confirm payment. Request status is: ${photoRequest.status}`,
        400
      );
      return;
    }

    console.log('✅ Status is pending, proceeding with payment confirmation');

    // Find the transaction
    const transaction = await Transaction.findOne({
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      userId: photoRequest.userId, // Use the same userId from photoRequest
    });

    if (!transaction) {
      console.error('❌ Transaction not found for photo request:', id);
      console.error('   Searched with userId:', photoRequest.userId);
      sendError(res, 'Transaction not found', 404);
      return;
    }

    console.log('✅ Transaction found:', transaction._id);

    if (transaction.status === 'completed') {
      console.log('❌ Payment already completed');
      sendError(res, 'Payment already completed', 400);
      return;
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentMethod = paymentMethod;
    transaction.completedAt = new Date();
    await transaction.save();

    console.log('✅ Transaction updated to completed');

    // Update photo request status to 'processing'
    photoRequest.status = 'processing';
    await photoRequest.save();

    console.log('✅ Photo request status updated to processing');

    // Create notification for user
    await createNotification({
      userId: photoRequest.userId,
      type: 'photo_request_complete',
      title: 'Payment Confirmed',
      message: `Your photo request payment has been confirmed. We'll process it within 1 business day.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    console.log('✅ Notifications created');
    console.log('💳 ========================================');

    sendSuccess(
      res,
      {
        photoRequest: {
          _id: photoRequest._id.toString(),
          id: photoRequest._id.toString(),
          status: photoRequest.status,
          cost: photoRequest.cost,
        },
        transaction: {
          _id: transaction._id.toString(),
          id: transaction._id.toString(),
          status: transaction.status,
          amount: transaction.amount,
        },
      },
      'Payment confirmed successfully. Your request is now being processed.'
    );
  } catch (error: any) {
    console.error('❌ ========================================');
    console.error('❌ Error confirming payment:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ ========================================');
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
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;
    const { status, photos, informationReport } = req.body;

    console.log('📸 Updating photo request:', id, 'Status:', status);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid photo request ID', 400);
      return;
    }

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
 * Cancel photo request (before completion)
 * DELETE /api/photo-requests/:id
 */
export const cancelPhotoRequest = async (
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid photo request ID', 400);
      return;
    }

    const photoRequest = await PhotoRequest.findById(id);

    if (!photoRequest) {
      sendNotFound(res, 'Photo request not found');
      return;
    }

    // Check ownership using helper
    if (!userIdsMatch(photoRequest.userId, req.user.userId)) {
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
