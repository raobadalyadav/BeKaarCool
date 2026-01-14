import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { ReturnRequest } from "@/models/ReturnRequest"
import { resolveUserId } from "@/lib/auth-utils"

// POST: Create return/replace request
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { id } = await (params as any)
        const body = await request.json()

        const { type, reason, items, images } = body

        // Validate input
        if (!type || !["return", "replace", "refund"].includes(type)) {
            return NextResponse.json({ error: "Invalid request type" }, { status: 400 })
        }

        if (!reason) {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 })
        }

        // Find order
        const order = await Order.findOne({ _id: id, user: userId })

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Check if order is eligible for return (must be delivered)
        if (order.status !== "delivered") {
            return NextResponse.json({
                error: "Order must be delivered to request return/replace"
            }, { status: 400 })
        }

        // Check return window (7 days from delivery)
        const deliveredAt = order.deliveredAt || order.updatedAt
        const returnWindow = 7 * 24 * 60 * 60 * 1000 // 7 days
        if (Date.now() - new Date(deliveredAt).getTime() > returnWindow) {
            return NextResponse.json({
                error: "Return window has expired (7 days from delivery)"
            }, { status: 400 })
        }

        // Check if return request already exists
        const existingRequest = await ReturnRequest.findOne({
            order: id,
            status: { $in: ["pending", "approved", "processing"] }
        })

        if (existingRequest) {
            return NextResponse.json({
                error: "A return request already exists for this order"
            }, { status: 400 })
        }

        // Create return request
        const returnRequest = await ReturnRequest.create({
            order: id,
            user: userId,
            type,
            reason,
            items: items || order.items.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
                reason
            })),
            images: images || [],
            status: "pending",
            refundAmount: type === "return" || type === "refund" ? order.total : 0
        })

        // Update order status
        order.returnRequested = true
        order.returnRequestId = returnRequest._id
        await order.save()

        return NextResponse.json({
            message: "Return request submitted successfully",
            requestId: returnRequest._id,
            status: "pending"
        }, { status: 201 })
    } catch (error: any) {
        console.error("Return request error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET: Get return request status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { id } = await (params as any)

        const returnRequest = await ReturnRequest.findOne({ order: id, user: userId })
            .populate("order", "orderNumber total")

        if (!returnRequest) {
            return NextResponse.json({ error: "No return request found" }, { status: 404 })
        }

        return NextResponse.json({ returnRequest })
    } catch (error: any) {
        console.error("Return request fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
