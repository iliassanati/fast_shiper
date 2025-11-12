// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import packageRoutes from './packageRoutes.js';
import shipmentRoutes from './shipmentRoutes.js';
import consolidationRoutes from './consolidationRoutes.js';
import photoRequestRoutes from './photoRequestRoutes.js';
import notificationRoutes from './notificationRoutes.js';

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

export default router;
