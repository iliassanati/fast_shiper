// server/src/routes/packageRoutes.ts
import { Router } from 'express';
import * as packageController from '../controllers/packageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/packages
 * @desc    Get all packages for current user (with filters)
 * @access  Private
 */
router.get('/', packageController.getPackages);

/**
 * @route   GET /api/packages/stats
 * @desc    Get package statistics for current user
 * @access  Private
 */
router.get('/stats', packageController.getPackageStats);

/**
 * @route   GET /api/packages/:id
 * @desc    Get single package by ID
 * @access  Private
 */
router.get('/:id', packageController.getPackageById);

/**
 * @route   POST /api/packages
 * @desc    Create new package (admin/warehouse use)
 * @access  Private
 */
router.post('/', packageController.createNewPackage);

/**
 * @route   PUT /api/packages/:id
 * @desc    Update package information
 * @access  Private
 */
router.put('/:id', packageController.updatePackage);

/**
 * @route   DELETE /api/packages/:id
 * @desc    Delete package
 * @access  Private
 */
router.delete('/:id', packageController.removePackage);

export default router;
