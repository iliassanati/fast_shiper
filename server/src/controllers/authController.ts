// src/controllers/authController.ts
import type { Request, Response, NextFunction } from 'express';
import type {
  AuthRequest,
  RegisterDTO,
  LoginDTO,
  UserResponse,
} from '../types/index.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  emailExists,
  User,
} from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import {
  sendSuccess,
  sendError,
  sendUnauthorized,
  sendNotFound,
} from '../utils/responses.js';
import { sendWelcomeEmail } from '../services/emailService.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone, city }: RegisterDTO = req.body;

    // Check if email already exists
    const exists = await emailExists(email);
    if (exists) {
      sendError(res, 'Email already registered', 400);
      return;
    }

    // Create user with address
    const user = await createUser({
      name,
      email,
      password,
      phone,
      address: {
        street: '', // Will be updated later
        city,
        postalCode: '', // Will be updated later
        country: 'Morocco',
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Prepare user response (without password)
    const userResponse: UserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      suiteNumber: user.suiteNumber,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // US Address for the user
    const usAddress = {
      name: user.name,
      suite: `Suite ${user.suiteNumber}`,
      street: '123 Warehouse Drive',
      city: 'Wilmington, DE 19801',
      country: 'United States',
      phone: '+1 (555) 123-4567',
    };

    // 🎉 Send welcome email (non-blocking)
    sendWelcomeEmail(user, usAddress)
      .then(() => {
        console.log(`✅ Welcome email sent to ${user.email}`);
      })
      .catch((error) => {
        console.error(
          `⚠️ Failed to send welcome email to ${user.email}:`,
          error.message
        );
        // Don't fail registration if email fails
      });

    // Send response
    sendSuccess(
      res,
      {
        user: userResponse,
        token,
        usAddress,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Find user by email (with password)
    const user = await findUserByEmail(email);

    if (!user) {
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      sendUnauthorized(res, 'Invalid credentials');
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Prepare user response (without password)
    const userResponse: UserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      suiteNumber: user.suiteNumber,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Send response
    sendSuccess(
      res,
      {
        user: userResponse,
        token,
        usAddress: {
          name: user.name,
          suite: `Suite ${user.suiteNumber}`,
          street: '123 Warehouse Drive',
          city: 'Wilmington, DE 19801',
          country: 'United States',
          phone: '+1 (555) 123-4567',
        },
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const user = await findUserById(req.user.userId);

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Prepare user response
    const userResponse: UserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      suiteNumber: user.suiteNumber,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    sendSuccess(res, {
      user: userResponse,
      usAddress: {
        name: user.name,
        suite: `Suite ${user.suiteNumber}`,
        street: '123 Warehouse Drive',
        city: 'Wilmington, DE 19801',
        country: 'United States',
        phone: '+1 (555) 123-4567',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = (req: Request, res: Response): void => {
  // With JWT, logout is handled client-side by removing the token
  sendSuccess(res, null, 'Logout successful');
};

/**
 * Update user email
 * PUT /api/auth/email
 */
export const updateEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const { newEmail, password } = req.body;

    // Validate input
    if (!newEmail || !password) {
      sendError(res, 'New email and current password are required', 400);
      return;
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      sendError(res, 'Invalid email format', 400);
      return;
    }

    // Get user with password
    const user = await User.findById(req.user.userId).select('+password');

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendUnauthorized(res, 'Incorrect password');
      return;
    }

    // Check if new email is same as current
    if (user.email === newEmail.toLowerCase()) {
      sendError(res, 'New email is the same as current email', 400);
      return;
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      sendError(res, 'Email is already in use', 400);
      return;
    }

    // Update email
    user.email = newEmail.toLowerCase();
    await user.save();

    // Generate new token with updated email
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    sendSuccess(
      res,
      {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          suiteNumber: user.suiteNumber,
          phone: user.phone,
          address: user.address,
        },
        token,
      },
      'Email updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const { name, phone, address } = req.body;

    const user = await findUserById(req.user.userId);

    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();

    // Prepare user response
    const userResponse: UserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      suiteNumber: user.suiteNumber,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    sendSuccess(res, { user: userResponse }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
