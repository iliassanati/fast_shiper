// server/src/controllers/admin/adminTicketController.ts
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';
import {
  Ticket,
  findTicketById,
  findAllTickets,
  addMessageToTicket,
  updateTicketStatus,
  assignTicket,
} from '../../models/Ticket.js';
import { createNotification } from '../../models/Notification.js';
import { findAdminById } from '../../models/Admin.js';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
} from '../../utils/responses.js';

/**
 * Get all tickets with filters
 * GET /api/admin/tickets
 */
export const getAllTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const {
      status,
      priority,
      category,
      assignedTo,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('userId', 'name email suiteNumber phone')
      .populate('assignedTo', 'name email')
      .sort({ priority: 1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .exec();

    const total = await Ticket.countDocuments(query);

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
 * Get ticket statistics
 * GET /api/admin/tickets/statistics
 */
export const getTicketStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedToday,
      createdToday,
      byStatus,
      byCategory,
      byPriority,
      avgResponseTime,
      unassignedTickets,
    ] = await Promise.all([
      Ticket.countDocuments(),

      Ticket.countDocuments({ status: 'open' }),

      Ticket.countDocuments({ status: 'in_progress' }),

      Ticket.countDocuments({
        status: 'resolved',
        resolvedAt: { $gte: today },
      }),

      Ticket.countDocuments({
        createdAt: { $gte: today },
      }),

      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),

      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),

      Ticket.aggregate([
        {
          $match: {
            responseTime: { $exists: true, $ne: null },
            createdAt: { $gte: thisWeek },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$responseTime' },
          },
        },
      ]),

      Ticket.countDocuments({
        status: { $in: ['open', 'in_progress'] },
        assignedTo: null,
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusBreakdown[item._id] = item.count;
    });

    const categoryBreakdown: Record<string, number> = {};
    byCategory.forEach((item) => {
      categoryBreakdown[item._id] = item.count;
    });

    const priorityBreakdown: Record<string, number> = {};
    byPriority.forEach((item) => {
      priorityBreakdown[item._id] = item.count;
    });

    sendSuccess(res, {
      statistics: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolvedToday,
        createdToday,
        unassigned: unassignedTickets,
        byStatus: statusBreakdown,
        byCategory: categoryBreakdown,
        byPriority: priorityBreakdown,
        avgResponseTime: Math.round(avgResponseTime[0]?.avgTime || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single ticket
 * GET /api/admin/tickets/:id
 */
export const getTicketById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to ticket
 * POST /api/admin/tickets/:id/reply
 */
export const replyToTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { message, isInternal, attachments } = req.body;

    if (!message || message.trim() === '') {
      sendError(res, 'Message is required', 400);
      return;
    }

    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    // Get admin info
    const admin = await findAdminById(req.user!.userId);

    if (!admin) {
      sendError(res, 'Admin not found', 404);
      return;
    }

    // Add message
    const updatedTicket = await addMessageToTicket(id, {
      sender: admin._id as any,
      senderType: 'admin',
      senderName: admin.name,
      message: message.trim(),
      attachments: attachments || [],
      isInternal: isInternal || false,
    });

    if (!updatedTicket) {
      sendError(res, 'Failed to add message', 500);
      return;
    }

    // Update status to in_progress if it was open
    if (updatedTicket.status === 'open') {
      await updateTicketStatus(id, 'in_progress');
    }

    // Notify user (only if not internal message)
    if (!isInternal) {
      await createNotification({
        userId: ticket.userId,
        type: 'package_received',
        title: 'New Ticket Response',
        message: `You have a new response on ticket ${ticket.ticketNumber}: ${ticket.subject}`,
        relatedId: ticket._id,
        relatedModel: 'Package',
        priority: 'normal',
        actionUrl: `/tickets/${ticket._id}`,
      });
    }

    sendSuccess(res, { ticket: updatedTicket }, 'Reply added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket status
 * PUT /api/admin/tickets/:id/status
 */
export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      sendError(res, 'Status is required', 400);
      return;
    }

    const validStatuses = [
      'open',
      'in_progress',
      'waiting_customer',
      'resolved',
      'closed',
    ];
    if (!validStatuses.includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    const updatedTicket = await updateTicketStatus(id, status);

    // Notify user of status change
    let notificationMessage = '';
    switch (status) {
      case 'resolved':
        notificationMessage = `Your ticket ${ticket.ticketNumber} has been resolved.`;
        break;
      case 'closed':
        notificationMessage = `Your ticket ${ticket.ticketNumber} has been closed.`;
        break;
      case 'in_progress':
        notificationMessage = `Your ticket ${ticket.ticketNumber} is now being worked on.`;
        break;
      case 'waiting_customer':
        notificationMessage = `Your ticket ${ticket.ticketNumber} is waiting for your response.`;
        break;
    }

    if (notificationMessage) {
      await createNotification({
        userId: ticket.userId,
        type: 'package_received',
        title: 'Ticket Status Updated',
        message: notificationMessage,
        relatedId: ticket._id,
        relatedModel: 'Package',
        priority: status === 'waiting_customer' ? 'high' : 'normal',
        actionUrl: `/tickets/${ticket._id}`,
      });
    }

    sendSuccess(res, { ticket: updatedTicket }, 'Status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Assign ticket to admin
 * PUT /api/admin/tickets/:id/assign
 */
export const assignToAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { adminId } = req.body;

    const ticket = await findTicketById(id);

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    // Validate admin exists if adminId is provided
    if (adminId) {
      const admin = await findAdminById(adminId);
      if (!admin) {
        sendError(res, 'Admin not found', 404);
        return;
      }
    }

    const updatedTicket = await assignTicket(id, adminId || null);

    sendSuccess(res, { ticket: updatedTicket }, 'Ticket assigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket priority
 * PUT /api/admin/tickets/:id/priority
 */
export const updatePriority = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      sendError(res, 'Priority is required', 400);
      return;
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      sendError(res, 'Invalid priority', 400);
      return;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $set: { priority } },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email suiteNumber')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    sendSuccess(res, { ticket }, 'Priority updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add tags to ticket
 * PUT /api/admin/tickets/:id/tags
 */
export const updateTags = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.isAdmin) {
      sendForbidden(res);
      return;
    }

    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      sendError(res, 'Tags must be an array', 400);
      return;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $set: { tags } },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email suiteNumber')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      sendNotFound(res, 'Ticket not found');
      return;
    }

    sendSuccess(res, { ticket }, 'Tags updated successfully');
  } catch (error) {
    next(error);
  }
};
