// server/src/routes/publicShippingRoutes.ts
import express from 'express';
import { getPublicShippingRates } from '../controllers/shipmentController.js';

const router = express.Router();

/**
 * @route   POST /api/public/shipping/get-rates
 * @desc    Get shipping rates from multiple carriers (PUBLIC - no auth required)
 * @access  Public
 * @note    This is for the home page calculator
 */
router.post('/get-rates', getPublicShippingRates);

export default router;
