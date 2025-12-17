// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/index.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      message: err.message,
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    const response: ApiResponse = {
      success: false,
      error: `${field} already exists`,
    };
    res.status(400).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token',
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      error: 'Token expired',
    };
    res.status(401).json(response);
    return;
  }

  // Default error
  const response: ApiResponse = {
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  };

  res.status(500).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
};
