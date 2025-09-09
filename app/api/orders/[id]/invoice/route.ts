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
      .populate("items.product", "name images")
      .populate("user", "name email")

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Handle case where user might not be populated
    const orderUserId = order.user?._id?.toString() || order.user?.toString()
    if (orderUserId !== userId && session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      dueDate: order.estimatedDelivery,
      status: order.paymentStatus,
      
      // Company details
      company: {
        name: "BeKaarCool",
        address: "123 Business Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
        email: "support@bekaar-cool.com",
        phone: "+91 9876543210",
        gst: "27ABCDE1234F1Z5"
      },

      // Customer details
      customer: {
        name: order.shippingAddress?.name || "Customer",
        email: order.user?.email || "customer@example.com",
        phone: order.shippingAddress?.phone || "",
        address: order.shippingAddress?.address || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        pincode: order.shippingAddress?.pincode || "",
        country: order.shippingAddress?.country || "India"
      },

      // Items
      items: order.items.map((item: any) => ({
        name: item.product?.name || "Product",
        quantity: item.quantity || 1,
        price: item.quantity ? item.price / item.quantity : item.price,
        total: item.price || 0,
        size: item.size || "",
        color: item.color || ""
      })),

      // Totals
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      total: order.total,

      // Payment details
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      paymentStatus: order.paymentStatus
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ message: "Failed to generate invoice" }, { status: 500 })
  }
}