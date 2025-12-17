// server/src/routes/admin/adminAuthRoutes.ts
import { Router } from 'express';
import * as adminAuthController from '../../controllers/admin/adminAuthController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';
import { validate, loginSchema } from '../../middleware/validation.js';

const router = Router();

/**
 * @route   POST /api/admin/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validate(loginSchema), adminAuthController.adminLogin);

/**
 * @route   GET /api/admin/auth/me
 * @desc    Get current admin profile
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, adminAuthController.getAdminProfile);

/**
 * @route   POST /api/admin/auth/logout
 * @desc    Admin logout
 * @access  Private (Admin)
 */
router.post('/logout', authenticateAdmin, adminAuthController.adminLogout);

export default router;
