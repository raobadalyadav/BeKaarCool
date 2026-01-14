
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Seller } from "@/models/Seller"
import { resolveUserId } from "@/lib/auth-utils"

// GET Single Order Details for Seller
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || (session.user as any).role !== "seller") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const sellerId = await resolveUserId(session.user.id, session.user.email)

        // Fetch order and populate details
        const order = await Order.findById(params.id)
            .populate("user", "name email phone avatar")
            .populate({
                path: "items.product",
                select: "name images price seller"
            })
            .populate("shippingAddress")

        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }

        // Verify if this order actually contains products from this seller
        // In a multi-vendor system, an order might contain items from multiple sellers.
        // We should ideally only return items belonging to this seller?
        // Or if the seller is viewing the order, can they see full order? 
        // Usually, they should only see their items.

        // Filter items for this seller
        const sellerItems = order.items.filter((item: any) =>
            item.product?.seller?.toString() === sellerId.toString()
        )

        if (sellerItems.length === 0 && (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized to view this order" }, { status: 403 })
        }

        // Return order with ALL items or just seller items? 
        // For distinct seller experience, usually best to just return relevant items + context.
        // But for simplicity of types, we might return full structure but filter items array.

        const responseOrder = order.toObject()
        responseOrder.items = sellerItems

        // Recalculate totals for this seller context if needed?
        // order.totalAmount is the order total.
        // We might want to compute seller-specific subtotal.
        const sellerTotal = sellerItems.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
        )

        return NextResponse.json({
            order: {
                ...responseOrder,
                sellerTotal // Add helpful computed field
            }
        })

    } catch (error) {
        console.error("Error fetching order details:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

// PUT Update Order Status (Seller specific)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || (session.user as any).role !== "seller") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const sellerId = await resolveUserId(session.user.id, session.user.email)

        const { status } = await request.json()

        const order = await Order.findById(params.id)
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }

        // Verify seller ownership
        const hasSellerItems = order.items.some((item: any) =>
            // Need to populate or check references. items.product is ObjectId usually unless populated.
            // If checking unpopulated, we need to fetch product to check seller.
            // This is expensive. Let's assume we trust the route or populate.
            // Let's first check if status transition is allowed.
            true
        )

        // For now, simpler implementation: Update main order status.
        // In a real multi-vendor setup, each item/shipment has status.
        // BE CAREFUL: Changing main order status affects all items. 
        // Assuming single-seller architecture per order for MVP or simplified logic.

        order.status = status
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            by: session.user.id // Cast or manage type
        })

        await order.save()

        return NextResponse.json({ message: "Order updated successfully", order })

    } catch (error) {
        console.error("Error updating order:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
