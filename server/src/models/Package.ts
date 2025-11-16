// server/src/models/Package.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { IPackage } from '../types/index.js';

export interface IPackageDocument extends Omit<IPackage, '_id'>, Document {}

const packageSchema = new Schema<IPackageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number is required'],
      unique: true,
      trim: true,
    },
    retailer: {
      type: String,
      required: [true, 'Retailer name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['received', 'consolidated', 'shipped', 'in_transit', 'delivered'],
      default: 'received',
      index: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    weight: {
      value: {
        type: Number,
        required: true,
        min: [0, 'Weight must be positive'],
      },
      unit: {
        type: String,
        enum: ['kg', 'lb'],
        default: 'kg',
      },
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: [0, 'Length must be positive'],
      },
      width: {
        type: Number,
        required: true,
        min: [0, 'Width must be positive'],
      },
      height: {
        type: Number,
        required: true,
        min: [0, 'Height must be positive'],
      },
      unit: {
        type: String,
        enum: ['cm', 'in'],
        default: 'cm',
      },
    },
    storageDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedValue: {
      amount: {
        type: Number,
        required: true,
        min: [0, 'Value must be positive'],
      },
      currency: {
        type: String,
        enum: ['USD', 'MAD'],
        default: 'USD',
      },
    },
    photos: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['basic', 'unpacked', 'detailed', 'damage'],
          default: 'basic',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    consolidationId: {
      type: Schema.Types.ObjectId,
      ref: 'Consolidation',
      default: null,
    },
    shipmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Shipment',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isConsolidatedResult: {
      type: Boolean,
      default: false,
      index: true,
    },
    originalPackageIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Package',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
packageSchema.index({ userId: 1, status: 1 });
packageSchema.index({ userId: 1, receivedDate: -1 });
packageSchema.index({ trackingNumber: 1 });

// Method to calculate storage days
packageSchema.methods.updateStorageDays = function () {
  const today = new Date();
  const received = new Date(this.receivedDate);
  const daysDiff = Math.floor(
    (today.getTime() - received.getTime()) / (1000 * 60 * 60 * 24)
  );
  this.storageDay = Math.max(0, daysDiff);
  return this.storageDay;
};

export const Package = mongoose.model<IPackageDocument>(
  'Package',
  packageSchema
);

// Helper functions
export const createPackage = async (
  packageData: Partial<IPackage>
): Promise<IPackageDocument> => {
  const pkg = new Package(packageData);
  await pkg.save();
  return pkg;
};

export const findPackageById = async (
  packageId: string
): Promise<IPackageDocument | null> => {
  return Package.findById(packageId).populate(
    'userId',
    'name email suiteNumber'
  );
};

export const findPackagesByUser = async (
  userId: string,
  filters?: {
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<IPackageDocument[]> => {
  const query = Package.find({ userId });

  if (filters?.status) {
    query.where('status').equals(filters.status);
  }

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  if (filters?.skip) {
    query.skip(filters.skip);
  }

  return query.sort({ receivedDate: -1 }).exec();
};

export const updatePackageStatus = async (
  packageId: string,
  status: IPackage['status']
): Promise<IPackageDocument | null> => {
  return Package.findByIdAndUpdate(
    packageId,
    { $set: { status } },
    { new: true, runValidators: true }
  );
};

export const deletePackage = async (
  packageId: string
): Promise<IPackageDocument | null> => {
  return Package.findByIdAndDelete(packageId);
};
