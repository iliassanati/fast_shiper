// server/src/controllers/admin/adminTransactionController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { Transaction } from '../../models/Transaction.js';
import { createNotification } from '../../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all transactions with filters
 * GET /api/admin/transactions
 */
export const getAllTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const {
      status,
      type,
      userId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'invoice.number': { $regex: search, $options: 'i' } },
        { 'paymentDetails.transactionId': { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Transaction.countDocuments(query);

    sendSuccess(res, {
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction statistics
 * GET /api/admin/transactions/statistics
 */
export const getTransactionStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const thisMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const lastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    );

    const [
      totalTransactions,
      completedToday,
      completedThisMonth,
      completedLastMonth,
      byStatus,
      byType,
      revenueStats,
      revenueToday,
      revenueThisMonth,
      failedTransactions,
    ] = await Promise.all([
      // Total transactions
      Transaction.countDocuments(),

      // Completed today
      Transaction.countDocuments({
        status: 'completed',
        completedAt: { $gte: today },
      }),

      // Completed this month
      Transaction.countDocuments({
        status: 'completed',
        completedAt: { $gte: thisMonth },
      }),

      // Completed last month
      Transaction.countDocuments({
        status: 'completed',
        completedAt: { $gte: lastMonth, $lt: thisMonth },
      }),

      // By status
      Transaction.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // By type
      Transaction.aggregate([
        {
          $match: { status: 'completed' },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount.value' },
          },
        },
      ]),

      // Overall revenue stats
      Transaction.aggregate([
        {
          $match: { status: 'completed' },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount.value' },
            avgTransaction: { $avg: '$amount.value' },
            minTransaction: { $min: '$amount.value' },
            maxTransaction: { $max: '$amount.value' },
          },
        },
      ]),

      // Revenue today
      Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount.value' },
          },
        },
      ]),

      // Revenue this month
      Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: { $gte: thisMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount.value' },
          },
        },
      ]),

      // Failed transactions in last 24 hours
      Transaction.countDocuments({
        status: 'failed',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const typeBreakdown = byType.map((item) => ({
      type: item._id,
      count: item.count,
      total: item.totalAmount,
    }));

    const growthRate =
      completedLastMonth > 0
        ? ((completedThisMonth - completedLastMonth) / completedLastMonth) * 100
        : 0;

    sendSuccess(res, {
      statistics: {
        total: totalTransactions,
        completedToday,
        completedThisMonth,
        byStatus: statusBreakdown,
        byType: typeBreakdown,
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          today: revenueToday[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0,
          average: revenueStats[0]?.avgTransaction || 0,
          min: revenueStats[0]?.minTransaction || 0,
          max: revenueStats[0]?.maxTransaction || 0,
        },
        growth: {
          rate: growthRate.toFixed(2),
          direction: growthRate >= 0 ? 'up' : 'down',
        },
        alerts: {
          failedTransactions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single transaction
 * GET /api/admin/transactions/:id
 */
export const getTransactionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const transaction = await Transaction.findById(id)
      .populate('userId', 'name email suiteNumber phone address')
      .populate('relatedId');

    if (!transaction) {
      sendNotFound(res, 'Transaction not found');
      return;
    }

    sendSuccess(res, { transaction });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund
 * POST /api/admin/transactions/:id/refund
 */
export const processRefund = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      sendError(res, 'Amount and reason are required', 400);
      return;
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      sendNotFound(res, 'Transaction not found');
      return;
    }

    if (transaction.status !== 'completed') {
      sendError(res, 'Can only refund completed transactions', 400);
      return;
    }

    if (transaction.status === 'refunded') {
      sendError(res, 'Transaction already refunded', 400);
      return;
    }

    if (amount > transaction.amount.value) {
      sendError(res, 'Refund amount cannot exceed transaction amount', 400);
      return;
    }

    if (amount <= 0) {
      sendError(res, 'Refund amount must be greater than 0', 400);
      return;
    }

    // Update transaction
    transaction.status = 'refunded';
    transaction.refund = {
      amount,
      reason,
      processedAt: new Date(),
    };
    await transaction.save();

    // Create notification for user
    await createNotification({
      userId: transaction.userId,
      type: 'payment_received',
      title: 'Refund Processed',
      message: `A refund of ${amount} ${transaction.amount.currency} has been processed for your ${transaction.type.replace('_', ' ')} transaction. Reason: ${reason}`,
      relatedId: transaction._id,
      relatedModel: 'Transaction',
      priority: 'high',
      actionUrl: `/transactions/${transaction._id}`,
    });

    sendSuccess(res, { transaction }, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update transaction status
 * PUT /api/admin/transactions/:id/status
 */
export const updateTransactionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      sendError(res, 'Status is required', 400);
      return;
    }

    const validStatuses = [
      'pending',
      'processing',
      'completed',
      'failed',
      'refunded',
    ];
    if (!validStatuses.includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      sendNotFound(res, 'Transaction not found');
      return;
    }

    const oldStatus = transaction.status;
    transaction.status = status;

    // Set completedAt timestamp if marking as completed
    if (status === 'completed' && !transaction.completedAt) {
      transaction.completedAt = new Date();
    }

    await transaction.save();

    // Notify user of status change
    if (oldStatus !== status) {
      let notificationMessage = '';
      let notificationTitle = '';

      switch (status) {
        case 'completed':
          notificationTitle = 'Payment Completed';
          notificationMessage = 'Your payment has been processed successfully.';
          break;
        case 'failed':
          notificationTitle = 'Payment Failed';
          notificationMessage =
            'Your payment could not be processed. Please contact support.';
          break;
        case 'processing':
          notificationTitle = 'Payment Processing';
          notificationMessage = 'Your payment is being processed.';
          break;
      }

      if (notificationMessage) {
        await createNotification({
          userId: transaction.userId,
          type: 'payment_received',
          title: notificationTitle,
          message: notificationMessage,
          relatedId: transaction._id,
          relatedModel: 'Transaction',
          priority: status === 'failed' ? 'high' : 'normal',
          actionUrl: `/transactions/${transaction._id}`,
        });
      }
    }

    sendSuccess(
      res,
      { transaction },
      'Transaction status updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate invoice for transaction
 * POST /api/admin/transactions/:id/invoice
 */
export const generateInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const transaction = await Transaction.findById(id).populate('userId');

    if (!transaction) {
      sendNotFound(res, 'Transaction not found');
      return;
    }

    if (transaction.status !== 'completed') {
      sendError(
        res,
        'Can only generate invoices for completed transactions',
        400
      );
      return;
    }

    // Check if invoice already exists
    if (transaction.invoice?.number) {
      sendSuccess(
        res,
        {
          invoice: {
            number: transaction.invoice.number,
            url: transaction.invoice.url,
            generatedAt: transaction.invoice.generatedAt,
          },
        },
        'Invoice already exists'
      );
      return;
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-6)}`;

    // In production, you would generate a PDF here
    // For now, we'll just create a placeholder URL
    const invoiceUrl = `/api/admin/transactions/${id}/invoice/download`;

    // Update transaction with invoice info
    transaction.invoice = {
      number: invoiceNumber,
      url: invoiceUrl,
      generatedAt: new Date(),
    };

    await transaction.save();

    // Notify user
    await createNotification({
      userId: transaction.userId,
      type: 'payment_received',
      title: 'Invoice Generated',
      message: `Invoice ${invoiceNumber} has been generated for your transaction.`,
      relatedId: transaction._id,
      relatedModel: 'Transaction',
      priority: 'normal',
      actionUrl: `/transactions/${transaction._id}`,
    });

    sendSuccess(
      res,
      {
        invoice: {
          number: invoiceNumber,
          url: invoiceUrl,
          generatedAt: transaction.invoice.generatedAt,
        },
      },
      'Invoice generated successfully'
    );
  } catch (error) {
    next(error);
  }
};
