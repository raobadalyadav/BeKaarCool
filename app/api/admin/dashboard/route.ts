import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { User } from "@/models/User"

// Ensure models are registered
void Order
void Product
void User

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Check admin role
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        // Date ranges
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

        // Aggregated stats
        const [
            totalRevenue,
            totalOrders,
            totalProducts,
            activeUsers,
            recentOrders,
            topProducts,
            revenueByDay,
            ordersByStatus,
            todayRevenue,
            lastMonthRevenue
        ] = await Promise.all([
            // Total revenue (all time)
            Order.aggregate([
                { $match: { paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ]),

            // Total orders count
            Order.countDocuments(),

            // Total products count
            Product.countDocuments({ isActive: true }),

            // Active users (logged in last 30 days)
            User.countDocuments({
                lastLogin: { $gte: last30Days },
                role: "customer"
            }),

            // Recent orders (last 10)
            Order.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("user", "name email")
                .select("orderNumber total status paymentStatus createdAt items")
                .lean(),

            // Top selling products
            Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.product",
                        totalSold: { $sum: "$items.quantity" },
                        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } }
            ]),

            // Revenue by day (last 7 days)
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: last7Days },
                        paymentStatus: "paid"
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        revenue: { $sum: "$total" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Orders by status
            Order.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),

            // Today's revenue
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: today },
                        paymentStatus: "paid"
                    }
                },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ]),

            // Last month revenue
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: lastMonth, $lt: new Date(now.getFullYear(), now.getMonth(), 1) },
                        paymentStatus: "paid"
                    }
                },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ])
        ])

        // Calculate percentage changes
        const currentMonthRevenue = totalRevenue[0]?.total || 0
        const prevMonthRevenue = lastMonthRevenue[0]?.total || 1
        const revenueChange = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1)

        // Format response
        const response = {
            stats: {
                totalRevenue: totalRevenue[0]?.total || 0,
                todayRevenue: todayRevenue[0]?.total || 0,
                totalOrders,
                totalProducts,
                activeUsers,
                revenueChange: parseFloat(revenueChange)
            },
            recentOrders: recentOrders.map(order => ({
                id: order.orderNumber,
                customer: (order.user as any)?.name || "Guest",
                email: (order.user as any)?.email || "",
                product: order.items?.[0]?.name || "Multiple Items",
                itemCount: order.items?.length || 0,
                amount: order.total,
                status: order.status,
                paymentStatus: order.paymentStatus,
                date: order.createdAt
            })),
            topProducts: topProducts.map(p => ({
                id: p._id?.toString(),
                name: p.product?.name || "Unknown Product",
                image: p.product?.images?.[0] || "/placeholder.svg",
                sold: p.totalSold,
                revenue: p.totalRevenue
            })),
            revenueChart: revenueByDay.map(d => ({
                date: d._id,
                revenue: d.revenue,
                orders: d.orders
            })),
            ordersByStatus: ordersByStatus.reduce((acc, s) => {
                acc[s._id] = s.count
                return acc
            }, {} as Record<string, number>)
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Admin dashboard error:", error)
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
    }
}
