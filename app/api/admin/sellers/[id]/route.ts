import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { User } from "@/models/User"
import { Product } from "@/models/Product"
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

        const seller = await Seller.findById(id)
            .populate("user", "name email phone avatar isActive createdAt")
            .populate("approvedBy", "name")
            .populate("statusHistory.by", "name")
            .lean()

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 })
        }

        const userId = (seller as any).user?._id || (seller as any).user

        // Get real-time stats
        const [productCount, orderStats, recentOrders] = await Promise.all([
            Product.countDocuments({ seller: userId, isDeleted: { $ne: true } }),
            Order.aggregate([
                { $match: { "items.seller": userId } },
                { $unwind: "$items" },
                { $match: { "items.seller": userId } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentStatus", "paid"] },
                                    { $multiply: ["$items.price", "$items.quantity"] },
                                    0
                                ]
                            }
                        },
                        totalOrders: { $sum: 1 },
                        deliveredOrders: {
                            $sum: { $cond: [{ $eq: ["$items.status", "delivered"] }, 1, 0] }
                        },
                        cancelledOrders: {
                            $sum: { $cond: [{ $eq: ["$items.status", "cancelled"] }, 1, 0] }
                        }
                    }
                }
            ]),
            Order.find({ "items.seller": userId })
                .sort({ createdAt: -1 })
                .limit(5)
                .select("orderNumber total status createdAt")
                .lean()
        ])

        const stats = orderStats[0] || {
            totalRevenue: 0,
            totalOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0
        }

        return NextResponse.json({
            ...seller,
            stats: {
                totalProducts: productCount,
                totalRevenue: stats.totalRevenue,
                totalOrders: stats.totalOrders,
                deliveredOrders: stats.deliveredOrders,
                cancelledOrders: stats.cancelledOrders,
                fulfillmentRate: stats.totalOrders > 0
                    ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100)
                    : 100
            },
            recentOrders
        })
    } catch (error) {
        console.error("Admin seller fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch seller" }, { status: 500 })
    }
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
        const { status, statusReason, ...updateData } = body

        const seller = await Seller.findById(id)
        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 })
        }

        // Handle status change with history
        if (status && status !== seller.status) {
            seller.status = status
            seller.statusHistory.push({
                status,
                timestamp: new Date(),
                reason: statusReason,
                by: (session.user as any).id
            })

            if (status === "approved") {
                seller.approvedAt = new Date()
                seller.approvedBy = (session.user as any).id

                // Activate the user account
                await User.findByIdAndUpdate(seller.user, { isActive: true })
            } else if (status === "suspended" || status === "rejected") {
                // Deactivate the user account
                await User.findByIdAndUpdate(seller.user, { isActive: false })
            }
        }

        // Apply other updates
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                (seller as any)[key] = updateData[key]
            }
        })

        await seller.save()

        const updatedSeller = await Seller.findById(id)
            .populate("user", "name email phone avatar isActive")
            .populate("approvedBy", "name")
            .lean()

        return NextResponse.json({
            seller: updatedSeller,
            message: status ? `Seller ${status} successfully` : "Seller updated successfully"
        })
    } catch (error) {
        console.error("Admin seller update error:", error)
        return NextResponse.json({ error: "Failed to update seller" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const seller = await Seller.findById(id)
        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 })
        }

        // Soft delete - update status to deleted
        seller.status = "deleted"
        seller.statusHistory.push({
            status: "deleted",
            timestamp: new Date(),
            reason: "Deleted by admin",
            by: (session.user as any).id
        })
        await seller.save()

        // Deactivate user account
        await User.findByIdAndUpdate(seller.user, { isActive: false, role: "customer" })

        // Deactivate all products
        await Product.updateMany(
            { seller: seller.user },
            { $set: { isActive: false, isDeleted: true } }
        )

        return NextResponse.json({ message: "Seller deleted successfully" })
    } catch (error) {
        console.error("Admin seller delete error:", error)
        return NextResponse.json({ error: "Failed to delete seller" }, { status: 500 })
    }
}
