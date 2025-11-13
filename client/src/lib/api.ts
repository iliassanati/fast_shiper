// client/src/lib/api.ts - FIXED VERSION
import axios, { type AxiosError, type AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  //  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token (FIXED TO SUPPORT BOTH USER AND ADMIN TOKENS)
api.interceptors.request.use(
  (config) => {
    // Check for admin token first, then user token
    const adminToken = localStorage.getItem('admin-token');
    const userToken = localStorage.getItem('auth-token');
    const token = adminToken || userToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return the data directly for successful responses
    return response;
  },
  (
    error: AxiosError<{ success: boolean; error: string; message?: string }>
  ) => {
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized - clear auth and redirect to login
      if (status === 401) {
        // Check which token failed and clear appropriately
        const adminToken = localStorage.getItem('admin-token');
        const userToken = localStorage.getItem('auth-token');

        if (adminToken) {
          // Admin token failed
          localStorage.removeItem('admin-token');
          const { useAdminAuthStore } = require('@/stores/useAdminAuthStore');
          useAdminAuthStore.getState().logout();

          if (
            window.location.pathname.startsWith('/admin') &&
            window.location.pathname !== '/admin/login'
          ) {
            window.location.href = '/admin/login';
          }
        } else if (userToken) {
          // User token failed
          localStorage.removeItem('auth-token');
          const { useAuthStore } = require('@/stores');
          useAuthStore.getState().logout();

          if (window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          }
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        console.error(
          'Access forbidden:',
          data.error || 'You do not have permission to access this resource'
        );
      }

      // Handle 404 Not Found
      if (status === 404) {
        console.error(
          'Resource not found:',
          data.error || 'The requested resource was not found'
        );
      }

      // Handle 500 Server Error
      if (status >= 500) {
        console.error(
          'Server error:',
          data.error || 'An unexpected server error occurred'
        );
      }

      // Return structured error
      return Promise.reject({
        status,
        message: data.error || data.message || 'An error occurred',
        data: data,
      });
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your internet connection.',
        data: null,
      });
    } else {
      // Something else went wrong
      console.error('Request error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'An unexpected error occurred',
        data: null,
      });
    }
  }
);

// Helper functions for common API operations
export const apiHelpers = {
  /**
   * GET request
   */
  get: async <T = any>(url: string, params?: Record<string, any>) => {
    const response = await api.get<{ success: boolean; data: T }>(url, {
      params,
    });
    return response.data.data;
  },

  /**
   * POST request
   */
  post: async <T = any>(url: string, data?: any) => {
    const response = await api.post<{ success: boolean; data: T }>(url, data);
    return response.data.data;
  },

  /**
   * PUT request
   */
  put: async <T = any>(url: string, data?: any) => {
    const response = await api.put<{ success: boolean; data: T }>(url, data);
    return response.data.data;
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(url: string) => {
    const response = await api.delete<{ success: boolean; data: T }>(url);
    return response.data.data;
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(url: string, data?: any) => {
    const response = await api.patch<{ success: boolean; data: T }>(url, data);
    return response.data.data;
  },
};

export default api;
