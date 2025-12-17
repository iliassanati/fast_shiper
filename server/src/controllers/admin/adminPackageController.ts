// server/src/controllers/admin/adminPackageController.ts - FIXED VERSION WITH STORAGE DAYS
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
import { sendPackageArrivalEmail } from '../../services/emailService.js';

// Storage configuration - 30 days
const STORAGE_LIMIT_DAYS = 30;

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

    // Storage warning filter - packages with 7 or less days remaining
    if (storageWarning === 'true') {
      query.status = 'received';
      query.storageDay = { $gte: STORAGE_LIMIT_DAYS - 7 }; // 23+ days = 7 or less remaining
    }

    const packages = await Package.find(query)
      .populate('userId', 'name email suiteNumber')
      .populate('consolidationId')
      .sort({ receivedDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    // Update storage days for each package before returning
    const updatedPackages = await Promise.all(
      packages.map(async (pkg) => {
        const currentStorageDay = calculateStorageDays(pkg.receivedDate);
        if (pkg.storageDay !== currentStorageDay) {
          pkg.storageDay = currentStorageDay;
          await pkg.save();
        }
        return pkg;
      })
    );

    const total = await Package.countDocuments(query);

    sendSuccess(res, {
      packages: updatedPackages,
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
      photos,
      receivedDate, // Allow custom received date from admin
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

    // Set received date (default to now)
    const packageReceivedDate = receivedDate
      ? new Date(receivedDate)
      : new Date();

    // Calculate initial storage days
    const initialStorageDay = calculateStorageDays(packageReceivedDate);

    // Create package with proper storage day initialization
    const packageData: any = {
      userId: user._id,
      trackingNumber,
      retailer,
      description: description || 'Package from ' + retailer,
      status: 'received',
      receivedDate: packageReceivedDate,
      notes: notes || '',
      storageDay: initialStorageDay, // FIXED: Properly initialize storage day
    };

    // Add weight if provided
    if (weight && weight.value) {
      packageData.weight = weight;
    } else {
      packageData.weight = { value: 0, unit: 'kg' };
    }

    // Add dimensions if provided
    if (dimensions && dimensions.length) {
      packageData.dimensions = dimensions;
    } else {
      packageData.dimensions = {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm',
      };
    }

    // Add estimated value if provided
    if (estimatedValue && estimatedValue.amount) {
      packageData.estimatedValue = estimatedValue;
    } else {
      packageData.estimatedValue = { amount: 0, currency: 'USD' };
    }

    // Add photos if provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
      packageData.photos = photos.map((photo: any) => ({
        url: photo.url,
        type: photo.type || 'basic',
        uploadedAt: new Date(),
      }));
    } else {
      packageData.photos = [];
    }

    console.log('📦 Creating package with storage day:', initialStorageDay);

    const pkg = await createPackage(packageData);

    // Send email notification
    try {
      const emailSent = await sendPackageArrivalEmail(user, pkg);
      if (emailSent) {
        console.log('✅ Email notification sent to user');
      } else {
        console.log('⚠️ Email failed to send but package was registered');
      }
    } catch (emailError) {
      console.error('❌ Email error:', emailError);
    }

    // Create in-app notification for user
    await createNotification({
      userId: user._id as any,
      type: 'package_received',
      title: 'New Package Received',
      message: `Your package from ${pkg.retailer} (${pkg.trackingNumber}) has been received at our warehouse. Free storage for ${STORAGE_LIMIT_DAYS} days.`,
      relatedId: pkg._id,
      relatedModel: 'Package',
      priority: 'normal',
      actionUrl: `/packages/${pkg._id}`,
    });

    sendSuccess(
      res,
      {
        package: pkg,
        storageDaysRemaining: STORAGE_LIMIT_DAYS - initialStorageDay,
      },
      'Package registered successfully',
      201
    );
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
      'receivedDate', // Allow updating received date
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (pkg as any)[field] = updates[field];
      }
    });

    // Recalculate storage days if received date changed
    if (updates.receivedDate) {
      pkg.storageDay = calculateStorageDays(new Date(updates.receivedDate));
    }

    await pkg.save();

    // Handle consolidation status change
    if (updates.status === 'consolidated' && oldStatus !== 'consolidated') {
      console.log(`📦 Package ${id} marked as consolidated`);

      if (!pkg.consolidationId) {
        console.log(
          '⚠️ Package has no consolidation ID - creating a consolidation record'
        );

        let consolidation = await Consolidation.findOne({
          userId: pkg.userId,
          packageIds: pkg._id,
          status: { $in: ['pending', 'processing'] },
        });

        if (!consolidation) {
          consolidation = await Consolidation.findOne({
            userId: pkg.userId,
            status: 'pending',
          });

          if (consolidation && !consolidation.packageIds.includes(pkg._id)) {
            consolidation.packageIds.push(pkg._id as any);
            await consolidation.save();
            console.log(
              `✅ Added package to existing consolidation: ${consolidation._id}`
            );
          }
        }

        if (!consolidation) {
          const totalWeight = pkg.weight.value;
          const totalVolume =
            pkg.dimensions.length *
            pkg.dimensions.width *
            pkg.dimensions.height;

          consolidation = new Consolidation({
            userId: pkg.userId,
            packageIds: [pkg._id],
            status: 'processing',
            preferences: {
              removePackaging: true,
              addProtection: false,
              requestUnpackedPhotos: false,
            },
            specialInstructions: 'Admin-initiated consolidation',
            estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
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
      {
        package: updatedPackage,
        storageDaysRemaining:
          STORAGE_LIMIT_DAYS - (updatedPackage?.storageDay || 0),
      },
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
    const { photos } = req.body;

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
      criticalWarnings,
    ] = await Promise.all([
      Package.countDocuments(),
      Package.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Package.aggregate([
        { $group: { _id: '$retailer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Package.aggregate([
        { $match: { status: 'received' } },
        { $group: { _id: null, avg: { $avg: '$storageDay' } } },
      ]),
      // Packages with 7 or less days remaining
      Package.countDocuments({
        status: 'received',
        storageDay: { $gte: STORAGE_LIMIT_DAYS - 7 },
      }),
      // Packages with 3 or less days remaining (critical)
      Package.countDocuments({
        status: 'received',
        storageDay: { $gte: STORAGE_LIMIT_DAYS - 3 },
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
        storageWarnings, // 7 days or less remaining
        criticalWarnings, // 3 days or less remaining
        storageLimitDays: STORAGE_LIMIT_DAYS,
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
      .populate('userId', 'name email suiteNumber phone')
      .populate('consolidationId');

    if (!pkg) {
      sendNotFound(res, 'Package not found');
      return;
    }

    // Update storage days before returning
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
    next(error);
  }
};
