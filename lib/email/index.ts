/**
 * Email Service - Unified API
 * All email sending goes through this module.
 * Emails are queued via Redis for reliable delivery.
 * Use `immediate: true` for critical emails (OTP, password reset).
 */

import { sendEmail } from "./resend"
import { enqueueEmail } from "./queue"
import { env } from "@/lib/env"
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
    loginAlertEmail,
    passwordChangedEmail,
    accountLockedEmail,
    accountDeletionEmail,
    profileUpdatedEmail,
    addressUpdatedEmail,
    paymentMethodUpdatedEmail,
    accountActivityEmail,
    paymentSuccessEmail,
    orderProcessingEmail,
    outForDeliveryEmail,
    orderDeliveredEmail,
    deliveryDelayEmail,
    deliveryAttemptFailedEmail,
    deliveryCompletedEmail,
    abandonedCartEmail,
    cartDiscountEmail,
    priceDropEmail,
    backInStockEmail,
    promotionalEmail,
    flashSaleEmail,
    productLaunchEmail,
    personalizedRecommendationsEmail,
    referralInvitationEmail,
    referralRewardEmail,
    loyaltyPointsUpdateEmail,
    loyaltyPointsExpiryEmail,
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
        env.SUPPORT_EMAIL
            ? send(
                  env.SUPPORT_EMAIL,
                  templates.supportEmail,
                  "support_ticket_team",
                  { ticketNumber: ticket.ticketNumber }
              )
            : Promise.resolve({ success: false, error: "No support email configured" }),
    ])

    return results
}

// ============================================
// NEW AUTHENTICATION & ACCOUNT SENDERS
// ============================================

export async function sendLoginAlertEmail(email: string, name: string, device: string, location: string, time: string) {
    const template = loginAlertEmail(name, device, location, time)
    return send(email, template, "login_alert", { name }, { immediate: true })
}

export async function sendPasswordChangedEmail(email: string, name: string) {
    const template = passwordChangedEmail(name)
    return send(email, template, "password_changed", { name }, { immediate: true })
}

export async function sendAccountLockedEmail(email: string, name: string, unlockTime: string) {
    const template = accountLockedEmail(name, unlockTime)
    return send(email, template, "account_locked", { name }, { immediate: true })
}

export async function sendAccountDeletionEmail(email: string, name: string) {
    const template = accountDeletionEmail(name)
    return send(email, template, "account_deletion", { name }, { immediate: true })
}

export async function sendProfileUpdatedEmail(email: string, name: string) {
    const template = profileUpdatedEmail(name)
    return send(email, template, "profile_updated", { name })
}

export async function sendAddressUpdatedEmail(email: string, name: string, action: 'added' | 'updated' | 'removed', addressType: string) {
    const template = addressUpdatedEmail(name, action, addressType)
    return send(email, template, "address_updated", { name })
}

export async function sendPaymentMethodUpdatedEmail(email: string, name: string, action: 'added' | 'removed', methodInfo: string) {
    const template = paymentMethodUpdatedEmail(name, action, methodInfo)
    return send(email, template, "payment_method_updated", { name })
}

export async function sendAccountActivityEmail(email: string, name: string, activityDescription: string) {
    const template = accountActivityEmail(name, activityDescription)
    return send(email, template, "account_activity", { name })
}

// ============================================
// NEW ORDERS & SHIPPING SENDERS
// ============================================

export async function sendPaymentSuccessEmail(email: string, name: string, order: any) {
    const template = paymentSuccessEmail(name, order)
    return send(email, template, "payment_success", { orderId: order._id?.toString() })
}

export async function sendOrderProcessingEmail(email: string, name: string, order: any) {
    const template = orderProcessingEmail(name, order)
    return send(email, template, "order_processing", { orderId: order._id?.toString() })
}

export async function sendOutForDeliveryEmail(email: string, name: string, order: any) {
    const template = outForDeliveryEmail(name, order)
    return send(email, template, "out_for_delivery", { orderId: order._id?.toString() })
}

