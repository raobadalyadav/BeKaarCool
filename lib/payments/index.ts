/**
 * Payment Gateway - Razorpay Only
 * Production-ready single payment provider
 */

// Re-export everything from razorpay module
export * from "../razorpay"
export { default as RazorpayService } from "../razorpay"

// Type for backward compatibility
export type PaymentProvider = "razorpay"

// Unified interface (Razorpay only)
export interface PaymentOrderInput {
    amount: number // in paise
    currency?: string
    orderId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    description?: string
}

export interface PaymentOrderResult {
    success: boolean
    provider: PaymentProvider
    orderId: string
    razorpayOrderId?: string
    amount?: number
    currency?: string
    keyId?: string
    error?: string
}

// Re-export for backward compatibility
import RazorpayService, {
    createOrder,
    verifyPayment,
    initiateRefund,
    RAZORPAY_KEY_ID
} from "../razorpay"

export async function createPaymentOrder(
    provider: PaymentProvider,
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    // Only Razorpay supported
    const result = await createOrder(input)
    return {
        ...result,
        provider: "razorpay"
    }
}

export { createOrder as createRazorpayOrder }
export { verifyPayment as verifyRazorpayPayment }
export { initiateRefund }
export { RAZORPAY_KEY_ID }

export default RazorpayService
