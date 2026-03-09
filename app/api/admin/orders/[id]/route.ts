import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  sendOrderStatusUpdateEmail, 
  sendShippingNotificationEmail, 
  sendRefundProcessedEmail,
  sendOutForDeliveryEmail,
  sendOrderDeliveredEmail
} from "@/lib/email"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Await params before using
    const { id } = await params

    const order = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("items.product", "name images")
      .populate("statusHistory.by", "name")
      .select("+internalNotes")

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Await params before using
    const { id } = await params

    const body = await request.json()
    const { status, statusNote, internalNotes, ...otherUpdates } = body

    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // If status is being updated, use the updateStatus method for proper history tracking
    if (status && status !== order.status) {
      order.status = status
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: statusNote || undefined,
        by: session.user.id
      })
    }

    // Update internal notes if provided
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes
    }

    // Apply other updates
    Object.assign(order, otherUpdates)

    await order.save()

    // Re-fetch with populated fields
    const updatedOrder = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("items.product", "name images")
      .populate("statusHistory.by", "name")
      .select("+internalNotes")
      
    // Handle Email Notifications Asynchronously
    if (updatedOrder && updatedOrder.customer?.email) {
      const customerEmail = updatedOrder.customer.email;
      const customerName = updatedOrder.customer.name;
      
      const emailPromises = [];

      // 1. Status Changes
      if (status && status !== order.status) {
        if (status === "shipped") {
          emailPromises.push(
            sendShippingNotificationEmail(
              customerEmail, 
              customerName, 
              updatedOrder, 
              updatedOrder.shipment?.awbNumber || "N/A", 
              updatedOrder.shipment?.trackingUrl || ""
            )
          );
        } else if (status === "out_for_delivery") {
          emailPromises.push(
            sendOutForDeliveryEmail(customerEmail, customerName, updatedOrder)
          );
        } else if (status === "delivered") {
          emailPromises.push(
            sendOrderDeliveredEmail(customerEmail, customerName, updatedOrder)
          );
        } else if (status === "returned") {
          emailPromises.push(
            sendOrderStatusUpdateEmail(customerEmail, customerName, updatedOrder, "returned")
          );
        } else if (status === "cancelled") {
          emailPromises.push(
            sendOrderStatusUpdateEmail(customerEmail, customerName, updatedOrder, "cancelled")
          );
        } else {
           emailPromises.push(
            sendOrderStatusUpdateEmail(customerEmail, customerName, updatedOrder, status)
          );
        }
      }

      // 2. Refund Processing
      if (otherUpdates.paymentStatus === "refunded" && order.paymentStatus !== "refunded") {
        emailPromises.push(
          sendRefundProcessedEmail(
            customerEmail, 
            customerName, 
            updatedOrder, 
            updatedOrder.refundDetails?.amount || updatedOrder.total
          )
        );
      }

      // Execute but don't block the API response
      Promise.allSettled(emailPromises).then((results) => {
        results.forEach((res, i) => {
          if (res.status === 'rejected') console.error(`Failed to send order email ${i}:`, res.reason);
        });
      });
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ message: "Failed to update order" }, { status: 500 })
  }
}

