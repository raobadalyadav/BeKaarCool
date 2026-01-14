import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "seller") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const sellerId = (session.user as any).id

        await connectDB()

        // Get seller's products stats
        const [totalProducts, activeProducts] = await Promise.all([
            Product.countDocuments({ seller: sellerId }),
            Product.countDocuments({ seller: sellerId, isActive: true })
        ])

        // Get orders containing seller's products
        const orderStats = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { $match: { "productDetails.seller": sellerId } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $addToSet: "$_id" },
                    pendingOrders: {
                        $addToSet: {
                            $cond: [{ $in: ["$status", ["pending", "confirmed", "processing"]] }, "$_id", null]
                        }
                    },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            }
        ])

        // This month's revenue
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const monthlyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: "paid" } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { $match: { "productDetails.seller": sellerId } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            }
        ])

        // Recent orders
        const recentOrders = await Order.aggregate([
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            { $match: { "productDetails.seller": sellerId } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$_id",
                    orderNumber: { $first: "$orderNumber" },
                    customerName: { $first: "$userDetails.name" },
                    amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    status: { $first: "$status" },
                    date: { $first: "$createdAt" }
                }
            },
            { $sort: { date: -1 } },
            { $limit: 5 }
        ])

        // Low stock products
        const lowStockProducts = await Product.find({
            seller: sellerId,
            stock: { $lte: 10 },
            isActive: true
        })
            .select("name stock")
            .sort({ stock: 1 })
            .limit(5)
            .lean()

        const stats = orderStats[0] || { totalOrders: [], pendingOrders: [], totalRevenue: 0 }

        return NextResponse.json({
            stats: {
                totalProducts,
                activeProducts,
                totalOrders: stats.totalOrders?.filter(Boolean).length || 0,
                pendingOrders: stats.pendingOrders?.filter(Boolean).length || 0,
                totalRevenue: stats.totalRevenue || 0,
                thisMonthRevenue: monthlyRevenue[0]?.revenue || 0
            },
            recentOrders: recentOrders.map(o => ({
                id: o._id,
                orderNumber: o.orderNumber,
                customerName: o.customerName || "Guest",
                amount: o.amount,
                status: o.status,
                date: o.date
            })),
            lowStockProducts: lowStockProducts.map(p => ({
                id: p._id,
                name: p.name,
                stock: p.stock
            }))
        })
    } catch (error) {
        console.error("Seller dashboard error:", error)
        return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 })
    }
}
