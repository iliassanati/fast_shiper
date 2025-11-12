// server/src/models/PhotoRequest.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { IPhotoRequest } from '../types/index.js';

export interface IPhotoRequestDocument
  extends Omit<IPhotoRequest, '_id'>,
    Document {}

const photoRequestSchema = new Schema<IPhotoRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    requestType: {
      type: String,
      enum: ['photos', 'information', 'both'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    additionalPhotos: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    specificRequests: [
      {
        type: String,
        trim: true,
      },
    ],
    customInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    cost: {
      photos: {
        type: Number,
        default: 0,
        min: 0,
      },
      information: {
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
    completedAt: {
      type: Date,
      default: null,
    },
    photos: [
      {
        url: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    informationReport: {
      type: String,
      trim: true,
      default: '',
    },
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
photoRequestSchema.index({ userId: 1, status: 1 });
photoRequestSchema.index({ packageId: 1 });

export const PhotoRequest = mongoose.model<IPhotoRequestDocument>(
  'PhotoRequest',
  photoRequestSchema
);

// Helper functions
export const createPhotoRequest = async (
  requestData: Partial<IPhotoRequest>
): Promise<IPhotoRequestDocument> => {
  const request = new PhotoRequest(requestData);
  await request.save();
  return request;
};

export const findPhotoRequestById = async (
  requestId: string
): Promise<IPhotoRequestDocument | null> => {
  return PhotoRequest.findById(requestId)
    .populate('userId', 'name email')
    .populate('packageId');
};

export const findPhotoRequestsByUser = async (
  userId: string,
  filters?: {
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<IPhotoRequestDocument[]> => {
  const query = PhotoRequest.find({ userId });

  if (filters?.status) {
    query.where('status').equals(filters.status);
  }

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  if (filters?.skip) {
    query.skip(filters.skip);
  }

  return query.sort({ createdAt: -1 }).populate('packageId').exec();
};
