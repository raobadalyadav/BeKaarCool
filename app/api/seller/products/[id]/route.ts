
import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== "seller") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const sellerId = await resolveUserId(session.user.id, session.user.email)

        // Ensure product belongs to seller
        const product = await Product.findOne({ _id: params.id, seller: sellerId })
        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 })
        }

        return NextResponse.json({ product })
    } catch (error) {
        console.error("Error fetching product:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== "seller") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        await connectDB()
        const sellerId = await resolveUserId(session.user.id, session.user.email)

        // Ensure product belongs to seller
        const product = await Product.findOne({ _id: params.id, seller: sellerId })
        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 })
        }

        // Update fields
        Object.assign(product, body)
        // If name changed, you might want to update slug, but keep it simple for now or handle slug regen

        await product.save()

        return NextResponse.json({ message: "Product updated successfully", product })
    } catch (error) {
        console.error("Error updating product:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== "seller") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const sellerId = await resolveUserId(session.user.id, session.user.email)

        const product = await Product.findOneAndDelete({ _id: params.id, seller: sellerId })

        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Product deleted successfully" })
    } catch (error) {
        console.error("Error deleting product:", error)
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
