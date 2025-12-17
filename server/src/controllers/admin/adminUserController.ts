// server/src/controllers/admin/adminUserController.ts - COMPLETE WITH EDIT/DELETE
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import {
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../../utils/responses';
import { Package } from '../../models/Package';
import { Shipment } from '../../models/Shipment';
import { User } from '../../models/User';

/**
 * Get all users with optional search
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

    const { search } = req.query;

    // Build search query
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { suiteNumber: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query).select('-password').lean();

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [packages, shipments, totalSpent] = await Promise.all([
          Package.countDocuments({ userId: user._id }),
          Shipment.countDocuments({ userId: user._id }),
          Shipment.aggregate([
            { $match: { userId: user._id } },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } },
          ]),
        ]);

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          suiteNumber: user.suiteNumber,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt,
          stats: {
            packages,
            shipments,
            totalSpent: totalSpent[0]?.total || 0,
          },
        };
      })
    );

    sendSuccess(res, { users: usersWithStats });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user information
 * PUT /api/admin/users/:id
 */
export const updateUser = async (
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
    const { name, phone, address } = req.body;

    const user = await User.findById(id);
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) {
      user.address = {
        street: address.street || user.address.street,
        city: address.city || user.address.city,
        postalCode: address.postalCode || user.address.postalCode,
        country: address.country || user.address.country,
      };
    }

    await user.save();

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      suiteNumber: user.suiteNumber,
      phone: user.phone,
      address: user.address,
    };

    sendSuccess(res, { user: userResponse }, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user
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

    const user = await User.findById(id);
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

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
        `Cannot delete user with active packages (${activePackages}) or shipments (${activeShipments})`,
        400
      );
      return;
    }

    await User.findByIdAndDelete(id);

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete users
 * POST /api/admin/users/bulk-delete
 */
export const bulkDeleteUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      sendError(res, 'User IDs array is required', 400);
      return;
    }

    // Check if any users have active packages or shipments
    const [activePackages, activeShipments] = await Promise.all([
      Package.countDocuments({
        userId: { $in: userIds },
        status: { $in: ['received', 'consolidated', 'shipped', 'in_transit'] },
      }),
      Shipment.countDocuments({
        userId: { $in: userIds },
        status: { $in: ['pending', 'processing', 'in_transit'] },
      }),
    ]);

    if (activePackages > 0 || activeShipments > 0) {
      sendError(
        res,
        `Cannot delete users with active packages (${activePackages}) or shipments (${activeShipments})`,
        400
      );
      return;
    }

    // Delete users
    const result = await User.deleteMany({ _id: { $in: userIds } });

    sendSuccess(
      res,
      { deleted: result.deletedCount },
      `${result.deletedCount} user(s) deleted successfully`
    );
  } catch (error) {
    next(error);
  }
};
