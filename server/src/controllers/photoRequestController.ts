// server/src/controllers/photoRequestController.ts
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

    // Check ownership
    if (photoRequest.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    sendSuccess(res, { photoRequest });
  } catch (error) {
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
      sendForbidden(res);
      return;
    }

    const requestData: CreatePhotoRequestDTO = req.body;

    // Validate package exists and belongs to user
    const pkg = await findPackageById(requestData.packageId);

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    if (pkg.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied to package');
      return;
    }

    // Calculate costs
    const costs = calculatePhotoRequestCost(
      requestData.additionalPhotos,
      requestData.requestType
    );

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

    // Create transaction
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
      description: `Photo request for package ${pkg.description}`,
    });

    // Create notification
    await createNotification({
      userId: req.user.userId,
      type: 'photo_request_complete',
      title: 'Photo Request Received',
      message: `Your photo request for ${pkg.description} has been received and will be processed shortly.`,
      relatedId: photoRequest._id,
      relatedModel: 'PhotoRequest',
      priority: 'normal',
      actionUrl: `/photo-requests/${photoRequest._id}`,
    });

    sendSuccess(
      res,
      { photoRequest },
      'Photo request created successfully',
      201
    );
  } catch (error) {
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

        // Create notification
        await createNotification({
          userId: photoRequest.userId,
          type: 'photo_request_complete',
          title: 'Photo Request Complete',
          message: `Your requested photos are now available!`,
          relatedId: photoRequest._id,
          relatedModel: 'PhotoRequest',
          priority: 'high',
          actionUrl: `/photo-requests/${photoRequest._id}`,
        });
      }
    }

    if (photos) {
      photoRequest.photos = photos;
    }

    if (informationReport) {
      photoRequest.informationReport = informationReport;
    }

    await photoRequest.save();

    sendSuccess(res, { photoRequest }, 'Photo request updated successfully');
  } catch (error) {
    next(error);
  }
};
