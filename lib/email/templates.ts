/**
 * Email Templates
 * Reusable HTML email templates with consistent Baefikra branding
 */

import { formatCurrency } from "@/lib/utils";
import { env } from "@/lib/env";

const BASE_URL = env.NEXTAUTH_URL || "https://baefikra.com";
const BRAND_COLOR = "#FACC15";
const BRAND_NAME = "Baefikra";
const LOGO_URL = `${BASE_URL}/logo.png`; // Assuming logo is at public/logo.png
const COMPANY_NAME = "Baefikra";
const SUPPORT_EMAIL = env.SUPPORT_EMAIL || "support@baefikra.com";

// ============================================
// SHARED LAYOUT
// ============================================

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: ${BRAND_COLOR}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">${BRAND_NAME}</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Fashion that speaks</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">
        This email was sent by ${BRAND_NAME}. If you have any questions, please contact us at
        <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLOR};">${SUPPORT_EMAIL}</a>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function primaryButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #eab308 100%); color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 15px;">
        ${text}
      </a>
    </div>`;
}

// ============================================
// TEMPLATES
// ============================================

export interface EmailTemplate {
  subject: string;
  html: string;
}

// --- Welcome ---
export function welcomeEmail(name: string): EmailTemplate {
  return {
    subject: `Welcome to ${BRAND_NAME}! 🎉`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Welcome, ${name}!</h2>
      <p style="color: #475569; line-height: 1.6;">Thank you for joining ${BRAND_NAME}. We're excited to have you on board!</p>
      <p style="color: #475569; line-height: 1.6;">Explore our curated collection of custom-designed products, created just for you.</p>
      ${primaryButton("Start Shopping", `${BASE_URL}/products`)}
      <p style="color: #94a3b8; font-size: 13px;">Need help? Reply to this email or reach out at ${SUPPORT_EMAIL}.</p>
    `),
  };
}

// --- Email Verification ---
export function verificationEmail(name: string, token: string): EmailTemplate {
  const verificationUrl = `${BASE_URL}/auth/verify?token=${token}`;
  return {
    subject: `Verify your ${BRAND_NAME} account`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Verify your email</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, please click the button below to verify your email address:</p>
      ${primaryButton("Verify Email Address", verificationUrl)}
      <p style="color: #475569; font-size: 13px;">Or copy this link: <a href="${verificationUrl}" style="color: ${BRAND_COLOR}; word-break: break-all;">${verificationUrl}</a></p>
      <p style="color: #94a3b8; font-size: 13px;">This link expires in 24 hours.</p>
      <p style="color: #94a3b8; font-size: 13px;">If you didn't create this account, you can safely ignore this email.</p>
    `),
  };
}

// --- Password Reset ---
export function passwordResetEmail(name: string, token: string): EmailTemplate {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;
  return {
    subject: `Reset your ${BRAND_NAME} password`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Password Reset Request</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we received a request to reset your password. Click the button below:</p>
      ${primaryButton("Reset Password", resetUrl)}
      <p style="color: #475569; font-size: 13px;">Or copy this link: <a href="${resetUrl}" style="color: ${BRAND_COLOR}; word-break: break-all;">${resetUrl}</a></p>
      <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour.</p>
      <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    `),
  };
}

