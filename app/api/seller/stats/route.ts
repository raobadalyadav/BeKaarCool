import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const sellerId = await resolveUserId(session.user.id, session.user.email)

    // Get seller products
    const products = await Product.find({ seller: sellerId })
    const productIds = products.map(p => p._id)

    // Get orders for seller products
    const orders = await Order.find({
      "items.product": { $in: productIds },
      status: { $ne: "cancelled" }
    })

    // Calculate stats
    const totalRevenue = orders.reduce((sum, order) => {
      const sellerItems = order.items.filter((item: any) => 
        productIds.some(id => id.toString() === item.product?.toString())
      )
      return sum + sellerItems.reduce((itemSum: number, item: any) => 
        itemSum + (item.price * item.quantity), 0
      )
    }, 0)

    const totalProducts = products.length
    const totalOrders = orders.length
    const totalViews = products.reduce((sum, product) => sum + (product.views || 0), 0)
    const pendingOrders = orders.filter(order => order.status === "pending").length
    const rating = products.reduce((sum, product) => sum + (product.rating || 0), 0) / totalProducts || 0

    return NextResponse.json({
      totalRevenue,
      totalProducts,
      totalOrders,
      totalViews,
      pendingOrders,
      rating,
    })
  } catch (error) {
    console.error("Error fetching seller stats:", error)
    return NextResponse.json({ message: "Failed to fetch stats" }, { status: 500 })
  }
}