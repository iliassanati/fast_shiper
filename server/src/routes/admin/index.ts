// server/src/routes/admin/index.ts
import { Router } from 'express';
import adminAuthRoutes from './adminAuthRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import adminPackageRoutes from './adminPackageRoutes.js';
import adminConsolidationRoutes from './adminConsolidationRoutes.js';
import adminShipmentRoutes from './adminShipmentRoutes.js';

const router = Router();

/**
 * Admin routes
 * All routes under /api/admin
 */
router.use('/auth', adminAuthRoutes);
router.use('/dashboard', adminDashboardRoutes);
router.use('/packages', adminPackageRoutes);
router.use('/consolidations', adminConsolidationRoutes);
router.use('/shipments', adminShipmentRoutes);

export default router;
