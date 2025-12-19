// server/src/routes/admin/adminShipmentRoutes.ts
import { Router } from 'express';
import * as adminShipmentController from '../../controllers/admin/adminShipmentController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

router.use(authenticateAdmin);

/**
 * Statistics & Reporting
 */
router.get('/statistics', adminShipmentController.getShipmentStatistics);

/**
 * Rates & Creation
 */
router.post('/get-rates', adminShipmentController.getShippingRates);
router.post('/', adminShipmentController.createShipmentForUser);

/**
 * Bulk Operations
 */
router.post('/bulk-update', adminShipmentController.bulkUpdateShipments);

/**
 * List & Details
 */
router.get('/', adminShipmentController.getAllShipments);
router.get('/:id', adminShipmentController.getShipmentDetails);

/**
 * Status Management
 */
router.post('/:id/approve', adminShipmentController.approveShipment);
router.post('/:id/reject', adminShipmentController.rejectShipment);
router.put('/:id/payment-status', adminShipmentController.updatePaymentStatus);

/**
 * Tracking & Notifications
 */
router.get('/:id/track', adminShipmentController.trackShipment);
router.post('/:id/notify', adminShipmentController.sendCustomNotification);

export default router;
