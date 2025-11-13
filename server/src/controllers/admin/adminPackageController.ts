// server/src/controllers/admin/adminPackageController.ts - FIXED VERSION
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
  Package,
  createPackage,
  findPackageById,
} from '../../models/Package.js';
import { Consolidation } from '../../models/Consolidation.js';
import { User } from '../../models/User.js';
import { createNotification } from '../../models/Notification.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all packages (admin view with filters)
 * GET /api/admin/packages
 */
export const getAllPackages = async (
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
      userId,
      search,
      storageWarning,
      page = 1,
      limit = 50,
    } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { retailer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (storageWarning === 'true') {
      query.status = 'received';
      query.storageDay = { $gte: 40 };
    }

    const packages = await Package.find(query)
      .populate('userId', 'name email suiteNumber')
      .populate('consolidationId')
      .sort({ receivedDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Package.countDocuments(query);

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
    next(error);
  }
};

/**
 * Register new package arrival
 * POST /api/admin/packages
 */
export const registerPackage = async (
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
      trackingNumber,
      retailer,
      description,
      weight,
      dimensions,
      estimatedValue,
      suiteNumber,
      notes,
    } = req.body;

    // Find user by suite number
    const user = await User.findOne({ suiteNumber });

    if (!user) {
      sendNotFound(res, 'User not found with this suite number');
      return;
    }

    // Check if package already exists
    const existingPackage = await Package.findOne({ trackingNumber });
    if (existingPackage) {
      sendError(res, 'Package with this tracking number already exists', 400);
      return;
    }

    // Create package
    const pkg = await createPackage({
      userId: user._id as any,
      trackingNumber,
      retailer,
      description,
      weight,
      dimensions,
      estimatedValue,
      status: 'received',
      receivedDate: new Date(),
      notes: notes || '',
      photos: [],
      storageDay: 0,
    } as any);

    // Create notification for user
    await createNotification({
      userId: user._id as any,
      type: 'package_received',
      title: 'New Package Received',
      message: `Your package from ${retailer} (${trackingNumber}) has been received at our warehouse.`,
      relatedId: pkg._id,
      relatedModel: 'Package',
      priority: 'normal',
      actionUrl: `/packages/${pkg._id}`,
    });

    sendSuccess(res, { package: pkg }, 'Package registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update package details - FIXED VERSION WITH CONSOLIDATION HANDLING
 * PUT /api/admin/packages/:id
 */
export const updatePackageDetails = async (
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

    const pkg = await Package.findById(id).populate('userId');

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    const oldStatus = pkg.status;

    // Update allowed fields
    const allowedUpdates = [
      'weight',
      'dimensions',
      'estimatedValue',
      'status',
      'notes',
      'description',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (pkg as any)[field] = updates[field];
      }
    });

    await pkg.save();

    // 🔥 NEW: Handle consolidation status change
    if (updates.status === 'consolidated' && oldStatus !== 'consolidated') {
      console.log(`📦 Package ${id} marked as consolidated`);

      // Check if package already has a consolidation
      if (!pkg.consolidationId) {
        console.log(
          '⚠️ Package has no consolidation ID - creating a consolidation record'
        );

        // Find or create a consolidation for this package
        // Option 1: Find existing pending consolidation for this user with this package
        let consolidation = await Consolidation.findOne({
          userId: pkg.userId,
          packageIds: pkg._id,
          status: { $in: ['pending', 'processing'] },
        });

        // Option 2: If no existing consolidation, check if user has any pending consolidation requests
        if (!consolidation) {
          consolidation = await Consolidation.findOne({
            userId: pkg.userId,
            status: 'pending',
          });

          // Add this package to the existing consolidation if found
          if (consolidation && !consolidation.packageIds.includes(pkg._id)) {
            consolidation.packageIds.push(pkg._id as any);
            await consolidation.save();
            console.log(
              `✅ Added package to existing consolidation: ${consolidation._id}`
            );
          }
        }

        // Option 3: If still no consolidation, create a new one (admin-initiated)
        if (!consolidation) {
          const totalWeight = pkg.weight.value;
          const totalVolume =
            pkg.dimensions.length *
            pkg.dimensions.width *
            pkg.dimensions.height;

          consolidation = new Consolidation({
            userId: pkg.userId,
            packageIds: [pkg._id],
            status: 'processing', // Admin-initiated, so start as processing
            preferences: {
              removePackaging: true,
              addProtection: false,
              requestUnpackedPhotos: false,
            },
            specialInstructions: 'Admin-initiated consolidation',
            estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            cost: {
              base: 25,
              protection: 0,
              photos: 0,
              total: 25,
              currency: 'MAD',
            },
            beforeConsolidation: {
              totalWeight,
              totalVolume,
            },
            afterConsolidation: {
              weight: null,
              dimensions: {
                length: null,
                width: null,
                height: null,
              },
            },
            photos: [],
            notes: `Admin-initiated consolidation for package ${pkg.trackingNumber}`,
          });

          await consolidation.save();
          console.log(`✅ Created new consolidation: ${consolidation._id}`);
        }

        // Link package to consolidation
        pkg.consolidationId = consolidation._id as any;
        await pkg.save();

        // Notify user
        await createNotification({
          userId: pkg.userId,
          type: 'consolidation_complete',
          title: 'Package Consolidated',
          message: `Your package ${pkg.trackingNumber} has been marked for consolidation.`,
          relatedId: consolidation._id,
          relatedModel: 'Consolidation',
          priority: 'normal',
          actionUrl: `/consolidations/${consolidation._id}`,
        });
      } else {
        console.log(
          `✅ Package already linked to consolidation: ${pkg.consolidationId}`
        );
      }
    }

    // Reload package with consolidation data
    const updatedPackage = await Package.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('consolidationId');

    sendSuccess(
      res,
      { package: updatedPackage },
      'Package updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload package photos
 * POST /api/admin/packages/:id/photos
 */
export const uploadPackagePhotos = async (
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
    const { photos } = req.body; // Array of { url, type }

    const pkg = await findPackageById(id);

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    // Add photos
    photos.forEach((photo: { url: string; type: string }) => {
      pkg.photos.push({
        url: photo.url,
        type: photo.type as any,
        uploadedAt: new Date(),
      });
    });

    await pkg.save();

    // Notify user
    await createNotification({
      userId: pkg.userId,
      type: 'package_received',
      title: 'Package Photos Available',
      message: `Photos of your package ${pkg.trackingNumber} are now available.`,
      relatedId: pkg._id,
      relatedModel: 'Package',
      priority: 'normal',
      actionUrl: `/packages/${pkg._id}`,
    });

    sendSuccess(res, { package: pkg }, 'Photos uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get package statistics
 * GET /api/admin/packages/statistics
 */
export const getPackageStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const [
      totalPackages,
      byStatus,
      byRetailer,
      avgStorageDays,
      storageWarnings,
    ] = await Promise.all([
      // Total packages
      Package.countDocuments(),

      // Packages by status
      Package.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

      // Top retailers
      Package.aggregate([
        { $group: { _id: '$retailer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Average storage days
      Package.aggregate([
        { $match: { status: 'received' } },
        { $group: { _id: null, avg: { $avg: '$storageDay' } } },
      ]),

      // Storage warnings
      Package.countDocuments({
        status: 'received',
        storageDay: { $gte: 40 },
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const topRetailers = byRetailer.map((item) => ({
      name: item._id,
      count: item.count,
    }));

    sendSuccess(res, {
      statistics: {
        total: totalPackages,
        byStatus: statusBreakdown,
        topRetailers,
        avgStorageDays: Math.round(avgStorageDays[0]?.avg || 0),
        storageWarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update package status
 * POST /api/admin/packages/bulk-update
 */
export const bulkUpdatePackages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { packageIds, status, notes } = req.body;

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      sendError(res, 'Package IDs are required', 400);
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;

    const result = await Package.updateMany(
      { _id: { $in: packageIds } },
      { $set: updateData }
    );

    sendSuccess(
      res,
      { updated: result.modifiedCount },
      `${result.modifiedCount} package(s) updated successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get single package details
 * GET /api/admin/packages/:id
 */
export const getPackageDetails = async (
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
    const pkg = await Package.findById(id)
      .populate('userId', 'name email suiteNumber')
      .populate('consolidationId');

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    sendSuccess(res, { package: pkg });
  } catch (error) {
    next(error);
  }
};
