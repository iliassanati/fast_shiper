// src/types/index.ts
import type { Request } from 'express';

// User Types
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  suiteNumber: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Omit password for responses
export type UserResponse = Omit<IUser, 'password'>;

// Request with authenticated user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Auth DTOs
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
