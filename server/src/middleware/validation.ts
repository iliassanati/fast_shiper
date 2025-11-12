// src/middleware/validation.ts
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { sendValidationError } from '../utils/responses.js';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().min(10, 'Invalid phone number'),
  city: z.string().min(2, 'City is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  phone: z.string().min(10, 'Invalid phone number').optional(),
  address: z
    .object({
      street: z.string().min(1, 'Street is required').optional(),
      city: z.string().min(1, 'City is required').optional(),
      postalCode: z.string().min(1, 'Postal code is required').optional(),
      country: z.string().optional(),
    })
    .optional(),
});

// ============================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================

/**
 * Create validation middleware from Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });

        sendValidationError(res, errors);
        return;
      }

      next(error);
    }
  };
};
