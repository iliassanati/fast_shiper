// server/src/routes/admin/adminTicketRoutes.ts
import { Router } from 'express';
import * as adminTicketController from '../../controllers/admin/adminTicketController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/tickets
 * @desc    Get all tickets with filters
 * @access  Private (Admin)
 */
router.get('/', adminTicketController.getAllTickets);

/**
 * @route   GET /api/admin/tickets/statistics
 * @desc    Get ticket statistics
 * @access  Private (Admin)
 */
router.get('/statistics', adminTicketController.getTicketStatistics);

/**
 * @route   GET /api/admin/tickets/:id
 * @desc    Get single ticket
 * @access  Private (Admin)
 */
router.get('/:id', adminTicketController.getTicketById);

/**
 * @route   POST /api/admin/tickets/:id/reply
 * @desc    Reply to ticket
 * @access  Private (Admin)
 */
router.post('/:id/reply', adminTicketController.replyToTicket);

/**
 * @route   PUT /api/admin/tickets/:id/status
 * @desc    Update ticket status
 * @access  Private (Admin)
 */
router.put('/:id/status', adminTicketController.updateStatus);

/**
 * @route   PUT /api/admin/tickets/:id/assign
 * @desc    Assign ticket to admin
 * @access  Private (Admin)
 */
router.put('/:id/assign', adminTicketController.assignToAdmin);

/**
 * @route   PUT /api/admin/tickets/:id/priority
 * @desc    Update ticket priority
 * @access  Private (Admin)
 */
router.put('/:id/priority', adminTicketController.updatePriority);

/**
 * @route   PUT /api/admin/tickets/:id/tags
 * @desc    Update ticket tags
 * @access  Private (Admin)
 */
router.put('/:id/tags', adminTicketController.updateTags);

export default router;