export async function sendOrderDeliveredEmail(email: string, name: string, order: any) {
    const template = orderDeliveredEmail(name, order)
    return send(email, template, "order_delivered", { orderId: order._id?.toString() })
}

export async function sendDeliveryDelayEmail(email: string, name: string, order: any, newEta: string) {
    const template = deliveryDelayEmail(name, order, newEta)
    return send(email, template, "delivery_delay", { orderId: order._id?.toString() })
}

export async function sendDeliveryAttemptFailedEmail(email: string, name: string, order: any) {
    const template = deliveryAttemptFailedEmail(name, order)
    return send(email, template, "delivery_attempt_failed", { orderId: order._id?.toString() })
}

export async function sendDeliveryCompletedEmail(email: string, name: string, order: any) {
    const template = deliveryCompletedEmail(name, order)
    return send(email, template, "delivery_completed", { orderId: order._id?.toString() })
}

// ============================================
// NEW CART & CONVERSION SENDERS
// ============================================

export async function sendAbandonedCartEmail(email: string, name: string, cartUrl: string) {
    const template = abandonedCartEmail(name, cartUrl)
    return send(email, template, "abandoned_cart", { name })
}

export async function sendCartDiscountEmail(email: string, name: string, discountCode: string, cartUrl: string) {
    const template = cartDiscountEmail(name, discountCode, cartUrl)
    return send(email, template, "cart_discount", { name })
}

export async function sendPriceDropEmail(email: string, name: string, product: any, productUrl: string) {
    const template = priceDropEmail(name, product, productUrl)
    return send(email, template, "price_drop", { productId: product?._id?.toString() })
}

export async function sendBackInStockEmail(email: string, name: string, product: any, productUrl: string) {
    const template = backInStockEmail(name, product, productUrl)
    return send(email, template, "back_in_stock", { productId: product?._id?.toString() })
}

// ============================================
// NEW MARKETING SENDERS
// ============================================

export async function sendPromotionalEmail(email: string, name: string, campaignDetails: string, ctaUrl: string) {
    const template = promotionalEmail(name, campaignDetails, ctaUrl)
    return send(email, template, "promotional", { name })
}

export async function sendFlashSaleEmail(email: string, name: string, saleDetails: string, ctaUrl: string) {
    const template = flashSaleEmail(name, saleDetails, ctaUrl)
    return send(email, template, "flash_sale", { name })
}

export async function sendProductLaunchEmail(email: string, name: string, productDetails: string, productUrl: string) {
    const template = productLaunchEmail(name, productDetails, productUrl)
    return send(email, template, "product_launch", { name })
}

export async function sendPersonalizedRecommendationsEmail(email: string, name: string, recommendationsUrl: string) {
    const template = personalizedRecommendationsEmail(name, recommendationsUrl)
    return send(email, template, "personalized_recommendations", { name })
}

// ============================================
// NEW LOYALTY & REFERRAL SENDERS
// ============================================

export async function sendReferralInvitationEmail(email: string, name: string, referrerName: string, referralUrl: string) {
    const template = referralInvitationEmail(name, referrerName, referralUrl)
    return send(email, template, "referral_invitation", { name, referrerName })
}

export async function sendReferralRewardEmail(email: string, name: string, rewardAmount: string) {
    const template = referralRewardEmail(name, rewardAmount)
    return send(email, template, "referral_reward", { name })
}

export async function sendLoyaltyPointsUpdateEmail(email: string, name: string, pointsAdded: number, totalPoints: number) {
    const template = loyaltyPointsUpdateEmail(name, pointsAdded, totalPoints)
    return send(email, template, "loyalty_points_update", { name })
}

export async function sendLoyaltyPointsExpiryEmail(email: string, name: string, pointsExpiring: number, expiryDate: string) {
    const template = loyaltyPointsExpiryEmail(name, pointsExpiring, expiryDate)
    return send(email, template, "loyalty_points_expiry", { name })
}
