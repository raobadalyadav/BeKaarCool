import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { Product } from "@/models/Product"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        // Get seller to find user ID
        const seller = await Seller.findById(id).lean()
        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const status = searchParams.get("status")
        const search = searchParams.get("search")

        // Build query
        const query: any = {
            seller: (seller as any).user,
            isDeleted: { $ne: true }
        }

        if (status === "active") {
            query.isActive = true
        } else if (status === "inactive") {
            query.isActive = false
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku: { $regex: search, $options: "i" } }
            ]
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .select("name images price discountPrice stock isActive sku rating reviewCount createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Product.countDocuments(query)
        ])

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Seller products error:", error)
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }
}