// --- Order Confirmation ---
export function orderConfirmationEmail(
  name: string,
  order: any,
): EmailTemplate {
  const orderUrl = `${BASE_URL}/orders/${order._id}`;

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; color: #334155;">
          ${item.name || item.product?.name || "Product"}
          ${item.size ? `<br><span style="color: #94a3b8; font-size: 12px;">Size: ${item.size}</span>` : ""}
          ${item.color ? `<span style="color: #94a3b8; font-size: 12px;"> | Color: ${item.color}</span>` : ""}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #334155; font-weight: 600;">₹${item.price}</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Order Confirmed! ✅</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, thank you for your order! Here are the details:</p>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong style="color: #1e293b;">Order Number:</strong> <span style="color: #475569;">${order.orderNumber}</span></p>
        <p style="margin: 0 0 8px;"><strong style="color: #1e293b;">Date:</strong> <span style="color: #475569;">${new Date(order.createdAt).toLocaleDateString("en-IN")}</span></p>
        <p style="margin: 0;"><strong style="color: #1e293b;">Total:</strong> <span style="color: ${BRAND_COLOR}; font-weight: 700; font-size: 18px;">₹${order.total}</span></p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 10px 8px; text-align: left; font-size: 13px; color: #64748b; text-transform: uppercase;">Item</th>
            <th style="padding: 10px 8px; text-align: center; font-size: 13px; color: #64748b; text-transform: uppercase;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; font-size: 13px; color: #64748b; text-transform: uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${primaryButton("View Order", orderUrl)}
      <p style="color: #94a3b8; font-size: 13px;">We'll send you a shipping notification with tracking information once your order ships.</p>
    `),
  };
}

// --- Order Status Update ---
export function orderStatusUpdateEmail(
  name: string,
  order: any,
  newStatus: string,
): EmailTemplate {
  const orderUrl = `${BASE_URL}/orders/${order._id}`;

  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is currently being processed.",
    shipped: "Great news! Your order has been shipped. 🚚",
    out_for_delivery: "Your order is out for delivery! 📦",
    delivered: "Your order has been delivered successfully. ✅",
    cancelled: "Your order has been cancelled.",
    returned: "Your return has been processed.",
    refunded: "Your refund has been processed.",
  };

  const message =
    statusMessages[newStatus] || "Your order status has been updated.";

  return {
    subject: `Order Update — ${order.orderNumber}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Order Update</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, ${message}</p>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong style="color: #1e293b;">Order Number:</strong> <span style="color: #475569;">${order.orderNumber}</span></p>
        <p style="margin: 0 0 8px;"><strong style="color: #1e293b;">Status:</strong> <span style="color: ${BRAND_COLOR}; text-transform: capitalize; font-weight: 600;">${newStatus.replace(/_/g, " ")}</span></p>
        ${order.trackingNumber || order.shipment?.awbNumber ? `<p style="margin: 0;"><strong style="color: #1e293b;">Tracking:</strong> <span style="color: #475569;">${order.trackingNumber || order.shipment?.awbNumber}</span></p>` : ""}
      </div>

      ${primaryButton("View Order", orderUrl)}
    `),
  };
}

// --- Shipping Notification ---
export function shippingNotificationEmail(
  name: string,
  order: any,
  trackingNumber: string,
  trackingUrl: string,
): EmailTemplate {
  return {
    subject: `Your order ${order.orderNumber} has shipped! 🚚`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Your order is on its way!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, great news! Your order has been shipped.</p>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong style="color: #1e293b;">Order Number:</strong> <span style="color: #475569;">${order.orderNumber}</span></p>
        <p style="margin: 0 0 8px;"><strong style="color: #1e293b;">Tracking Number:</strong> <span style="color: ${BRAND_COLOR}; font-weight: 600;">${trackingNumber}</span></p>
        ${order.estimatedDelivery ? `<p style="margin: 0;"><strong style="color: #1e293b;">ETA:</strong> <span style="color: #475569;">${new Date(order.estimatedDelivery).toLocaleDateString("en-IN")}</span></p>` : ""}
      </div>

      ${primaryButton("Track Your Order", trackingUrl)}
    `),
  };
}

// --- Payment Failed ---
export function paymentFailedEmail(name: string, order: any): EmailTemplate {
  return {
    subject: `Payment failed for order ${order.orderNumber}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Payment Failed</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, unfortunately, the payment for your order could not be processed.</p>

      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
        <p style="margin: 0 0 8px;"><strong style="color: #991b1b;">Order Number:</strong> <span style="color: #7f1d1d;">${order.orderNumber}</span></p>
        <p style="margin: 0;"><strong style="color: #991b1b;">Amount:</strong> <span style="color: #7f1d1d;">₹${order.total}</span></p>
      </div>

      <p style="color: #475569; line-height: 1.6;">You can try placing the order again with a different payment method.</p>
      ${primaryButton("Retry Payment", `${BASE_URL}/checkout`)}
    `),
  };
}

