import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { resolveUserId } from "@/lib/auth-utils"

interface TrackingEvent {
  status: string
  location: string
  timestamp: string
  description: string
}

// GET: Get order tracking info
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

    const order = await Order.findOne({ _id: id, user: userId })
      .select("orderNumber status trackingNumber carrier shippingAddress createdAt")
      .lean()

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Build tracking events based on order status
    const events: TrackingEvent[] = []
    const now = new Date()

    // Always add order placed
    events.push({
      status: "Order Placed",
      location: "Online",
      timestamp: new Date(order.createdAt).toISOString(),
      description: "Your order has been placed successfully"
    })

    if (["confirmed", "processing", "shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      events.push({
        status: "Order Confirmed",
        location: "Warehouse",
        timestamp: new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000).toISOString(),
        description: "Your order has been confirmed and is being processed"
      })
    }

    if (["processing", "shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      events.push({
        status: "Processing",
        location: "Warehouse",
        timestamp: new Date(new Date(order.createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        description: "Your order is being packed and prepared for shipping"
      })
    }

    if (["shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      events.push({
        status: "Shipped",
        location: "Dispatch Center",
        timestamp: new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        description: `Package handed over to ${order.carrier || "courier partner"}`
      })
    }

    if (["out_for_delivery", "delivered"].includes(order.status)) {
      events.push({
        status: "Out for Delivery",
        location: order.shippingAddress?.city || "Local Hub",
        timestamp: new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Package is out for delivery and will arrive today"
      })
    }

    if (order.status === "delivered") {
      events.push({
        status: "Delivered",
        location: order.shippingAddress?.city || "Destination",
        timestamp: new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Package has been delivered successfully"
      })
    }

    // If order has real tracking number, try to get carrier updates
    let carrierTracking = null
    if (order.trackingNumber && order.carrier) {
      carrierTracking = {
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        trackingUrl: getCarrierTrackingUrl(order.carrier, order.trackingNumber)
      }
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      events: events.reverse(), // Most recent first
      carrier: carrierTracking,
      estimatedDelivery: getEstimatedDelivery(order.createdAt, order.status)
    })
  } catch (error: any) {
    console.error("Order tracking error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
  switch (carrier.toLowerCase()) {
    case "delhivery":
      return `https://www.delhivery.com/track/package/${trackingNumber}`
    case "bluedart":
      return `https://www.bluedart.com/tracking/${trackingNumber}`
    case "dtdc":
      return `https://tracking.dtdc.com/ctbs-tracking/customerInterface.tr?submitName=${trackingNumber}`
    case "ecom_express":
      return `https://ecomexpress.in/track/${trackingNumber}`
    case "xpressbees":
      return `https://www.xpressbees.com/track/${trackingNumber}`
    default:
      return ""
  }
}

function getEstimatedDelivery(createdAt: Date, status: string): string | null {
  if (status === "delivered" || status === "cancelled") return null

  const orderDate = new Date(createdAt)
  const deliveryDate = new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days default

  return deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  })
}