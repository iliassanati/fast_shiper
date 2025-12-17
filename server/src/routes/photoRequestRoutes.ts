// server/src/routes/photoRequestRoutes.ts - UPDATED WITH PAYMENT
import { Router } from 'express';
import * as photoRequestController from '../controllers/photoRequestController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/photo-requests
 * @desc    Get all photo requests for current user
 * @access  Private
 */
router.get('/', photoRequestController.getPhotoRequests);

/**
 * @route   GET /api/photo-requests/:id
 * @desc    Get single photo request by ID
 * @access  Private
 */
router.get('/:id', photoRequestController.getPhotoRequestById);

/**
 * @route   POST /api/photo-requests
 * @desc    Create new photo request
 * @access  Private
 */
router.post('/', photoRequestController.createNewPhotoRequest);

/**
 * @route   POST /api/photo-requests/:id/confirm-payment
 * @desc    Confirm payment for photo request
 * @access  Private
 */
router.post('/:id/confirm-payment', photoRequestController.confirmPayment);

/**
 * @route   PUT /api/photo-requests/:id
 * @desc    Update photo request (add photos, complete)
 * @access  Private
 */
router.put('/:id', photoRequestController.updatePhotoRequest);

/**
 * @route   DELETE /api/photo-requests/:id
 * @desc    Cancel photo request
 * @access  Private
 */
router.delete('/:id', photoRequestController.cancelPhotoRequest);

export default router;