// --- Refund Processed ---
export function refundProcessedEmail(
  name: string,
  order: any,
  amount: number,
): EmailTemplate {
  return {
    subject: `Refund processed — ${order.orderNumber}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Refund Processed ✅</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, your refund has been processed successfully.</p>

      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0 0 8px;"><strong style="color: #166534;">Order Number:</strong> <span style="color: #15803d;">${order.orderNumber}</span></p>
        <p style="margin: 0;"><strong style="color: #166534;">Refund Amount:</strong> <span style="color: #15803d; font-weight: 700; font-size: 18px;">₹${amount}</span></p>
      </div>

      <p style="color: #475569; line-height: 1.6;">The refund will be credited to your original payment method within 5-7 business days.</p>
      ${primaryButton("View Order", `${BASE_URL}/orders/${order._id}`)}
    `),
  };
}

// --- Support Ticket ---
export function supportTicketEmail(ticket: any): {
  customerEmail: EmailTemplate;
  supportEmail: EmailTemplate;
} {
  const ticketUrl = `${BASE_URL}/support/tickets/${ticket._id}`;

  const categoryLabels: Record<string, string> = {
    order: "Order Issue",
    product: "Product Issue",
    payment: "Payment Issue",
    shipping: "Shipping Issue",
    account: "Account Issue",
    technical: "Technical Issue",
    other: "Other",
  };

  return {
    customerEmail: {
      subject: `Support Ticket Created — ${ticket.ticketNumber}`,
      html: emailLayout(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">Support Ticket Created</h2>
        <p style="color: #475569; line-height: 1.6;">Hi ${ticket.user?.name}, we've received your support ticket and our team will review it shortly.</p>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
          <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${ticket.subject}</p>
          <p style="margin: 0;"><strong>Category:</strong> ${categoryLabels[ticket.category] || ticket.category}</p>
        </div>

        ${primaryButton("View Ticket", ticketUrl)}
        <p style="color: #94a3b8; font-size: 13px;">We aim to respond within 24 hours. Keep ticket number <strong>${ticket.ticketNumber}</strong> for reference.</p>
      `),
    },
    supportEmail: {
      subject: `New Support Ticket — ${ticket.ticketNumber}`,
      html: emailLayout(`
        <h2 style="color: #1e293b; margin: 0 0 16px;">New Support Ticket</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
          <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${ticket.user?.name} (${ticket.user?.email})</p>
          <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${ticket.subject}</p>
          <p style="margin: 0 0 8px;"><strong>Category:</strong> ${categoryLabels[ticket.category] || ticket.category}</p>
          <p style="margin: 0;"><strong>Priority:</strong> <span style="text-transform: capitalize; font-weight: 600;">${ticket.priority}</span></p>
        </div>
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
          <h3 style="margin: 0 0 8px; color: #1e293b;">Description:</h3>
          <p style="color: #475569; white-space: pre-wrap;">${ticket.description}</p>
        </div>
        ${primaryButton("View Ticket", ticketUrl)}
      `),
    },
  };
}

// ============================================
// NEW AUTHENTICATION & ACCOUNT TEMPLATES
// ============================================

// --- Login Alert ---
export function loginAlertEmail(name: string, device: string, location: string, time: string): EmailTemplate {
  return {
    subject: `New login to your ${BRAND_NAME} account`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">New Login Alert</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we noticed a new login to your account from an unrecognized device.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Device:</strong> ${device}</p>
        <p style="margin: 0 0 8px;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 0;"><strong>Time:</strong> ${time}</p>
      </div>
      <p style="color: #475569; line-height: 1.6;">If this was you, you can safely ignore this email. If you don't recognize this activity, please reset your password immediately.</p>
      ${primaryButton("Secure My Account", `${BASE_URL}/auth/forgot-password`)}
    `),
  };
}

// --- Password Changed ---
export function passwordChangedEmail(name: string): EmailTemplate {
  return {
    subject: `Your ${BRAND_NAME} password has been changed`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Password Changed Successfully</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, your account password was recently updated.</p>
      <p style="color: #475569; line-height: 1.6;">If you made this change, no further action is required.</p>
      <p style="color: #475569; line-height: 1.6;">If you did not make this change, please contact support immediately to secure your account.</p>
      ${primaryButton("Contact Support", `mailto:${SUPPORT_EMAIL}`)}
    `),
  };
}

// --- Account Locked ---
export function accountLockedEmail(name: string, unlockTime: string): EmailTemplate {
  return {
    subject: `Security Alert: Your ${BRAND_NAME} account has been temporarily locked`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Account Temporarily Locked</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, due to multiple failed login attempts, your account has been temporarily locked for your security.</p>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
        <p style="margin: 0; color: #991b1b;">Your account will automatically unlock at: <strong>${unlockTime}</strong></p>
      </div>
      <p style="color: #475569; line-height: 1.6;">If you forgot your password, you can reset it below.</p>
      ${primaryButton("Reset Password", `${BASE_URL}/auth/forgot-password`)}
    `),
  };
}

