// server/src/controllers/packageController.ts - FIXED WITH 30 DAYS STORAGE
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { Types } from 'mongoose';
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

// Storage configuration - 30 days
const STORAGE_LIMIT_DAYS = 30;

/**
 * Helper function to extract userId as string from potentially populated field
 */
const extractUserId = (userIdField: any): string => {
  if (!userIdField) return '';

  // If it's a populated object with _id
  if (typeof userIdField === 'object' && userIdField._id) {
    return userIdField._id.toString();
  }

  // If it's already a string
  if (typeof userIdField === 'string') {
    return userIdField;
  }

  // If it's an ObjectId
  return userIdField.toString();
};

/**
 * Check if user owns the package
 */
const isPackageOwner = (packageUserId: any, authUserId: string): boolean => {
  const pkgUserId = extractUserId(packageUserId);
  const match = pkgUserId === authUserId;

  console.log('🔍 Ownership check:', {
    extractedPackageUserId: pkgUserId,
    authUserId: authUserId,
    match: match,
  });

  return match;
};

/**
 * Calculate storage days from received date
 */
const calculateStorageDays = (receivedDate: Date): number => {
  const today = new Date();
  const received = new Date(receivedDate);
  const daysDiff = Math.floor(
    (today.getTime() - received.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysDiff);
};

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

    // Update storage days for each package
    for (const pkg of packages) {
      const currentStorageDay = calculateStorageDays(pkg.receivedDate);
      if (pkg.storageDay !== currentStorageDay) {
        pkg.storageDay = currentStorageDay;
        await pkg.save();
      }
    }

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

    // Check ownership
    if (!isPackageOwner(pkg.userId, req.user.userId)) {
      console.log('❌ Access denied - package ownership mismatch');
      sendForbidden(res, 'Access denied to this package');
      return;
    }

    // Update storage days
    const currentStorageDay = calculateStorageDays(pkg.receivedDate);
    if (pkg.storageDay !== currentStorageDay) {
      pkg.storageDay = currentStorageDay;
      await pkg.save();
    }

    const daysRemaining = Math.max(0, STORAGE_LIMIT_DAYS - pkg.storageDay);

    sendSuccess(res, {
      package: pkg,
      storageDaysRemaining: daysRemaining,
      isWarning: daysRemaining <= 7,
      isCritical: daysRemaining <= 3,
      storageLimitDays: STORAGE_LIMIT_DAYS,
    });
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
      userId: req.body.userId || req.user.userId,
    };

    console.log('📦 Creating package for user:', packageData.userId);

    const pkg = await createPackage(packageData);

    // Create notification
    await createNotification({
      userId: pkg.userId,
      type: 'package_received',
      title: 'New Package Received',
      message: `Your package from ${pkg.retailer} has been received at our warehouse. Free storage for ${STORAGE_LIMIT_DAYS} days.`,
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

    // CRITICAL: Check ownership using helper
    if (!isPackageOwner(pkg.userId, req.user.userId)) {
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

    // CRITICAL: Check ownership using helper
    if (!isPackageOwner(pkg.userId, req.user.userId)) {
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
    let minStorageDaysLeft = STORAGE_LIMIT_DAYS;

    if (packagesInStorage.length > 0) {
      let totalDays = 0;

      for (const pkg of packagesInStorage) {
        // Update storage days
        const currentStorageDay = calculateStorageDays(pkg.receivedDate);
        if (pkg.storageDay !== currentStorageDay) {
          pkg.storageDay = currentStorageDay;
          await pkg.save();
        }

        totalDays += pkg.storageDay;

        // Track minimum days left
        const daysLeft = STORAGE_LIMIT_DAYS - pkg.storageDay;
        if (daysLeft < minStorageDaysLeft) {
          minStorageDaysLeft = daysLeft;
        }
      }

      avgStorageDays = Math.round(totalDays / packagesInStorage.length);
    }

    console.log('✅ Stats calculated:', {
      total,
      inStorage,
      consolidated,
      shipped,
      avgStorageDays,
      storageDaysLeft: Math.max(0, minStorageDaysLeft),
    });

    sendSuccess(res, {
      stats: {
        total,
        inStorage,
        consolidated,
        shipped,
        avgStorageDays,
        storageDaysLeft: Math.max(0, minStorageDaysLeft),
        storageLimitDays: STORAGE_LIMIT_DAYS,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    next(error);
  }
};
