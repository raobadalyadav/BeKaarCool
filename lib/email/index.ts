/**
 * Email Service - Unified API
 * All email sending goes through this module.
 * Emails are queued via Redis for reliable delivery.
 * Use `immediate: true` for critical emails (OTP, password reset).
 */

import { sendEmail } from "./resend"
import { enqueueEmail } from "./queue"
import {
    verificationEmail,
    passwordResetEmail,
    orderConfirmationEmail,
    orderStatusUpdateEmail,
    shippingNotificationEmail,
    paymentFailedEmail,
    refundProcessedEmail,
    supportTicketEmail,
    welcomeEmail,
} from "./templates"

// Re-export for convenience
export { processEmailQueue, getQueueStats, retryFailedEmails } from "./queue"
export type { EmailJob } from "./queue"
export type { EmailPayload, EmailResult } from "./resend"

// ============================================
// HELPERS
// ============================================

interface SendOptions {
    immediate?: boolean
}

async function send(
    to: string,
    template: { subject: string; html: string },
    templateName: string,
    metadata?: Record<string, any>,
    options?: SendOptions
) {
    const payload = {
        to,
        subject: template.subject,
        html: template.html,
        templateName,
        metadata,
    }

    if (options?.immediate) {
        return sendEmail(payload)
    }

    return enqueueEmail(payload)
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

export async function sendWelcomeEmail(email: string, name: string) {
    const template = welcomeEmail(name)
    return send(email, template, "welcome", { name })
}

export async function sendVerificationEmail(
    email: string,
    name: string,
    token: string
) {
    const template = verificationEmail(name, token)
    // OTP/verification emails should be sent immediately
    return send(email, template, "verification", { name }, { immediate: true })
}

export async function sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
) {
    const template = passwordResetEmail(name, token)
    // Password reset is time-sensitive, send immediately
    return send(email, template, "password_reset", { name }, { immediate: true })
}

export async function sendOrderConfirmationEmail(
    email: string,
    name: string,
    order: any
) {
    const template = orderConfirmationEmail(name, order)
    return send(email, template, "order_confirmation", {
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
    })
}

export async function sendOrderStatusUpdateEmail(
    email: string,
    name: string,
    order: any,
    newStatus: string
) {
    const template = orderStatusUpdateEmail(name, order, newStatus)
    return send(email, template, "order_status_update", {
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
        status: newStatus,
    })
}

export async function sendShippingNotificationEmail(
    email: string,
    name: string,
    order: any,
    trackingNumber: string,
    trackingUrl: string
) {
    const template = shippingNotificationEmail(name, order, trackingNumber, trackingUrl)
    return send(email, template, "shipping_notification", {
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
        trackingNumber,
    })
}

export async function sendPaymentFailedEmail(
    email: string,
    name: string,
    order: any
) {
    const template = paymentFailedEmail(name, order)
    return send(email, template, "payment_failed", {
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
    })
}

export async function sendRefundProcessedEmail(
    email: string,
    name: string,
    order: any,
    amount: number
) {
    const template = refundProcessedEmail(name, order, amount)
    return send(email, template, "refund_processed", {
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
        amount,
    })
}

export async function sendSupportTicketEmail(ticket: any) {
    const templates = supportTicketEmail(ticket)

    const results = await Promise.all([
        // Customer confirmation
        ticket.user?.email
            ? send(
                  ticket.user.email,
                  templates.customerEmail,
                  "support_ticket_customer",
                  { ticketNumber: ticket.ticketNumber }
              )
            : Promise.resolve({ success: false, error: "No customer email" }),

        // Support team notification
        process.env.SUPPORT_EMAIL
            ? send(
                  process.env.SUPPORT_EMAIL,
                  templates.supportEmail,
                  "support_ticket_team",
                  { ticketNumber: ticket.ticketNumber }
              )
            : Promise.resolve({ success: false, error: "No support email configured" }),
    ])

    return results
}