// --- Account Deletion ---
export function accountDeletionEmail(name: string): EmailTemplate {
  return {
    subject: `Your ${BRAND_NAME} account has been deleted`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Account Deletion Confirmed</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, your request to delete your account has been processed. All associated personal data has been securely removed from our systems.</p>
      <p style="color: #475569; line-height: 1.6;">We're sorry to see you go! If you ever wish to return, you can always create a new account.</p>
      ${primaryButton("Return to Shop", `${BASE_URL}/`)}
    `),
  };
}

// --- Profile Updated ---
export function profileUpdatedEmail(name: string): EmailTemplate {
  return {
    subject: `Your ${BRAND_NAME} profile has been updated`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Profile Updated</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, the personal information on your profile was recently updated.</p>
      <p style="color: #475569; line-height: 1.6;">If you made this change, no further action is required. If you did not authorize this change, please secure your account.</p>
      ${primaryButton("View Profile", `${BASE_URL}/account/profile`)}
    `),
  };
}

// --- Address Updated ---
export function addressUpdatedEmail(name: string, action: 'added' | 'updated' | 'removed', addressType: string): EmailTemplate {
  return {
    subject: `Address ${action} on your ${BRAND_NAME} account`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Address Book Updated</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, a ${addressType} address was recently ${action} in your account address book.</p>
      <p style="color: #475569; line-height: 1.6;">Please review your saved addresses to ensure everything is correct before your next order.</p>
      ${primaryButton("Manage Addresses", `${BASE_URL}/account/addresses`)}
    `),
  };
}

// --- Payment Method Updated ---
export function paymentMethodUpdatedEmail(name: string, action: 'added' | 'removed', methodInfo: string): EmailTemplate {
  return {
    subject: `Payment method ${action} on your ${BRAND_NAME} account`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Payment Methods Updated</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, a payment method ending in <strong>${methodInfo}</strong> was recently ${action} on your account.</p>
      <p style="color: #475569; line-height: 1.6;">If you made this change, no action is needed.</p>
    `),
  };
}

// --- Account Activity ---
export function accountActivityEmail(name: string, activityDescription: string): EmailTemplate {
  return {
    subject: `Recent activity on your ${BRAND_NAME} account`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Account Activity Notice</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we noticed the following recent activity on your account:</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_COLOR};">
        <p style="margin: 0; color: #1e293b; font-weight: 500;">${activityDescription}</p>
      </div>
      <p style="color: #475569; line-height: 1.6;">If you performed this action, please safely ignore this email.</p>
    `),
  };
}
// ============================================
// NEW ORDERS & SHIPPING TEMPLATES
// ============================================

export function paymentSuccessEmail(name: string, order: any): EmailTemplate {
  return {
    subject: `Payment Successful! Order ${order.orderNumber} is confirmed`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Payment Successful ✅</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we have successfully received your payment of <strong>₹${order.total}</strong>.</p>
      <p style="color: #475569; line-height: 1.6;">Your order is now confirmed and is being prepared for shipment.</p>
      ${primaryButton("View Order Details", `${BASE_URL}/account/orders/${order._id}`)}
    `),
  };
}

export function orderProcessingEmail(name: string, order: any): EmailTemplate {
  return {
    subject: `Your order ${order.orderNumber} is now being processed`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Order is Processing ⚙️</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, good news! We have started processing your order.</p>
      <p style="color: #475569; line-height: 1.6;">Our team is currently quality-checking and packing your items. We'll send you another email as soon as it ships.</p>
      ${primaryButton("Check Status", `${BASE_URL}/account/orders/${order._id}`)}
    `),
  };
}

export function outForDeliveryEmail(name: string, order: any): EmailTemplate {
  return {
    subject: `Your order ${order.orderNumber} is OUT FOR DELIVERY today!`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Out for Delivery 📦💨</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, get ready! Your order is on the styling vehicle and out for delivery today.</p>
      <p style="color: #475569; line-height: 1.6;">Please make sure someone is available at your shipping address to receive the package.</p>
      ${primaryButton("Track Delivery", order.shipment?.trackingUrl || `${BASE_URL}/account/orders/${order._id}`)}
    `),
  };
}

