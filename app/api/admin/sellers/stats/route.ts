import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        // Get seller counts by status
        const sellerStats = await Seller.aggregate([
            { $match: { status: { $ne: "deleted" } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                    suspended: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
                    verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
                    totalPendingPayouts: { $sum: "$pendingPayout" },
                    totalPayouts: { $sum: "$totalPayouts" }
                }
            }
        ])

        const stats = sellerStats[0] || {
            total: 0,
            pending: 0,
            approved: 0,
            suspended: 0,
            rejected: 0,
            verified: 0,
            totalPendingPayouts: 0,
            totalPayouts: 0
        }

        // Get total seller revenue from orders
        const revenueStats = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $unwind: "$items" },
            { $match: { "items.seller": { $exists: true } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    totalOrders: { $sum: 1 }
                }
            }
        ])

        const revenue = revenueStats[0] || { totalRevenue: 0, totalOrders: 0 }

        // Get product stats
        const productStats = await Product.aggregate([
            { $match: { seller: { $exists: true }, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } }
                }
            }
        ])

        const products = productStats[0] || { totalProducts: 0, activeProducts: 0 }

        // Get monthly growth (new sellers this month)
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const newSellersThisMonth = await Seller.countDocuments({
            createdAt: { $gte: startOfMonth },
            status: { $ne: "deleted" }
        })

        // Get business type distribution
        const businessTypeStats = await Seller.aggregate([
            { $match: { status: { $ne: "deleted" } } },
            { $group: { _id: "$businessType", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])

        return NextResponse.json({
            totalSellers: stats.total,
            activeSellers: stats.approved,
            pendingSellers: stats.pending,
            suspendedSellers: stats.suspended,
            rejectedSellers: stats.rejected,
            verifiedSellers: stats.verified,
            totalRevenue: revenue.totalRevenue,
            totalOrders: revenue.totalOrders,
            totalProducts: products.totalProducts,
            activeProducts: products.activeProducts,
            pendingPayouts: stats.totalPendingPayouts,
            totalPayouts: stats.totalPayouts,
            newSellersThisMonth,
            businessTypeDistribution: businessTypeStats.map((b: any) => ({
                type: b._id || "unknown",
                count: b.count
            }))
        })
    } catch (error) {
        console.error("Admin sellers stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
