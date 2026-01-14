import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const [total, lowStock, outOfStock, totalValueResult] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 10 } }),
            Product.countDocuments({ isActive: true, stock: 0 }),
            Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$stock"] } } } }
            ])
        ])

        return NextResponse.json({
            totalProducts: total,
            lowStockItems: lowStock,
            outOfStockItems: outOfStock,
            totalValue: totalValueResult[0]?.total || 0
        })
    } catch (error) {
        console.error("Admin inventory stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
