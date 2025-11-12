// server/src/models/Shipment.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { IShipment } from '../types/index.js';

export interface IShipmentDocument extends Omit<IShipment, '_id'>, Document {}

const shipmentSchema = new Schema<IShipmentDocument>(
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
    carrier: {
      type: String,
      required: [true, 'Carrier is required'],
      enum: ['DHL', 'FedEx', 'Aramex', 'UPS'],
      trim: true,
    },
    serviceLevel: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number is required'],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    shippedDate: {
      type: Date,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      required: true,
    },
    actualDelivery: {
      type: Date,
      default: null,
    },
    destination: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: 'Morocco',
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },
    weight: {
      total: {
        type: Number,
        required: true,
        min: 0,
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
        min: 0,
      },
      width: {
        type: Number,
        required: true,
        min: 0,
      },
      height: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['cm', 'in'],
        default: 'cm',
      },
    },
    cost: {
      shipping: {
        type: Number,
        required: true,
        min: 0,
      },
      insurance: {
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
    insurance: {
      coverage: {
        type: Number,
        default: 0,
        min: 0,
      },
      cost: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    customsInfo: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        value: {
          type: Number,
          required: true,
          min: 0,
        },
        hsCode: {
          type: String,
          trim: true,
        },
        countryOfOrigin: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    trackingEvents: [
      {
        status: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        timestamp: {
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
shipmentSchema.index({ userId: 1, status: 1 });
shipmentSchema.index({ userId: 1, createdAt: -1 });
shipmentSchema.index({ trackingNumber: 1 });

export const Shipment = mongoose.model<IShipmentDocument>(
  'Shipment',
  shipmentSchema
);

// Helper functions
export const createShipment = async (
  shipmentData: Partial<IShipment>
): Promise<IShipmentDocument> => {
  const shipment = new Shipment(shipmentData);
  await shipment.save();
  return shipment;
};

export const findShipmentById = async (
  shipmentId: string
): Promise<IShipmentDocument | null> => {
  return Shipment.findById(shipmentId)
    .populate('userId', 'name email suiteNumber')
    .populate('packageIds');
};

export const findShipmentsByUser = async (
  userId: string,
  filters?: {
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<IShipmentDocument[]> => {
  const query = Shipment.find({ userId });

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

export const updateShipmentStatus = async (
  shipmentId: string,
  status: IShipment['status'],
  trackingEvent?: IShipment['trackingEvents'][0]
): Promise<IShipmentDocument | null> => {
  const update: any = { $set: { status } };

  if (trackingEvent) {
    update.$push = { trackingEvents: trackingEvent };
  }

  if (status === 'in_transit' && !trackingEvent) {
    update.$set.shippedDate = new Date();
  }

  if (status === 'delivered') {
    update.$set.actualDelivery = new Date();
  }

  return Shipment.findByIdAndUpdate(shipmentId, update, {
    new: true,
    runValidators: true,
  });
};