export function orderDeliveredEmail(name: string, order: any): EmailTemplate {
  return {
    subject: `Delivered! Enjoy your new items from ${BRAND_NAME}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Package Delivered! 🛍️</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, your order has been successfully delivered to your address.</p>
      <p style="color: #475569; line-height: 1.6;">We hope you love your new pieces! If you have any issues, please don't hesitate to contact our support team.</p>
      ${primaryButton("Review Your Items", `${BASE_URL}/account/orders/${order._id}`)}
    `),
  };
}

export function deliveryDelayEmail(name: string, order: any, newEta: string): EmailTemplate {
  return {
    subject: `Update on your ${BRAND_NAME} order ${order.orderNumber}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Delivery Update ⚠️</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we wanted to let you know that there is a slight delay with your delivery.</p>
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
        <p style="margin: 0; color: #92400e;">Your new estimated delivery date is: <strong>${newEta}</strong></p>
      </div>
      <p style="color: #475569; line-height: 1.6;">We apologize for the inconvenience and appreciate your patience.</p>
    `),
  };
}

export function deliveryAttemptFailedEmail(name: string, order: any): EmailTemplate {
  return {
    subject: `Delivery Attempt Failed for Order ${order.orderNumber}`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Missed Delivery 🚪</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, our courier tried to deliver your package today but was unsuccessful.</p>
      <p style="color: #475569; line-height: 1.6;">They will typically attempt delivery again on the next business day. Please reach out to the courier using your tracking link if you need to reschedule.</p>
      ${primaryButton("Track Package", order.shipment?.trackingUrl || `${BASE_URL}/account/orders/${order._id}`)}
    `),
  };
}

export function deliveryCompletedEmail(name: string, order: any): EmailTemplate {
  return orderDeliveredEmail(name, order); // Alias for consistency
}


// ============================================
// NEW CART & CONVERSION TEMPLATES
// ============================================

export function abandonedCartEmail(name: string, cartUrl: string): EmailTemplate {
  return {
    subject: `You left some great items behind, ${name}!`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Did you forget something? 🛒</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we noticed you left some amazing items in your shopping cart.</p>
      <p style="color: #475569; line-height: 1.6;">Complete your purchase now before they sell out!</p>
      ${primaryButton("Return to Cart", cartUrl)}
    `),
  };
}

export function cartDiscountEmail(name: string, discountCode: string, cartUrl: string): EmailTemplate {
  return {
    subject: `Here's a special discount to complete your order! 🎁`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">A gift just for you!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, those items in your cart are calling your name. Use the promo code below for a special discount on us.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed ${BRAND_COLOR};">
        <h3 style="margin: 0; color: #1e293b; font-size: 24px; letter-spacing: 2px;">${discountCode}</h3>
      </div>
      ${primaryButton("Checkout Now", cartUrl)}
    `),
  };
}

export function priceDropEmail(name: string, product: any, productUrl: string): EmailTemplate {
  return {
    subject: `Price drop alert! An item you liked is on sale 📉`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Alert: Price Drop!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, an item you recently viewed or added to your wishlist has just dropped in price!</p>
      <p style="color: #475569; line-height: 1.6;"><strong>${product?.name || "The product"}</strong> is now available at a lower price.</p>
      ${primaryButton("Shop the Sale", productUrl)}
    `),
  };
}

export function backInStockEmail(name: string, product: any, productUrl: string): EmailTemplate {
  return {
    subject: `Good News! ${product?.name || 'Your item'} is back in stock! ✨`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Back In Stock 🎉</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, the wait is over! An item you were waiting for has just been restocked.</p>
      <p style="color: #475569; line-height: 1.6;"><strong>${product?.name || "The product"}</strong> is now available. Grab it before it sells out again!</p>
      ${primaryButton("Shop Now", productUrl)}
    `),
  };
}


// ============================================
// NEW MARKETING TEMPLATES
// ============================================

export function promotionalEmail(name: string, campaignDetails: string, ctaUrl: string): EmailTemplate {
  return {
    subject: `Special Offer from ${BRAND_NAME}!`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Exclusive Offer Inside</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we've got something special for you.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #1e293b; font-size: 16px;">${campaignDetails}</p>
      </div>
      ${primaryButton("Explore Now", ctaUrl)}
    `),
  };
}

