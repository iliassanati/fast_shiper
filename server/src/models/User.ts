// src/models/User.ts
import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '../types/index.js';

// User Document interface (extends Mongoose Document)
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User Schema Definition
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    suiteNumber: {
      type: String,
      unique: true,
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
      },
      country: {
        type: String,
        default: 'Morocco',
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
export const User = mongoose.model<IUserDocument>('User', userSchema);

// ============================================
// FUNCTIONAL HELPERS FOR USER OPERATIONS
// ============================================

/**
 * Generate a unique suite number for new users
 */
export const generateSuiteNumber = async (): Promise<string> => {
  let suiteNumber: string;
  let exists = true;

  while (exists) {
    // Generate format: MA-XXXX (X = random digit)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    suiteNumber = `MA-${randomNum}`;

    // Check if suite number already exists
    const existingUser = await User.findOne({ suiteNumber });
    exists = !!existingUser;
  }

  return suiteNumber!;
};

/**
 * Create a new user
 */
export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: IUser['address'];
}): Promise<IUserDocument> => {
  const suiteNumber = await generateSuiteNumber();

  const user = new User({
    ...userData,
    suiteNumber,
  });

  await user.save();
  return user;
};

/**
 * Find user by email (with password)
 */
export const findUserByEmail = async (
  email: string
): Promise<IUserDocument | null> => {
  return User.findOne({ email }).select('+password');
};

/**
 * Find user by ID
 */
export const findUserById = async (
  userId: string
): Promise<IUserDocument | null> => {
  return User.findById(userId);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<IUser, 'name' | 'phone' | 'address'>>
): Promise<IUserDocument | null> => {
  return User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  );
};

/**
 * Check if email already exists
 */
export const emailExists = async (email: string): Promise<boolean> => {
  const user = await User.findOne({ email });
  return !!user;
};
