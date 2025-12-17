// server/src/services/scheduledTasks.ts - NEW FILE
import {
  checkStorageWarnings,
  updateAllStorageDays,
} from './storageWarningService.js';

// Task configuration
const STORAGE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORAGE_UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

let storageCheckInterval: NodeJS.Timeout | null = null;
let storageUpdateInterval: NodeJS.Timeout | null = null;

/**
 * Initialize all scheduled tasks
 */
export const initializeScheduledTasks = (): void => {
  console.log('🕐 Initializing scheduled tasks...');

  // Run storage day updates every 6 hours
  storageUpdateInterval = setInterval(async () => {
    console.log('⏰ Running scheduled storage day update...');
    await updateAllStorageDays();
  }, STORAGE_UPDATE_INTERVAL);

  // Run storage warning checks once per day
  storageCheckInterval = setInterval(async () => {
    console.log('⏰ Running scheduled storage warning check...');
    await checkStorageWarnings();
  }, STORAGE_CHECK_INTERVAL);

  // Run initial checks on startup (with a small delay to allow DB connection)
  setTimeout(async () => {
    console.log('🚀 Running initial storage checks...');
    await updateAllStorageDays();
    await checkStorageWarnings();
  }, 10000); // 10 second delay after startup

  console.log('✅ Scheduled tasks initialized:');
  console.log('   - Storage day updates: every 6 hours');
  console.log('   - Storage warning checks: every 24 hours');
};

/**
 * Stop all scheduled tasks
 */
export const stopScheduledTasks = (): void => {
  console.log('🛑 Stopping scheduled tasks...');

  if (storageCheckInterval) {
    clearInterval(storageCheckInterval);
    storageCheckInterval = null;
  }

  if (storageUpdateInterval) {
    clearInterval(storageUpdateInterval);
    storageUpdateInterval = null;
  }

  console.log('✅ Scheduled tasks stopped');
};

/**
 * Manually trigger storage warning check (for admin use)
 */
export const triggerStorageCheck = async (): Promise<any> => {
  console.log('🔧 Manually triggering storage check...');
  await updateAllStorageDays();
  const result = await checkStorageWarnings();
  return result;
};

export default {
  initializeScheduledTasks,
  stopScheduledTasks,
  triggerStorageCheck,
};
