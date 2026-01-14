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
        const type = searchParams.get("type") || "sales" // sales, inventory, customers, returns
        const dateFrom = searchParams.get("from")
        const dateTo = searchParams.get("to")

        const dateQuery: any = {}
        if (dateFrom) dateQuery.$gte = new Date(dateFrom)
        if (dateTo) dateQuery.$lte = new Date(dateTo)

        let report: any = {}

        switch (type) {
            case "sales":
                const salesData = await Order.aggregate([
                    { $match: dateFrom || dateTo ? { createdAt: dateQuery } : {} },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            orders: { $sum: 1 },
                            revenue: { $sum: "$total" },
                            avgOrderValue: { $avg: "$total" }
                        }
                    },
                    { $sort: { _id: 1 } }
                ])

                const salesSummary = await Order.aggregate([
                    { $match: dateFrom || dateTo ? { createdAt: dateQuery } : {} },
                    {
                        $group: {
                            _id: null,
                            totalOrders: { $sum: 1 },
                            totalRevenue: { $sum: "$total" },
                            avgOrderValue: { $avg: "$total" },
                            paidOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } }
                        }
                    }
                ])

                report = {
                    type: "sales",
                    summary: salesSummary[0] || {},
                    data: salesData
                }
                break

            case "inventory":
                const inventoryData = await Product.aggregate([
                    { $match: { isActive: true } },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category",
                            foreignField: "_id",
                            as: "categoryInfo"
                        }
                    },
                    { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: "$categoryInfo.name",
                            totalProducts: { $sum: 1 },
                            totalStock: { $sum: "$stock" },
                            avgPrice: { $avg: "$price" },
                            lowStock: { $sum: { $cond: [{ $lte: ["$stock", 10] }, 1, 0] } },
                            outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } }
                        }
                    },
                    { $sort: { totalProducts: -1 } }
                ])

                report = {
                    type: "inventory",
                    data: inventoryData.map(i => ({
                        category: i._id || "Uncategorized",
                        ...i
                    }))
                }
                break

            case "customers":
                const customerData = await User.aggregate([
                    { $match: { role: "customer" } },
                    {
                        $lookup: {
                            from: "orders",
                            localField: "_id",
                            foreignField: "user",
                            as: "orders"
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            createdAt: 1,
                            orderCount: { $size: "$orders" },
                            totalSpent: { $sum: "$orders.total" }
                        }
                    },
                    { $sort: { totalSpent: -1 } },
                    { $limit: 100 }
                ])

                const customerSummary = await User.aggregate([
                    { $match: { role: "customer" } },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            newThisMonth: {
                                $sum: {
                                    $cond: [
                                        { $gte: ["$createdAt", new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                                        1, 0
                                    ]
                                }
                            }
                        }
                    }
                ])

                report = {
                    type: "customers",
                    summary: customerSummary[0] || {},
                    data: customerData
                }
                break

            case "returns":
                const returnsData = await Order.aggregate([
                    { $match: { status: { $in: ["returned", "return_requested"] } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                            count: { $sum: 1 },
                            value: { $sum: "$total" }
                        }
                    },
                    { $sort: { _id: -1 } }
                ])

                report = {
                    type: "returns",
                    data: returnsData
                }
                break

            default:
                return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
        }

        return NextResponse.json(report)
    } catch (error) {
        console.error("Admin reports error:", error)
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
    }
}
