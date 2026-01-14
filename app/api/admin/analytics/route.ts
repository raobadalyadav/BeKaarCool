import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const period = searchParams.get("period") || "30" // days
        const days = parseInt(period)

        const dateFrom = new Date()
        dateFrom.setDate(dateFrom.getDate() - days)

        // Sales by category
        const salesByCategory = await Order.aggregate([
            { $match: { createdAt: { $gte: dateFrom }, paymentStatus: "paid" } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "categories",
                    localField: "productDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$categoryDetails.name",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ])

        // Revenue trend
        const revenueTrend = await Order.aggregate([
            { $match: { createdAt: { $gte: dateFrom }, paymentStatus: "paid" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        // Top products
        const topProducts = await Order.aggregate([
            { $match: { createdAt: { $gte: dateFrom } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    name: { $first: "$items.name" },
                    sold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { sold: -1 } },
            { $limit: 10 }
        ])

        // Customer acquisition
        const customerAcquisition = await User.aggregate([
            { $match: { createdAt: { $gte: dateFrom }, role: "customer" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    newCustomers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        // Order stats
        const orderStats = await Order.aggregate([
            { $match: { createdAt: { $gte: dateFrom } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])

        // Payment method distribution
        const paymentMethods = await Order.aggregate([
            { $match: { createdAt: { $gte: dateFrom } } },
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    revenue: { $sum: "$total" }
                }
            }
        ])

        // Calculate totals
        const [totalRevenue] = await Order.aggregate([
            { $match: { createdAt: { $gte: dateFrom }, paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ])

        return NextResponse.json({
            period: days,
            summary: {
                totalRevenue: totalRevenue?.total || 0,
                totalOrders: totalRevenue?.count || 0,
                averageOrderValue: totalRevenue?.count ?
                    Math.round(totalRevenue.total / totalRevenue.count) : 0
            },
            salesByCategory: salesByCategory.map(c => ({
                category: c._id || "Uncategorized",
                revenue: c.revenue,
                orders: c.orders
            })),
            revenueTrend,
            topProducts,
            customerAcquisition,
            ordersByStatus: orderStats.reduce((acc, s) => {
                acc[s._id] = s.count
                return acc
            }, {} as Record<string, number>),
            paymentMethods: paymentMethods.map(p => ({
                method: p._id || "Unknown",
                count: p.count,
                revenue: p.revenue
            }))
        })
    } catch (error) {
        console.error("Admin analytics error:", error)
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }
}
