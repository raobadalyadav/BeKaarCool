import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = await resolveUserId(session.user.id, session.user.email)

    // Get order statistics
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalSpent,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Order.countDocuments({ 
        user: userId, 
        status: { $in: ["pending", "confirmed", "processing", "shipped"] }
      }),
      Order.countDocuments({ user: userId, status: "delivered" }),
      Order.countDocuments({ user: userId, status: "cancelled" }),
      Order.aggregate([
        { $match: { user: userId, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.find({ user: userId })
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .limit(5)
    ])

    const stats = {
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalSpent: totalSpent[0]?.total || 0,
      recentOrders
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching order stats:", error)
    return NextResponse.json({ message: "Failed to fetch order statistics" }, { status: 500 })
  }
}