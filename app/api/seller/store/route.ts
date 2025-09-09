import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get user/seller info
    const user = await User.findById(session.user.id).select("name email avatar")
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get seller's products
    const products = await Product.find({ seller: session.user.id })
      .sort({ createdAt: -1 })
      .limit(6)
    
    const productIds = products.map(p => p._id)

    // Get orders containing seller's products
    const orders = await Order.find({
      "items.product": { $in: productIds }
    }).populate("items.product customer")
      .sort({ createdAt: -1 })
      .limit(5)

    // Calculate stats
    const allOrders = await Order.find({
      "items.product": { $in: productIds },
      paymentStatus: "paid"
    }).populate("customer")

    const customerSet = new Set()
    let totalSales = 0

    allOrders.forEach(order => {
      customerSet.add(order.customer._id.toString())
      totalSales += 1
    })

    // Featured products with mock data
    const featuredProducts = products.slice(0, 6).map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "/placeholder.jpg",
      rating: product.rating || 4.5,
      sales: product.sold || Math.floor(Math.random() * 100)
    }))

    // Recent orders
    const recentOrders = orders.slice(0, 5).map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customer: order.customer.name,
      total: order.total,
      status: order.status,
      date: order.createdAt
    }))

    const store = {
      name: user.name + "'s Store",
      description: "Custom products and designs",
      logo: user.avatar || "/placeholder-logo.png",
      banner: "/placeholder-banner.jpg",
      rating: 4.5, // Mock rating
      totalProducts: products.length,
      totalCustomers: customerSet.size,
      totalSales,
      storeUrl: `${process.env.NEXTAUTH_URL}/store/${session.user.id}`,
      socialLinks: {
        facebook: "",
        twitter: "",
        instagram: ""
      },
      featuredProducts,
      recentOrders
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error("Error fetching store data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}