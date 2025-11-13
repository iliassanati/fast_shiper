// server/src/controllers/admin/adminDashboardController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { User } from '../../models/User.js';
import { Package } from '../../models/Package.js';
import { Shipment } from '../../models/Shipment.js';
import { Consolidation } from '../../models/Consolidation.js';
import { Transaction } from '../../models/Transaction.js';
import { sendSuccess, sendForbidden } from '../../utils/responses.js';

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel for performance
    const [
      // User stats
      totalUsers,
      newUsersToday,

      // Package stats
      totalPackages,
      packagesInStorage,
      packagesReceivedToday,

      // Shipment stats
      activeShipments,
      shipmentsToday,

      // Consolidation stats
      pendingConsolidations,

      // Revenue stats
      revenueToday,
      revenueThisMonth,
    ] = await Promise.all([
      // Users
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),

      // Packages
      Package.countDocuments(),
      Package.countDocuments({ status: 'received' }),
      Package.countDocuments({ receivedDate: { $gte: today } }),

      // Shipments
      Shipment.countDocuments({
        status: { $in: ['pending', 'processing', 'in_transit'] },
      }),
      Shipment.countDocuments({ createdAt: { $gte: today } }),

      // Consolidations
      Consolidation.countDocuments({
        status: { $in: ['pending', 'processing'] },
      }),

      // Revenue
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
    ]);

    const stats = {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
      },
      packages: {
        total: totalPackages,
        inStorage: packagesInStorage,
        today: packagesReceivedToday,
      },
      shipments: {
        active: activeShipments,
        today: shipmentsToday,
      },
      consolidations: {
        pending: pendingConsolidations,
      },
      revenue: {
        today: revenueToday[0]?.total || 0,
        month: revenueThisMonth[0]?.total || 0,
      },
    };

    sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activities
 * GET /api/admin/dashboard/activities
 */
export const getRecentActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { limit = 20 } = req.query;

    // Get recent packages
    const recentPackages = await Package.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit) / 3)
      .populate('userId', 'name email')
      .lean();

    // Get recent shipments
    const recentShipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit) / 3)
      .populate('userId', 'name email')
      .lean();

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit) / 3)
      .populate('userId', 'name email')
      .lean();

    // Combine and format activities
    const activities: any[] = [];

    // Add package activities
    recentPackages.forEach((pkg) => {
      activities.push({
        id: pkg._id,
        type: 'package',
        timestamp: pkg.createdAt,
        data: {
          trackingNumber: pkg.trackingNumber,
          retailer: pkg.retailer,
          status: pkg.status,
          userName: (pkg.userId as any)?.name,
          userEmail: (pkg.userId as any)?.email,
        },
      });
    });

    // Add shipment activities
    recentShipments.forEach((shipment) => {
      activities.push({
        id: shipment._id,
        type: 'shipment',
        timestamp: shipment.createdAt,
        data: {
          trackingNumber: shipment.trackingNumber,
          carrier: shipment.carrier,
          status: shipment.status,
          userName: (shipment.userId as any)?.name,
          userEmail: (shipment.userId as any)?.email,
        },
      });
    });

    // Add transaction activities
    recentTransactions.forEach((transaction) => {
      activities.push({
        id: transaction._id,
        type: 'transaction',
        timestamp: transaction.createdAt,
        data: {
          type: transaction.type,
          amount: transaction.amount.value,
          currency: transaction.amount.currency,
          status: transaction.status,
          userName: (transaction.userId as any)?.name,
          userEmail: (transaction.userId as any)?.email,
        },
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limit to requested number
    const limitedActivities = activities.slice(0, Number(limit));

    sendSuccess(res, { activities: limitedActivities });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics data for charts
 * GET /api/admin/dashboard/analytics
 */
export const getAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { period = '7d' } = req.query;

    // Calculate date range
    let daysBack = 7;
    if (period === '30d') daysBack = 30;
    if (period === '90d') daysBack = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    // Get packages over time
    const packagesOverTime = await Package.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get shipments over time
    const shipmentsOverTime = await Shipment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get revenue over time
    const revenueOverTime = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          total: { $sum: '$amount.value' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const analytics = {
      period,
      startDate,
      endDate: new Date(),
      packages: packagesOverTime,
      shipments: shipmentsOverTime,
      revenue: revenueOverTime,
    };

    sendSuccess(res, { analytics });
  } catch (error) {
    next(error);
  }
};

/**
 * Get alerts and urgent actions
 * GET /api/admin/dashboard/alerts
 */
export const getAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const alerts: any[] = [];

    // Check for packages nearing storage limit (40+ days)
    const storageWarnings = await Package.countDocuments({
      status: 'received',
      storageDay: { $gte: 40 },
    });

    if (storageWarnings > 0) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        message: `${storageWarnings} package(s) approaching 45-day storage limit`,
        action: 'Review packages',
        link: '/admin/packages?storageWarning=true',
      });
    }

    // Check for pending consolidations
    const pendingConsolidations = await Consolidation.countDocuments({
      status: 'pending',
    });

    if (pendingConsolidations > 0) {
      alerts.push({
        type: 'info',
        priority: 'medium',
        message: `${pendingConsolidations} consolidation request(s) awaiting processing`,
        action: 'View consolidations',
        link: '/admin/consolidations?status=pending',
      });
    }

    // Check for failed transactions
    const failedTransactions = await Transaction.countDocuments({
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (failedTransactions > 0) {
      alerts.push({
        type: 'error',
        priority: 'high',
        message: `${failedTransactions} failed transaction(s) in the last 24 hours`,
        action: 'Review transactions',
        link: '/admin/transactions?status=failed',
      });
    }

    // Check for shipments with no updates
    const staleShipments = await Shipment.countDocuments({
      status: 'in_transit',
      updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // No update for 7 days
    });

    if (staleShipments > 0) {
      alerts.push({
        type: 'warning',
        priority: 'medium',
        message: `${staleShipments} shipment(s) with no tracking updates for 7+ days`,
        action: 'Check shipments',
        link: '/admin/shipments?status=in_transit',
      });
    }

    sendSuccess(res, { alerts });
  } catch (error) {
    next(error);
  }
};
