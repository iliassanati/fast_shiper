// server/src/routes/admin/adminDashboardRoutes.ts
import { Router } from 'express';
import * as adminDashboardController from '../../controllers/admin/adminDashboardController.js';
import {
  authenticateAdmin,
  requirePermission,
} from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
// router.get(
//   '/stats',
//   requirePermission('analytics:read'),
//   adminDashboardController.getDashboardStats
// );

/**
 * @route   GET /api/admin/dashboard/activities
 * @desc    Get recent activities
 * @access  Private (Admin)
 */
// router.get('/activities', adminDashboardController.getRecentActivities);

/**
 * @route   GET /api/admin/dashboard/analytics
 * @desc    Get analytics data for charts
 * @access  Private (Admin)
 */
// router.get(
//   '/analytics',
//   requirePermission('analytics:read'),
//   adminDashboardController.getAnalytics
// );

/**
 * @route   GET /api/admin/dashboard/alerts
 * @desc    Get alerts and urgent actions
 * @access  Private (Admin)
 */
// router.get('/alerts', adminDashboardController.getAlerts);

export default router;
