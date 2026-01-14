import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const search = searchParams.get("search")
        const status = searchParams.get("status")
        const businessType = searchParams.get("businessType")
        const isVerified = searchParams.get("isVerified")
        const sortBy = searchParams.get("sortBy") || "createdAt"
        const sortOrder = searchParams.get("sortOrder") || "desc"

        // Build query
        const query: any = { status: { $ne: "deleted" } }

        if (status && status !== "all") {
            query.status = status
        }

        if (businessType && businessType !== "all") {
            query.businessType = businessType
        }

        if (isVerified === "true") {
            query.isVerified = true
        } else if (isVerified === "false") {
            query.isVerified = false
        }

        if (search) {
            query.$or = [
                { businessName: { $regex: search, $options: "i" } },
                { gstNumber: { $regex: search, $options: "i" } },
                { panNumber: { $regex: search, $options: "i" } }
            ]
        }

        // Build sort
        const sortOptions: any = {}
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1

        // Fetch sellers with user details
        const [sellers, total] = await Promise.all([
            Seller.find(query)
                .populate("user", "name email phone avatar isActive")
                .populate("approvedBy", "name")
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Seller.countDocuments(query)
        ])

        // Get real product counts and revenue for each seller
        const sellerIds = sellers.map((s: any) => s.user?._id || s.user)

        // Aggregate product counts per seller
        const productCounts = await Product.aggregate([
            { $match: { seller: { $in: sellerIds }, isDeleted: { $ne: true } } },
            { $group: { _id: "$seller", count: { $sum: 1 } } }
        ])
        const productCountMap = new Map(productCounts.map((p: any) => [p._id.toString(), p.count]))

        // Aggregate revenue per seller from orders
        const revenueData = await Order.aggregate([
            { $match: { "items.seller": { $in: sellerIds }, paymentStatus: "paid" } },
            { $unwind: "$items" },
            { $match: { "items.seller": { $in: sellerIds } } },
            {
                $group: {
                    _id: "$items.seller",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    orderCount: { $sum: 1 }
                }
            }
        ])
        const revenueMap = new Map(revenueData.map((r: any) => [r._id.toString(), { revenue: r.revenue, orders: r.orderCount }]))

        // Enrich sellers with real data
        const enrichedSellers = sellers.map((seller: any) => {
            const userId = seller.user?._id?.toString() || seller.user?.toString()
            const productData = productCountMap.get(userId) || 0
            const orderData = revenueMap.get(userId) || { revenue: 0, orders: 0 }

            return {
                ...seller,
                totalProducts: productData,
                totalOrders: orderData.orders,
                revenue: orderData.revenue,
                // Computed fields
                fulfillmentRate: seller.totalOrders > 0
                    ? Math.round((seller.ordersDelivered / seller.totalOrders) * 100)
                    : 100,
                pendingEarnings: seller.pendingPayout || 0
            }
        })

        return NextResponse.json({
            sellers: enrichedSellers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Admin sellers error:", error)
        return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const body = await request.json()
        const { userId, businessName, businessType, businessAddress, ...otherData } = body

        // Check if user exists and isn't already a seller
        const user = await User.findById(userId)
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const existingSeller = await Seller.findOne({ user: userId })
        if (existingSeller) {
            return NextResponse.json({ error: "User is already a seller" }, { status: 400 })
        }

        // Create seller profile
        const seller = await Seller.create({
            user: userId,
            businessName,
            businessType: businessType || "individual",
            businessAddress,
            ...otherData,
            status: "pending",
            statusHistory: [{
                status: "pending",
                timestamp: new Date(),
                by: (session.user as any).id
            }]
        })

        // Update user role to seller
        await User.findByIdAndUpdate(userId, { role: "seller" })

        return NextResponse.json(seller, { status: 201 })
    } catch (error: any) {
        console.error("Create seller error:", error)
        return NextResponse.json({ error: error.message || "Failed to create seller" }, { status: 500 })
    }
}
