// server/src/middleware/adminAuth.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { findAdminById } from '../models/Admin.js';
import { sendUnauthorized, sendForbidden } from '../utils/responses.js';

/**
 * Admin authentication middleware
 * Verifies JWT token and ensures user is an admin
 */
export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }

    // Check if admin exists and is active
    const admin = await findAdminById(decoded.userId);

    if (!admin) {
      sendUnauthorized(res, 'Admin not found or inactive');
      return;
    }

    // Attach admin info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    // Attach admin role and permissions
    req.admin = {
      role: admin.role,
      permissions: admin.permissions,
    };

    next();
  } catch (error) {
    sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Permission check middleware factory
 * Creates middleware that checks if admin has required permission
 */
export const requirePermission = (permission: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.admin) {
        sendUnauthorized(res, 'Admin authentication required');
        return;
      }

      // Super admin has all permissions
      if (req.admin.role === 'super_admin') {
        next();
        return;
      }

      // Check if admin has the required permission
      if (!req.admin.permissions.includes(permission)) {
        sendForbidden(res, `Permission denied. Required: ${permission}`);
        return;
      }

      next();
    } catch (error) {
      sendForbidden(res, 'Permission check failed');
    }
  };
};

/**
 * Role check middleware factory
 * Creates middleware that checks if admin has required role
 */
export const requireRole = (...roles: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.admin) {
        sendUnauthorized(res, 'Admin authentication required');
        return;
      }

      // Check if admin has one of the required roles
      if (!roles.includes(req.admin.role)) {
        sendForbidden(
          res,
          `Access denied. Required roles: ${roles.join(', ')}`
        );
        return;
      }

      next();
    } catch (error) {
      sendForbidden(res, 'Role check failed');
    }
  };
};
