// server/src/models/Transaction.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { ITransaction } from '../types/index.js';

export interface ITransactionDocument
  extends Omit<ITransaction, '_id'>,
    Document {}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'consolidation',
        'shipping',
        'photo_request',
        'insurance',
        'storage_fee',
        'refund',
      ],
      required: true,
      index: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    relatedModel: {
      type: String,
      enum: ['Consolidation', 'Shipment', 'PhotoRequest', 'Package'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    amount: {
      value: {
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
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'cash'],
      required: true,
    },
    paymentDetails: {
      last4: {
        type: String,
        default: '',
      },
      brand: {
        type: String,
        default: '',
      },
      transactionId: {
        type: String,
        unique: true,
        sparse: true,
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    invoice: {
      number: {
        type: String,
        unique: true,
        sparse: true,
      },
      url: {
        type: String,
        default: '',
      },
      generatedAt: {
        type: Date,
        default: null,
      },
    },
    refund: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      reason: {
        type: String,
        trim: true,
        default: '',
      },
      processedAt: {
        type: Date,
        default: null,
      },
    },
    completedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model<ITransactionDocument>(
  'Transaction',
  transactionSchema
);

// Helper functions
export const createTransaction = async (
  transactionData: Partial<ITransaction>
): Promise<ITransactionDocument> => {
  const transaction = new Transaction(transactionData);
  await transaction.save();
  return transaction;
};

export const findTransactionsByUser = async (
  userId: string,
  filters?: {
    type?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<ITransactionDocument[]> => {
  const query = Transaction.find({ userId });

  if (filters?.type) {
    query.where('type').equals(filters.type);
  }

  if (filters?.status) {
    query.where('status').equals(filters.status);
  }

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  if (filters?.skip) {
    query.skip(filters.skip);
  }

  return query.sort({ createdAt: -1 }).exec();
};
