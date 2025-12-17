// server/src/routes/admin/adminUserRoutes.ts
import { Router } from 'express';
import * as adminUserController from '../../controllers/admin/adminUserController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin)
 */
router.get('/', adminUserController.getAllUsers);

/**
 * @route   GET /api/admin/users/statistics
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
// router.get('/statistics', adminUserController.getUserStatistics);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private (Admin)
 */
// router.get('/:id', adminUserController.getUserDetails);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user information
 * @access  Private (Admin)
 */
router.put('/:id', adminUserController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/:id', adminUserController.deleteUser);

/**
 * @route   POST /api/admin/users/bulk-delete
 * @desc    Bulk delete users
 * @access  Private (Admin)
 */
router.post('/bulk-delete', adminUserController.bulkDeleteUsers);

export default router;
