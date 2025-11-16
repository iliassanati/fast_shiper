// server/src/controllers/webhookController.ts
import type { Request, Response, NextFunction } from 'express';
import { Shipment, updateShipmentStatus } from '../models/Shipment.js';
import { createNotification } from '../models/Notification.js';
import { sendSuccess } from '../utils/responses.js';

/**
 * Handle DHL tracking webhook
 * POST /api/webhooks/dhl/tracking
 */
export const handleDHLTrackingWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const webhookData = req.body;

    console.log(
      '📨 Received DHL webhook:',
      JSON.stringify(webhookData, null, 2)
    );

    // Validate webhook signature (if DHL provides one)
    // const signature = req.headers['x-dhl-signature'];
    // if (!verifyDHLSignature(signature, webhookData)) {
    //   res.status(401).json({ error: 'Invalid signature' });
    //   return;
    // }

    // Extract tracking information
    const {
      trackingNumber,
      status,
      location,
      timestamp,
      description,
      estimatedDelivery,
    } = webhookData;

    // Find shipment by tracking number
    const shipment = await Shipment.findOne({ trackingNumber }).populate(
      'userId'
    );

    if (!shipment) {
      console.warn(`⚠️ Shipment not found for tracking: ${trackingNumber}`);
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    console.log(`✅ Found shipment: ${shipment._id}`);

    // Map DHL status to our internal status
    const internalStatus = mapDHLStatusToInternal(status);

    // Add tracking event
    shipment.trackingEvents.push({
      status: internalStatus,
      location: location || 'Unknown',
      description: description || `Status updated to ${status}`,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Update shipment status if changed
    if (internalStatus !== shipment.status) {
      shipment.status = internalStatus as any;

      // Update shipped date if status changed to in_transit
      if (internalStatus === 'in_transit' && !shipment.shippedDate) {
        shipment.shippedDate = new Date();
      }

      // Update delivery date if delivered
      if (internalStatus === 'delivered') {
        shipment.actualDelivery = new Date();
      }
    }

    // Update estimated delivery if provided
    if (estimatedDelivery) {
      shipment.estimatedDelivery = new Date(estimatedDelivery);
    }

    await shipment.save();

    console.log(`✅ Shipment updated: ${shipment._id}`);

    // Send notification to user
    let notificationTitle = 'Shipment Update';
    let notificationMessage =
      description || 'Your shipment status has been updated';

    if (internalStatus === 'in_transit') {
      notificationTitle = 'Shipment In Transit';
      notificationMessage = `Your shipment ${trackingNumber} is now on its way!`;
    } else if (internalStatus === 'delivered') {
      notificationTitle = 'Shipment Delivered';
      notificationMessage = `Your shipment ${trackingNumber} has been delivered!`;
    }

    await createNotification({
      userId: shipment.userId,
      type: 'shipment_update',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: shipment._id,
      relatedModel: 'Shipment',
      priority: internalStatus === 'delivered' ? 'high' : 'normal',
      actionUrl: `/shipments/${shipment._id}`,
    });

    console.log(`✅ Notification sent to user: ${shipment.userId}`);

    // Respond to DHL webhook
    sendSuccess(res, { received: true }, 'Webhook processed successfully');
  } catch (error) {
    console.error('❌ Error processing DHL webhook:', error);
    next(error);
  }
};

/**
 * Map DHL status codes to internal status
 */
function mapDHLStatusToInternal(dhlStatus: string): string {
  const statusMap: Record<string, string> = {
    // Pre-transit
    PU: 'pending', // Information received
    PL: 'processing', // Picked up

    // In transit
    RCS: 'in_transit', // Received at facility
    WC: 'in_transit', // With delivery courier
    OFD: 'in_transit', // Out for delivery

    // Delivered
    OK: 'delivered', // Delivered
    DD: 'delivered', // Signed for
    DF: 'delivered', // Delivered to final destination

    // Exceptions
    NH: 'in_transit', // Not home - will retry
    RT: 'in_transit', // Returning to sender
    CA: 'cancelled', // Cancelled
  };

  return statusMap[dhlStatus] || 'in_transit';
}

/**
 * Verify DHL webhook signature (if implemented)
 */
function verifyDHLSignature(
  signature: string | undefined,
  payload: any
): boolean {
  if (!signature) return false;

  // Implement signature verification logic based on DHL's documentation
  // This typically involves HMAC SHA256 with a secret key

  const crypto = require('crypto');
  const secret = process.env.DHL_WEBHOOK_SECRET || '';

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === computedSignature;
}
