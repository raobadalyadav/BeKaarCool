import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import RazorpayService from "@/lib/razorpay"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const body = await request.json()
        const { amount } = body

        const order = await Order.findById(id)
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        if (order.paymentStatus !== "paid") {
            return NextResponse.json({ error: "Order is not paid" }, { status: 400 })
        }

        // Process refund via Razorpay
        if (order.paymentId) {
            try {
                await RazorpayService.initiateRefund({
                    paymentId: order.paymentId,
                    amount: amount * 100 // Convert to paise
                })
            } catch (e) {
                console.error("Razorpay refund failed:", e)
            }
        }

        // Update order status
        order.paymentStatus = "refunded"
        order.status = "cancelled"
        order.refundAmount = amount
        await order.save()

        return NextResponse.json({ message: "Refund processed", order })
    } catch (error) {
        console.error("Admin refund error:", error)
        return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
    }
}
