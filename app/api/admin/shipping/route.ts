import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
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
        const status = searchParams.get("status") // pending, shipped, delivered, etc.

        const query: any = {}

        // Filter for orders that have shipping info
        if (status) {
            query.status = status
        }

        const [shipments, total, statusCounts] = await Promise.all([
            Order.find(query)
                .select("orderNumber status shippingAddress trackingNumber carrier createdAt deliveredAt user items")
                .populate("user", "name email phone")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
            Order.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ])

        return NextResponse.json({
            shipments: shipments.map(s => ({
                id: s._id,
                orderId: s.orderNumber,
                customer: (s.user as any)?.name || "Guest",
                phone: (s.user as any)?.phone || "",
                address: s.shippingAddress,
                status: s.status,
                trackingNumber: s.trackingNumber,
                carrier: s.carrier || "Delhivery",
                itemCount: s.items?.length || 0,
                createdAt: s.createdAt,
                deliveredAt: s.deliveredAt
            })),
            stats: statusCounts.reduce((acc, s) => {
                acc[s._id] = s.count
                return acc
            }, {} as Record<string, number>),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Admin shipping error:", error)
        return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 })
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
        const { orderId, status, trackingNumber, carrier } = body

        if (!orderId) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 })
        }

        const updateData: any = {}
        if (status) updateData.status = status
        if (trackingNumber) updateData.trackingNumber = trackingNumber
        if (carrier) updateData.carrier = carrier
        if (status === "delivered") updateData.deliveredAt = new Date()

        const order = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true }
        )

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Shipment updated", order })
    } catch (error) {
        console.error("Admin shipping update error:", error)
        return NextResponse.json({ error: "Failed to update shipment" }, { status: 500 })
    }
}
