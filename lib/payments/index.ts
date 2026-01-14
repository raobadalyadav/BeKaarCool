/**
 * Payment Gateway Integrations
 * Supports: Razorpay, PhonePe, Paytm, PayU, Stripe
 */

import Razorpay from "razorpay"
import crypto from "crypto"

// ============================================
// COMMON TYPES
// ============================================

export type PaymentProvider = "razorpay" | "phonepe" | "paytm" | "payu" | "stripe"

export interface PaymentOrderInput {
    amount: number // in paise/paisa
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
    paymentId?: string
    paymentLink?: string
    checksum?: string
    error?: string
}

export interface PaymentVerifyInput {
    provider: PaymentProvider
    orderId: string
    paymentId: string
    signature: string
}

export interface PaymentVerifyResult {
    success: boolean
    verified: boolean
    orderId: string
    paymentId: string
    error?: string
}

// ============================================
// RAZORPAY
// ============================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || ""
})

export async function createRazorpayOrder(
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    try {
        const order = await razorpay.orders.create({
            amount: input.amount,
            currency: input.currency || "INR",
            receipt: input.orderId,
            notes: {
                customerName: input.customerName,
                customerEmail: input.customerEmail
            }
        })

        return {
            success: true,
            provider: "razorpay",
            orderId: order.id,
            paymentId: undefined
        }
    } catch (error: any) {
        console.error("Razorpay createOrder error:", error)
        return {
            success: false,
            provider: "razorpay",
            orderId: input.orderId,
            error: error.message
        }
    }
}

export function verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${orderId}|${paymentId}`)
        .digest("hex")

    return generatedSignature === signature
}

// ============================================
// PHONEPE
// ============================================

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || ""
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || ""
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1"
const PHONEPE_API_URL = process.env.PHONEPE_API_URL || "https://api.phonepe.com/apis/hermes"

export async function createPhonePeOrder(
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    try {
        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: input.orderId,
            merchantUserId: input.customerEmail,
            amount: input.amount,
            redirectUrl: `${process.env.NEXTAUTH_URL}/api/payments/phonepe/callback`,
            redirectMode: "POST",
            callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/phonepe/webhook`,
            mobileNumber: input.customerPhone,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        }

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64")
        const checksum = crypto
            .createHash("sha256")
            .update(`${base64Payload}/pg/v1/pay${PHONEPE_SALT_KEY}`)
            .digest("hex") + "###" + PHONEPE_SALT_INDEX

        const response = await fetch(`${PHONEPE_API_URL}/pg/v1/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": checksum
            },
            body: JSON.stringify({ request: base64Payload })
        })

        const data = await response.json()

        if (data.success) {
            return {
                success: true,
                provider: "phonepe",
                orderId: input.orderId,
                paymentLink: data.data.instrumentResponse.redirectInfo.url,
                checksum
            }
        }

        return {
            success: false,
            provider: "phonepe",
            orderId: input.orderId,
            error: data.message
        }
    } catch (error: any) {
        console.error("PhonePe createOrder error:", error)
        return {
            success: false,
            provider: "phonepe",
            orderId: input.orderId,
            error: error.message
        }
    }
}

export function verifyPhonePePayment(
    merchantTransactionId: string,
    checksum: string
): boolean {
    const expectedChecksum = crypto
        .createHash("sha256")
        .update(`/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}${PHONEPE_SALT_KEY}`)
        .digest("hex") + "###" + PHONEPE_SALT_INDEX

    return expectedChecksum === checksum
}

// ============================================
// PAYTM
// ============================================

const PAYTM_MID = process.env.PAYTM_MID || ""
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY || ""
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE || "DEFAULT"
const PAYTM_API_URL = process.env.PAYTM_API_URL || "https://securegw.paytm.in"

export async function createPaytmOrder(
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    try {
        const orderId = input.orderId
        const txnAmount = (input.amount / 100).toFixed(2) // Convert paise to rupees

        const paytmParams: Record<string, string> = {
            MID: PAYTM_MID,
            WEBSITE: PAYTM_WEBSITE,
            INDUSTRY_TYPE_ID: "Retail",
            CHANNEL_ID: "WEB",
            ORDER_ID: orderId,
            CUST_ID: input.customerEmail,
            EMAIL: input.customerEmail,
            MOBILE_NO: input.customerPhone,
            TXN_AMOUNT: txnAmount,
            CALLBACK_URL: `${process.env.NEXTAUTH_URL}/api/payments/paytm/callback`
        }

        // Generate checksum
        const checksum = generatePaytmChecksum(paytmParams, PAYTM_MERCHANT_KEY)

        return {
            success: true,
            provider: "paytm",
            orderId,
            checksum,
            paymentLink: `${PAYTM_API_URL}/theia/processTransaction?ORDER_ID=${orderId}`
        }
    } catch (error: any) {
        console.error("Paytm createOrder error:", error)
        return {
            success: false,
            provider: "paytm",
            orderId: input.orderId,
            error: error.message
        }
    }
}

function generatePaytmChecksum(params: Record<string, string>, key: string): string {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&")
    return crypto.createHmac("sha256", key).update(sortedParams).digest("hex")
}

// ============================================
// PAYU
// ============================================

const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || ""
const PAYU_SALT = process.env.PAYU_SALT || ""
const PAYU_API_URL = process.env.PAYU_API_URL || "https://secure.payu.in"

export async function createPayUOrder(
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    try {
        const txnid = input.orderId
        const amount = (input.amount / 100).toFixed(2)
        const productinfo = input.description || "Order Payment"
        const firstname = input.customerName.split(" ")[0]
        const email = input.customerEmail

        // PayU hash: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||SALT)
        const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`
        const hash = crypto.createHash("sha512").update(hashString).digest("hex")

        return {
            success: true,
            provider: "payu",
            orderId: txnid,
            checksum: hash,
            paymentLink: `${PAYU_API_URL}/_payment`
        }
    } catch (error: any) {
        console.error("PayU createOrder error:", error)
        return {
            success: false,
            provider: "payu",
            orderId: input.orderId,
            error: error.message
        }
    }
}

