// server/src/controllers/packageController.ts - UPDATED VERSION
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import {
  Package,
  createPackage,
  findPackageById,
  findPackagesByUser,
  updatePackageStatus,
  deletePackage,
} from '../models/Package.js';
import { createNotification } from '../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

/**
 * Get all packages for current user
 * GET /api/packages
 */
export const getPackages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    console.log('🔍 Fetching packages for user:', req.user.userId);

    const filters = {
      status: status as string | undefined,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };

    // CRITICAL: This ensures we only get packages for THIS user
    const packages = await findPackagesByUser(req.user.userId, filters);

    // Count total packages for this user
    const countQuery: any = { userId: req.user.userId };
    if (status) {
      countQuery.status = status;
    }
    const total = await Package.countDocuments(countQuery);

    console.log(
      `✅ Found ${packages.length} packages for user ${req.user.userId}`
    );

    sendSuccess(res, {
      packages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching packages:', error);
    next(error);
  }
};

/**
 * Get single package by ID
 * GET /api/packages/:id
 */
export const getPackageById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;
    const pkg = await findPackageById(id);

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    // CRITICAL: Check ownership - user can only see their own packages
    if (pkg.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied to this package');
      return;
    }

    // Update storage days
    pkg.updateStorageDays();
    await pkg.save();

    sendSuccess(res, { package: pkg });
  } catch (error) {
    console.error('❌ Error fetching package:', error);
    next(error);
  }
};

/**
 * Create new package (admin only - for receiving packages at warehouse)
 * POST /api/packages
 */
export const createNewPackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    // For user creation, use their own userId
    // For admin creation, userId should be in the request body
    const packageData = {
      ...req.body,
      userId: req.body.userId || req.user.userId, // Admin can specify userId, user uses their own
    };

    console.log('📦 Creating package for user:', packageData.userId);

    const pkg = await createPackage(packageData);

    // Create notification
    await createNotification({
      userId: pkg.userId,
      type: 'package_received',
      title: 'New Package Received',
      message: `Your package from ${pkg.retailer} has been received at our warehouse.`,
      relatedId: pkg._id,
      relatedModel: 'Package',
      priority: 'normal',
      actionUrl: `/packages/${pkg._id}`,
    });

    console.log('✅ Package created successfully:', pkg._id);

    sendSuccess(res, { package: pkg }, 'Package created successfully', 201);
  } catch (error) {
    console.error('❌ Error creating package:', error);
    next(error);
  }
};

/**
 * Update package
 * PUT /api/packages/:id
 */
export const updatePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;
    const pkg = await findPackageById(id);

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    // CRITICAL: Check ownership
    if (pkg.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied to this package');
      return;
    }

    // Update fields
    Object.assign(pkg, req.body);
    await pkg.save();

    console.log('✅ Package updated:', id);

    sendSuccess(res, { package: pkg }, 'Package updated successfully');
  } catch (error) {
    console.error('❌ Error updating package:', error);
    next(error);
  }
};

/**
 * Delete package
 * DELETE /api/packages/:id
 */
export const removePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const { id } = req.params;
    const pkg = await findPackageById(id);

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    // CRITICAL: Check ownership
    if (pkg.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied to this package');
      return;
    }

    // Don't allow deletion of shipped packages
    if (pkg.status === 'shipped' || pkg.status === 'in_transit') {
      sendError(res, 'Cannot delete packages that are in transit', 400);
      return;
    }

    await deletePackage(id);

    console.log('✅ Package deleted:', id);

    sendSuccess(res, null, 'Package deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting package:', error);
    next(error);
  }
};

/**
 * Get package statistics for current user
 * GET /api/packages/stats
 */
export const getPackageStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const userId = req.user.userId;

    console.log('📊 Fetching stats for user:', userId);

    // CRITICAL: Filter by userId for all stats
    const [total, inStorage, consolidated, shipped] = await Promise.all([
      Package.countDocuments({ userId }),
      Package.countDocuments({ userId, status: 'received' }),
      Package.countDocuments({ userId, status: 'consolidated' }),
      Package.countDocuments({
        userId,
        status: { $in: ['shipped', 'in_transit', 'delivered'] },
      }),
    ]);

    // Calculate average storage days for packages in storage
    const packagesInStorage = await Package.find({
      userId,
      status: 'received',
    });

    let avgStorageDays = 0;
    if (packagesInStorage.length > 0) {
      const totalDays = packagesInStorage.reduce((sum, pkg) => {
        pkg.updateStorageDays();
        return sum + pkg.storageDay;
      }, 0);
      avgStorageDays = Math.round(totalDays / packagesInStorage.length);
    }

    console.log('✅ Stats calculated:', {
      total,
      inStorage,
      consolidated,
      shipped,
    });

    sendSuccess(res, {
      stats: {
        total,
        inStorage,
        consolidated,
        shipped,
        avgStorageDays,
        storageDaysLeft: Math.max(0, 45 - avgStorageDays),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    next(error);
  }
};
