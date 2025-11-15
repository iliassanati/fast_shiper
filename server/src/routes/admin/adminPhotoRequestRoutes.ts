// server/src/routes/admin/adminPhotoRequestRoutes.ts
import { Router } from 'express';
import * as adminPhotoRequestController from '../../controllers/admin/adminPhotoRequestController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/photo-requests
 * @desc    Get all photo requests with filters
 * @access  Private (Admin)
 */
router.get('/', adminPhotoRequestController.getAllPhotoRequests);

/**
 * @route   GET /api/admin/photo-requests/statistics
 * @desc    Get photo request statistics
 * @access  Private (Admin)
 */
router.get(
  '/statistics',
  adminPhotoRequestController.getPhotoRequestStatistics
);

/**
 * @route   GET /api/admin/photo-requests/:id
 * @desc    Get photo request details
 * @access  Private (Admin)
 */
router.get('/:id', adminPhotoRequestController.getPhotoRequestDetails);

/**
 * @route   PUT /api/admin/photo-requests/:id/status
 * @desc    Update photo request status
 * @access  Private (Admin)
 */
router.put('/:id/status', adminPhotoRequestController.updatePhotoRequestStatus);

/**
 * @route   POST /api/admin/photo-requests/:id/photos
 * @desc    Upload photos for photo request
 * @access  Private (Admin)
 */
router.post('/:id/photos', adminPhotoRequestController.uploadPhotos);

/**
 * @route   POST /api/admin/photo-requests/:id/report
 * @desc    Add information report
 * @access  Private (Admin)
 */
router.post('/:id/report', adminPhotoRequestController.addInformationReport);

export default router;
