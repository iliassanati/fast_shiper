// server/src/routes/index.ts
// UPDATED VERSION - Include tickets
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import packageRoutes from './packageRoutes.js';
import shipmentRoutes from './shipmentRoutes.js';
import consolidationRoutes from './consolidationRoutes.js';
import photoRequestRoutes from './photoRequestRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import ticketRoutes from './ticketRoutes.js'; // NEW
import adminRoutes from './admin/index.js';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/consolidations', consolidationRoutes);
router.use('/photo-requests', photoRequestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tickets', ticketRoutes); // NEW
router.use('/admin', adminRoutes);

export default router;
