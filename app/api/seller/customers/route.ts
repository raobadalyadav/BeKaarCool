import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get all orders for this seller
    const orders = await Order.find({
      "items.product": { $exists: true }
    }).populate([
      { path: "customer", select: "name email phone avatar" },
      { path: "items.product", select: "seller" }
    ])

    // Filter orders for this seller's products
    const sellerOrders = orders.filter(order => 
      order.items.some(item => 
        item.product?.seller?.toString() === session.user.id
      )
    )

    // Group by customer and calculate stats
    const customerMap = new Map()

    sellerOrders.forEach(order => {
      const customerId = order.customer._id.toString()
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          _id: customerId,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          avatar: order.customer.avatar,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
          status: "active",
          rating: 4.5, // Default rating
          location: order.shippingAddress?.city + ", " + order.shippingAddress?.state
        })
      }

      const customer = customerMap.get(customerId)
      customer.totalOrders += 1
      customer.totalSpent += order.total
      
      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt
      }
    })

    // Convert map to array and determine status
    const customers = Array.from(customerMap.values()).map(customer => ({
      ...customer,
      status: new Date(customer.lastOrderDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) 
        ? "active" : "inactive"
    }))

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}