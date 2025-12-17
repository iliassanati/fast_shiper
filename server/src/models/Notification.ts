// server/src/models/Notification.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { INotification } from '../types/index.js';

export interface INotificationDocument
  extends Omit<INotification, '_id'>,
    Document {}

const notificationSchema = new Schema<INotificationDocument>(
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
        'package_received',
        'shipment_update',
        'consolidation_complete',
        'photo_request_complete',
        'payment_received',
        'storage_warning',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: [
        'Package',
        'Shipment',
        'Consolidation',
        'PhotoRequest',
        'Transaction',
      ],
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    actionUrl: {
      type: String,
      trim: true,
      default: '',
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
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>(
  'Notification',
  notificationSchema
);

// Helper functions
export const createNotification = async (
  notificationData: Partial<INotification>
): Promise<INotificationDocument> => {
  const notification = new Notification(notificationData);
  await notification.save();
  return notification;
};

export const findNotificationsByUser = async (
  userId: string,
  filters?: {
    read?: boolean;
    type?: string;
    limit?: number;
    skip?: number;
  }
): Promise<INotificationDocument[]> => {
  const query = Notification.find({ userId });

  if (filters?.read !== undefined) {
    query.where('read').equals(filters.read);
  }

  if (filters?.type) {
    query.where('type').equals(filters.type);
  }

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  if (filters?.skip) {
    query.skip(filters.skip);
  }

  return query.sort({ createdAt: -1 }).exec();
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<INotificationDocument | null> => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );
};

export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};