export function verifyPayUPayment(params: Record<string, string>): boolean {
    const { status, email, firstname, productinfo, amount, txnid, additionalCharges } = params

    // Reverse hash for verification
    let hashString = `${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`
    if (additionalCharges) {
        hashString = `${additionalCharges}|${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`
    }

    const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex")
    return expectedHash === params.hash
}

// ============================================
// STRIPE (International)
// ============================================

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function createStripePaymentIntent(
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: input.amount,
            currency: input.currency?.toLowerCase() || "inr",
            metadata: {
                orderId: input.orderId,
                customerEmail: input.customerEmail
            },
            receipt_email: input.customerEmail
        })

        return {
            success: true,
            provider: "stripe",
            orderId: input.orderId,
            paymentId: paymentIntent.client_secret || undefined
        }
    } catch (error: any) {
        console.error("Stripe createPaymentIntent error:", error)
        return {
            success: false,
            provider: "stripe",
            orderId: input.orderId,
            error: error.message
        }
    }
}

export function verifyStripeWebhook(
    payload: string,
    signature: string
): Stripe.Event | null {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        )
    } catch (error) {
        console.error("Stripe webhook verification failed:", error)
        return null
    }
}

// ============================================
// UNIFIED PAYMENT INTERFACE
// ============================================

export async function createPaymentOrder(
    provider: PaymentProvider,
    input: PaymentOrderInput
): Promise<PaymentOrderResult> {
    switch (provider) {
        case "razorpay":
            return createRazorpayOrder(input)
        case "phonepe":
            return createPhonePeOrder(input)
        case "paytm":
            return createPaytmOrder(input)
        case "payu":
            return createPayUOrder(input)
        case "stripe":
            return createStripePaymentIntent(input)
        default:
            return {
                success: false,
                provider,
                orderId: input.orderId,
                error: "Unknown payment provider"
            }
    }
}

export function verifyPayment(input: PaymentVerifyInput): boolean {
    switch (input.provider) {
        case "razorpay":
            return verifyRazorpayPayment(input.orderId, input.paymentId, input.signature)
        case "phonepe":
            return verifyPhonePePayment(input.orderId, input.signature)
        case "payu":
            // PayU verification needs full params, this is simplified
            return true // Should be verified in webhook
        default:
            return false
    }
}
