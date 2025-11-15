// server/src/routes/consolidationRoutes.ts - UPDATED
import { Router } from 'express';
import * as consolidationController from '../controllers/consolidationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/consolidations
 * @desc    Get all consolidations for current user
 * @access  Private
 */
router.get('/', consolidationController.getConsolidations);

/**
 * @route   GET /api/consolidations/:id
 * @desc    Get single consolidation by ID
 * @access  Private
 */
router.get('/:id', consolidationController.getConsolidationById);

/**
 * @route   POST /api/consolidations
 * @desc    Create new consolidation request
 * @access  Private
 */
router.post('/', consolidationController.createConsolidationRequest);

/**
 * @route   PUT /api/consolidations/:id
 * @desc    Update consolidation (users can only cancel pending ones)
 * @access  Private
 */
router.put('/:id', consolidationController.updateConsolidation);

/**
 * @route   DELETE /api/consolidations/:id
 * @desc    Cancel consolidation (only pending ones)
 * @access  Private
 */
router.delete('/:id', consolidationController.cancelConsolidation);

export default router;
