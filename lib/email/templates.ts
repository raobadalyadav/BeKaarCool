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
