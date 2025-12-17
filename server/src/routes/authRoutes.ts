// server/src/routes/authRoutes.ts - UPDATED VERSION
// Add these routes to your existing authRoutes.ts file

import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validate,
  registerSchema,
  loginSchema,
} from '../middleware/validation.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name, phone, address)
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/auth/email
 * @desc    Update user email
 * @access  Private
 */
router.put('/email', authenticate, authController.updateEmail);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

export default router;
