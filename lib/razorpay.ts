/**
 * Razorpay Payment Integration - Production Ready
 * Single payment gateway for BeKaarCool
 */

import Razorpay from "razorpay"
import crypto from "crypto"

// ============================================
// CONFIGURATION
// ============================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || ""
})

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ""

// ============================================
// TYPES
// ============================================

export interface RazorpayOrderInput {
    amount: number // in paise (₹100 = 10000 paise)
    currency?: string
    orderId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    description?: string
    notes?: Record<string, string>
}

export interface RazorpayOrderResult {
    success: boolean
    orderId: string
    razorpayOrderId?: string
    amount?: number
    currency?: string
    keyId?: string
    error?: string
}

export interface RazorpayVerifyInput {
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
}

export interface RazorpayRefundInput {
    paymentId: string
    amount?: number // partial refund in paise, omit for full
    notes?: Record<string, string>
}

// ============================================
// CREATE ORDER
// ============================================

export async function createOrder(
    input: RazorpayOrderInput
): Promise<RazorpayOrderResult> {
    try {
        if (!RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay credentials not configured")
        }

        const order = await razorpay.orders.create({
            amount: input.amount,
            currency: input.currency || "INR",
            receipt: input.orderId,
            notes: {
                customerName: input.customerName,
                customerEmail: input.customerEmail,
                customerPhone: input.customerPhone,
                ...input.notes
            }
        })

        return {
            success: true,
            orderId: input.orderId,
            razorpayOrderId: order.id,
            amount: order.amount as number,
            currency: order.currency as string,
            keyId: RAZORPAY_KEY_ID
        }
    } catch (error: any) {
        console.error("Razorpay createOrder error:", error)
        return {
            success: false,
            orderId: input.orderId,
            error: error.message || "Failed to create payment order"
        }
    }
}

// ============================================
// VERIFY PAYMENT SIGNATURE
// ============================================

export function verifyPayment(input: RazorpayVerifyInput): boolean {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET || ""
        const body = input.razorpayOrderId + "|" + input.razorpayPaymentId

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex")

        return expectedSignature === input.razorpaySignature
    } catch (error) {
        console.error("Razorpay verification error:", error)
        return false
    }
}

// ============================================
// GET PAYMENT DETAILS
// ============================================

export async function getPaymentDetails(paymentId: string) {
    try {
        const payment = await razorpay.payments.fetch(paymentId)
        return {
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                email: payment.email,
                contact: payment.contact,
                createdAt: payment.created_at,
                card: payment.card,
                bank: payment.bank,
                wallet: payment.wallet,
                vpa: payment.vpa
            }
        }
    } catch (error: any) {
        console.error("Razorpay getPayment error:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// REFUND
// ============================================

export async function initiateRefund(
    input: RazorpayRefundInput
): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
        const refundOptions: any = {}

        if (input.amount) {
            refundOptions.amount = input.amount
        }
        if (input.notes) {
            refundOptions.notes = input.notes
        }

        const refund = await razorpay.payments.refund(input.paymentId, refundOptions)

        return {
            success: true,
            refundId: refund.id
        }
    } catch (error: any) {
        console.error("Razorpay refund error:", error)
        return {
            success: false,
            error: error.message || "Failed to process refund"
        }
    }
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret?: string
): boolean {
    try {
        const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || ""

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex")

        return expectedSignature === signature
    } catch (error) {
        console.error("Razorpay webhook verification error:", error)
        return false
    }
}

// ============================================
// SAVE CARD (TOKENIZATION)
// ============================================

export async function createCustomer(
    name: string,
    email: string,
    contact: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
        const customer = await (razorpay.customers as any).create({
            name,
            email,
            contact
        })

        return { success: true, customerId: customer.id }
    } catch (error: any) {
        console.error("Razorpay createCustomer error:", error)
        return { success: false, error: error.message }
    }
}

export async function getCustomerTokens(customerId: string) {
    try {
        const tokens = await (razorpay.customers as any).fetchTokens(customerId)
        return { success: true, tokens: tokens.items || [] }
    } catch (error: any) {
        console.error("Razorpay getTokens error:", error)
        return { success: false, tokens: [], error: error.message }
    }
}

export async function deleteCustomerToken(customerId: string, tokenId: string) {
    try {
        await (razorpay.customers as any).deleteToken(customerId, tokenId)
        return { success: true }
    } catch (error: any) {
        console.error("Razorpay deleteToken error:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// CLIENT-SIDE OPTIONS
// ============================================

export function getCheckoutOptions(
    orderResult: RazorpayOrderResult,
    customerInfo: { name: string; email: string; phone: string },
    callbacks: {
        onSuccess: (response: any) => void
        onDismiss?: () => void
    }
) {
    return {
        key: RAZORPAY_KEY_ID,
        amount: orderResult.amount,
        currency: orderResult.currency || "INR",
        name: "BeKaarCool",
        description: "Fashion that speaks",
        image: "/logo.png",
        order_id: orderResult.razorpayOrderId,
        handler: callbacks.onSuccess,
        prefill: {
            name: customerInfo.name,
            email: customerInfo.email,
            contact: customerInfo.phone
        },
        theme: {
            color: "#FACC15" // Yellow theme
        },
        modal: {
            ondismiss: callbacks.onDismiss,
            confirm_close: true
        }
    }
}

// ============================================
// EXPORT DEFAULT SERVICE
// ============================================

const RazorpayService = {
    createOrder,
    verifyPayment,
    getPaymentDetails,
    initiateRefund,
    verifyWebhookSignature,
    createCustomer,
    getCustomerTokens,
    deleteCustomerToken,
    getCheckoutOptions,
    RAZORPAY_KEY_ID
}

export default RazorpayService
