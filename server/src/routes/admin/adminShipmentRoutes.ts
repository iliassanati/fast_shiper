// server/src/routes/admin/adminShipmentRoutes.ts
import { Router } from 'express';
import * as adminShipmentController from '../../controllers/admin/adminShipmentController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/shipments
 * @desc    Get all shipments with filters
 * @access  Private (Admin)
 */
router.get('/', adminShipmentController.getAllShipments);

/**
 * @route   GET /api/admin/shipments/statistics
 * @desc    Get shipment statistics
 * @access  Private (Admin)
 */
router.get('/statistics', adminShipmentController.getShipmentStatistics);

/**
 * @route   POST /api/admin/shipments/bulk-update
 * @desc    Bulk update shipment status
 * @access  Private (Admin)
 */
router.post('/bulk-update', adminShipmentController.bulkUpdateShipments);

/**
 * @route   GET /api/admin/shipments/:id
 * @desc    Get single shipment details
 * @access  Private (Admin)
 */
router.get('/:id', adminShipmentController.getShipmentDetails);

/**
 * @route   PUT /api/admin/shipments/:id
 * @desc    Update shipment details
 * @access  Private (Admin)
 */
router.put('/:id', adminShipmentController.updateShipmentDetails);

/**
 * @route   PUT /api/admin/shipments/:id/status
 * @desc    Update shipment status
 * @access  Private (Admin)
 */
router.put('/:id/status', adminShipmentController.updateShipmentStatusById);

/**
 * @route   POST /api/admin/shipments/:id/tracking
 * @desc    Add tracking event
 * @access  Private (Admin)
 */
router.post('/:id/tracking', adminShipmentController.addTrackingEvent);

export default router;
