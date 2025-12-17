// server/src/models/Shipment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IShipment extends Document {
  user: mongoose.Types.ObjectId;
  packages: mongoose.Types.ObjectId[];
  consolidation?: mongoose.Types.ObjectId;
  trackingNumber: string;
  carrier: string;
  serviceLevelName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  recipientInfo: {
    name: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
    email?: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  declaredValue: number;
  shippingCost: number;
  photoRequestFees: number;
  protectionFee: number;
  totalCost: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentIntentId?: string;
  labelUrl?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  shippoTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema = new Schema<IShipment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Package',
        required: true,
      },
    ],
    consolidation: {
      type: Schema.Types.ObjectId,
      ref: 'Consolidation',
      default: null,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    carrier: {
      type: String,
      required: true,
      enum: ['DHL', 'FedEx', 'UPS', 'Aramex', 'USPS', 'Other'],
    },
    serviceLevelName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    recipientInfo: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
      },
      postalCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
      },
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
    },
    weight: {
      type: Number,
      required: true,
    },
    declaredValue: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    photoRequestFees: {
      type: Number,
      default: 0,
    },
    protectionFee: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    labelUrl: {
      type: String,
    },
    trackingUrl: {
      type: String,
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    shippoTransactionId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ShipmentSchema.index({ user: 1, createdAt: -1 });
ShipmentSchema.index({ trackingNumber: 1 });
ShipmentSchema.index({ status: 1 });

// Virtual for calculating days since shipment
ShipmentSchema.virtual('daysSinceShipment').get(function () {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if shipment is overdue
ShipmentSchema.methods.isOverdue = function () {
  if (!this.estimatedDelivery || this.status === 'delivered') {
    return false;
  }
  return new Date() > this.estimatedDelivery;
};

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
