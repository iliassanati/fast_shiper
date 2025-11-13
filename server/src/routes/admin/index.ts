// server/src/routes/admin/index.ts
import { Router } from 'express';
import adminAuthRoutes from './adminAuthRoutes';
import adminDashboardRoutes from './adminDashboardRoutes';
import adminPackageRoutes from './adminPackageRoutes';
// import adminUserRoutes from './adminUserRoutes.js';
// import adminShipmentRoutes from './adminShipmentRoutes.js';
// import adminConsolidationRoutes from './adminConsolidationRoutes.js';
// import adminTransactionRoutes from './adminTransactionRoutes.js';

const router = Router();

/**
 * Admin routes
 * All routes under /api/admin
 */
router.use('/auth', adminAuthRoutes);
router.use('/dashboard', adminDashboardRoutes);
router.use('/packages', adminPackageRoutes);
// router.use('/users', adminUserRoutes);
// router.use('/shipments', adminShipmentRoutes);
// router.use('/consolidations', adminConsolidationRoutes);
// router.use('/transactions', adminTransactionRoutes);

export default router;