export function flashSaleEmail(name: string, saleDetails: string, ctaUrl: string): EmailTemplate {
  return {
    subject: `⚡ FLASH SALE is Live! Hurry, ${name}!`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Flash Sale Active! ⚡</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, our highly anticipated Flash Sale has just begun!</p>
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
        <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 16px;">${saleDetails}</p>
      </div>
      <p style="color: #475569; line-height: 1.6;">Prices like these won't last long. Shop while supplies last.</p>
      ${primaryButton("Shop the Sale", ctaUrl)}
    `),
  };
}

export function productLaunchEmail(name: string, productDetails: string, productUrl: string): EmailTemplate {
  return {
    subject: `Introducing the newest drop from ${BRAND_NAME} 🔥`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">New Arrival Alert!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, be the first to check out our newest collection.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #1e293b;">${productDetails}</p>
      </div>
      ${primaryButton("See What's New", productUrl)}
    `),
  };
}

export function personalizedRecommendationsEmail(name: string, recommendationsUrl: string): EmailTemplate {
  return {
    subject: `Hand-picked for you, ${name} 🌟`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Top Picks Just For You</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, based on your recent activity, we've curated a selection of items we think you'll absolute love.</p>
      ${primaryButton("View Your Recommendations", recommendationsUrl)}
    `),
  };
}


// ============================================
// NEW LOYALTY & REFERRAL TEMPLATES
// ============================================

export function referralInvitationEmail(name: string, referrerName: string, referralUrl: string): EmailTemplate {
  return {
    subject: `${referrerName} has invited you to join ${BRAND_NAME} 🤝`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">You've Been Invited!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, your friend <strong>${referrerName}</strong> thinks you'd love ${BRAND_NAME}!</p>
      <p style="color: #475569; line-height: 1.6;">Click the link below to accept their invite and get a special welcome bonus on your first order.</p>
      ${primaryButton("Accept Invitation", referralUrl)}
    `),
  };
}

export function referralRewardEmail(name: string, rewardAmount: string): EmailTemplate {
  return {
    subject: `You've earned a reward! Thank you for sharing ${BRAND_NAME} 🏆`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Reward Unlocked!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, someone you referred just completed their first purchase!</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <p style="margin: 0; color: #166534; font-weight: 600; font-size: 16px;">You have earned: ${rewardAmount}</p>
      </div>
      <p style="color: #475569; line-height: 1.6;">Thank you for spreading the word about us.</p>
      ${primaryButton("Spend Your Reward", `${BASE_URL}/`)}
    `),
  };
}

export function loyaltyPointsUpdateEmail(name: string, pointsAdded: number, totalPoints: number): EmailTemplate {
  return {
    subject: `You just earned ${pointsAdded} loyalty points! ✨`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Points Added!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, you've successfully earned <strong>${pointsAdded}</strong> points from your recent activity.</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_COLOR};">
        <p style="margin: 0; color: #1e293b; font-size: 16px;">Your new total balance is: <strong>${totalPoints} points</strong></p>
      </div>
      ${primaryButton("View Rewards", `${BASE_URL}/account/rewards`)}
    `),
  };
}

export function loyaltyPointsExpiryEmail(name: string, pointsExpiring: number, expiryDate: string): EmailTemplate {
  return {
    subject: `Action Required: Your ${BRAND_NAME} points are expiring soon ⏰`,
    html: emailLayout(`
      <h2 style="color: #1e293b; margin: 0 0 16px;">Points Expiring Soon!</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${name}, we wanted to remind you that some of your loyalty points are about to expire.</p>
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
        <p style="margin: 0; color: #92400e;"><strong>${pointsExpiring} points</strong> will expire on <strong>${expiryDate}</strong>.</p>
      </div>
      <p style="color: #475569; line-height: 1.6;">Don't let them go to waste! Redeem them now on your next purchase.</p>
      ${primaryButton("Redeem Points Now", `${BASE_URL}/`)}
    `),
  };
}
