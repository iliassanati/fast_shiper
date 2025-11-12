// src/utils/responses.ts
import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    data,
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  error: string | Error,
  statusCode: number = 500
): Response => {
  const response: ApiResponse = {
    success: false,
    error: typeof error === 'string' ? error : error.message,
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: Record<string, string>
): Response => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors,
  });
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return res.status(404).json({
    success: false,
    error: message,
  });
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return res.status(401).json({
    success: false,
    error: message,
  });
};

/**
 * Send forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return res.status(403).json({
    success: false,
    error: message,
  });
};
