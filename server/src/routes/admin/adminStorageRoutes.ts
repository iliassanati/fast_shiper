// server/src/routes/admin/adminStorageRoutes.ts - NEW FILE
import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth.js';
import { triggerStorageCheck } from '../../services/scheduledTasks.js';
import {
  getPackagesWithStorageWarnings,
  getStorageStatistics,
} from '../../services/storageWarningService.js';
import { sendSuccess, sendError } from '../../utils/responses.js';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/storage/warnings
 * @desc    Get all packages with storage warnings
 * @access  Private (Admin)
 */
router.get(
  '/warnings',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const packages = await getPackagesWithStorageWarnings();
      sendSuccess(res, {
        packages,
        total: packages.length,
        critical: packages.filter((p: any) => p.isCritical).length,
        urgent: packages.filter((p: any) => p.isUrgent).length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/storage/statistics
 * @desc    Get storage statistics
 * @access  Private (Admin)
 */
router.get(
  '/statistics',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const statistics = await getStorageStatistics();
      sendSuccess(res, { statistics });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/admin/storage/check
 * @desc    Manually trigger storage warning check
 * @access  Private (Admin)
 */
router.post(
  '/check',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('🔧 Admin triggered manual storage check');
      const result = await triggerStorageCheck();
      sendSuccess(res, {
        result,
        message: 'Storage check completed',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
