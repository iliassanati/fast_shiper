// server/src/routes/admin/adminTransactionRoutes.ts
import { Router } from 'express';
import * as adminTransactionController from '../../controllers/admin/adminTransactionController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions with filters
 * @access  Private (Admin)
 */
router.get('/', adminTransactionController.getAllTransactions);

/**
 * @route   GET /api/admin/transactions/statistics
 * @desc    Get transaction statistics
 * @access  Private (Admin)
 */
router.get('/statistics', adminTransactionController.getTransactionStatistics);

/**
 * @route   GET /api/admin/transactions/:id
 * @desc    Get single transaction
 * @access  Private (Admin)
 */
router.get('/:id', adminTransactionController.getTransactionById);

/**
 * @route   POST /api/admin/transactions/:id/refund
 * @desc    Process refund for a transaction
 * @access  Private (Admin)
 */
router.post('/:id/refund', adminTransactionController.processRefund);

/**
 * @route   PUT /api/admin/transactions/:id/status
 * @desc    Update transaction status
 * @access  Private (Admin)
 */
router.put('/:id/status', adminTransactionController.updateTransactionStatus);

/**
 * @route   POST /api/admin/transactions/:id/invoice
 * @desc    Generate invoice for transaction
 * @access  Private (Admin)
 */
router.post('/:id/invoice', adminTransactionController.generateInvoice);

export default router;
