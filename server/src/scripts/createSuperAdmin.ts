// server/src/scripts/createAdmin.ts
import mongoose from 'mongoose';
import { createAdmin } from '../models/Admin.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createAdminAccount() {
  try {
    console.log('🔄 Connecting to MongoDB...');

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fast-shipper';
    await mongoose.connect(mongoUri);

    console.log('✅ Connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    // Check if admin already exists
    const { Admin } = await import('../models/Admin.js');
    const existingAdmin = await Admin.findOne({ isActive: true });

    if (existingAdmin) {
      console.log('\n⚠️  Admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log(
        '\nIf you want to create a new admin, please delete the existing one first.'
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('\n🔨 Creating admin account...');

    const admin = await createAdmin({
      name: 'Admin',
      email: 'admin@fastshipper.com',
      password: 'Admin123!',
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@fastshipper.com');
    console.log('🔑 Password: Admin123!');
    console.log('🆔 ID:       ' + admin._id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      '\n⚠️  IMPORTANT: Please change this password after first login!'
    );
    console.log('🌐 Login at: http://localhost:5173/admin/login');

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdminAccount();
