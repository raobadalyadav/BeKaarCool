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

        // Fetch all data for complete ReportData structure expected by frontend
        const [salesSummary, inventorySummary, customerSummary, topProducts] = await Promise.all([
            // Sales summary
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" },
                        avgOrderValue: { $avg: "$total" }
                    }
                }
            ]),

            // Inventory summary
            Product.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] }, 1, 0] } },
                        outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } }
                    }
                }
            ]),

            // Customer summary
            User.aggregate([
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
            ]),

            // Top products
            Order.aggregate([
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.name",
                        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                        quantity: { $sum: "$items.quantity" }
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 }
            ])
        ])

        // Return in format expected by frontend ReportData interface
        const response = {
            sales: {
                totalRevenue: salesSummary[0]?.totalRevenue || 0,
                totalOrders: salesSummary[0]?.totalOrders || 0,
                averageOrderValue: Math.round(salesSummary[0]?.avgOrderValue || 0),
                topProducts: topProducts.map(p => ({
                    name: p._id || "Product",
                    revenue: p.revenue || 0,
                    quantity: p.quantity || 0
                }))
            },
            customers: {
                totalCustomers: customerSummary[0]?.total || 0,
                newCustomers: customerSummary[0]?.newThisMonth || 0,
                returningCustomers: Math.max(0, (customerSummary[0]?.total || 0) - (customerSummary[0]?.newThisMonth || 0)),
                topCustomers: []
            },
            inventory: {
                totalProducts: inventorySummary[0]?.totalProducts || 0,
                lowStockItems: inventorySummary[0]?.lowStock || 0,
                outOfStockItems: inventorySummary[0]?.outOfStock || 0,
                topCategories: []
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Admin reports error:", error)
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
    }
}
