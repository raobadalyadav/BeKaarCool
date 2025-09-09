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

    const products = await Product.find({ seller: sellerId })
    const productIds = products.map(p => p._id)

    const orders = await Order.find({
      "items.product": { $in: productIds },
      status: { $ne: "cancelled" }
    })

    const totalRevenue = orders.reduce((sum, order) => {
      const sellerItems = order.items.filter((item: any) => 
        productIds.some(id => id.toString() === item.product?.toString())
      )
      return sum + sellerItems.reduce((itemSum: number, item: any) => 
        itemSum + (item.price * item.quantity), 0
      )
    }, 0)

    const totalOrders = orders.length
    const totalViews = products.reduce((sum, product) => sum + (product.views || 0), 0)

    const topProducts = products
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .map(product => ({
        id: product._id,
        name: product.name,
        sales: product.sold || 0,
        revenue: (product.sold || 0) * product.price
      }))

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: products.length,
      totalViews,
      topProducts
    })
  } catch (error) {
    console.error("Error fetching seller analytics:", error)
    return NextResponse.json({ message: "Failed to fetch analytics" }, { status: 500 })
  }
}