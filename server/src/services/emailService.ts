// server/src/services/emailService.ts - UPDATED WITH STORAGE WARNING
import nodemailer from 'nodemailer';
import type { IUserDocument } from '../models/User.js';
import type { IPackageDocument } from '../models/Package.js';

// Email transporter configuration
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    console.log('⚠️ Email credentials not configured');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) return false;

    await transport.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

/**
 * Send package arrival notification email
 */
export const sendPackageArrivalEmail = async (
  user: IUserDocument,
  pkg: IPackageDocument
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      console.log('⚠️ Email transport not available');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const mailOptions = {
      from: `"Fast Shipper" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `📦 Your package from ${pkg.retailer} has arrived!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Package Received</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📦 Package Received!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
                Hello <strong>${user.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                Great news! Your package from <strong>${pkg.retailer}</strong> has been received at our US warehouse and is now safely stored in your suite.
              </p>
              
              <!-- Package Details Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">Package Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Tracking Number:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-family: monospace;">${pkg.trackingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Suite Number:</td>
                    <td style="padding: 8px 0; color: #3b82f6; font-weight: 600;">${user.suiteNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Weight:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${pkg.weight.value} ${pkg.weight.unit}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Dimensions:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${pkg.dimensions.length} × ${pkg.dimensions.width} × ${pkg.dimensions.height} ${pkg.dimensions.unit}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Storage Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⏰ <strong>Free Storage:</strong> Your package will be stored free for 30 days. After that, daily storage fees may apply.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/packages" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View My Packages
                </a>
              </div>
              
              <!-- Next Steps -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                <h4 style="color: #1e293b; margin-bottom: 15px;">What's Next?</h4>
                <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
                  <li>Wait for more packages to consolidate and save on shipping</li>
                  <li>Request photos to verify contents</li>
                  <li>Ship when you're ready!</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Fast Shipper - Shop from USA, Deliver to Morocco 🇲🇦
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
                © ${new Date().getFullYear()} Fast Shipper. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Package arrival email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending package arrival email:', error);
    return false;
  }
};

/**
 * Send storage warning email - NEW FUNCTION
 */
export const sendStorageWarningEmail = async (
  user: IUserDocument,
  pkg: IPackageDocument,
  daysRemaining: number
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      console.log('⚠️ Email transport not available');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const isUrgent = daysRemaining <= 3;
    const headerColor = isUrgent
      ? 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)'
      : 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)';

    const mailOptions = {
      from: `"Fast Shipper" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: isUrgent
        ? `🚨 URGENT: Only ${daysRemaining} day(s) left for package storage!`
        : `⚠️ Storage Warning: ${daysRemaining} days remaining for your package`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Storage Warning</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: ${headerColor}; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">
                ${isUrgent ? '🚨 Urgent Storage Warning!' : '⚠️ Storage Reminder'}
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
                Hello <strong>${user.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                ${
                  isUrgent
                    ? `<strong style="color: #dc2626;">This is an urgent reminder!</strong> Your package has only <strong>${daysRemaining} day(s)</strong> of free storage remaining.`
                    : `Your package from <strong>${pkg.retailer}</strong> has <strong>${daysRemaining} days</strong> of free storage remaining.`
                }
              </p>
              
              <!-- Warning Box -->
              <div style="background-color: ${isUrgent ? '#fef2f2' : '#fffbeb'}; border: 2px solid ${isUrgent ? '#dc2626' : '#f59e0b'}; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="font-size: 48px; margin: 0;">${isUrgent ? '🚨' : '⏰'}</p>
                <p style="font-size: 32px; font-weight: bold; color: ${isUrgent ? '#dc2626' : '#d97706'}; margin: 10px 0;">
                  ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left
                </p>
                <p style="color: ${isUrgent ? '#991b1b' : '#92400e'}; margin: 0;">
                  Free storage expires on ${new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <!-- Package Details Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">Package Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Tracking Number:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-family: monospace;">${pkg.trackingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Retailer:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${pkg.retailer}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Received Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${new Date(pkg.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Days in Storage:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${pkg.storageDay} days</td>
                  </tr>
                </table>
              </div>
              
              <!-- Action Required -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Action Required:</strong> Please ship your package before the storage period expires to avoid additional storage fees or package disposal.
                </p>
              </div>
              
              <!-- CTA Buttons -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/shipping" 
                   style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
                  Ship Now
                </a>
                <a href="${frontendUrl}/packages/${pkg._id}" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Package
                </a>
              </div>
              
              <!-- Options -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                <h4 style="color: #1e293b; margin-bottom: 15px;">Your Options:</h4>
                <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
                  <li><strong>Ship your package</strong> - Get it delivered to Morocco</li>
                  <li><strong>Consolidate</strong> - Combine with other packages to save on shipping</li>
                  <li><strong>Contact support</strong> - If you need more time or have questions</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Fast Shipper - Shop from USA, Deliver to Morocco 🇲🇦
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
                © ${new Date().getFullYear()} Fast Shipper. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(
      `✅ Storage warning email sent to ${user.email} (${daysRemaining} days remaining)`
    );
    return true;
  } catch (error) {
    console.error('❌ Error sending storage warning email:', error);
    return false;
  }
};

/**
 * Send shipment update email
 */
export const sendShipmentUpdateEmail = async (
  user: IUserDocument,
  shipmentData: {
    trackingNumber: string;
    carrier: string;
    status: string;
    estimatedDelivery?: string;
  }
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) return false;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const statusMessages: Record<string, { emoji: string; text: string }> = {
      pending: { emoji: '⏳', text: 'Your shipment is being prepared' },
      processing: { emoji: '📋', text: 'Your shipment is being processed' },
      in_transit: { emoji: '✈️', text: 'Your shipment is on its way!' },
      out_for_delivery: {
        emoji: '🚚',
        text: 'Your shipment is out for delivery',
      },
      delivered: { emoji: '✅', text: 'Your shipment has been delivered!' },
    };

    const statusInfo = statusMessages[shipmentData.status] || {
      emoji: '📦',
      text: `Status: ${shipmentData.status}`,
    };

    const mailOptions = {
      from: `"Fast Shipper" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `${statusInfo.emoji} Shipment Update: ${statusInfo.text}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${statusInfo.emoji} Shipment Update</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #1e293b;">Hello <strong>${user.name}</strong>,</p>
              <p style="font-size: 16px; color: #475569;">${statusInfo.text}</p>
              
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">Shipment Details</h3>
                <p><strong>Tracking:</strong> ${shipmentData.trackingNumber}</p>
                <p><strong>Carrier:</strong> ${shipmentData.carrier}</p>
                ${shipmentData.estimatedDelivery ? `<p><strong>Est. Delivery:</strong> ${shipmentData.estimatedDelivery}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/shipments" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Track Shipment
                </a>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">Fast Shipper - Shop from USA, Deliver to Morocco 🇲🇦</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Shipment update email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending shipment update email:', error);
    return false;
  }
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (
  user: IUserDocument,
  temporaryPassword?: string
): Promise<void> => {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .suite-number {
      background: #f0f4ff;
      border: 2px solid #667eea;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      margin: 20px 0;
    }
    .suite-number h2 {
      color: #667eea;
      margin: 0 0 10px 0;
    }
    .suite-number .number {
      font-size: 32px;
      font-weight: bold;
      color: #111827;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Fast Shipper!</h1>
  </div>
  
  <div class="content">
    <p>Dear ${user.name},</p>
    
    <p>Welcome to Fast Shipper! Your account has been successfully created.</p>
    
    <div class="suite-number">
      <h2>📬 Your US Suite Number</h2>
      <div class="number">${user.suiteNumber}</div>
      <p style="margin-top: 10px; color: #6b7280;">Use this address for all your US online shopping</p>
    </div>

    <p>Your US shipping address is:</p>
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; font-family: monospace;">
      ${user.name}<br>
      Suite ${user.suiteNumber}<br>
      [Warehouse Street Address]<br>
      [City, State ZIP]<br>
      United States
    </div>

    <p>You can now start shopping from any US retailer and have packages shipped to this address!</p>

    <p>Best regards,<br>
    <strong>Fast Shipper Team</strong></p>
  </div>
</body>
</html>
  `;

  console.log(user);

  const mailOptions = {
    from: `"Fast Shipper" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎉 Welcome to Fast Shipper - Your US Address is Ready!',
    html: emailHtml,
  };

  // Check if email service is configured
  if (!transporter) {
    console.log(
      `⚠️  Email service not configured - skipping welcome email to ${user.email}`
    );
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send photo request completion email
 */
export const sendPhotoRequestCompletionEmail = async (
  user: IUserDocument,
  photoRequest: any,
  pkg: any
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      console.log('⚠️ Email transport not available');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create photo gallery HTML
    const photoGallery = photoRequest.photos
      .map(
        (photo: any, index: number) => `
      <div style="display: inline-block; margin: 10px; text-align: center;">
        <img src="${photo.url}" alt="Package Photo ${index + 1}" 
             style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">${photo.description || `Photo ${index + 1}`}</p>
      </div>
    `
      )
      .join('');

    const mailOptions = {
      from: `"Fast Shipper" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `📸 Your Package Photos Are Ready! - ${pkg.trackingNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Photo Request Completed</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ec4899 0%, #f97316 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📸 Your Photos Are Ready!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
                Hello <strong>${user.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                Great news! Your photo request for package <strong>${pkg.trackingNumber}</strong> has been completed. 
                ${photoRequest.photos.length} photo(s) are now available for viewing.
              </p>
              
              <!-- Package Details Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">Package Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Tracking Number:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-family: monospace;">${pkg.trackingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Retailer:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${pkg.retailer}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Description:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${pkg.description}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Photos:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${photoRequest.photos.length} photo(s)</td>
                  </tr>
                </table>
              </div>
              
              <!-- Photo Gallery -->
              ${
                photoRequest.photos.length > 0
                  ? `
                <div style="margin: 25px 0;">
                  <h3 style="color: #1e293b; margin-bottom: 15px;">📸 Your Package Photos</h3>
                  <div style="text-align: center; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
                    ${photoGallery}
                  </div>
                  <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 10px;">
                    Click on any photo to view full size
                  </p>
                </div>
              `
                  : ''
              }
              
              <!-- Information Report (if exists) -->
              ${
                photoRequest.informationReport
                  ? `
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <h4 style="color: #1e40af; margin-top: 0;">📋 Package Inspection Report</h4>
                  <p style="color: #1e40af; white-space: pre-wrap; margin-bottom: 0;">${photoRequest.informationReport}</p>
                </div>
              `
                  : ''
              }
              
              <!-- Cost Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💰 <strong>Billing:</strong> This photo request fee of <strong>$2.00 USD</strong> will be added to your final shipment invoice.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/packages/${pkg._id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f97316 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Package Details
                </a>
              </div>
              
              <!-- Next Steps -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                <h4 style="color: #1e293b; margin-bottom: 15px;">What's Next?</h4>
                <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
                  <li>Review your package photos and contents</li>
                  <li>Request consolidation with other packages to save on shipping</li>
                  <li>Ship your package when ready</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Fast Shipper - Shop from USA, Deliver to Morocco 🇲🇦
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
                © ${new Date().getFullYear()} Fast Shipper. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Photo request completion email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending photo request completion email:', error);
    return false;
  }
};

/**
 * Send consolidation completion email - NEW FUNCTION
 */
export const sendConsolidationCompleteEmail = async (
  user: IUserDocument,
  consolidation: any,
  resultingPackage: any,
  originalPackages: any[]
): Promise<boolean> => {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      console.log('⚠️ Email transport not available');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Calculate savings
    const separateCost = originalPackages.length * 350; // Estimated MAD per package
    const estimatedConsolidatedCost = 450; // Base consolidation shipping
    const savings = separateCost - estimatedConsolidatedCost;

    const mailOptions = {
      from: `"Fast Shipper" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `📦 Your ${originalPackages.length} Packages Have Been Consolidated!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Consolidation Complete</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #9333ea 0%, #06b6d4 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">📦✨ Consolidation Complete!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your packages have been expertly combined</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #1e293b; margin-bottom: 20px;">
                Hello <strong>${user.name}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                Great news! Your <strong>${originalPackages.length} packages</strong> have been successfully consolidated into one single package. This means easier shipping and significant savings for you!
              </p>
              
              <!-- New Package Card -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #06b6d4; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px; font-size: 18px;">🎁 Your New Consolidated Package</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #475569;">Tracking Number:</td>
                    <td style="padding: 8px 0; color: #0c4a6e; font-weight: 700; font-family: monospace; font-size: 16px;">${resultingPackage.trackingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #475569;">Total Weight:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${resultingPackage.weight.value} ${resultingPackage.weight.unit}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #475569;">Dimensions:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">
                      ${resultingPackage.dimensions.length} × ${resultingPackage.dimensions.width} × ${resultingPackage.dimensions.height} ${resultingPackage.dimensions.unit}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #475569;">Total Value:</td>
                    <td style="padding: 8px 0; color: #059669; font-weight: 700; font-size: 16px;">
                      $${resultingPackage.estimatedValue.amount} ${resultingPackage.estimatedValue.currency}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Original Packages -->
              <div style="margin: 30px 0;">
                <h3 style="color: #1e293b; margin-bottom: 15px;">📋 Original Packages Consolidated:</h3>
                <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                  ${originalPackages
                    .map(
                      (pkg, index) => `
                    <div style="padding: 12px 0; ${index < originalPackages.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                      <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                          <p style="margin: 0; font-weight: 600; color: #1e293b; font-size: 14px;">${pkg.retailer}</p>
                          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">${pkg.description}</p>
                          <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; font-family: monospace;">${pkg.trackingNumber}</p>
                        </div>
                        <div style="text-align: right; padding-left: 15px;">
                          <p style="margin: 0; font-weight: 600; color: #475569; font-size: 14px;">${pkg.weight.value} ${pkg.weight.unit}</p>
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
              
              <!-- Savings Highlight -->
              ${
                savings > 0
                  ? `
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; color: #78350f; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">💰 Estimated Savings</p>
                <p style="margin: 10px 0 0 0; color: #78350f; font-size: 36px; font-weight: 800;">${savings} MAD</p>
                <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">By consolidating vs shipping separately</p>
              </div>
              `
                  : ''
              }
              
              <!-- Protection Info -->
              ${
                consolidation.preferences.addProtection
                  ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  🛡️ <strong>Extra Protection Added:</strong> Your consolidated package includes additional protective packaging for maximum safety during shipping.
                </p>
              </div>
              `
                  : ''
              }
              
              <!-- CTA Buttons -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${frontendUrl}/packages/${resultingPackage._id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #06b6d4 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 0 10px 10px 0; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.25);">
                  View Package Details
                </a>
                <a href="${frontendUrl}/shipping" 
                   style="display: inline-block; background: #10b981; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 0 0 10px 0; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                  Ship Now
                </a>
              </div>
              
              <!-- Next Steps -->
              <div style="border-top: 2px solid #e2e8f0; padding-top: 25px; margin-top: 30px;">
                <h4 style="color: #1e293b; margin-bottom: 15px; font-size: 16px;">📬 What's Next?</h4>
                <ul style="color: #475569; line-height: 1.8; padding-left: 20px; margin: 0;">
                  <li style="margin-bottom: 8px;">Your consolidated package is ready to ship whenever you are</li>
                  <li style="margin-bottom: 8px;">Choose your preferred carrier and shipping method</li>
                  <li style="margin-bottom: 8px;">Track your shipment from USA to Morocco</li>
                  <li>Receive your items within 3-7 business days</li>
                </ul>
              </div>
              
              <!-- Notes -->
              ${
                consolidation.notes
                  ? `
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-top: 25px;">
                <h4 style="color: #1e293b; margin-top: 0; margin-bottom: 10px; font-size: 14px;">📝 Notes from our team:</h4>
                <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${consolidation.notes}</p>
              </div>
              `
                  : ''
              }
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 25px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Fast Shipper - Shop from USA, Deliver to Morocco 🇲🇦
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
                © ${new Date().getFullYear()} Fast Shipper. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Consolidation completion email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending consolidation completion email:', error);
    return false;
  }
};

export default {
  verifyEmailConfig,
  sendWelcomeEmail,
  sendPackageArrivalEmail,
  sendStorageWarningEmail,
  sendShipmentUpdateEmail,
  sendPhotoRequestCompletionEmail,
  sendConsolidationCompleteEmail,
};
