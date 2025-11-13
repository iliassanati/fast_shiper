// server/src/controllers/admin/adminUserController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import { User } from '../../models/User.js';
import { Package } from '../../models/Package.js';
import { Shipment } from '../../models/Shipment.js';
import { Transaction } from '../../models/Transaction.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { search, status, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { suiteNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await User.countDocuments(query);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [packageCount, shipmentCount, totalSpent] = await Promise.all([
          Package.countDocuments({ userId: user._id }),
          Shipment.countDocuments({ userId: user._id }),
          Transaction.aggregate([
            {
              $match: {
                userId: user._id,
                status: 'completed',
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

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          suiteNumber: user.suiteNumber,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt,
          stats: {
            packages: packageCount,
            shipments: shipmentCount,
            totalSpent: totalSpent[0]?.total || 0,
          },
        };
      })
    );

    sendSuccess(res, {
      users: usersWithStats,
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
 * Get single user details
 * GET /api/admin/users/:id
 */
export const getUserDetails = async (
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
    const user = await User.findById(id);

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Get user's packages
    const packages = await Package.find({ userId: user._id })
      .sort({ receivedDate: -1 })
      .limit(10)
      .exec();

    // Get user's shipments
    const shipments = await Shipment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    // Get user's transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    // Get statistics
    const [packageStats, shipmentStats, financialStats] = await Promise.all([
      Package.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      Shipment.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      Transaction.aggregate([
        { $match: { userId: user._id, status: 'completed' } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount.value' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    sendSuccess(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        suiteNumber: user.suiteNumber,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt,
      },
      packages,
      shipments,
      transactions,
      statistics: {
        packages: packageStats,
        shipments: shipmentStats,
        financial: financialStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user information
 * PUT /api/admin/users/:id
 */
export const updateUserInfo = async (
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
    const updates = req.body;

    const user = await User.findById(id);

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'phone', 'address'];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (user as any)[field] = updates[field];
      }
    });

    await user.save();

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          suiteNumber: user.suiteNumber,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt,
        },
      },
      'User updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/admin/users/statistics
 */
export const getUserStatistics = async (
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

    const [
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      activeUsers,
      topUsers,
    ] = await Promise.all([
      // Total users
      User.countDocuments(),

      // New users today
      User.countDocuments({ createdAt: { $gte: today } }),

      // New users this month
      User.countDocuments({ createdAt: { $gte: thisMonth } }),

      // Active users (users with packages received in last 30 days)
      Package.distinct('userId', {
        receivedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }).then((userIds) => userIds.length),

      // Top users by spending
      Transaction.aggregate([
        {
          $match: {
            status: 'completed',
          },
        },
        {
          $group: {
            _id: '$userId',
            totalSpent: { $sum: '$amount.value' },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ]),
    ]);

    sendSuccess(res, {
      statistics: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
        active: activeUsers,
        topUsers: topUsers.map((item) => ({
          userId: item._id,
          name: item.user.name,
          email: item.user.email,
          suiteNumber: item.user.suiteNumber,
          totalSpent: item.totalSpent,
          transactionCount: item.transactionCount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete - for future implementation)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (
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

    // Check if user has active packages or shipments
    const [activePackages, activeShipments] = await Promise.all([
      Package.countDocuments({
        userId: id,
        status: { $in: ['received', 'consolidated', 'shipped', 'in_transit'] },
      }),
      Shipment.countDocuments({
        userId: id,
        status: { $in: ['pending', 'processing', 'in_transit'] },
      }),
    ]);

    if (activePackages > 0 || activeShipments > 0) {
      sendError(
        res,
        'Cannot delete user with active packages or shipments',
        400
      );
      return;
    }

    // For now, we'll just mark as inactive instead of deleting
    // In production, implement soft delete or archival system
    await User.findByIdAndDelete(id);

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};
