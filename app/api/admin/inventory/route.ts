import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { Category } from "@/models/Category" // Required for populate

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "50")
        const lowStock = searchParams.get("lowStock") === "true"
        const outOfStock = searchParams.get("outOfStock") === "true"
        const search = searchParams.get("search")
        const category = searchParams.get("category")

        const query: any = { isActive: true }

        if (lowStock) {
            query.stock = { $gt: 0, $lte: 10 }
        } else if (outOfStock) {
            query.stock = 0
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } }
            ]
        }

        if (category) {
            query.category = category
        }

        const [products, total, lowStockCount, outOfStockCount] = await Promise.all([
            Product.find(query)
                .select("name sku images stock price category seller")
                .populate("category", "name")
                .populate("seller", "name")
                .sort({ stock: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Product.countDocuments(query),
            Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 10 } }),
            Product.countDocuments({ isActive: true, stock: 0 })
        ])

        return NextResponse.json({
            products: products.map(p => ({
                ...p,
                categoryName: (p.category as any)?.name || "Uncategorized",
                sellerName: (p.seller as any)?.name || "Unknown"
            })),
            stats: {
                lowStock: lowStockCount,
                outOfStock: outOfStockCount,
                total
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Admin inventory fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const body = await request.json()
        const { updates } = body // Array of { productId, stock }

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: "Updates array required" }, { status: 400 })
        }

        const bulkOps = updates.map(({ productId, stock }) => ({
            updateOne: {
                filter: { _id: productId },
                update: { $set: { stock: Math.max(0, stock) } }
            }
        }))

        const result = await Product.bulkWrite(bulkOps)

        return NextResponse.json({
            message: `Updated ${result.modifiedCount} products`,
            modifiedCount: result.modifiedCount
        })
    } catch (error) {
        console.error("Admin inventory update error:", error)
        return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 })
    }
}
