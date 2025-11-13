// server/src/controllers/admin/adminAuthController.ts
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
  createAdmin,
  findAdminByEmail,
  findAdminById,
  updateAdminLastLogin,
} from '../../models/Admin.js';
import { generateToken } from '../../utils/jwt.js';
import {
  sendSuccess,
  sendError,
  sendUnauthorized,
} from '../../utils/responses.js';

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
          role: admin.role,
          permissions: admin.permissions,
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
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new admin (super admin only)
 * POST /api/admin/auth/create
 */
export const createNewAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existingAdmin = await findAdminByEmail(email);
    if (existingAdmin) {
      sendError(res, 'Email already registered', 400);
      return;
    }

    // Create admin
    const admin = await createAdmin({
      name,
      email,
      password,
      role,
    });

    sendSuccess(
      res,
      {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      'Admin created successfully',
      201
    );
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
