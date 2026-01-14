import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const body = await request.json()
        const { currentStock } = body

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { stock: Math.max(0, currentStock) } },
            { new: true }
        )

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        return NextResponse.json({ product, message: "Stock updated" })
    } catch (error) {
        console.error("Admin inventory update error:", error)
        return NextResponse.json({ error: "Failed to update stock" }, { status: 500 })
    }
}
