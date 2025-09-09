import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = await resolveUserId(session.user.id, session.user.email)
    const { id } = await params

    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    if (order.user.toString() !== userId && session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    if (!order.trackingNumber) {
      return NextResponse.json({ message: "No tracking information available" }, { status: 404 })
    }

    // Mock tracking data - replace with actual Shiprocket API call
    const trackingData = {
      trackingNumber: order.trackingNumber,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      timeline: [
        {
          status: "Order Placed",
          date: order.createdAt,
          location: "BeKaarCool Warehouse",
          description: "Your order has been placed successfully"
        },
        {
          status: "Order Confirmed",
          date: order.updatedAt,
          location: "BeKaarCool Warehouse",
          description: "Your order has been confirmed and is being prepared"
        }
      ]
    }

    if (["shipped", "delivered"].includes(order.status)) {
      trackingData.timeline.push({
        status: "Shipped",
        date: order.updatedAt,
        location: "Shipping Partner",
        description: "Your order has been shipped"
      })
    }

    if (order.status === "delivered") {
      trackingData.timeline.push({
        status: "Delivered",
        date: order.deliveredAt || order.updatedAt,
        location: order.shippingAddress.city,
        description: "Your order has been delivered successfully"
      })
    }

    return NextResponse.json(trackingData)
  } catch (error) {
    console.error("Error fetching tracking info:", error)
    return NextResponse.json({ message: "Failed to fetch tracking information" }, { status: 500 })
  }
}