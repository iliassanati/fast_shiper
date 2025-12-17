// server/src/middleware/adminAuth.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';
import { findAdminById } from '../models/Admin.js';
import { sendUnauthorized } from '../utils/responses.js';

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

    // Mark as admin request
    req.isAdmin = true;

    next();
  } catch (error) {
    sendUnauthorized(res, 'Authentication failed');
  }
};
