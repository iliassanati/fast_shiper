// server/src/routes/admin/adminPackageRoutes.ts
import { Router } from 'express';
import * as adminPackageController from '../../controllers/admin/adminPackageController.js';
import {
  authenticateAdmin,
  requirePermission,
} from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/packages
 * @desc    Get all packages with filters
 * @access  Private (Admin with packages:read)
 */
router.get(
  '/',
  requirePermission('packages:read'),
  adminPackageController.getAllPackages
);

/**
 * @route   GET /api/admin/packages/statistics
 * @desc    Get package statistics
 * @access  Private (Admin with analytics:read)
 */
router.get(
  '/statistics',
  requirePermission('analytics:read'),
  adminPackageController.getPackageStatistics
);

/**
 * @route   POST /api/admin/packages
 * @desc    Register new package arrival
 * @access  Private (Admin with packages:write)
 */
router.post(
  '/',
  requirePermission('packages:write'),
  adminPackageController.registerPackage
);

/**
 * @route   POST /api/admin/packages/bulk-update
 * @desc    Bulk update package status
 * @access  Private (Admin with packages:write)
 */
router.post(
  '/bulk-update',
  requirePermission('packages:write'),
  adminPackageController.bulkUpdatePackages
);

/**
 * @route   PUT /api/admin/packages/:id
 * @desc    Update package details
 * @access  Private (Admin with packages:write)
 */
router.put(
  '/:id',
  requirePermission('packages:write'),
  adminPackageController.updatePackageDetails
);

/**
 * @route   POST /api/admin/packages/:id/photos
 * @desc    Upload package photos
 * @access  Private (Admin with packages:write)
 */
router.post(
  '/:id/photos',
  requirePermission('packages:write'),
  adminPackageController.uploadPackagePhotos
);

export default router;
