// server/src/routes/admin/index.ts
// UPDATED VERSION - Include transactions and tickets
import { Router } from 'express';
import adminAuthRoutes from './adminAuthRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import adminPackageRoutes from './adminPackageRoutes.js';
import adminConsolidationRoutes from './adminConsolidationRoutes.js';
import adminShipmentRoutes from './adminShipmentRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';
import adminTransactionRoutes from './adminTransactionRoutes.js';
import adminTicketRoutes from './adminTicketRoutes.js';

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
router.use('/users', adminUserRoutes);
router.use('/transactions', adminTransactionRoutes); // NEW
router.use('/tickets', adminTicketRoutes); // NEW

export default router;
