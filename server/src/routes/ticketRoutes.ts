// server/src/routes/ticketRoutes.ts
import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/tickets
 * @desc    Get all tickets for current user
 * @access  Private
 */
router.get('/', ticketController.getUserTickets);

/**
 * @route   GET /api/tickets/stats
 * @desc    Get ticket statistics for current user
 * @access  Private
 */
router.get('/stats', ticketController.getTicketStats);

/**
 * @route   GET /api/tickets/:id
 * @desc    Get single ticket by ID
 * @access  Private
 */
router.get('/:id', ticketController.getTicketById);

/**
 * @route   POST /api/tickets
 * @desc    Create new ticket
 * @access  Private
 */
router.post('/', ticketController.createNewTicket);

/**
 * @route   POST /api/tickets/:id/reply
 * @desc    Reply to ticket
 * @access  Private
 */
router.post('/:id/reply', ticketController.replyToTicket);

/**
 * @route   PUT /api/tickets/:id/close
 * @desc    Close ticket
 * @access  Private
 */
router.put('/:id/close', ticketController.closeTicket);

/**
 * @route   PUT /api/tickets/:id/reopen
 * @desc    Reopen ticket
 * @access  Private
 */
router.put('/:id/reopen', ticketController.reopenTicket);

export default router;
