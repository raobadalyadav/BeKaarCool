import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { User } from "@/models/User"
import { Category } from "@/models/Category"

// Ensure models are registered before populate
void User
void Category
interface RouteParams {
    params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        if (!slug || slug === 'undefined' || slug === 'null') {
            return NextResponse.json(
                { error: "Invalid slug" },
                { status: 400 }
            )
        }

        await connectDB()

        const product = await Product.findOne({ slug, isActive: true })
            .populate("seller", "name email avatar")
            .populate("category", "name slug")
            .lean()

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ product })
    } catch (error) {
        console.error("Error fetching product by slug:", error)
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        )
    }
}
