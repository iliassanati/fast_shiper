// server/src/routes/index.ts - UPDATE to include webhooks
import { Router } from 'express';
import adminRoutes from './admin/index.js';
import authRoutes from './authRoutes.js';
import consolidationRoutes from './consolidationRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import packageRoutes from './packageRoutes.js';
import photoRequestRoutes from './photoRequestRoutes.js';
import shipmentRoutes from './shipmentRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import publicShippingRoutes from './publicShippingRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/consolidations', consolidationRoutes);
router.use('/photo-requests', photoRequestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tickets', ticketRoutes);
router.use('/admin', adminRoutes);

router.use('/public/shipping', publicShippingRoutes);

export default router;
