/**
 * Razorpay Webhook Handler
 * Processes payment events from Razorpay:
 *   - payment.captured → confirm order, create transaction, send email, create shipment
 *   - payment.failed → mark payment failed, restore stock, notify user
 *   - refund.processed → update order, record refund transaction, send email
 *
 * IMPORTANT: Always return 200 to Razorpay. Log errors internally.
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Transaction } from "@/models/Transaction"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import {
    sendOrderConfirmationEmail,
    sendPaymentFailedEmail,
    sendRefundProcessedEmail,
    sendShippingNotificationEmail,
    sendPaymentSuccessEmail
} from "@/lib/email"
import DelhiveryService from "@/lib/delhivery"

// Disable body parsing — we need the raw body for verification
export const dynamic = "force-dynamic"

// ============================================
// VERIFY WEBHOOK SIGNATURE
// ============================================

function verifySignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ""
    if (!secret || secret === "xxx") {
        console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not configured")
        return false
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex")

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    )
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text()
        const signature = request.headers.get("x-razorpay-signature") || ""

        // 1. Verify signature
        if (!verifySignature(rawBody, signature)) {
            console.error("[Webhook] Invalid signature")
            // Still return 200 to prevent Razorpay from retrying (could be a spoofed request)
            return NextResponse.json({ received: true, error: "Invalid signature" }, { status: 200 })
        }

        const event = JSON.parse(rawBody)
        const eventType = event.event

        await connectDB()

        // 2. Handle event
        switch (eventType) {
            case "payment.captured":
                await handlePaymentCaptured(event.payload.payment.entity)
                break

            case "payment.failed":
                await handlePaymentFailed(event.payload.payment.entity)
                break

            case "refund.processed":
                await handleRefundProcessed(event.payload.refund.entity, event.payload.payment?.entity)
                break

            case "payment.authorized":
                // Usually auto-captured, log for monitoring
                console.log("[Webhook] Payment authorized:", event.payload.payment.entity.id)
                break

            default:
                console.log(`[Webhook] Unhandled event: ${eventType}`)
        }

        return NextResponse.json({ received: true, event: eventType })
    } catch (error: any) {
        console.error("[Webhook] Error:", error)
        // Always return 200 to Razorpay
        return NextResponse.json({ received: true, error: error.message }, { status: 200 })
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handlePaymentCaptured(payment: any) {
    const paymentId = payment.id
    const razorpayOrderId = payment.order_id
    const amount = payment.amount / 100 // Convert paise to rupees

    console.log(`[Webhook] Payment captured: ${paymentId}, amount: ₹${amount}`)

    // Idempotency check — skip if already processed
    const existingTxn = await Transaction.findOne({ providerTransactionId: paymentId })
    if (existingTxn) {
        console.log(`[Webhook] Payment ${paymentId} already processed, skipping`)
        return
    }

    // Find order by paymentId or by Razorpay order ID in notes
    let order = await Order.findOne({
        $or: [
            { paymentId: paymentId },
            { paymentId: razorpayOrderId },
            { "paymentDetails.transactionId": razorpayOrderId },
        ],
    })

    // Fallback: find by receipt in Razorpay notes
    if (!order && payment.notes?.orderId) {
        order = await Order.findById(payment.notes.orderId)
    }

    if (!order) {
        console.error(`[Webhook] No order found for payment ${paymentId}`)
        return
    }

    // Update order
    order.paymentStatus = "paid"
    order.paymentId = paymentId
    order.paymentDetails = {
        provider: "razorpay",
        transactionId: paymentId,
        method: payment.method,
        last4: payment.card?.last4,
        bank: payment.bank,
        vpa: payment.vpa,
    }

    if (order.status === "pending") {
        order.status = "confirmed"
        order.statusHistory.push({
            status: "confirmed",
            timestamp: new Date(),
            note: "Payment captured via webhook",
        })
    }

    await order.save()

    // Create Transaction record
    const user = await User.findById(order.user)
    await Transaction.create({
        order: order._id,
        user: order.user,
        type: "payment",
        provider: "razorpay",
        amount: amount,
        currency: payment.currency?.toUpperCase() || "INR",
        status: "completed",
        providerTransactionId: paymentId,
        providerOrderId: razorpayOrderId,
        paymentMethod: {
            type: payment.method || "unknown",
            last4: payment.card?.last4,
            brand: payment.card?.network,
            bank: payment.bank,
            vpa: payment.vpa,
        },
        completedAt: new Date(),
        metadata: {
            webhookEvent: "payment.captured",
        },
    })

    // Send payment success email (queued)
    if (user?.email) {
        await sendPaymentSuccessEmail(user.email, user.name, order).catch((err: any) =>
            console.error("[Webhook] Email error:", err)
        )
    }

    // Create Delhivery shipment
    try {
        const shipmentResult = await DelhiveryService.createShipment({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            customer: {
                name: order.shippingAddress.name,
                phone: order.shippingAddress.phone,
                address: `${order.shippingAddress.address}${order.shippingAddress.landmark ? `, ${order.shippingAddress.landmark}` : ""}`,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                pincode: order.shippingAddress.pincode,
                country: order.shippingAddress.country || "India",
            },
            items: order.items.map((item: any) => ({
                name: item.name || "Product",
                sku: item.product?.toString() || `SKU-${item._id}`,
                quantity: item.quantity,
                price: item.price,
            })),
            totalWeight: 0.5,
            paymentMode: "prepaid",
            codAmount: 0,
            invoiceValue: order.total,
        })

        if (shipmentResult.success && shipmentResult.awbNumber) {
            order.shipment = {
                provider: "delhivery",
                awbNumber: shipmentResult.awbNumber,
                trackingUrl: DelhiveryService.getTrackingUrl(shipmentResult.awbNumber),
            }
            order.status = "processing"
            order.statusHistory.push({
                status: "processing",
                timestamp: new Date(),
                note: `Delhivery shipment created: ${shipmentResult.awbNumber}`,
            })
            await order.save()

            // Send shipping notification
            if (user?.email) {
                await sendShippingNotificationEmail(
                    user.email,
                    user.name,
                    order,
                    shipmentResult.awbNumber,
                    DelhiveryService.getTrackingUrl(shipmentResult.awbNumber)
                ).catch((err) => console.error("[Webhook] Shipping email error:", err))
            }
        }
    } catch (shipErr) {
        console.error("[Webhook] Delhivery shipment error:", shipErr)
    }
}

async function handlePaymentFailed(payment: any) {
    const paymentId = payment.id
    const razorpayOrderId = payment.order_id

    console.log(`[Webhook] Payment failed: ${paymentId}`)

    let order = await Order.findOne({
        $or: [
            { paymentId: paymentId },
            { paymentId: razorpayOrderId },
        ],
    })

    if (!order && payment.notes?.orderId) {
        order = await Order.findById(payment.notes.orderId)
    }

    if (!order) {
        console.error(`[Webhook] No order found for failed payment ${paymentId}`)
        return
    }

    // Update order
    order.paymentStatus = "failed"
    order.status = "cancelled"
    order.cancelledAt = new Date()
    order.cancellationReason = `Payment failed: ${payment.error_description || "Unknown error"}`
    order.cancelledBy = "system"
    order.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        note: `Payment failed: ${payment.error_description || "Unknown"}`,
    })
    await order.save()

    // Restore stock
    for (const item of order.items) {
        if (item.product) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity, sold: -item.quantity },
            })
        }
    }

    // Create failed transaction record
    await Transaction.create({
        order: order._id,
        user: order.user,
        type: "payment",
        provider: "razorpay",
        amount: payment.amount / 100,
        currency: payment.currency?.toUpperCase() || "INR",
        status: "failed",
        providerTransactionId: paymentId,
        providerOrderId: razorpayOrderId,
        failureReason: payment.error_description || payment.error_code,
        metadata: {
            webhookEvent: "payment.failed",
            errorCode: payment.error_code,
            errorSource: payment.error_source,
        },
    })

    // Notify user
    const user = await User.findById(order.user)
    if (user?.email) {
        await sendPaymentFailedEmail(user.email, user.name, order).catch((err) =>
            console.error("[Webhook] Payment failed email error:", err)
        )
    }
}

async function handleRefundProcessed(refund: any, payment: any) {
    const refundId = refund.id
    const paymentId = refund.payment_id || payment?.id
    const refundAmount = refund.amount / 100

    console.log(`[Webhook] Refund processed: ${refundId}, amount: ₹${refundAmount}`)

    // Idempotency check
    const existingTxn = await Transaction.findOne({ providerTransactionId: refundId })
    if (existingTxn) {
        console.log(`[Webhook] Refund ${refundId} already processed, skipping`)
        return
    }

    // Find order by payment ID
    let order = await Order.findOne({
        $or: [
            { paymentId: paymentId },
            { "paymentDetails.transactionId": paymentId },
        ],
    })

    if (!order) {
        console.error(`[Webhook] No order found for refund ${refundId}`)
        return
    }

    // Determine if partial or full refund
    const isFullRefund = refundAmount >= order.total
    order.paymentStatus = isFullRefund ? "refunded" : "partially_refunded"
    order.refundDetails = {
        amount: refundAmount,
        reason: refund.notes?.reason || "Customer refund",
        processedAt: new Date(),
        transactionId: refundId,
    }

    if (isFullRefund && ["pending", "confirmed", "processing"].includes(order.status)) {
        order.status = "cancelled"
        order.cancelledAt = new Date()
        order.cancellationReason = "Full refund processed"
        order.cancelledBy = "system"
    }

    await order.save()

    // Create refund transaction record
    await Transaction.create({
        order: order._id,
        user: order.user,
        type: isFullRefund ? "refund" : "partial_refund",
        provider: "razorpay",
        amount: refundAmount,
        currency: refund.currency?.toUpperCase() || "INR",
        status: "completed",
        providerTransactionId: refundId,
        providerOrderId: paymentId,
        refundReason: refund.notes?.reason || "Customer refund",
        refundedAt: new Date(),
        completedAt: new Date(),
        metadata: {
            webhookEvent: "refund.processed",
        },
    })

    // Notify user
    const user = await User.findById(order.user)
    if (user?.email) {
        await sendRefundProcessedEmail(user.email, user.name, order, refundAmount).catch((err) =>
            console.error("[Webhook] Refund email error:", err)
        )
    }
}
