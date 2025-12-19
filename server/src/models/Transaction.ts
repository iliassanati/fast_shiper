// server/src/models/Transaction.ts - FIXED VERSION
import mongoose, { Schema, type Document } from 'mongoose';

export interface ITransaction {
  _id: string;
  userId: mongoose.Types.ObjectId | any;
  type: 'consolidation' | 'shipping' | 'photo_request' | 'storage' | 'other';
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: 'Package' | 'Shipment' | 'Consolidation' | 'PhotoRequest';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  amount: {
    value: number;
    currency: string;
  };
  paymentMethod: string; // ✅ CHANGED: Removed enum restriction
  description?: string;
  metadata?: Record<string, any>;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionDocument
  extends Omit<ITransaction, '_id'>, Document {}

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
      required: true,
      enum: ['consolidation', 'shipping', 'photo_request', 'storage', 'other'],
      index: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['Package', 'Shipment', 'Consolidation', 'PhotoRequest'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
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
        required: true,
        default: 'MAD',
      },
    },
    paymentMethod: {
      type: String,
      required: true,
      paymentMethod: {
        type: String,
        required: true,
        enum: [
          'stripe',
          'paypal',
          'card',
          'bank_transfer',
          'cash_on_delivery',
          'pending',
        ],
        default: 'pending',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    completedAt: {
      type: Date,
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

// Indexes for common queries
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ relatedId: 1, relatedModel: 1 });

export const Transaction = mongoose.model<ITransactionDocument>(
  'Transaction',
  transactionSchema
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a new transaction
 */
export const createTransaction = async (
  transactionData: Partial<ITransaction>
): Promise<ITransactionDocument> => {
  const transaction = new Transaction(transactionData);
  await transaction.save();
  return transaction;
};

/**
 * Find transaction by ID
 */
export const findTransactionById = async (
  transactionId: string
): Promise<ITransactionDocument | null> => {
  return Transaction.findById(transactionId).populate('userId', 'name email');
};

/**
 * Find transactions by user
 */
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

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
  transactionId: string,
  status: ITransaction['status'],
  notes?: string
): Promise<ITransactionDocument | null> => {
  const update: any = { status };

  if (status === 'completed') {
    update.completedAt = new Date();
  }

  if (notes) {
    update.notes = notes;
  }

  return Transaction.findByIdAndUpdate(transactionId, update, {
    new: true,
    runValidators: true,
  });
};

/**
 * Get user transaction statistics
 */
export const getUserTransactionStats = async (userId: string) => {
  const stats = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount.value' },
      },
    },
  ]);

  const result: Record<string, { count: number; totalAmount: number }> = {};

  stats.forEach((stat) => {
    result[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
    };
  });

  return result;
};
