import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = await resolveUserId(session.user.id, session.user.email)
    const { id } = await params
    const { reason } = await request.json()

    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    if (order.user.toString() !== userId && session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return NextResponse.json({ message: "Order cannot be cancelled" }, { status: 400 })
    }

    order.status = "cancelled"
    order.cancellationReason = reason
    order.cancelledAt = new Date()
    order.updatedAt = new Date()
    await order.save()

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      })
    }

    return NextResponse.json({ message: "Order cancelled successfully", order })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json({ message: "Failed to cancel order" }, { status: 500 })
  }
}