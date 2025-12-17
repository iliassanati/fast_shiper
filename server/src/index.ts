// src/index.ts - UPDATED WITH SCHEDULED TASKS
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase, setupDatabaseEvents } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { verifyEmailConfig } from './services/emailService.js';
import {
  initializeScheduledTasks,
  stopScheduledTasks,
} from './services/scheduledTasks.js';

// Load environment variables
dotenv.config();

// ============================================
// APP SETUP
// ============================================

const app: Express = express();
const PORT = process.env.PORT || 1337;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      'http://localhost:5173' ||
      'http://localhost:1337' ||
      'https://fast-shiper.onrender.com/',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api', routes);

// ============================================
// PRODUCTION - SERVE FRONTEND
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(
    express.static(path.join(__dirname, '../../client/dist'), {
      maxAge: '30d',
      index: false,
    })
  );

  // Catch-all for frontend routes (but NOT /api routes)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fast Shipper API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    setupDatabaseEvents();

    // Verify email configuration
    const emailReady = await verifyEmailConfig();
    if (emailReady) {
      console.log('✅ Email service configured and ready');
    } else {
      console.log('⚠️ Email service not configured - emails will not be sent');
    }

    // Initialize scheduled tasks (storage warnings, etc.)
    initializeScheduledTasks();

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ============================================');
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`
      );
      console.log(`🚀 Listening on port ${PORT}`);
      console.log(`🚀 API URL: http://localhost:${PORT}/api`);
      console.log(`🚀 Health Check: http://localhost:${PORT}/api/health`);
      console.log('🚀 ============================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Handle graceful shutdown
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Stop scheduled tasks
    stopScheduledTasks();

    // Close database connection
    const mongoose = await import('mongoose');
    await mongoose.default.disconnect();
    console.log('✅ Database connection closed');

    console.log('✅ Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

export default app;
