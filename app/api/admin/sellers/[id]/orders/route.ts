import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { Order } from "@/models/Order"

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

        // Build query - orders containing seller's products
        const matchStage: any = { "items.seller": (seller as any).user }

        if (status && status !== "all") {
            matchStage.status = status
        }

        const [orders, countResult] = await Promise.all([
            Order.find(matchStage)
                .populate("customer", "name email")
                .select("orderNumber total status paymentStatus items createdAt shippingAddress")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Order.countDocuments(matchStage)
        ])

        // Filter items to only show seller's items and calculate seller's portion
        const ordersWithSellerItems = orders.map((order: any) => {
            const sellerItems = order.items.filter((item: any) =>
                item.seller?.toString() === (seller as any).user.toString()
            )
            const sellerTotal = sellerItems.reduce((sum: number, item: any) =>
                sum + (item.price * item.quantity), 0
            )

            return {
                ...order,
                items: sellerItems,
                sellerTotal,
                itemCount: sellerItems.length
            }
        })

        return NextResponse.json({
            orders: ordersWithSellerItems,
            pagination: {
                page,
                limit,
                total: countResult,
                pages: Math.ceil(countResult / limit)
            }
        })
    } catch (error) {
        console.error("Seller orders error:", error)
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }
}
