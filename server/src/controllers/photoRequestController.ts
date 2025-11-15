// server/src/controllers/photoRequestController.ts - FIXED VERSION
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
import { createTransaction } from '../models/Transaction.js';
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

    // 🔥 FIX: Proper ObjectId comparison
    if (photoRequest.userId.toString() !== req.user.userId) {
      console.log('❌ Access denied - User ID mismatch:', {
        requestUserId: photoRequest.userId.toString(),
        authUserId: req.user.userId,
      });
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
 * Create new photo request
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

    // Validate package exists
    const pkg = await findPackageById(requestData.packageId);

    if (!pkg) {
      console.log('❌ Package not found:', requestData.packageId);
      sendNotFound(res, 'Package not found');
      return;
    }

    // 🔥 FIX: Handle both populated and non-populated userId
    // If userId is populated (has _id property), use _id, otherwise use userId directly
    const packageUserId = (pkg.userId as any)._id
      ? (pkg.userId as any)._id.toString()
      : pkg.userId.toString();

    const requestUserId = req.user.userId.toString();

    console.log('🔍 Ownership check:', {
      packageUserId,
      requestUserId,
      match: packageUserId === requestUserId,
    });

    if (packageUserId !== requestUserId) {
      console.log('❌ Access denied - package ownership mismatch');
      sendForbidden(res, 'This package does not belong to you');
      return;
    }

    console.log('✅ Ownership verified');

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

    // Calculate costs - $2 per photo = 20 MAD per photo
    const costs = calculatePhotoRequestCost(
      requestData.additionalPhotos,
      requestData.requestType
    );

    console.log('💰 Calculated costs:', costs);

    // Create photo request
    const photoRequest = await createPhotoRequest({
      userId: req.user.userId,
      packageId: requestData.packageId,
      requestType: requestData.requestType,
      status: 'pending',
      additionalPhotos: requestData.additionalPhotos,
      specificRequests: requestData.specificRequests || [],
      customInstructions: requestData.customInstructions || '',
      cost: costs,
    });

    console.log('✅ Photo request created:', photoRequest._id);

    // Create transaction for payment
    await createTransaction({
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

    console.log('✅ Transaction created');

    // Create notification
    await createNotification({
      userId: req.user.userId,
      type: 'photo_request_complete',
      title: 'Photo Request Received',
      message: `Your photo request has been received. We'll process it within 1 business day.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/profile`,
    });

    console.log('✅ Notification created');

    sendSuccess(
      res,
      { photoRequest },
      `Photo request created successfully. Cost: ${costs.total} MAD (~$${(costs.total / 10).toFixed(2)})`,
      201
    );
  } catch (error) {
    console.error('❌ Error creating photo request:', error);
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

        // Update transaction status to completed
        const { Transaction } = await import('../models/Transaction.js');
        await Transaction.findOneAndUpdate(
          {
            relatedId: photoRequest._id,
            relatedModel: 'PhotoRequest',
          },
          { status: 'completed', completedAt: new Date() }
        );

        console.log('✅ Transaction marked as completed');
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
