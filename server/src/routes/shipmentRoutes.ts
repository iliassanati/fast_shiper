// server/src/routes/shipmentRoutes.ts
import { Router } from 'express';
import * as shipmentController from '../controllers/shipmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/shipments
 * @desc    Get all shipments for current user (with filters)
 * @access  Private
 */
router.get('/', shipmentController.getShipments);

/**
 * @route   GET /api/shipments/stats
 * @desc    Get shipment statistics for current user
 * @access  Private
 */
router.get('/stats', shipmentController.getShipmentStats);

/**
 * @route   GET /api/shipments/:id
 * @desc    Get single shipment by ID with tracking details
 * @access  Private
 */
router.get('/:id', shipmentController.getShipmentById);

/**
 * @route   POST /api/shipments
 * @desc    Create new shipment request
 * @access  Private
 */
router.post('/', shipmentController.createNewShipment);

/**
 * @route   PUT /api/shipments/:id/status
 * @desc    Update shipment tracking status
 * @access  Private
 */
router.put('/:id/status', shipmentController.updateShipmentStatusById);

export default router;
