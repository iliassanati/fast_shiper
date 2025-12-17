// server/src/routes/shipmentRoutes.ts
import express from 'express';
import {
  getShippingRates,
  createNewShipment,
  getShipments,
  getShipmentById,
  trackShipment,
  downloadLabel,
} from '../controllers/shipmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/shipments/get-rates
 * @desc    Get shipping rates from multiple carriers
 * @access  Private
 */
router.post('/get-rates', getShippingRates);

/**
 * @route   POST /api/shipments
 * @desc    Create a new shipment
 * @access  Private
 */
router.post('/', createNewShipment);

/**
 * @route   GET /api/shipments
 * @desc    Get all shipments for authenticated user
 * @access  Private
 */
router.get('/', getShipments);

/**
 * @route   GET /api/shipments/:id
 * @desc    Get shipment by ID
 * @access  Private
 */
router.get('/:id', getShipmentById);

/**
 * @route   GET /api/shipments/:id/track
 * @desc    Track shipment
 * @access  Private
 */
router.get('/:id/track', trackShipment);

/**
 * @route   GET /api/shipments/:id/label
 * @desc    Download shipping label
 * @access  Private
 */
router.get('/:id/label', downloadLabel);

export default router;
