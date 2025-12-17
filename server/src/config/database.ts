// src/config/database.ts
import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @returns Promise that resolves when connected
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fast-shipper';

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📍 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error);
  }
};

/**
 * Handle MongoDB connection events
 */
export const setupDatabaseEvents = (): void => {
  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB Error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB Disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB Reconnected');
  });
};
