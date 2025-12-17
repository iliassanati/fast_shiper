// server/src/models/Consolidation.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { IConsolidation } from '../types/index.js';

export interface IConsolidationDocument
  extends Omit<IConsolidation, '_id'>,
    Document {}

const consolidationSchema = new Schema<IConsolidationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packageIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Package',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    preferences: {
      removePackaging: {
        type: Boolean,
        default: true,
      },
      addProtection: {
        type: Boolean,
        default: false,
      },
      requestUnpackedPhotos: {
        type: Boolean,
        default: false,
      },
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedCompletion: {
      type: Date,
      required: true,
    },
    actualCompletion: {
      type: Date,
      default: null,
    },
    resultingPackageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    cost: {
      base: {
        type: Number,
        required: true,
        min: 0,
      },
      protection: {
        type: Number,
        default: 0,
        min: 0,
      },
      photos: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        enum: ['MAD', 'USD'],
        default: 'MAD',
      },
    },
    beforeConsolidation: {
      totalWeight: {
        type: Number,
        required: true,
        min: 0,
      },
      totalVolume: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    afterConsolidation: {
      weight: {
        type: Number,
        default: null,
      },
      dimensions: {
        length: {
          type: Number,
          default: null,
        },
        width: {
          type: Number,
          default: null,
        },
        height: {
          type: Number,
          default: null,
        },
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
          enum: ['before', 'unpacked', 'after'],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
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

// Indexes
consolidationSchema.index({ userId: 1, status: 1 });
consolidationSchema.index({ userId: 1, createdAt: -1 });

export const Consolidation = mongoose.model<IConsolidationDocument>(
  'Consolidation',
  consolidationSchema
);

// Helper functions
export const createConsolidation = async (
  consolidationData: Partial<IConsolidation>
): Promise<IConsolidationDocument> => {
  const consolidation = new Consolidation(consolidationData);
  await consolidation.save();
  return consolidation;
};

export const findConsolidationById = async (
  consolidationId: string
): Promise<IConsolidationDocument | null> => {
  return Consolidation.findById(consolidationId)
    .populate('userId', 'name email suiteNumber')
    .populate('packageIds')
    .populate('resultingPackageId');
};

export const findConsolidationsByUser = async (
  userId: string,
  filters?: {
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<IConsolidationDocument[]> => {
  const query = Consolidation.find({ userId });

  if (filters?.status) {
    query.where('status').equals(filters.status);
  }

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  if (filters?.skip) {
    query.skip(filters.skip);
  }

  return query.sort({ createdAt: -1 }).populate('packageIds').exec();
};

export const updateConsolidationStatus = async (
  consolidationId: string,
  status: IConsolidation['status']
): Promise<IConsolidationDocument | null> => {
  const update: any = { $set: { status } };

  if (status === 'completed') {
    update.$set.actualCompletion = new Date();
  }

  return Consolidation.findByIdAndUpdate(consolidationId, update, {
    new: true,
    runValidators: true,
  });
};
