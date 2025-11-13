// server/src/controllers/admin/adminAuthController.ts
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
  findAdminByEmail,
  findAdminById,
  updateAdminLastLogin,
} from '../../models/Admin.js';
import { generateToken } from '../../utils/jwt.js';
import { sendSuccess, sendUnauthorized } from '../../utils/responses.js';

/**
 * Admin login
 * POST /api/admin/auth/login
 */
export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await findAdminByEmail(email);

    if (!admin) {
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Update last login
    await updateAdminLastLogin(admin._id.toString());

    // Generate JWT token
    const token = generateToken({
      userId: admin._id.toString(),
      email: admin.email,
    });

    // Send response
    sendSuccess(
      res,
      {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          lastLogin: admin.lastLogin,
        },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current admin profile
 * GET /api/admin/auth/me
 */
export const getAdminProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const admin = await findAdminById(req.user.userId);

    if (!admin) {
      sendUnauthorized(res, 'Admin not found');
      return;
    }

    sendSuccess(res, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin logout
 * POST /api/admin/auth/logout
 */
export const adminLogout = (req: Request, res: Response): void => {
  sendSuccess(res, null, 'Logout successful');
};
