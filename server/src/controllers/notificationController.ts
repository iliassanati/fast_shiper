// server/src/controllers/notificationController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import {
  Notification,
  findNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../models/Notification.js';
import {
  sendSuccess,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { read, type, page = 1, limit = 20 } = req.query;

    const filters = {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      type: type as string | undefined,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };

    const notifications = await findNotificationsByUser(
      req.user.userId,
      filters
    );
    const total = await Notification.countDocuments({
      userId: req.user.userId,
      ...(filters.read !== undefined && { read: filters.read }),
      ...(filters.type && { type: filters.type }),
    });

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      read: false,
    });

    sendSuccess(res, {
      notifications,
      unreadCount,
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
 * Get single notification by ID
 * GET /api/notifications/:id
 */
export const getNotificationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      sendNotFound(res, 'Notification not found');
      return;
    }

    // Check ownership
    if (notification.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    sendSuccess(res, { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      sendNotFound(res, 'Notification not found');
      return;
    }

    // Check ownership
    if (notification.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    const updatedNotification = await markNotificationAsRead(id);

    sendSuccess(
      res,
      { notification: updatedNotification },
      'Notification marked as read'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    await markAllNotificationsAsRead(req.user.userId);

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      sendNotFound(res, 'Notification not found');
      return;
    }

    // Check ownership
    if (notification.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    await Notification.findByIdAndDelete(id);

    sendSuccess(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
export const getNotificationStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const userId = req.user.userId;

    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
      Notification.aggregate([
        { $match: { userId: userId as any } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    const typeBreakdown: Record<string, number> = {};
    byType.forEach((item) => {
      typeBreakdown[item._id] = item.count;
    });

    sendSuccess(res, {
      stats: {
        total,
        unread,
        read: total - unread,
        byType: typeBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
