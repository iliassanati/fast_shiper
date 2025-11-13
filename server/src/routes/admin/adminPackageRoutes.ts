// server/src/routes/admin/adminPackageRoutes.ts
import { Router } from 'express';
import * as adminPackageController from '../../controllers/admin/adminPackageController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/packages
 * @desc    Get all packages with filters
 * @access  Private (Admin)
 */
router.get('/', adminPackageController.getAllPackages);

/**
 * @route   GET /api/admin/packages/statistics
 * @desc    Get package statistics
 * @access  Private (Admin)
 */
router.get('/statistics', adminPackageController.getPackageStatistics);

/**
 * @route   POST /api/admin/packages
 * @desc    Register new package arrival
 * @access  Private (Admin)
 */
router.post('/', adminPackageController.registerPackage);

/**
 * @route   POST /api/admin/packages/bulk-update
 * @desc    Bulk update package status
 * @access  Private (Admin)
 */
router.post('/bulk-update', adminPackageController.bulkUpdatePackages);

/**
 * @route   PUT /api/admin/packages/:id
 * @desc    Update package details
 * @access  Private (Admin)
 */
router.put('/:id', adminPackageController.updatePackageDetails);

/**
 * @route   POST /api/admin/packages/:id/photos
 * @desc    Upload package photos
 * @access  Private (Admin)
 */
router.post('/:id/photos', adminPackageController.uploadPackagePhotos);

/**
 * @route   GET /api/admin/packages/:id
 * @desc    Get single package details
 * @access  Private (Admin)
 */
router.get('/:id', adminPackageController.getPackageDetails);

export default router;
