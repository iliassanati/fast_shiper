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
} from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import {
  sendSuccess,
  sendError,
  sendUnauthorized,
  sendNotFound,
} from '../utils/responses.js';

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
