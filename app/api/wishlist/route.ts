import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { WishlistItem } from "@/models/Wishlist"
import { Product } from "@/models/Product"
import { User } from "@/models/User"

// GET: Fetch user's wishlist
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        // Find user
        const user = await User.findOne({ email: session.user.email }).lean()
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get wishlist items from WishlistItem collection
        const wishlistItems = await WishlistItem.find({ user: user._id })
            .populate({
                path: "product",
                select: "name price originalPrice images rating reviewCount category brand slug stock"
            })
            .sort({ addedAt: -1 })
            .lean()

        // Transform to expected format (array of products)
        const wishlist = wishlistItems
            .filter((item: any) => item.product) // Filter out items with deleted products
            .map((item: any) => ({
                ...item.product,
                addedAt: item.addedAt,
                priceAtAdd: item.priceAtAdd,
                variant: item.variant
            }))

        return NextResponse.json({ wishlist })
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

        const { productId, size, color } = await request.json()
        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 })
        }

        await connectDB()

        // Find user
        const user = await User.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get product price
        const product = await Product.findById(productId).select("price").lean()
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Check if already in wishlist
        const existing = await WishlistItem.findOne({
            user: user._id,
            product: productId
        })

        if (existing) {
            return NextResponse.json({
                message: "Already in wishlist",
                inWishlist: true
            })
        }

        // Add to wishlist
        await WishlistItem.create({
            user: user._id,
            product: productId,
            priceAtAdd: product.price,
            variant: size || color ? { size, color } : undefined
        })

        // Get updated count
        const count = await WishlistItem.countDocuments({ user: user._id })

        return NextResponse.json({
            message: "Added to wishlist",
            inWishlist: true,
            count
        })
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

        // Find user
        const user = await User.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Remove from wishlist
        await WishlistItem.deleteOne({
            user: user._id,
            product: productId
        })

        // Get updated count
        const count = await WishlistItem.countDocuments({ user: user._id })

        return NextResponse.json({
            message: "Removed from wishlist",
            inWishlist: false,
            count
        })
    } catch (error: any) {
        console.error("Wishlist DELETE error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
