import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { User } from "@/models/User"

// GET: Fetch user's wishlist
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const user = await User.findOne({ email: session.user.email })
            .populate({
                path: "wishlist",
                select: "name price originalPrice images rating reviews category brand slug"
            })
            .lean()

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ wishlist: user.wishlist || [] })
    } catch (error: any) {
        console.error("Wishlist GET error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Add product to wishlist
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { productId } = await request.json()
        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 })
        }

        await connectDB()
        const user = await User.findOne({ email: session.user.email })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check if already in wishlist
        if (user.wishlist?.includes(productId)) {
            return NextResponse.json({ message: "Already in wishlist", wishlist: user.wishlist })
        }

        // Add to wishlist
        user.wishlist = user.wishlist || []
        user.wishlist.push(productId)
        await user.save()

        return NextResponse.json({ message: "Added to wishlist", wishlist: user.wishlist })
    } catch (error: any) {
        console.error("Wishlist POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove product from wishlist
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get("productId")

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 })
        }

        await connectDB()
        const user = await User.findOne({ email: session.user.email })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Remove from wishlist
        user.wishlist = (user.wishlist || []).filter(
            (id: any) => id.toString() !== productId
        )
        await user.save()

        return NextResponse.json({ message: "Removed from wishlist", wishlist: user.wishlist })
    } catch (error: any) {
        console.error("Wishlist DELETE error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
