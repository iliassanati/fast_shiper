// server/src/routes/admin/adminConsolidationRoutes.ts
import { Router } from 'express';
import * as adminConsolidationController from '../../controllers/admin/adminConsolidationController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/consolidations
 * @desc    Get all consolidations with filters
 * @access  Private (Admin)
 */
router.get('/', adminConsolidationController.getAllConsolidations);

/**
 * @route   GET /api/admin/consolidations/statistics
 * @desc    Get consolidation statistics
 * @access  Private (Admin)
 */
router.get(
  '/statistics',
  adminConsolidationController.getConsolidationStatistics
);

/**
 * @route   GET /api/admin/consolidations/:id
 * @desc    Get single consolidation details
 * @access  Private (Admin)
 */
router.get('/:id', adminConsolidationController.getConsolidationDetails);

/**
 * @route   PUT /api/admin/consolidations/:id/status
 * @desc    Update consolidation status
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  adminConsolidationController.updateConsolidationStatusById
);

/**
 * @route   POST /api/admin/consolidations/:id/photos
 * @desc    Upload consolidation photos
 * @access  Private (Admin)
 */
router.post(
  '/:id/photos',
  adminConsolidationController.uploadConsolidationPhotos
);

/**
 * @route   POST /api/admin/consolidations/:id/complete
 * @desc    Complete consolidation and create resulting package
 * @access  Private (Admin)
 */
router.post(
  '/:id/complete',
  adminConsolidationController.completeConsolidation
);

export default router;
