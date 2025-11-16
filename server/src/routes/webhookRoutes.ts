// server/src/routes/webhookRoutes.ts
import { Router } from 'express';
import * as webhookController from '../controllers/webhookController.js';

const router = Router();

/**
 * @route   POST /api/webhooks/dhl/tracking
 * @desc    Handle DHL tracking updates
 * @access  Public (with signature verification)
 */
router.post('/dhl/tracking', webhookController.handleDHLTrackingWebhook);

export default router;
