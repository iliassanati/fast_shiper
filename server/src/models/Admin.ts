// server/src/models/Admin.ts
import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin {
  _id: string;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminDocument extends Omit<IAdmin, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdminDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
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
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
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
adminSchema.pre('save', async function (next) {
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
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model<IAdminDocument>('Admin', adminSchema);

// Helper functions
export const createAdmin = async (adminData: {
  name: string;
  email: string;
  password: string;
}): Promise<IAdminDocument> => {
  const admin = new Admin(adminData);
  await admin.save();
  return admin;
};

export const findAdminByEmail = async (
  email: string
): Promise<IAdminDocument | null> => {
  return Admin.findOne({ email, isActive: true }).select('+password');
};

export const findAdminById = async (
  adminId: string
): Promise<IAdminDocument | null> => {
  return Admin.findOne({ _id: adminId, isActive: true });
};

export const updateAdminLastLogin = async (adminId: string): Promise<void> => {
  await Admin.findByIdAndUpdate(adminId, { lastLogin: new Date() });
};
