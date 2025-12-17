// server/src/models/Ticket.ts
import mongoose, { Schema, type Document } from 'mongoose';
import { Types } from 'mongoose';

export interface ITicket {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'package' | 'shipping' | 'payment' | 'consolidation' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedTo: Types.ObjectId | null;
  relatedId: Types.ObjectId | null;
  relatedModel: 'Package' | 'Shipment' | 'Consolidation' | 'Transaction' | null;
  messages: Array<{
    _id: Types.ObjectId;
    sender: Types.ObjectId;
    senderType: 'user' | 'admin';
    senderName: string;
    message: string;
    attachments: string[];
    isInternal: boolean;
    timestamp: Date;
  }>;
  tags: string[];
  resolvedAt: Date | null;
  closedAt: Date | null;
  lastResponseAt: Date | null;
  responseTime: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketDocument extends Omit<ITicket, '_id'>, Document {
  generateTicketNumber(): string;
}

const ticketSchema = new Schema<ITicketDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['package', 'shipping', 'payment', 'consolidation', 'general'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Package', 'Shipment', 'Consolidation', 'Transaction'],
      default: null,
    },
    messages: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          required: true,
          refPath: 'messages.senderType',
        },
        senderType: {
          type: String,
          enum: ['user', 'admin'],
          required: true,
        },
        senderName: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        attachments: [
          {
            type: String,
          },
        ],
        isInternal: {
          type: Boolean,
          default: false,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    lastResponseAt: {
      type: Date,
      default: null,
    },
    responseTime: {
      type: Number,
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
        return ret;
      },
    },
  }
);

// Indexes for better performance
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ createdAt: -1 });

// Generate ticket number
ticketSchema.methods.generateTicketNumber = function (): string {
  const prefix = 'TKT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Pre-save hook to generate ticket number
ticketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    this.ticketNumber = this.generateTicketNumber();
  }
  next();
});

export const Ticket = mongoose.model<ITicketDocument>('Ticket', ticketSchema);

// Helper functions
export const createTicket = async (
  ticketData: Partial<ITicket>
): Promise<ITicketDocument> => {
  const ticket = new Ticket(ticketData);
  await ticket.save();
  return ticket;
};

export const findTicketById = async (
  ticketId: string
): Promise<ITicketDocument | null> => {
  return Ticket.findById(ticketId)
    .populate('userId', 'name email suiteNumber phone')
    .populate('assignedTo', 'name email')
    .populate('relatedId');
};

export const findTicketByNumber = async (
  ticketNumber: string
): Promise<ITicketDocument | null> => {
  return Ticket.findOne({ ticketNumber })
    .populate('userId', 'name email suiteNumber phone')
    .populate('assignedTo', 'name email')
    .populate('relatedId');
};

export const findTicketsByUser = async (
  userId: string,
  filters?: {
    status?: string;
    limit?: number;
    skip?: number;
  }
): Promise<ITicketDocument[]> => {
  const query = Ticket.find({ userId });

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

export const findAllTickets = async (filters?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  limit?: number;
  skip?: number;
}): Promise<ITicketDocument[]> => {
  const query: any = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.priority) query.priority = filters.priority;
  if (filters?.category) query.category = filters.category;
  if (filters?.assignedTo) query.assignedTo = filters.assignedTo;

  const tickets = await Ticket.find(query)
    .populate('userId', 'name email suiteNumber')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .limit(filters?.limit || 50)
    .skip(filters?.skip || 0)
    .exec();

  return tickets;
};

export const addMessageToTicket = async (
  ticketId: string,
  message: {
    sender: Types.ObjectId;
    senderType: 'user' | 'admin';
    senderName: string;
    message: string;
    attachments?: string[];
    isInternal?: boolean;
  }
): Promise<ITicketDocument | null> => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return null;
  }

  ticket.messages.push({
    _id: new Types.ObjectId(),
    sender: message.sender,
    senderType: message.senderType,
    senderName: message.senderName,
    message: message.message,
    attachments: message.attachments || [],
    isInternal: message.isInternal || false,
    timestamp: new Date(),
  });

  ticket.lastResponseAt = new Date();

  // Calculate response time for first admin response
  if (
    message.senderType === 'admin' &&
    !ticket.responseTime &&
    ticket.createdAt
  ) {
    const responseTimeMs =
      new Date().getTime() - new Date(ticket.createdAt).getTime();
    ticket.responseTime = Math.floor(responseTimeMs / 1000 / 60); // in minutes
  }

  await ticket.save();
  return ticket;
};

export const updateTicketStatus = async (
  ticketId: string,
  status: ITicket['status']
): Promise<ITicketDocument | null> => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return null;
  }

  ticket.status = status;

  if (status === 'resolved' && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date();
  }

  if (status === 'closed' && !ticket.closedAt) {
    ticket.closedAt = new Date();
  }

  await ticket.save();
  return ticket;
};

export const assignTicket = async (
  ticketId: string,
  adminId: Types.ObjectId | null
): Promise<ITicketDocument | null> => {
  return Ticket.findByIdAndUpdate(
    ticketId,
    { $set: { assignedTo: adminId } },
    { new: true, runValidators: true }
  )
    .populate('userId', 'name email suiteNumber')
    .populate('assignedTo', 'name email');
};
