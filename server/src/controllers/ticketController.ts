// server/src/controllers/ticketController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import {
  Ticket,
  createTicket,
  findTicketById,
  findTicketsByUser,
  addMessageToTicket,
} from '../models/Ticket.js';
import { createNotification } from '../models/Notification.js';
import { findUserById } from '../models/User.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../utils/responses.js';

/**
 * Get all tickets for current user
 * GET /api/tickets
 */
export const getUserTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    const filters = {
      status: status as string | undefined,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };

    const tickets = await findTicketsByUser(req.user.userId, filters);
    const total = await Ticket.countDocuments({
      userId: req.user.userId,
      ...(status && { status }),
    });

    sendSuccess(res, {
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single ticket by ID
 * GET /api/tickets/:id
 */
export const getTicketById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    // Filter out internal messages
    const filteredTicket = ticket.toJSON();
    filteredTicket.messages = filteredTicket.messages.filter(
      (msg: any) => !msg.isInternal
    );

    sendSuccess(res, { ticket: filteredTicket });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new ticket
 * POST /api/tickets
 */
export const createNewTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const {
      subject,
      description,
      category,
      priority,
      relatedId,
      relatedModel,
    } = req.body;

    if (!subject || !description || !category) {
      sendError(res, 'Subject, description, and category are required', 400);
      return;
    }

    // Get user info
    const user = await findUserById(req.user.userId);

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Create ticket
    const ticket = await createTicket({
      userId: user._id as any,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority: priority || 'medium',
      status: 'open',
      relatedId: relatedId || null,
      relatedModel: relatedModel || null,
      messages: [
        {
          _id: new (require('mongoose').Types.ObjectId)(),
          sender: user._id as any,
          senderType: 'user',
          senderName: user.name,
          message: description.trim(),
          attachments: [],
          isInternal: false,
          timestamp: new Date(),
        },
      ],
      tags: [],
    } as any);

    // Notify user
    await createNotification({
      userId: user._id as any,
      type: 'package_received',
      title: 'Ticket Created',
      message: `Your ticket ${ticket.ticketNumber} has been created. We'll respond as soon as possible.`,
      relatedId: ticket._id,
      relatedModel: 'Package',
      priority: 'normal',
      actionUrl: `/tickets/${ticket._id}`,
    });

    sendSuccess(res, { ticket }, 'Ticket created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to ticket
 * POST /api/tickets/:id/reply
 */
export const replyToTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message || message.trim() === '') {
      sendError(res, 'Message is required', 400);
      return;
    }

    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    // Get user info
    const user = await findUserById(req.user.userId);

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Add message
    const updatedTicket = await addMessageToTicket(id, {
      sender: user._id as any,
      senderType: 'user',
      senderName: user.name,
      message: message.trim(),
      attachments: attachments || [],
      isInternal: false,
    });

    if (!updatedTicket) {
      sendError(res, 'Failed to add message', 500);
      return;
    }

    // If ticket was waiting_customer, change to in_progress
    if (updatedTicket.status === 'waiting_customer') {
      await Ticket.findByIdAndUpdate(id, { status: 'in_progress' });
    }

    sendSuccess(res, { ticket: updatedTicket }, 'Reply added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Close ticket
 * PUT /api/tickets/:id/close
 */
export const closeTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    if (ticket.status === 'closed') {
      sendError(res, 'Ticket is already closed', 400);
      return;
    }

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();

    sendSuccess(res, { ticket }, 'Ticket closed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reopen ticket
 * PUT /api/tickets/:id/reopen
 */
export const reopenTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user.userId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
      sendError(res, 'Can only reopen closed or resolved tickets', 400);
      return;
    }

    ticket.status = 'open';
    ticket.closedAt = null;
    ticket.resolvedAt = null;
    await ticket.save();

    sendSuccess(res, { ticket }, 'Ticket reopened successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get ticket statistics for user
 * GET /api/tickets/stats
 */
export const getTicketStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendForbidden(res);
      return;
    }

    const userId = req.user.userId;

    const [total, open, inProgress, resolved, byCategory] = await Promise.all([
      Ticket.countDocuments({ userId }),
      Ticket.countDocuments({ userId, status: 'open' }),
      Ticket.countDocuments({ userId, status: 'in_progress' }),
      Ticket.countDocuments({ userId, status: 'resolved' }),
      Ticket.aggregate([
        { $match: { userId: userId as any } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const categoryBreakdown: Record<string, number> = {};
    byCategory.forEach((item) => {
      categoryBreakdown[item._id] = item.count;
    });

    sendSuccess(res, {
      stats: {
        total,
        open,
        inProgress,
        resolved,
        byCategory: categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
