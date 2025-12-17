// server/src/services/storageWarningService.ts - NEW FILE
import { Package } from '../models/Package.js';
import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';
import { createNotification } from '../models/Notification.js';
import { sendStorageWarningEmail } from './emailService.js';

// Storage configuration - 30 days total, warn at 7 days remaining
const STORAGE_LIMIT_DAYS = 30;
const WARNING_THRESHOLDS = [7, 5, 3, 1]; // Days remaining to send warnings

interface StorageWarningResult {
  totalChecked: number;
  warningsSent: number;
  emailsSent: number;
  errors: string[];
}

/**
 * Update storage days for all packages in storage
 */
export const updateAllStorageDays = async (): Promise<number> => {
  try {
    const packagesInStorage = await Package.find({ status: 'received' });
    let updated = 0;

    for (const pkg of packagesInStorage) {
      const today = new Date();
      const received = new Date(pkg.receivedDate);
      const daysDiff = Math.floor(
        (today.getTime() - received.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (pkg.storageDay !== daysDiff) {
        pkg.storageDay = Math.max(0, daysDiff);
        await pkg.save();
        updated++;
      }
    }

    console.log(`📊 Updated storage days for ${updated} packages`);
    return updated;
  } catch (error) {
    console.error('❌ Error updating storage days:', error);
    return 0;
  }
};

/**
 * Check packages for storage warnings and send notifications
 */
export const checkStorageWarnings = async (): Promise<StorageWarningResult> => {
  const result: StorageWarningResult = {
    totalChecked: 0,
    warningsSent: 0,
    emailsSent: 0,
    errors: [],
  };

  try {
    console.log('🔍 Checking for storage warnings...');

    // First, update all storage days
    await updateAllStorageDays();

    // Find packages that need warnings (23+ days in storage = 7 or less days remaining)
    const warningThresholdDays =
      STORAGE_LIMIT_DAYS - Math.max(...WARNING_THRESHOLDS);

    const packagesNeedingWarning = await Package.find({
      status: 'received',
      storageDay: { $gte: warningThresholdDays },
    }).populate('userId');

    result.totalChecked = packagesNeedingWarning.length;
    console.log(
      `📦 Found ${packagesNeedingWarning.length} packages needing storage warnings`
    );

    for (const pkg of packagesNeedingWarning) {
      try {
        const daysRemaining = Math.max(0, STORAGE_LIMIT_DAYS - pkg.storageDay);
        const user = pkg.userId as any;

        if (!user || !user.email) {
          result.errors.push(
            `Package ${pkg.trackingNumber}: User not found or no email`
          );
          continue;
        }

        // Check if we should send a warning for this threshold
        const shouldSendWarning = WARNING_THRESHOLDS.includes(daysRemaining);

        if (!shouldSendWarning && daysRemaining > 0) {
          continue; // Only send at specific thresholds
        }

        // Determine notification priority
        const priority =
          daysRemaining <= 3
            ? 'urgent'
            : daysRemaining <= 5
              ? 'high'
              : 'normal';

        // Create notification for user
        await createNotification({
          userId: user._id,
          type: 'storage_warning',
          title:
            daysRemaining <= 3
              ? `🚨 URGENT: ${daysRemaining} day(s) left for package!`
              : `⚠️ Storage Warning: ${daysRemaining} days remaining`,
          message: `Your package from ${pkg.retailer} (${pkg.trackingNumber}) has ${daysRemaining} day(s) of free storage remaining. Please ship or consolidate soon to avoid additional fees.`,
          relatedId: pkg._id,
          relatedModel: 'Package',
          priority: priority as any,
          actionUrl: `/packages/${pkg._id}`,
        });

        result.warningsSent++;

        // Send email notification
        const emailSent = await sendStorageWarningEmail(
          user,
          pkg,
          daysRemaining
        );
        if (emailSent) {
          result.emailsSent++;
        }

        // Also notify all admins about critical packages (3 days or less)
        if (daysRemaining <= 3) {
          await notifyAdminsAboutStorageWarning(pkg, user, daysRemaining);
        }
      } catch (pkgError: any) {
        result.errors.push(
          `Package ${pkg.trackingNumber}: ${pkgError.message}`
        );
      }
    }

    console.log(`✅ Storage warning check complete:
      - Packages checked: ${result.totalChecked}
      - Warnings sent: ${result.warningsSent}
      - Emails sent: ${result.emailsSent}
      - Errors: ${result.errors.length}`);

    return result;
  } catch (error: any) {
    console.error('❌ Error checking storage warnings:', error);
    result.errors.push(`General error: ${error.message}`);
    return result;
  }
};

/**
 * Notify admins about critical storage warnings
 */
const notifyAdminsAboutStorageWarning = async (
  pkg: any,
  user: any,
  daysRemaining: number
): Promise<void> => {
  try {
    // Get all active admins
    const admins = await Admin.find({ isActive: true });

    for (const admin of admins) {
      // Note: Admin notifications use a different system
      // For now, we'll log and could extend to use admin notification store
      console.log(
        `📢 Admin notification: Package ${pkg.trackingNumber} for ${user.name} has ${daysRemaining} day(s) remaining`
      );
    }
  } catch (error) {
    console.error('❌ Error notifying admins:', error);
  }
};

/**
 * Get packages with storage warnings
 */
export const getPackagesWithStorageWarnings = async () => {
  try {
    const warningThresholdDays =
      STORAGE_LIMIT_DAYS - Math.max(...WARNING_THRESHOLDS);

    const packages = await Package.find({
      status: 'received',
      storageDay: { $gte: warningThresholdDays },
    })
      .populate('userId', 'name email suiteNumber')
      .sort({ storageDay: -1 });

    return packages.map((pkg) => ({
      ...pkg.toObject(),
      daysRemaining: Math.max(0, STORAGE_LIMIT_DAYS - pkg.storageDay),
      isUrgent: STORAGE_LIMIT_DAYS - pkg.storageDay <= 3,
      isCritical: STORAGE_LIMIT_DAYS - pkg.storageDay <= 1,
    }));
  } catch (error) {
    console.error('❌ Error getting packages with warnings:', error);
    return [];
  }
};

/**
 * Get storage statistics for admin dashboard
 */
export const getStorageStatistics = async () => {
  try {
    const packagesInStorage = await Package.countDocuments({
      status: 'received',
    });

    const stats = await Package.aggregate([
      { $match: { status: 'received' } },
      {
        $group: {
          _id: null,
          avgStorageDays: { $avg: '$storageDay' },
          maxStorageDays: { $max: '$storageDay' },
          minStorageDays: { $min: '$storageDay' },
        },
      },
    ]);

    const warningCount = await Package.countDocuments({
      status: 'received',
      storageDay: { $gte: STORAGE_LIMIT_DAYS - 7 },
    });

    const criticalCount = await Package.countDocuments({
      status: 'received',
      storageDay: { $gte: STORAGE_LIMIT_DAYS - 3 },
    });

    const expiredCount = await Package.countDocuments({
      status: 'received',
      storageDay: { $gte: STORAGE_LIMIT_DAYS },
    });

    return {
      totalInStorage: packagesInStorage,
      avgStorageDays: Math.round(stats[0]?.avgStorageDays || 0),
      maxStorageDays: stats[0]?.maxStorageDays || 0,
      warningCount, // 7 days or less remaining
      criticalCount, // 3 days or less remaining
      expiredCount, // 0 days remaining (30+ days in storage)
      storageLimitDays: STORAGE_LIMIT_DAYS,
    };
  } catch (error) {
    console.error('❌ Error getting storage statistics:', error);
    return null;
  }
};

export default {
  updateAllStorageDays,
  checkStorageWarnings,
  getPackagesWithStorageWarnings,
  getStorageStatistics,
};
