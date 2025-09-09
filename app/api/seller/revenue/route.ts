import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"

    await connectDB()

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get seller's products
    const sellerProducts = await Product.find({ seller: session.user.id }).select("_id")
    const productIds = sellerProducts.map(p => p._id)

    // Get orders containing seller's products
    const orders = await Order.find({
      "items.product": { $in: productIds },
      paymentStatus: "paid",
      createdAt: { $gte: startDate }
    }).populate("items.product")

    // Calculate revenue metrics
    let totalRevenue = 0
    let monthlyRevenue = 0
    let weeklyRevenue = 0
    let dailyRevenue = 0
    const productRevenue = new Map()
    const monthlyData = []

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    orders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.product._id.toString())) {
          const itemRevenue = item.price * item.quantity
          totalRevenue += itemRevenue

          if (order.createdAt >= monthStart) {
            monthlyRevenue += itemRevenue
          }
          if (order.createdAt >= weekStart) {
            weeklyRevenue += itemRevenue
          }
          if (order.createdAt >= dayStart) {
            dailyRevenue += itemRevenue
          }

          // Track product revenue
          const productName = item.product.name
          if (!productRevenue.has(productName)) {
            productRevenue.set(productName, { revenue: 0, orders: 0 })
          }
          const productData = productRevenue.get(productName)
          productData.revenue += itemRevenue
          productData.orders += 1
        }
      })
    })

    // Generate monthly data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthOrders = orders.filter(order => 
        order.createdAt >= monthDate && order.createdAt < nextMonth
      )
      
      let monthRevenue = 0
      monthOrders.forEach(order => {
        order.items.forEach(item => {
          if (productIds.some(id => id.toString() === item.product._id.toString())) {
            monthRevenue += item.price * item.quantity
          }
        })
      })

      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        orders: monthOrders.length
      })
    }

    // Top products
    const topProducts = Array.from(productRevenue.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Mock payout history (in real app, this would come from payment processor)
    const payoutHistory = [
      {
        id: "payout_1",
        amount: Math.floor(totalRevenue * 0.3),
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed" as const,
        method: "Bank Transfer"
      },
      {
        id: "payout_2",
        amount: Math.floor(totalRevenue * 0.2),
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed" as const,
        method: "UPI"
      },
      {
        id: "payout_3",
        amount: Math.floor(totalRevenue * 0.1),
        date: new Date().toISOString(),
        status: "pending" as const,
        method: "Bank Transfer"
      }
    ]

    const revenueData = {
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      pendingPayouts: Math.floor(totalRevenue * 0.15),
      completedPayouts: Math.floor(totalRevenue * 0.85),
      revenueGrowth: 12.5, // Mock growth percentage
      topProducts,
      monthlyData,
      payoutHistory
    }

    return NextResponse.json(revenueData)
  } catch (error) {
    console.error("Error fetching revenue data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}