import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "admin" && session.user.role !== "seller")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days
    const sellerId = session.user.role === "seller" ? session.user.id : searchParams.get("sellerId")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Build filter for seller-specific data
    const orderFilter: any = { createdAt: { $gte: startDate } }
    const productFilter: any = { createdAt: { $gte: startDate } }

    if (sellerId) {
      orderFilter["items.seller"] = sellerId
      productFilter.seller = sellerId
    }

    // Get analytics data
    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
      topProducts,
      salesByDay,
      ordersByStatus,
    ] = await Promise.all([
      // Total Revenue
      Order.aggregate([{ $match: orderFilter }, { $group: { _id: null, total: { $sum: "$total" } } }]),

      // Total Orders
      Order.countDocuments(orderFilter),

      // Total Products
      Product.countDocuments(productFilter),

      // Total Customers (unique users who placed orders)
      Order.distinct("user", orderFilter).then((users) => users.length),

      // Recent Orders
      Order.find(orderFilter)
        .populate("user", "name email")
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .limit(10),

      // Top Products
      Order.aggregate([
        { $match: orderFilter },
        { $unwind: "$items" },
        ...(sellerId ? [{ $match: { "items.seller": sellerId } }] : []),
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
      ]),

      // Sales by Day
      Order.aggregate([
        { $match: orderFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Orders by Status
      Order.aggregate([{ $match: orderFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ])

    return NextResponse.json({
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      recentOrders,
      topProducts,
      salesByDay,
      ordersByStatus,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
